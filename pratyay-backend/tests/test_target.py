"""Per-review model choice: hosted models use a server-side key; saved self-hosted models use their own URL."""
import json
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test_target.db"

from fastapi.testclient import TestClient  # noqa: E402

from app import config, llm, target  # noqa: E402
from app.main import app  # noqa: E402

B = "/api/v1"
CREATOR = {"name": "Content Creator (Demo)", "role": "Content Creator (Demo)"}
DRAFT = "Join India's fastest network. Special offer on cheap recharge plans."


def data(r, code=200):
    assert r.status_code == code, r.text
    return r.json()["data"]


def test_hosted_model_needs_server_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    cfg, note = target.resolve(None, "gemini-2.5-flash")
    assert cfg["base_url"] == "" and "GEMINI_API_KEY" in note          # AI off, and says why
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    cfg, note = target.resolve(None, "gemini-2.5-flash")
    assert cfg["api_key"] == "k" and "generativelanguage" in cfg["base_url"] and note is None
    assert target.resolve(None, None) == (None, None)


def test_self_hosted_crud_validates_and_hides_key():
    with TestClient(app) as c:
        assert data(c.get(f"{B}/self-hosted-models")) == []
        assert c.post(f"{B}/self-hosted-models", json={"name": "x", "baseUrl": "ftp://bad"}).status_code == 422
        row = data(c.post(f"{B}/self-hosted-models", json={
            "name": "My llama", "baseUrl": "http://localhost:8080/v1/", "apiKey": "secret"}), 201)
        assert row["id"].startswith("selfhosted:") and row["model"] == "local"
        assert row["baseUrl"] == "http://localhost:8080/v1" and row["hasApiKey"] is True
        assert "secret" not in json.dumps(data(c.get(f"{B}/self-hosted-models")))
        data(c.delete(f"{B}/self-hosted-models/{row['id']}"))
        assert c.delete(f"{B}/self-hosted-models/{row['id']}").status_code == 404


def test_review_uses_selected_self_hosted_server():
    calls = []

    def fake_post(url, headers, payload, timeout):
        calls.append((url, headers["Authorization"], payload["model"]))
        return {"choices": [{"message": {"content": json.dumps({"claims": [], "issues": []})}}]}

    saved = llm._post
    llm._post = fake_post
    try:
        with TestClient(app) as c:
            row = data(c.post(f"{B}/self-hosted-models", json={
                "name": "Qwen", "baseUrl": "http://localhost:8080/v1", "model": "qwen", "apiKey": "abc"}), 201)
            review = data(c.post(f"{B}/reviews", json={
                "campaignTitle": "t", "contentType": "Other", "brandPackName": "p", "draftText": DRAFT,
                "status": "Draft", "submittedBy": CREATOR, "targetModelId": row["id"]}), 201)
            assert calls and all(u == "http://localhost:8080/v1/chat/completions" for u, _, _ in calls)
            assert all(a == "Bearer abc" and mdl == "qwen" for _, a, mdl in calls)
            assert "local:qwen" in review["actualModelUsed"]

            # deleting the saved model falls back to the server default and records why
            data(c.delete(f"{B}/self-hosted-models/{row['id']}"))
            n = len(calls)
            again = data(c.post(f"{B}/reviews/{review['id']}/analyze", json={}))
            assert len(calls) == n and "no longer exists" in again["review"]["analysisNote"]
    finally:
        llm._post = saved
