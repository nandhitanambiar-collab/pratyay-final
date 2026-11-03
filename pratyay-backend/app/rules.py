"""
Rules-only review engine. Pure Python: no database, no web framework, no AI.

Takes the draft text and a RuleSet, returns a list of finding dicts. The AI stages (claim
extraction, tone, verification) add findings in the same format, so the frontend never needs to
care where a finding came from (see the `source` field).

Finding dict keys: type, category, severity (lowercase here), source, title, description,
explanation, start, end (None for document-level findings), rule_reference, guideline_ref,
evidence (list of dicts), evidence_status, suggestion.
"""
import re
from dataclasses import dataclass, field
from datetime import date

NO_PROOF = ("Supporting evidence was not found in the current registry. "
            "This does not establish that the claim is false.")

# Required wording (disclaimers) only applies to promotional copy. A rule may override this later.
PROMO_TRIGGER = (r"\boffers?\b|\bdiscounts?\b|\b\d+\s?%|\bsale\b|\bcashback\b|\bfree\b|\bprices?d?\b"
                 r"|\bselections?\b|\bresults?\b|\brank(?:s|ers?)?\b")


@dataclass
class TermRule:
    id: int
    phrase: str
    kind: str                      # 'preferred' | 'banned'
    replacement: str | None = None
    note: str = ""
    severity: str = "medium"
    name: str = ""
    ref: str = ""                  # id shown to the user, e.g. RULE-3


@dataclass
class RequiredTextRule:
    id: int
    trigger: str                   # regex: when this appears, the text below becomes mandatory
    text: str
    note: str = ""
    name: str = ""
    ref: str = ""


@dataclass
class ClaimRecord:
    id: int
    pattern: str                   # regex used to recognise the claim in a draft
    text: str
    evidence: str = ""
    owner: str = ""
    valid_to: date | None = None
    status: str = "available"      # available | expired | missing | review
    name: str = ""
    ref: str = ""                  # id shown to the user, e.g. FACT-2


@dataclass
class RuleSet:
    terms: list[TermRule] = field(default_factory=list)
    required: list[RequiredTextRule] = field(default_factory=list)
    claims: list[ClaimRecord] = field(default_factory=list)


# Wording that needs evidence before it can be published.
RISKY_PATTERNS = [
    r"guarantee[ds]?", r"100\s?%", r"\bbest\b", r"#\s?1\b", r"\bno\.?\s?1\b",
    r"number one", r"fastest", r"\bcures?\b", r"\bcured\b", r"risk[- ]free",
    r"\bassured\b", r"miracle", r"\binstant(ly)?\b", r"clinically proven",
    r"zero side effects", r"\bcheapest\b", r"\bunbeatable\b",
]
RISKY = [re.compile(p, re.I) for p in RISKY_PATTERNS]

SENTENCE_RE = re.compile(r"[^\n]+?(?:[.!?]+(?=\s|$)|$)", re.M)


def _sentences(text: str) -> list[tuple[int, int]]:
    return [(m.start(), m.end()) for m in SENTENCE_RE.finditer(text) if m.group().strip()]


def _sentence_containing(spans, pos):
    for s, e in spans:
        if s <= pos < e:
            return s, e
    return 0, 0


def claim_state(c: ClaimRecord, today: date) -> str:
    if c.status == "available" and c.valid_to is not None and c.valid_to < today:
        return "expired"
    return c.status


def _evidence(c: ClaimRecord) -> dict:
    return {"ref": c.ref or f"claim:{c.id}", "claim_id": c.id, "text": c.text, "evidence": c.evidence,
            "owner": c.owner, "valid_to": c.valid_to.isoformat() if c.valid_to else None}


def _finding(start, end, ftype, category, severity, title, description, explanation, *,
             rule_reference="", guideline_ref=None, evidence=None, evidence_status="not_applicable",
             suggestion=None):
    return {"start": start, "end": end, "type": ftype, "category": category, "severity": severity,
            "source": "rule", "title": title, "description": description, "explanation": explanation,
            "rule_reference": rule_reference, "guideline_ref": guideline_ref,
            "evidence": evidence or [], "evidence_status": evidence_status, "suggestion": suggestion}


