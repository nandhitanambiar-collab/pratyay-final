"""The /api/v1 endpoints the frontend calls (see FRONTEND_HANDOFF.md section 7).
Every response is {success, data, message?, timestamp}, except /health."""
from fastapi import APIRouter, Body, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from . import config, llm, pipeline, service, util
from . import models as m
from . import schemas as s
from .db import get_db
from .service import compact, envelope, get_submission, rid

router = APIRouter(prefix="/api/v1")


def _page(q, limit: int, offset: int):
    return q.offset(max(offset, 0)).limit(min(max(limit, 1), 500)).all()


@router.get("/health")
def health():
    return {"status": "ok", "timestamp": service.now_utc().isoformat()}


# ============ Guidelines ============

def _get_rule(db: Session, id: str) -> m.Rule:
    n = util.parse_id("RULE", id)
    r = db.get(m.Rule, n) if n is not None else None
    if r is None:
        raise HTTPException(404, f"Guideline {id} not found")
    return r




@router.get("/guidelines")
def list_guidelines(category: str | None = None, status: str | None = None, search: str | None = None,
                    limit: int = 200, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(m.Rule)
    if category:
        q = q.filter(m.Rule.category == category)
    if status:
        q = q.filter(m.Rule.status == status)
    if search:
        like = f"%{search}%"
        q = q.filter(m.Rule.name.ilike(like) | m.Rule.summary.ilike(like) | m.Rule.target_term.ilike(like))
    return envelope([service.rule_dict(r) for r in _page(q.order_by(m.Rule.id.desc()), limit, offset)])


@router.get("/guidelines/{id}")
def get_guideline(id: str, db: Session = Depends(get_db)):
    return envelope(service.rule_dict(_get_rule(db, id)))


@router.post("/guidelines", status_code=201)
def create_guideline(body: s.GuidelineIn, db: Session = Depends(get_db),
                     x_user: str = Header(default="Workspace Admin (Demo)"),
                     x_role: str = Header(default="Brand Admin (Demo)")):
    r = m.Rule(**body.model_dump())
    db.add(r)
    db.flush()
    service.log_event(db, None, "guideline_updated", x_user, x_role, f'Created guideline "{r.name}" (RULE-{r.id}).')
    db.commit()
    return envelope(service.rule_dict(r))


@router.put("/guidelines/{id}")
def update_guideline(id: str, body: s.GuidelineUpdate, db: Session = Depends(get_db),
                     x_user: str = Header(default="Workspace Admin (Demo)"),
                     x_role: str = Header(default="Brand Admin (Demo)")):
    r = _get_rule(db, id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    service.log_event(db, None, "guideline_updated", x_user, x_role, f'Updated guideline "{r.name}" ({id}).')
    db.commit()
    return envelope(service.rule_dict(r))


@router.delete("/guidelines/{id}")
def delete_guideline(id: str, db: Session = Depends(get_db),
                     x_user: str = Header(default="Workspace Admin (Demo)"),
                     x_role: str = Header(default="Brand Admin (Demo)")):
    r = _get_rule(db, id)
    name = r.name
    db.delete(r)
    service.log_event(db, None, "guideline_updated", x_user, x_role, f'Deleted guideline "{name}" ({id}).')
    db.commit()
    return envelope({"deleted": True, "id": id})


# ============ Evidence ============

def _get_fact(db: Session, id: str) -> m.Evidence:
    n = util.parse_id("FACT", id)
    e = db.get(m.Evidence, n) if n is not None else None
    if e is None:
        raise HTTPException(404, f"Evidence {id} not found")
    return e


@router.get("/evidence")
def list_evidence(status: str | None = None, search: str | None = None, limit: int = 200, offset: int = 0,
                  db: Session = Depends(get_db)):
    q = db.query(m.Evidence)
    if status:
        q = q.filter(m.Evidence.evidence_status == status)
    if search:
        like = f"%{search}%"
        q = q.filter(m.Evidence.claim_name.ilike(like) | m.Evidence.approved_statement.ilike(like)
                     | m.Evidence.source_reference.ilike(like))
    return envelope([service.evidence_dict(e) for e in _page(q.order_by(m.Evidence.id.desc()), limit, offset)])


@router.get("/evidence/{id}")
def get_evidence(id: str, db: Session = Depends(get_db)):
    return envelope(service.evidence_dict(_get_fact(db, id)))


@router.post("/evidence", status_code=201)
def create_evidence(body: s.EvidenceIn, db: Session = Depends(get_db),
                    x_user: str = Header(default="Workspace Admin (Demo)"),
                    x_role: str = Header(default="Brand Admin (Demo)")):
    e = m.Evidence(**body.model_dump())
    db.add(e)
    db.flush()
    service.log_event(db, None, "guideline_updated", x_user, x_role,
                      f'Added approved fact "{e.claim_name}" (FACT-{e.id}).')
    db.commit()
    return envelope(service.evidence_dict(e))


@router.put("/evidence/{id}")
def update_evidence(id: str, body: s.EvidenceUpdate, db: Session = Depends(get_db),
                    x_user: str = Header(default="Workspace Admin (Demo)"),
                    x_role: str = Header(default="Brand Admin (Demo)")):
    e = _get_fact(db, id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    service.log_event(db, None, "guideline_updated", x_user, x_role, f'Updated approved fact "{e.claim_name}" ({id}).')
    db.commit()
    return envelope(service.evidence_dict(e))


@router.delete("/evidence/{id}")
def delete_evidence(id: str, db: Session = Depends(get_db),
                    x_user: str = Header(default="Workspace Admin (Demo)"),
                    x_role: str = Header(default="Brand Admin (Demo)")):
    e = _get_fact(db, id)
    name = e.claim_name
    db.delete(e)
    service.log_event(db, None, "guideline_updated", x_user, x_role, f'Deleted approved fact "{name}" ({id}).')
    db.commit()
    return envelope({"deleted": True, "id": id})


# ============ Reviews ============

@router.get("/reviews")
def list_reviews(status: str | None = None, category: str | None = None, search: str | None = None,
                 limit: int = 200, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(m.Submission)
    if status and status != "All":
        q = q.filter(m.Submission.status == status)
    if category:
        q = q.filter((m.Submission.category == category) | (m.Submission.content_type == category))
    if search:
        like = f"%{search}%"
        q = q.filter(m.Submission.campaign_title.ilike(like) | m.Submission.draft_text.ilike(like))
    subs = _page(q.order_by(m.Submission.id.desc()), limit, offset)
    return envelope(service.reviews_to_dicts(db, subs))


@router.get("/reviews/{id}")
def get_review(id: str, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    return envelope(service.review_dict(sub, service.current_findings(db, sub)))


@router.post("/reviews", status_code=201)
def create_review(body: s.ReviewCreate, db: Session = Depends(get_db)):
    sub = m.Submission(
        campaign_title=body.campaign_title, category=body.content_type, content_type=body.content_type,
        brand_pack_name=body.brand_pack_name, campaign_context=body.campaign_context,
        draft_text=body.draft_text, original_draft_text=body.draft_text, version=1, status=body.status,
        submitted_by_name=body.submitted_by.name, submitted_by_role=body.submitted_by.role,
        target_model_id=body.target_model_id,
        uploaded_document=body.uploaded_document.model_dump(by_alias=True, exclude_none=True)
        if body.uploaded_document else None,
        submitted_at=service.now_utc() if body.status == "In Review" else None)
    db.add(sub)
    db.flush()
    service.reanalyze(db, sub)
    if body.status == "In Review":
        service.log_event(db, sub, "content_submitted", sub.submitted_by_name, sub.submitted_by_role,
                          f'Created and submitted "{sub.campaign_title}" for brand governance review.',
                          previous="Draft", new="In Review")
    db.commit()
    return envelope(service.review_dict(sub, service.current_findings(db, sub)))


@router.put("/reviews/{id}")
def update_review(id: str, body: s.ReviewUpdate, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    if sub.status == "Approved":
        raise HTTPException(409, "Approved reviews cannot be edited.")
    data = body.model_dump(exclude_unset=True)

    new_text = data.get("draft_text")
    text_changed = new_text is not None and new_text != sub.draft_text
    if text_changed and sub.status != "Draft":
        raise HTTPException(409, f"The text of a review that is '{sub.status}' cannot be edited directly. "
                                 "Use a resubmission so the change is recorded as a new version.")

    new_status = data.get("status")
    if new_status and new_status != sub.status:
        if not (sub.status == "Draft" and new_status == "In Review"):
            raise HTTPException(409, f"A review cannot move from '{sub.status}' to '{new_status}' this way. "
                                     "Reviewer decisions go through sign-off.")

    model_changed = "target_model_id" in data and data["target_model_id"] != sub.target_model_id
    for field in ("campaign_title", "content_type", "brand_pack_name", "campaign_context", "target_model_id"):
        if field in data:
            setattr(sub, field, data[field])
    if "content_type" in data and data["content_type"]:
        sub.category = data["content_type"]
    if "uploaded_document" in data:
        doc = body.uploaded_document
        sub.uploaded_document = doc.model_dump(by_alias=True, exclude_none=True) if doc else None
    if text_changed:
        sub.draft_text = new_text
    if text_changed or model_changed:
        service.reanalyze(db, sub)      # a different target model means different AI findings
    if new_status and new_status != sub.status:
        previous = sub.status
        sub.status, sub.submitted_at = "In Review", service.now_utc()
        service.log_event(db, sub, "content_submitted", sub.submitted_by_name, sub.submitted_by_role,
                          f'Submitted "{sub.campaign_title}" for brand governance review.',
                          previous=previous, new="In Review")
    db.commit()
    return envelope(service.review_dict(sub, service.current_findings(db, sub)))


@router.delete("/reviews/{id}")
def delete_review(id: str, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    if sub.status != "Draft":
        raise HTTPException(409, "Only drafts can be deleted. Submitted reviews are kept for the audit trail.")
    for model in (m.Finding, m.Revision):
        db.query(model).filter_by(submission_id=sub.id).delete()
    db.query(m.AuditEvent).filter_by(submission_id=sub.id).update({"submission_id": None})   # keep history
    db.delete(sub)
    db.commit()
    return envelope({"deleted": True, "id": id})


# ============ Findings and analysis ============

@router.get("/reviews/{id}/findings")
def review_findings(id: str, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    service.ensure_fresh(db, sub)
    return envelope([service.finding_dict(f, sub) for f in service.current_findings(db, sub)])


@router.post("/reviews/{id}/analyze")
def analyze(id: str, body: dict | None = Body(default=None), db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    if sub.status == "Approved":
        raise HTTPException(409, "Approved reviews are frozen and cannot be re-analysed.")
    if body and isinstance(body.get("targetModelId"), str):
        sub.target_model_id = body["targetModelId"]
    service.reanalyze(db, sub)
    db.commit()
    findings = service.current_findings(db, sub)
    review = service.review_dict(sub, findings)
    return envelope({
        "analysisResult": service.build_report(db, sub),
        "findings": [service.finding_dict(f, sub) for f in findings],
        "complianceScore": review["complianceScore"],
        "flaggedIssuesCount": review["flaggedIssuesCount"],
        "unverifiedClaimsCount": review["unverifiedClaimsCount"]})


@router.get("/reviews/{id}/report")
def report(id: str, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    service.ensure_fresh(db, sub)
    return envelope(service.build_report(db, sub))


# ============ Human decisions ============

@router.post("/reviews/{id}/decisions/sign-off")
def sign_off(id: str, body: s.SignOffIn, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    if sub.status != "In Review":
        raise HTTPException(409, f"Only reviews that are 'In Review' can be signed off (this one is '{sub.status}').")
    if not body.confirmation_acknowledged:
        raise HTTPException(400, "The reviewer must confirm the decision before it is recorded.")
    if "creator" in body.reviewer_role.lower():
        raise HTTPException(403, "Content creators cannot approve or reject their own work.")
    comment = (body.comment or "").strip()
    if body.decision == "Needs Changes" and not comment:
        raise HTTPException(400, "A comment is required when requesting changes.")

    open_high = sum(1 for f in service.current_findings(db, sub) if f.severity == "High" and f.status == "open")
    if body.decision == "Approved" and open_high and not comment:
        raise HTTPException(400, f"{open_high} high-severity finding(s) are still open. Resolve or dismiss them, "
                                 "or add a comment explaining why you are approving anyway.")

    previous = sub.status
    sub.status, sub.reviewer_decision = body.decision, body.decision
    sub.reviewer_comment = comment or "Verified and approved for brand compliance standards." \
        if body.decision == "Approved" else comment
    sub.reviewed_by, sub.reviewed_at = body.reviewer_name, service.now_utc()
    if body.decision == "Approved":
        detail = sub.reviewer_comment
        if open_high:
            detail = f"Approved with {open_high} open high-severity finding(s). Reviewer's reason: {comment}"
        service.log_event(db, sub, "content_approved", body.reviewer_name, body.reviewer_role,
                          f'Approved "{sub.campaign_title}" for publication.',
                          previous=previous, new="Approved", comment=detail)
    else:
        service.log_event(db, sub, "changes_requested", body.reviewer_name, body.reviewer_role,
                          f'Changes requested on "{sub.campaign_title}": {comment}',
                          previous=previous, new="Needs Changes", comment=comment)
    db.commit()
    return envelope(service.review_dict(sub, service.current_findings(db, sub)))


@router.post("/reviews/{id}/decisions/resubmit")
def resubmit(id: str, body: s.ResubmitIn, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    if sub.status != "Needs Changes":
        raise HTTPException(409, f"Only reviews that need changes can be resubmitted (this one is '{sub.status}').")
    author = body.submitter_name or sub.submitted_by_name
    db.add(m.Revision(submission_id=sub.id, version=sub.version, draft_text=sub.draft_text,
                      author=sub.submitted_by_name, change_summary=body.change_summary))
    previous = sub.status
    sub.draft_text = body.new_draft_text
    sub.version += 1
    sub.status, sub.reviewer_decision, sub.submitted_at = "In Review", None, service.now_utc()
    service.reanalyze(db, sub)
    service.log_event(db, sub, "revision_resubmitted", author, sub.submitted_by_role,
                      f'Resubmitted "{sub.campaign_title}" as Version {sub.version}.',
                      previous=previous, new="In Review",
                      comment=body.change_summary or f"Resubmitted with revisions (Version {sub.version})")
    db.commit()
    return envelope(service.review_dict(sub, service.current_findings(db, sub)))


@router.patch("/reviews/{id}/findings/{finding_id}/decision")
def finding_decision(id: str, finding_id: str, body: s.FindingDecisionIn, db: Session = Depends(get_db)):
    sub = get_submission(db, id)
    parsed = util.parse_finding_id(finding_id)
    f = db.get(m.Finding, parsed[1]) if parsed else None
    if f is None or f.submission_id != sub.id or (parsed and parsed[0] != sub.id):
        raise HTTPException(404, f"Finding {finding_id} not found on review {id}")
    if f.version != sub.version:
        raise HTTPException(409, "This finding belongs to an earlier version and can no longer be changed.")
    if sub.status == "Approved":
        raise HTTPException(409, "Approved reviews are frozen.")
    if body.status == "dismissed" and not (body.dismiss_reason or "").strip():
        raise HTTPException(400, "A reason is required to dismiss a finding.")

    f.status = body.status
    f.dismiss_reason = body.dismiss_reason if body.status == "dismissed" else None
    who = body.reviewer_name or "Editorial Reviewer (Demo)"
    event, verb = {"accepted": ("finding_accepted", "Accepted"), "dismissed": ("finding_dismissed", "Dismissed"),
                   "resolved": ("finding_resolved", "Resolved"), "open": ("finding_reopened", "Reopened")}[body.status]
    service.log_event(db, sub, event, who, "Reviewer (Demo Identity)", f"{verb} finding {finding_id} on {rid(sub)}.",
                      comment=f.dismiss_reason)
    db.commit()
    return envelope(service.finding_dict(f, sub))


# ============ Models and engine ============

@router.get("/models")
def models():
    tasks = {t: ({"enabled": True, "model": llm.label(t)} if llm.is_configured(t) else {"enabled": False})
             for t in ("extract", "verify", "tone")}
    ai_on = any(v["enabled"] for v in tasks.values())
    return envelope({
        "models": [],       # the frontend keeps its own display catalogue; the server decides what actually runs
        "tasks": tasks,
        "activeEngine": {"name": "Pratyay rules engine + AI pipeline" if ai_on else "Pratyay rules engine (server)",
                         "version": "0.2.0", "mode": "llm_service" if ai_on else "offline_deterministic"},
        "defaultModelId": "server-default"})


# ============ Saved self-hosted models (llama.cpp etc.) ============

def _self_hosted_dict(r: m.SelfHostedModel) -> dict:
    # the API key is never returned, only whether one is stored
    return {"id": f"selfhosted:{r.id}", "name": r.name, "baseUrl": r.base_url, "model": r.model,
            "hasApiKey": bool(r.api_key)}


@router.get("/self-hosted-models")
def list_self_hosted_models(db: Session = Depends(get_db)):
    rows = db.query(m.SelfHostedModel).order_by(m.SelfHostedModel.id).all()
    return envelope([_self_hosted_dict(r) for r in rows])


@router.post("/self-hosted-models", status_code=201)
def create_self_hosted_model(body: s.SelfHostedModelIn, db: Session = Depends(get_db)):
    r = m.SelfHostedModel(name=body.name, base_url=body.base_url, model=body.model,
                          api_key=(body.api_key or "").strip() or None)
    db.add(r)
    db.commit()
    return envelope(_self_hosted_dict(r))


@router.delete("/self-hosted-models/{id}")
def delete_self_hosted_model(id: str, db: Session = Depends(get_db)):
    raw = id.removeprefix("selfhosted:")
    r = db.get(m.SelfHostedModel, int(raw)) if raw.isdigit() else None
    if r is None:
        raise HTTPException(404, f"Self-hosted model {id} not found")
    db.delete(r)
    db.commit()
    return envelope({"deleted": True, "id": id})


# ============ Audit ============

@router.get("/audit-events")
def audit_events(reviewId: str | None = None, eventType: str | None = None, limit: int = 500, offset: int = 0,
                 db: Session = Depends(get_db)):
    q = db.query(m.AuditEvent)
    if reviewId:
        q = q.filter(m.AuditEvent.review_ref == reviewId)
    if eventType:
        q = q.filter(m.AuditEvent.event_type == eventType)
    return envelope([service.audit_dict(e) for e in _page(q.order_by(m.AuditEvent.id.desc()), limit, offset)])


@router.post("/audit-events", status_code=201)
def create_audit_event(body: s.AuditCreate, db: Session = Depends(get_db)):
    sub = get_submission(db, body.review_id) if body.review_id else None
    e = m.AuditEvent(submission_id=sub.id if sub else None, review_ref=body.review_id, event_type=body.event_type,
                     review_title=body.review_title or (sub.campaign_title if sub else None),
                     previous_status=body.previous_status, new_status=body.new_status, actor=body.actor,
                     actor_role=body.actor_role, summary=body.summary, comment=body.comment,
                     revision_version=body.revision_version)
    db.add(e)
    db.commit()
    return envelope(service.audit_dict(e))
