"""
AI stages. These functions contain no database code, so they can be tested with a fake model.
  extract_chunk : find checkable claims in a piece of text
  tone_chunk    : find tone problems against the brand-voice guidelines
  assess_claim  : retrieve approved evidence, then verify the claim against it

Safety rules enforced in CODE, not left to the model:
  * quotes must exist in the draft, otherwise the finding is dropped (no invented spans)
  * the verifier only sees retrieved approved evidence
  * a 'supported' verdict must cite real evidence ids, otherwise it becomes 'uncertain'
  * support from expired evidence becomes 'expired'
  * if nothing relevant is retrieved, the model is not called: the claim is 'unsubstantiated'
"""
import re
from datetime import date

from . import config, llm, retrieval

PROMPT_VERSION = "v1"   # bump when prompts change so old cached results are ignored

CLAIM_TYPES = ["superlative", "statistic", "guarantee", "comparative", "testimonial", "other"]

EXTRACT_SYS = (
    "You find checkable promotional or factual claims in marketing copy: superlatives (fastest, best), "
    "statistics, guarantees, comparisons, testimonials, outcome promises. Ignore opinions with no factual "
    "content and plain descriptions. Each 'quote' MUST be copied exactly, character for character, from the "
    "text. Return an empty list if there are no claims."
)
EXTRACT_SCHEMA = {
    "type": "object",
    "properties": {"claims": {"type": "array", "items": {
        "type": "object",
        "properties": {"quote": {"type": "string"}, "type": {"type": "string", "enum": CLAIM_TYPES}},
        "required": ["quote", "type"]}}},
    "required": ["claims"],
}

TONE_SYS = (
    "You review marketing copy against the brand voice guidelines below. Report only clear departures from "
    "the guidelines. Each 'quote' MUST be copied exactly from the text. 'suggestion' is a replacement for the "
    "quote that keeps its meaning. Do not comment on facts or claims. Return an empty list if the tone fits.\n\n"
    "BRAND VOICE GUIDELINES:\n{guidelines}"
)
TONE_SCHEMA = {
    "type": "object",
    "properties": {"issues": {"type": "array", "items": {
        "type": "object",
        "properties": {"quote": {"type": "string"}, "problem": {"type": "string"},
                       "suggestion": {"type": "string"}, "severity": {"type": "string", "enum": ["low", "medium"]}},
        "required": ["quote", "problem", "suggestion", "severity"]}}},
    "required": ["issues"],
}

VERDICTS = ["supported", "contradicted", "unsubstantiated", "uncertain"]
VERIFY_SYS = (
    "You judge whether a marketing claim is supported by approved evidence. Use ONLY the evidence items "
    "provided; never use outside knowledge. Verdicts: 'supported' (evidence clearly backs the claim, same "
    "scope and numbers), 'contradicted' (evidence conflicts with it, or the claim says more than the evidence), "
    "'unsubstantiated' (evidence does not address the claim), 'uncertain' (ambiguous). Cite the evidence "
    "labels you relied on in evidence_ids (e.g. E1). 'rewrite' is a safer wording that keeps the creator's "
    "intent, or an empty string if none is needed."
)
VERIFY_SCHEMA = {
    "type": "object",
    "properties": {"verdict": {"type": "string", "enum": VERDICTS},
                   "evidence_ids": {"type": "array", "items": {"type": "string"}},
                   "reason": {"type": "string"}, "rewrite": {"type": "string"}},
    "required": ["verdict", "evidence_ids", "reason", "rewrite"],
}


# ---------- text helpers ----------

def chunk_text(text: str, max_chars: int = 3500) -> list[tuple[int, str]]:
    """Split into chunks, preferring paragraph then sentence boundaries. Returns (offset, chunk)."""
    chunks, start = [], 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            cut = text.rfind("\n\n", start, end)
            if cut <= start:
                cut = max(text.rfind(". ", start, end), text.rfind("\n", start, end))
            if cut > start:
                end = cut + 1
        chunks.append((start, text[start:end]))
        start = end
    return [c for c in chunks if c[1].strip()]


