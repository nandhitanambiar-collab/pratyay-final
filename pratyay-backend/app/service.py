"""Database-level logic and serialisers that turn rows into the JSON shapes the frontend expects."""
import re
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from . import llm, pipeline, target, util
from . import models as m
from .rules import ClaimRecord, RequiredTextRule, RuleSet, TermRule, run_rules

UNVERIFIED = {"missing", "expired", "inconclusive", "contradicted"}
PLATFORM = "Pratyay — An Intelligent Brand Governance Platform"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def utc(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)      # SQLite returns naive datetimes
    return dt


def iso(dt: datetime | None) -> str | None:
    dt = utc(dt)
    return dt.isoformat() if dt else None


def compact(d: dict) -> dict:
    """Drop None values. The frontend treats missing and null differently (`!== undefined`)."""
    return {k: v for k, v in d.items() if v is not None}


def envelope(data, message: str | None = None) -> dict:
    return compact({"success": True, "data": data, "message": message, "timestamp": now_utc().isoformat()})


# ---------- guideline rules -> rules engine ----------

def load_rules(db: Session) -> RuleSet:
    terms, required, claims = [], [], []
    for r in db.query(m.Rule).filter(m.Rule.status == "Active").all():
        ref = f"RULE-{r.id}"
        if r.rule_type in ("Preferred Term", "Restricted Term") and r.target_term:
            phrases = [t.strip() for t in re.split(r"[/;]", r.target_term) if len(t.strip()) > 2]
            for i, phrase in enumerate(phrases):
                if r.rule_type == "Preferred Term":
                    kind, sev = "preferred", "medium"
                else:
                    kind = "banned"
                    high = (r.category == "Promotional Claims"
                            or any(w in phrase.lower() for w in ("guarantee", "cure")))
                    sev = "high" if high else "medium"
                terms.append(TermRule(r.id * 100 + i, phrase, kind, r.replacement_term, r.summary, sev, r.name, ref))
        elif r.rule_type == "Required Text" and r.target_term:
            required.append(RequiredTextRule(r.id, "", r.target_term, r.summary, r.name, ref))
    for e in db.query(m.Evidence).all():
        claims.append(ClaimRecord(
            id=e.id, pattern=util.claim_pattern(e.claim_name, e.approved_statement),
            text=e.approved_statement or e.claim_name,
            evidence=f"{e.source_reference}: {e.evidence_description}".strip(": "),
            owner="", valid_to=util.parse_date(e.expiry_date),
            status=util.EVIDENCE_STATUS.get(e.evidence_status, "review"),
            name=e.claim_name, ref=f"FACT-{e.id}"))
    return RuleSet(terms, required, claims)


# ---------- lookups ----------

def get_submission(db: Session, rid: str) -> m.Submission:
    n = util.parse_review_id(rid)
    sub = db.get(m.Submission, n) if n is not None else None
    if sub is None:
        raise HTTPException(404, f"Review {rid} not found")
    return sub


def current_findings(db: Session, sub: m.Submission) -> list[m.Finding]:
    rows = db.query(m.Finding).filter_by(submission_id=sub.id, version=sub.version).all()
    return sorted(rows, key=lambda f: (f.start is None, f.start or 0, f.id))


def rid(sub: m.Submission) -> str:
    return util.review_id(sub.id, utc(sub.created_at))


# ---------- analysis ----------

