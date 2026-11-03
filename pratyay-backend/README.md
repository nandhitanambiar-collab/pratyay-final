# Pratyay backend

FastAPI backend for the Pratyay frontend. Implements the `/api/v1` contract in the frontend's
`FRONTEND_HANDOFF.md`, with a rules engine and optional AI stages (claim extraction, evidence
retrieval, claim verification, tone).

## Run
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API docs: http://127.0.0.1:8000/docs. SQLite by default; for PostgreSQL set
`DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/pratyay`.
Tables are created and demo data seeded on first start. **If you ran an earlier version, delete
`pratyay.db` first: the tables changed.**

## Turn on AI (optional; without it only rule checks run)
Each task points at any OpenAI-compatible server. Mix local and hosted per task:
```bash
llama-server -m ./models/your-model.gguf --port 8081 --jinja          # local, for tone
export TONE_BASE_URL=http://localhost:8081/v1  TONE_MODEL=local
export VERIFY_BASE_URL=https://<provider>/v1  VERIFY_MODEL=<model>  VERIFY_API_KEY=<key>
# EXTRACT_* defaults to VERIFY_*
```
`GET /api/v1/models` reports which model handles each task. Every AI finding carries `source: "ai"`
and `aiModel`, and the frontend shows it.

## How a review is checked
1. Rules: restricted and preferred terms, required wording on promotional copy, claims registry
   (supported / expired / missing evidence / needs review), risky wording with no evidence.
2. AI (if configured): extract claims, retrieve approved evidence, verify against that evidence only,
   check tone. Code rejects invented quotes and citations; no evidence means "unsubstantiated",
   never "false".
3. Findings are stored per review version. If guidelines or evidence change, the next load re-checks
   automatically and keeps decisions on identical findings. Approved reviews are frozen.

## Rules enforced by the server (human control)
- Only `In Review` items can be signed off; creators cannot sign off; confirmation is required.
- Approving with open High findings needs a written reason, which is recorded in the audit trail.
- Requesting changes needs a comment; dismissing a finding needs a reason.
- Text of a submitted review changes only through resubmission (new version, old one kept).
- Only drafts can be deleted; the audit trail is append-only.

## Test
```bash
PYTHONPATH=. python tests/test_rules.py   # rules engine, no packages needed
PYTHONPATH=. python tests/test_ai.py      # AI stages with a fake model, no packages needed
PYTHONPATH=. python tests/test_util.py
pytest -q                                  # full API flow (needs requirements.txt)
```

## Layout
`app/api_v1.py` endpoints · `app/service.py` database logic and JSON shapes · `app/rules.py` rules
engine · `app/llm.py` provider layer · `app/retrieval.py` evidence search (swap in pgvector here) ·
`app/ai.py` AI stages · `app/pipeline.py` caching and AI glue · `app/seed.py` demo data
