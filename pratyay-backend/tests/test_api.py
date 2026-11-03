"""End-to-end API test against the frontend contract. Needs requirements.txt packages. Run: pytest -q"""
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

B = "/api/v1"
CREATOR = {"name": "Content Creator (Demo)", "role": "Content Creator (Demo)"}
DRAFT = "Join India's fastest network. Special offer on cheap recharge plans."


def data(r, code=200):
    assert r.status_code == code, r.text
    body = r.json()
    assert body["success"] is True and "timestamp" in body
    return body["data"]


def test_full_review_flow():
    with TestClient(app) as c:
        assert c.get(f"{B}/health").json()["status"] == "ok"
        assert len(data(c.get(f"{B}/guidelines"))) >= 5 and len(data(c.get(f"{B}/evidence"))) >= 3

        review = data(c.post(f"{B}/reviews", json={
            "campaignTitle": "Diwali post", "contentType": "Social Media Post", "brandPackName": "Pack",
            "draftText": DRAFT, "status": "Draft", "submittedBy": CREATOR}), 201)
        rid = review["id"]
        assert rid.startswith("REV-") and review["activeRevisionVersion"] == 1
        assert review["flaggedIssuesCount"] >= 3 and review["complianceScore"] < 100

        findings = data(c.get(f"{B}/reviews/{rid}/findings"))
        types = {f["type"] for f in findings}
        assert {"factual_claim", "terminology", "required_text"} <= types
        expired = next(f for f in findings if f["evidenceStatus"] == "expired")
        assert expired["severity"] == "High" and expired["evidenceIds"] and "startIndex" in expired
        assert "startIndex" not in next(f for f in findings if f["type"] == "required_text")   # document-level

        # submit, then a creator cannot sign off
        data(c.put(f"{B}/reviews/{rid}", json={"status": "In Review"}))
        so = {"decision": "Approved", "reviewerName": "R", "reviewerRole": "Editorial Reviewer (Demo)",
              "confirmationAcknowledged": True}
        assert c.post(f"{B}/reviews/{rid}/decisions/sign-off",
                      json={**so, "reviewerRole": "Content Creator (Demo)"}).status_code == 403
        # approving with an open high-severity finding needs a comment
        assert c.post(f"{B}/reviews/{rid}/decisions/sign-off", json=so).status_code == 400

        # request changes, then resubmit a clean revision (new version)
        data(c.post(f"{B}/reviews/{rid}/decisions/sign-off",
                    json={**so, "decision": "Needs Changes", "comment": "Claim evidence expired"}))
        rev = data(c.post(f"{B}/reviews/{rid}/decisions/resubmit", json={
            "newDraftText": "Join our network. Special offer on affordable top-up plans. T&C apply.",
            "changeSummary": "Removed expired claim"}))
        assert rev["activeRevisionVersion"] == 2 and rev["status"] == "In Review"
        assert data(c.get(f"{B}/reviews/{rid}/findings")) == []

        done = data(c.post(f"{B}/reviews/{rid}/decisions/sign-off", json=so))
        assert done["status"] == "Approved"
        assert c.put(f"{B}/reviews/{rid}", json={"campaignTitle": "x"}).status_code == 409   # frozen

        events = data(c.get(f"{B}/audit-events", params={"reviewId": rid}))
        kinds = [e["eventType"] for e in events]
        assert "changes_requested" in kinds and "revision_resubmitted" in kinds and "content_approved" in kinds


def test_finding_decisions_and_evidence_changes_refresh_findings():
    with TestClient(app) as c:
        rid = data(c.post(f"{B}/reviews", json={
            "campaignTitle": "T", "contentType": "Other", "brandPackName": "P",
            "draftText": "We are India's fastest network.", "submittedBy": CREATOR}), 201)["id"]
        f = data(c.get(f"{B}/reviews/{rid}/findings"))[0]
        # dismissing needs a reason
        assert c.patch(f"{B}/reviews/{rid}/findings/{f['id']}/decision", json={"status": "dismissed"}).status_code == 400
        ok = data(c.patch(f"{B}/reviews/{rid}/findings/{f['id']}/decision",
                          json={"status": "dismissed", "dismissReason": "Renewed"}))
        assert ok["status"] == "dismissed"

        # renewing the evidence changes the next analysis: the claim becomes supported
        fact = next(e for e in data(c.get(f"{B}/evidence")) if e["claimName"] == "India's fastest network")
        data(c.put(f"{B}/evidence/{fact['id']}", json={"evidenceStatus": "Evidence Available", "expiryDate": "2099-01-01"}))
        again = data(c.get(f"{B}/reviews/{rid}/findings"))
        assert again[0]["evidenceStatus"] == "supported" and again[0]["severity"] == "Notice"


def test_validation_and_not_found():
    with TestClient(app) as c:
        assert c.get(f"{B}/reviews/REV-2026-99999").status_code == 404
        assert c.get(f"{B}/reviews/nonsense").status_code == 404
        assert c.post(f"{B}/reviews", json={"campaignTitle": "", "draftText": "x", "submittedBy": CREATOR}).status_code == 422
        assert c.get(f"{B}/models").json()["data"]["activeEngine"]["version"]