def reanalyze(db: Session, sub: m.Submission) -> None:
    """(Re)generate findings for the current version. Decisions already made on identical findings are kept."""
    old = db.query(m.Finding).filter_by(submission_id=sub.id, version=sub.version).all()
    carry = {(f.title, f.matched_text or ""): (f.status, f.dismiss_reason) for f in old if f.status != "open"}
    for f in old:
        db.delete(f)
    db.flush()

    rule_findings = run_rules(sub.draft_text, load_rules(db))
    target_cfg, target_note = target.resolve(db, sub.target_model_id)
    with llm.use_target(target_cfg):
        ai_findings, note, used = pipeline.run_ai_checks(db, sub.draft_text, rule_findings)
    if target_note:
        note = f"{target_note}; {note}" if note else target_note
    everything = sorted(rule_findings + ai_findings, key=lambda f: (f["start"] is None, f["start"] or 0))
    for f in everything:
        matched = sub.draft_text[f["start"]:f["end"]] if f["start"] is not None else None
        status, reason = carry.get((f["title"], matched or ""), ("open", None))
        db.add(m.Finding(
            submission_id=sub.id, version=sub.version, type=f["type"], category=f["category"],
            severity=util.title_severity(f["severity"]), source=f["source"], ai_model=f.get("ai_model"),
            title=f["title"], description=f["description"], explanation=f["explanation"],
            start=f["start"], end=f["end"], matched_text=matched, rule_reference=f["rule_reference"],
            guideline_ref=f.get("guideline_ref"), evidence=f["evidence"], evidence_status=f["evidence_status"],
            suggestion=f.get("suggestion"), status=status, dismiss_reason=reason))
    sub.actual_model_used = ", ".join(used) if used else "Rules engine (server)"
    sub.analysis_note = note
    sub.analysis_kb = pipeline.kb_version(db)
    db.flush()


def ensure_fresh(db: Session, sub: m.Submission) -> None:
    """If guidelines or evidence changed since the last analysis, re-run it (approved reviews stay frozen)."""
    if sub.status != "Approved" and sub.analysis_kb != pipeline.kb_version(db):
        reanalyze(db, sub)
        db.commit()


# ---------- audit ----------

def log_event(db: Session, sub: m.Submission | None, event_type: str, actor: str, role: str, summary: str,
              previous: str | None = None, new: str | None = None, comment: str | None = None) -> None:
    db.add(m.AuditEvent(
        submission_id=sub.id if sub else None, review_ref=rid(sub) if sub else None, event_type=event_type,
        review_title=sub.campaign_title if sub else None, previous_status=previous, new_status=new,
        actor=actor, actor_role=role, summary=summary, comment=comment,
        revision_version=sub.version if sub else None))


def audit_dict(e: m.AuditEvent) -> dict:
    return compact({
        "id": f"AUD-{e.id}", "timestamp": util.relative_time(utc(e.created_at)), "isoTimestamp": iso(e.created_at),
        "eventType": e.event_type, "reviewId": e.review_ref, "reviewTitle": e.review_title,
        "previousStatus": e.previous_status, "newStatus": e.new_status, "actor": e.actor,
        "actorRole": e.actor_role, "summary": e.summary, "comment": e.comment,
        "revisionVersion": e.revision_version})


# ---------- serialisers ----------

def rule_dict(r: m.Rule) -> dict:
    return compact({
        "id": f"RULE-{r.id}", "name": r.name, "category": r.category, "ruleType": r.rule_type,
        "summary": r.summary, "description": r.description, "targetTerm": r.target_term or None,
        "replacementTerm": r.replacement_term or None, "status": r.status,
        "lastUpdated": util.relative_time(utc(r.updated_at)), "notes": r.notes or None})


def evidence_dict(e: m.Evidence) -> dict:
    return compact({
        "id": f"FACT-{e.id}", "claimName": e.claim_name, "approvedStatement": e.approved_statement,
        "evidenceDescription": e.evidence_description, "sourceReference": e.source_reference,
        "evidenceStatus": e.evidence_status, "validFrom": e.valid_from or None,
        "expiryDate": e.expiry_date or None, "notes": e.notes or None,
        "lastUpdated": util.relative_time(utc(e.updated_at))})


