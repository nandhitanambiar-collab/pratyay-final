"""
Database glue for the AI stages: loads approved material, caches results, and turns AI output
into findings in the same format the rules engine uses.

A failure in any AI stage never breaks a submission: the rule findings are still returned
and the problem is written to the audit log.
"""
import hashlib
import json
import re
from datetime import date

from sqlalchemy.orm import Session

from . import ai, config, llm, retrieval, util
from . import models as m
from .rules import NO_PROOF


# ---------- knowledge base + cache ----------

def load_docs(db: Session) -> list[retrieval.Doc]:
    docs = []
    for e in db.query(m.Evidence).all():
        status = util.EVIDENCE_STATUS.get(e.evidence_status, "review")
        docs.append(retrieval.Doc(
            f"FACT-{e.id}", "claim",
            f"{e.claim_name}. {e.approved_statement}. Evidence: {e.evidence_description} ({e.source_reference}).",
            util.parse_date(e.expiry_date), {"status": status}))
    for r in db.query(m.Rule).filter(m.Rule.status == "Active").all():
        kind = "tone" if r.category == "Tone and Voice" else "general"
        docs.append(retrieval.Doc(f"RULE-{r.id}", kind, f"{r.name}: {r.summary} {r.description}"))
    return docs


def kb_version(db: Session) -> str:
    """Fingerprint of everything approved. Changes whenever a rule or fact changes, so old cached
    verdicts stop being used automatically."""
    rows = (
        [("rule", r.name, r.category, r.rule_type, r.summary, r.description, r.target_term,
          r.replacement_term, r.status) for r in db.query(m.Rule).order_by(m.Rule.id)]
        + [("fact", e.claim_name, e.approved_statement, e.evidence_description, e.source_reference,
            e.evidence_status, e.valid_from, e.expiry_date) for e in db.query(m.Evidence).order_by(m.Evidence.id)]
    )
    return hashlib.sha256(json.dumps(rows, default=str).encode()).hexdigest()[:16]


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())


def cache_key(*parts) -> str:
    return hashlib.sha256(json.dumps(parts, ensure_ascii=False, default=str).encode()).hexdigest()


def cached(db: Session, key: str, compute):
    """Exact-match cache. A reworded input is a miss and is simply recomputed: slower, never wrong."""
    row = db.get(m.CacheEntry, key)
    if row is not None:
        return row.value
    value = compute()
    db.add(m.CacheEntry(key=key, value=value))
    db.flush()
    return value


# ---------- AI checks ----------

def _overlaps(start, end, findings, category) -> bool:
    return any(f["category"] == category and f["start"] is not None and f["start"] < end and start < f["end"]
               for f in findings)


# verdict -> (severity, evidence_status, title)
_VERDICT = {
    "unsubstantiated": ("medium", "missing", 'Claim Requiring Verification: "{claim}"'),
    "contradicted": ("high", "contradicted", "Claim Conflicts With Approved Evidence"),
    "expired": ("high", "expired", "Claim Backed Only By Expired Evidence"),
    "uncertain": ("medium", "inconclusive", "Claim Needs Human Judgement"),
}


def _claim_finding(span, claim_text, claim_type, res, model) -> dict | None:
    v = res["verdict"]
    if v == "supported":
        return None
    sev, ev_status, title = _VERDICT[v]
    reason = res["reason"].strip()
    explanation = reason
    if v in ("unsubstantiated", "expired"):
        explanation = f"{reason} {NO_PROOF}".strip()
    return {
        "start": span[0], "end": span[1], "type": "factual_claim", "category": "claim", "severity": sev,
        "source": "ai", "ai_model": model, "title": title.format(claim=claim_text[:80]),
        "description": f"{claim_type.capitalize()} claim: {claim_text}",
        "explanation": explanation or "This claim could not be confirmed against approved evidence.",
        "rule_reference": "AI claim verification (approved evidence only)", "guideline_ref": None,
        "evidence": res["evidence"], "evidence_status": ev_status, "suggestion": res["rewrite"] or None,
    }


def run_ai_checks(db: Session, text: str, existing: list[dict], today: date | None = None) -> tuple[list[dict], str, list[str]]:
    """Returns (ai_findings, note for the audit log, models used)."""
    today = today or date.today()
    tasks_on = [t for t in ("extract", "verify", "tone") if llm.is_configured(t)]
    if not tasks_on:
        return [], "AI not configured: rule checks only", []

    kbv = kb_version(db)
    docs = load_docs(db)
    chunks = ai.chunk_text(text)
    out: list[dict] = []
    notes: list[str] = []
    used: list[str] = []

    # --- claims: extract -> retrieve evidence -> verify ---
    if llm.is_configured("extract") and llm.is_configured("verify"):
        try:
            ex_model, ver_model = llm.label("extract"), llm.label("verify")
            claims: list[dict] = []
            for offset, chunk in chunks:
                key = cache_key("extract", _norm(chunk), ex_model, ai.PROMPT_VERSION)
                for c in cached(db, key, lambda ch=chunk: ai.extract_chunk(ch)):
                    span = ai.locate(chunk, offset, c["quote"])
                    if span and not _overlaps(span[0], span[1], existing, "claim"):
                        claims.append({"span": span, "text": text[span[0]:span[1]], "type": c["type"]})
            if len(claims) > config.AI_MAX_CLAIMS:
                notes.append(f"{len(claims)} claims found; verified the first {config.AI_MAX_CLAIMS}")
                claims = claims[:config.AI_MAX_CLAIMS]
            for c in claims:
                key = cache_key("verify", _norm(c["text"]), kbv, ver_model, ai.PROMPT_VERSION)
                res = cached(db, key, lambda t=c["text"]: ai.assess_claim(t, docs, today))
                f = _claim_finding(c["span"], c["text"], c["type"], res, ver_model)
                if f:
                    out.append(f)
            notes.append(f"claims: {len(claims)} checked ({ex_model} + {ver_model})")
            used += [ex_model, ver_model]
        except llm.LLMError as e:
            notes.append(f"claim checks unavailable: {e}")

    # --- tone ---
    tone_docs = [d for d in docs if d.kind == "tone"]
    if llm.is_configured("tone") and tone_docs:
        try:
            model = llm.label("tone")
            guide = "\n".join(d.text for d in tone_docs)
            n = 0
            for offset, chunk in chunks:
                key = cache_key("tone", _norm(chunk), kbv, model, ai.PROMPT_VERSION)
                for i in cached(db, key, lambda ch=chunk: ai.tone_chunk(ch, guide)):
                    span = ai.locate(chunk, offset, i["quote"])
                    if not span:
                        continue
                    n += 1
                    problem = i["problem"] or "Tone does not match the brand voice."
                    out.append({
                        "start": span[0], "end": span[1], "type": "rule_violation", "category": "tone",
                        "severity": i["severity"], "source": "ai", "ai_model": model,
                        "title": "Brand Tone and Voice", "description": problem,
                        "explanation": f"{problem} The suggested wording keeps the original meaning.",
                        "rule_reference": "Brand tone and voice guidelines (AI-assisted)", "guideline_ref": None,
                        "evidence": [], "evidence_status": "not_applicable", "suggestion": i["suggestion"] or None})
            notes.append(f"tone: {n} issue(s) ({model})")
            used.append(model)
        except llm.LLMError as e:
            notes.append(f"tone check unavailable: {e}")

    return out, "; ".join(notes), sorted(set(used))