def locate(chunk: str, offset: int, quote: str) -> tuple[int, int] | None:
    """Find the model's quote in the real text. Returns absolute (start, end) or None."""
    quote = quote.strip()
    if not quote:
        return None
    i = chunk.find(quote)
    if i >= 0:
        return offset + i, offset + i + len(quote)
    pattern = r"\s+".join(re.escape(w) for w in quote.split())
    m = re.search(pattern, chunk, re.I)
    return (offset + m.start(), offset + m.end()) if m else None


# ---------- AI stages ----------

def extract_chunk(chunk: str) -> list[dict]:
    res = llm.chat_json("extract", EXTRACT_SYS, chunk, EXTRACT_SCHEMA, "claims")
    out = []
    for c in res.get("claims", []):
        if isinstance(c, dict) and isinstance(c.get("quote"), str):
            out.append({"quote": c["quote"], "type": c.get("type", "other")})
    return out


def tone_chunk(chunk: str, guideline_text: str) -> list[dict]:
    res = llm.chat_json("tone", TONE_SYS.format(guidelines=guideline_text), chunk, TONE_SCHEMA, "tone")
    out = []
    for i in res.get("issues", []):
        if isinstance(i, dict) and isinstance(i.get("quote"), str):
            out.append({"quote": i["quote"], "problem": str(i.get("problem", "")),
                        "suggestion": str(i.get("suggestion", "")),
                        "severity": i.get("severity") if i.get("severity") in ("low", "medium") else "low"})
    return out


def _doc_state(d: retrieval.Doc, today: date) -> str:
    """available | expired | missing | review, from the evidence record's status and expiry date."""
    status = d.meta.get("status", "available")
    if status == "expired" or (status == "available" and d.valid_to is not None and d.valid_to < today):
        return "expired"
    return status


def _evidence_entry(label: str, d: retrieval.Doc) -> dict:
    return {"ref": label, "id": d.id, "text": d.text[:300], "status": d.meta.get("status", "available"),
            "valid_to": d.valid_to.isoformat() if d.valid_to else None}


def assess_claim(claim: str, docs: list[retrieval.Doc], today: date | None = None,
                 min_coverage: float | None = None, k: int = 4) -> dict:
    """Retrieve approved evidence for one claim and verify it. Returns
    {'verdict', 'evidence': [...], 'reason', 'rewrite'}."""
    today = today or date.today()
    min_coverage = config.RETRIEVAL_MIN_COVERAGE if min_coverage is None else min_coverage
    evidence_docs = [d for d in docs if d.kind != "tone"]
    ranked = retrieval.rank(claim, evidence_docs, k=k)

    if not ranked or ranked[0][2] < min_coverage:
        return {"verdict": "unsubstantiated", "evidence": [], "rewrite": "",
                "reason": "No approved evidence matches this claim."}

    labelled = {f"E{i + 1}": d for i, (d, _, _) in enumerate(ranked)}
    lines = []
    for lab, d in labelled.items():
        validity = f" (valid until {d.valid_to.isoformat()})" if d.valid_to else ""
        lines.append(f"[{lab}] {d.text}{validity}")
    user = f"CLAIM: {claim}\n\nAPPROVED EVIDENCE:\n" + "\n".join(lines)

    res = llm.chat_json("verify", VERIFY_SYS, user, VERIFY_SCHEMA, "verdict")
    verdict = res.get("verdict") if res.get("verdict") in VERDICTS else "uncertain"
    cited = [e for e in res.get("evidence_ids", []) if e in labelled]
    reason = str(res.get("reason", "")).strip()
    rewrite = str(res.get("rewrite", "")).strip()

    if verdict == "supported":
        if not cited:                                   # claimed support must point at real evidence
            verdict, reason = "uncertain", "The model reported support but cited no approved evidence."
        else:
            states = [_doc_state(labelled[e], today) for e in cited]
            if "available" in states:
                pass                                    # at least one cited item is current and verified
            elif all(st == "expired" for st in states):
                verdict, reason = "expired", "The only supporting evidence has expired."
            else:
                verdict, reason = "uncertain", "The cited evidence is not fully verified yet."

    shown = cited if cited else ([] if verdict == "unsubstantiated" else list(labelled)[:2])
    return {"verdict": verdict, "evidence": [_evidence_entry(e, labelled[e]) for e in shown],
            "reason": reason, "rewrite": rewrite}