def finding_dict(f: m.Finding, sub: m.Submission) -> dict:
    ids = [e.get("id") or e.get("ref") for e in (f.evidence or []) if (e.get("id") or e.get("ref"))]
    return compact({
        "id": util.finding_id(sub.id, f.id), "reviewId": rid(sub), "type": f.type, "severity": f.severity,
        "title": f.title, "description": f.description, "matchedText": f.matched_text,
        "startIndex": f.start, "endIndex": f.end, "guidelineId": f.guideline_ref,
        "ruleReference": f.rule_reference, "evidenceIds": ids or None, "evidenceStatus": f.evidence_status,
        "suggestedRevision": f.suggestion, "explanation": f.explanation, "status": f.status,
        "dismissReason": f.dismiss_reason, "createdAt": util.relative_time(utc(f.created_at)),
        "source": f.source, "aiModel": f.ai_model})


def review_dict(sub: m.Submission, findings: list[m.Finding]) -> dict:
    open_f = [f for f in findings if f.status == "open"]
    return compact({
        "id": rid(sub), "campaignTitle": sub.campaign_title, "category": sub.category or sub.content_type,
        "contentType": sub.content_type, "brandPackName": sub.brand_pack_name,
        "campaignContext": sub.campaign_context, "draftText": sub.draft_text,
        "originalDraftText": sub.original_draft_text, "activeRevisionVersion": sub.version,
        "reviewerComment": sub.reviewer_comment, "reviewerDecision": sub.reviewer_decision,
        "reviewedBy": sub.reviewed_by, "reviewedAt": util.relative_time(utc(sub.reviewed_at)),
        "submittedBy": {"name": sub.submitted_by_name, "role": sub.submitted_by_role},
        "createdAt": util.relative_time(utc(sub.created_at)),
        "lastUpdated": util.relative_time(utc(sub.updated_at)),
        "submittedAt": util.relative_time(utc(sub.submitted_at)), "status": sub.status,
        "flaggedIssuesCount": sum(1 for f in open_f if f.severity != "Notice"),
        "unverifiedClaimsCount": sum(1 for f in open_f if f.evidence_status in UNVERIFIED),
        "complianceScore": util.compliance_score([f.severity for f in open_f]),
        "uploadedDocument": sub.uploaded_document, "targetModelId": sub.target_model_id,
        "actualModelUsed": sub.actual_model_used, "analysisNote": sub.analysis_note})


def reviews_to_dicts(db: Session, subs: list[m.Submission]) -> list[dict]:
    """One query for all findings instead of one per review."""
    if not subs:
        return []
    by_sub: dict[int, list[m.Finding]] = {s.id: [] for s in subs}
    versions = {s.id: s.version for s in subs}
    for f in db.query(m.Finding).filter(m.Finding.submission_id.in_(list(by_sub))).all():
        if f.version == versions[f.submission_id]:
            by_sub[f.submission_id].append(f)
    return [review_dict(s, by_sub[s.id]) for s in subs]


# ---------- report ----------

_CLAIM_STATUS = {"supported": "Supported", "missing": "Unsubstantiated", "expired": "Expired",
                 "inconclusive": "Inconclusive", "contradicted": "Contradicted", "not_applicable": "Not Evaluated"}


