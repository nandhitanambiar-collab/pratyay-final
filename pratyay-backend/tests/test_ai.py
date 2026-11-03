"""Tests for provider layer, retrieval and AI stages, using a fake model server (no network)."""
import json
from contextlib import contextmanager
from datetime import date

from app import ai, config, llm, retrieval

TODAY = date(2026, 10, 27)

DOCS = [
    retrieval.Doc("claim:1", "claim", "India's fastest network. Evidence: Speed report 2025.", date(2026, 3, 31)),
    retrieval.Doc("claim:2", "claim", "50 million customers. Evidence: Annual report FY26.", date(2027, 6, 30)),
    retrieval.Doc("guideline:1", "general", "Pricing: prices are always shown inclusive of taxes."),
    retrieval.Doc("guideline:2", "tone", "Brand voice: warm, confident, plain-spoken."),
]


@contextmanager
def fake_model(reply, tasks=("verify", "extract", "tone"), statuses=None):
    """Replace the network call. `reply(payload)` returns a dict (the JSON the model 'writes')."""
    saved_cfg, saved_post = dict(config.LLM_TASKS), llm._post
    calls = []

    def fake_post(url, headers, payload, timeout):
        calls.append(payload)
        if statuses and len(calls) <= len(statuses) and statuses[len(calls) - 1] >= 400:
            raise llm.LLMHTTPError(statuses[len(calls) - 1], "unsupported")
        return {"choices": [{"message": {"content": json.dumps(reply(payload))}}]}

    for t in tasks:
        config.LLM_TASKS[t] = {"base_url": "http://localhost:8081/v1", "model": "test", "api_key": "x"}
    llm._post = fake_post
    try:
        yield calls
    finally:
        config.LLM_TASKS.update(saved_cfg)
        llm._post = saved_post


# ---------- retrieval ----------

def test_retrieval_finds_matching_claim_with_high_coverage():
    top = retrieval.rank("Trusted by 50 million customers", DOCS)[0]
    assert top[0].id == "claim:2" and top[2] >= 0.5


def test_retrieval_low_coverage_for_unrelated_claim():
    ranked = retrieval.rank("Cures hair fall in 3 days", DOCS)
    assert not ranked or ranked[0][2] < 0.5


# ---------- text helpers ----------

def test_chunks_cover_text_exactly():
    text = ("Paragraph one. " * 40 + "\n\n") * 6
    chunks = ai.chunk_text(text, max_chars=500)
    assert "".join(c for _, c in chunks) == text
    for off, c in chunks:
        assert text[off:off + len(c)] == c


def test_locate_exact_and_loose():
    chunk = "Join India's  fastest network today."
    assert ai.locate(chunk, 100, "India's  fastest network") == (105, 105 + len("India's  fastest network"))
    s = ai.locate(chunk, 0, "india's fastest network")           # different case and spacing
    assert s and chunk[s[0]:s[1]].lower().replace("  ", " ") == "india's fastest network"
    assert ai.locate(chunk, 0, "something invented") is None


# ---------- provider layer ----------

def test_chat_json_parses_code_fences_and_falls_back_on_400():
    with fake_model(lambda p: {"claims": []}, statuses=[400]) as calls:
        assert llm.chat_json("verify", "s", "u", {"type": "object"}) == {"claims": []}
        assert calls[0]["response_format"]["type"] == "json_schema"
        assert calls[1]["response_format"]["type"] == "json_object"      # retried in plain JSON mode


def test_label_shows_local_or_api():
    config.LLM_TASKS["tone"] = {"base_url": "http://localhost:8081/v1", "model": "qwen", "api_key": "x"}
    assert llm.label("tone") == "local:qwen"
    config.LLM_TASKS["tone"] = {"base_url": "https://api.example.com/v1", "model": "big", "api_key": "x"}
    assert llm.label("tone") == "api:api.example.com/big"
    config.LLM_TASKS["tone"] = {"base_url": "", "model": "local", "api_key": "none"}


# ---------- verification ----------

def test_no_evidence_means_no_model_call():
    with fake_model(lambda p: {}) as calls:
        r = ai.assess_claim("Cures hair fall in 3 days", DOCS, TODAY)
    assert r["verdict"] == "unsubstantiated" and calls == []


def test_supported_with_valid_citation():
    reply = lambda p: {"verdict": "supported", "evidence_ids": ["E1"], "reason": "matches", "rewrite": ""}
    with fake_model(reply):
        r = ai.assess_claim("Trusted by 50 million customers", DOCS, TODAY)
    assert r["verdict"] == "supported" and r["evidence"][0]["id"] == "claim:2"


def test_supported_without_real_citation_is_downgraded():
    reply = lambda p: {"verdict": "supported", "evidence_ids": ["E9"], "reason": "trust me", "rewrite": ""}
    with fake_model(reply):
        r = ai.assess_claim("Trusted by 50 million customers", DOCS, TODAY)
    assert r["verdict"] == "uncertain"


def test_support_from_expired_evidence_becomes_expired():
    reply = lambda p: {"verdict": "supported", "evidence_ids": ["E1"], "reason": "matches", "rewrite": ""}
    with fake_model(reply):
        r = ai.assess_claim("We run India's fastest network", DOCS, TODAY)
    assert r["verdict"] == "expired"


def test_bad_verdict_value_becomes_uncertain():
    reply = lambda p: {"verdict": "definitely false!", "evidence_ids": [], "reason": "", "rewrite": ""}
    with fake_model(reply):
        r = ai.assess_claim("Trusted by 50 million customers", DOCS, TODAY)
    assert r["verdict"] == "uncertain"


def test_verifier_prompt_contains_only_retrieved_evidence():
    seen = {}
    def reply(p):
        seen["user"] = p["messages"][-1]["content"]
        return {"verdict": "unsubstantiated", "evidence_ids": [], "reason": "", "rewrite": ""}
    with fake_model(reply):
        ai.assess_claim("Trusted by 50 million customers", DOCS, TODAY)
    assert "50 million customers" in seen["user"] and "warm, confident" not in seen["user"]   # tone doc excluded


# ---------- extraction ----------

def test_extract_chunk_filters_malformed_items():
    reply = lambda p: {"claims": [{"quote": "fastest network", "type": "superlative"}, {"nope": 1}, "str"]}
    with fake_model(reply):
        assert ai.extract_chunk("x") == [{"quote": "fastest network", "type": "superlative"}]


if __name__ == "__main__":
    import sys
    failed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            try:
                fn(); print("PASS", name)
            except Exception as e:
                failed += 1; print("FAIL", name, repr(e))
    sys.exit(1 if failed else 0)