def run_rules(text: str, rules: RuleSet, today: date | None = None) -> list[dict]:
    today = today or date.today()
    out: list[dict] = []
    spans = _sentences(text)

    # 1. Preferred / banned terminology
    for t in rules.terms:
        ref = f"{t.name} ({t.ref})" if t.ref else (t.name or "Terminology rule")
        for m in re.finditer(r"(?<!\w)" + re.escape(t.phrase) + r"(?!\w)", text, re.I):
            if t.kind == "preferred" and t.replacement:
                out.append(_finding(
                    m.start(), m.end(), "terminology", "terminology", t.severity,
                    f'Preferred Term Available for "{m.group()}"',
                    "Approved brand guidelines recommend standard terminology.",
                    f'Brand style guide specifies "{t.replacement}" over "{m.group()}". {t.note}'.strip(),
                    rule_reference=ref, guideline_ref=t.ref or None, suggestion=t.replacement))
            else:
                out.append(_finding(
                    m.start(), m.end(), "rule_violation", "terminology", t.severity,
                    f'Restricted Phrase Detected: "{m.group()}"',
                    t.note or "This phrase is restricted by the brand guidelines.",
                    f"'{m.group()}' is a restricted term. {t.note}".strip(),
                    rule_reference=ref, guideline_ref=t.ref or None,
                    suggestion=t.replacement or None))

    # 2. Required wording (document-level: no text span)
    for r in rules.required:
        if re.search(r.trigger or PROMO_TRIGGER, text, re.I) and r.text.strip().lower() not in text.lower():
            out.append(_finding(
                None, None, "required_text", "disclaimer", "medium",
                f"Missing Required Disclosure: {r.name or r.text}",
                "Mandatory wording was not found in the submitted marketing text.",
                f"This copy is promotional and must include: '{r.text}'. {r.note}".strip(),
                rule_reference=f"{r.name} ({r.ref})" if r.ref else (r.name or "Required wording"),
                guideline_ref=r.ref or None, evidence_status="missing",
                suggestion=f"{text.rstrip()}\n\n{r.text}"))

    # 3. Claims register: supported, expired, missing evidence, or needs review
    sentence_claims: dict[tuple[int, int], list[tuple[ClaimRecord, re.Match]]] = {}
    for c in rules.claims:
        for m in re.finditer(c.pattern, text, re.I):
            if m.end() == m.start():
                continue
            sp = _sentence_containing(spans, m.start())
            sentence_claims.setdefault(sp, []).append((c, m))

    for sp, matches in sentence_claims.items():
        for c, m in matches:
            state = claim_state(c, today)
            label = c.name or c.text
            common = dict(rule_reference=f"Brand Evidence Registry ({c.ref})" if c.ref else "Brand Evidence Registry",
                          evidence=[_evidence(c)])
            if state == "available":
                until = c.valid_to.isoformat() if c.valid_to else "indefinite"
                out.append(_finding(
                    m.start(), m.end(), "factual_claim", "claim", "notice",
                    f"Claim Verification: {label}", c.text,
                    f'Claim is substantiated by approved evidence in the brand registry: "{c.evidence}". '
                    f"Valid until {until}.", evidence_status="supported", **common))
            elif state == "expired":
                since = f" on {c.valid_to.isoformat()}" if c.valid_to else ""
                out.append(_finding(
                    m.start(), m.end(), "factual_claim", "claim", "high",
                    f"Claim Verification: {label}", c.text,
                    f'The approved evidence ("{c.evidence}") expired{since}. Renew the evidence or '
                    f"remove the claim. {NO_PROOF}", evidence_status="expired", **common))
            elif state == "review":
                out.append(_finding(
                    m.start(), m.end(), "factual_claim", "claim", "medium",
                    f"Claim Verification: {label}", c.text,
                    f'Evidence is on file ("{c.evidence}") but verification is pending. A reviewer must '
                    f"confirm it. {NO_PROOF}", evidence_status="inconclusive", **common))
            else:   # missing
                out.append(_finding(
                    m.start(), m.end(), "factual_claim", "claim", "high",
                    f"Claim Verification: {label}", c.text,
                    f"The registry lists this claim but no substantiation is on file. {NO_PROOF}",
                    evidence_status="missing", **common))

    # Risky wording is fine only inside a sentence backed by a currently valid approved claim
    for rx in RISKY:
        for m in rx.finditer(text):
            sp = _sentence_containing(spans, m.start())
            matched = sentence_claims.get(sp, [])
            if matched:
                continue          # the sentence already has a registry finding (supported, expired, ...)
            out.append(_finding(
                m.start(), m.end(), "factual_claim", "claim", "medium",
                f'Claim Requiring Verification: "{m.group()}"',
                "Claim requires registered evidence substantiation.", NO_PROOF,
                rule_reference="Claim Substantiation Standard", evidence_status="missing"))

    # Remove duplicates, sort by position (document-level findings last)
    seen, unique = set(), []
    for f in out:
        key = (f["start"], f["end"], f["category"], f["title"])
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return sorted(unique, key=lambda f: (f["start"] is None, f["start"] or 0, f["end"] or 0))