def build_report(db: Session, sub: m.Submission) -> dict:
    findings = current_findings(db, sub)
    fdicts = [finding_dict(f, sub) for f in findings]
    review = review_dict(sub, findings)

    factual = [f for f in findings if f.type == "factual_claim" or f.evidence_status != "not_applicable"]
    claim_verifications = []
    for f in factual:
        ev = (f.evidence or [{}])[0]
        claim_verifications.append(compact({
            "id": util.finding_id(sub.id, f.id), "claimText": f.matched_text or f.title,
            "status": _CLAIM_STATUS.get(f.evidence_status, "Not Evaluated"),
            "evidenceReference": ev.get("evidence") or ev.get("text") or f.rule_reference,
            "evidenceValidity": compact({"expiryDate": ev.get("valid_to"),
                                         "isExpired": f.evidence_status == "expired"}) if ev else None,
            "explanation": f.explanation, "requiresHumanReview": f.evidence_status != "supported"}))

    # Proposed text: apply span replacements from the end so positions stay valid, then append disclosures
    text, replaced, unresolved = sub.draft_text, 0, 0
    for f in sorted(findings, key=lambda f: -(f.start if f.start is not None else -1)):
        if not f.suggestion:
            unresolved += 1 if f.severity != "Notice" else 0
            continue
        if f.start is not None and f.end is not None:
            text = text[:f.start] + f.suggestion + text[f.end:]
            replaced += 1
        elif f.suggestion.startswith(sub.draft_text.rstrip()):
            extra = f.suggestion[len(sub.draft_text.rstrip()):].strip()
            if extra:
                text = text.rstrip() + "\n\n" + extra
                replaced += 1
        else:
            unresolved += 1

    tone_rules = [f"{r.name}: {r.summary}" for r in
                  db.query(m.Rule).filter(m.Rule.category == "Tone and Voice", m.Rule.status == "Active")]
    tone_on = llm.is_configured("tone")
    used_ai = any(f.source == "ai" for f in findings) or "Rules engine" not in (sub.actual_model_used or "Rules engine")
    sev = lambda s: sum(1 for f in findings if f.severity == s)    # noqa: E731
    open_f = [f for f in findings if f.status == "open"]

    return compact({
        "reportVersion": "1.0", "platform": PLATFORM,
        "metadata": compact({"reviewId": rid(sub), "campaignTitle": sub.campaign_title,
                             "contentType": sub.content_type, "brandPackName": sub.brand_pack_name,
                             "submittedAt": review.get("submittedAt") or review.get("createdAt"),
                             "reviewedAt": review.get("reviewedAt"), "reviewerDecision": sub.reviewer_decision,
                             "status": sub.status, "revisionVersion": sub.version}),
        "engine": {"configuredModelId": sub.target_model_id or "server-default",
                   "configuredModelName": sub.target_model_id or "Server-configured models",
                   "configuredProvider": "Pratyay backend",
                   "actualEngineUsed": sub.actual_model_used or "Rules engine (server)",
                   "executionMode": "llm_service" if used_ai else "offline_deterministic",
                   "generatedAt": now_utc().isoformat(),
                   "disclaimer": ("Generated by the Pratyay backend: rule checks plus AI-assisted analysis "
                                  "(models listed above). Suggestions are advisory; a human makes the final decision."
                                  if used_ai else
                                  "Generated by the Pratyay backend using deterministic rule checks only. "
                                  "No AI model was used for this review.")},
        "summary": {"totalFindings": len(findings), "highSeverityCount": sev("High"),
                    "mediumSeverityCount": sev("Medium"), "lowSeverityCount": sev("Low"),
                    "noticesCount": sev("Notice"),
                    "unverifiedClaimsCount": sum(1 for f in factual if f.evidence_status in UNVERIFIED),
                    "complianceScore": util.compliance_score([f.severity for f in open_f])},
        "findings": fdicts, "claimVerifications": claim_verifications,
        "toneAnalysis": {"status": "evaluated" if tone_on else "pending_ai_service",
                         "toneGuidelines": tone_rules,
                         "summary": ("Tone was checked by the configured AI model against the active tone guidelines."
                                     if tone_on else
                                     "Tone analysis needs an AI model. Configure TONE_BASE_URL on the backend."),
                         "applicableFindings": [d for d, f in zip(fdicts, findings) if f.category == "tone"]},
        "correctedContent": {"originalText": sub.draft_text, "proposedRevisedText": text,
                             "isFullyFixable": unresolved == 0, "replacementsCount": replaced,
                             "unresolvedIssuesCount": unresolved},
        "signOff": compact({"actor": sub.reviewed_by, "decision": sub.reviewer_decision,
                            "comment": sub.reviewer_comment,
                            "signedOffAt": review.get("reviewedAt")}) if sub.reviewer_decision else None})
