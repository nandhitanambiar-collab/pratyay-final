from datetime import date

from app.rules import ClaimRecord, RequiredTextRule, RuleSet, TermRule, run_rules, PROMO_TRIGGER

TODAY = date(2026, 10, 27)

RULES = RuleSet(
    terms=[
        TermRule(1, "cheap", "preferred", "affordable", name="Wording", ref="RULE-1"),
        TermRule(2, "unlimited", "banned", severity="high", note="Ask legal.", name="Unlimited", ref="RULE-2"),
    ],
    required=[RequiredTextRule(1, r"\boffer\b|\d+\s?%\s?off", "T&C apply", name="Disclaimer", ref="RULE-3")],
    claims=[
        ClaimRecord(1, r"india'?s\s+fastest(\s+network)?", "India's fastest network",
                    "Speed report 2025", "Brand", date(2026, 3, 31), name="Fastest", ref="FACT-1"),       # expired by date
        ClaimRecord(2, r"50\s?million\s+customers", "50 million customers",
                    "Annual report", "IR", date(2027, 6, 30), name="Customers", ref="FACT-2"),           # valid
        ClaimRecord(3, r"clinically\s+tested", "Clinically tested", "", "QA", None,
                    status="missing", name="Clinical", ref="FACT-3"),
        ClaimRecord(4, r"carbon\s+neutral", "Carbon neutral", "Audit pending", "ESG", None,
                    status="review", name="Carbon", ref="FACT-4"),
    ],
)


def pairs(findings):
    return [(f["category"], f["severity"], f["evidence_status"]) for f in findings]


def test_expired_claim_is_flagged_high_and_never_called_false():
    f = run_rules("Join India's fastest network today.", RULES, TODAY)
    assert pairs(f) == [("claim", "high", "expired")]
    assert f[0]["evidence"][0]["ref"] == "FACT-1"
    assert "does not establish that the claim is false" in f[0]["explanation"]


def test_valid_claim_gives_supported_notice_only():
    f = run_rules("Trusted by 50 million customers.", RULES, TODAY)
    assert pairs(f) == [("claim", "notice", "supported")]


def test_missing_and_review_states():
    assert pairs(run_rules("Our serum is clinically tested.", RULES, TODAY)) == [("claim", "high", "missing")]
    assert pairs(run_rules("We are carbon neutral.", RULES, TODAY)) == [("claim", "medium", "inconclusive")]


def test_unsupported_superlative_is_flagged():
    f = run_rules("We are the best provider.", RULES, TODAY)
    assert pairs(f) == [("claim", "medium", "missing")]
    assert f[0]["rule_reference"] == "Claim Substantiation Standard"


def test_risky_word_inside_supported_claim_sentence_is_not_flagged_again():
    f = run_rules("Trusted by 50 million customers, guaranteed.", RULES, TODAY)
    assert pairs(f) == [("claim", "notice", "supported")]


def test_preferred_term_suggestion_and_span():
    text = "A cheap plan."
    f = run_rules(text, RULES, TODAY)
    assert f[0]["type"] == "terminology" and f[0]["suggestion"] == "affordable"
    assert text[f[0]["start"]:f[0]["end"]] == "cheap"
    assert f[0]["rule_reference"] == "Wording (RULE-1)" and f[0]["guideline_ref"] == "RULE-1"


def test_banned_term():
    f = run_rules("Get unlimited data.", RULES, TODAY)
    assert f[0]["type"] == "rule_violation" and f[0]["severity"] == "high"


def test_missing_disclaimer_is_document_level_and_suggests_full_text():
    text = "Special offer this week."
    f = run_rules(text, RULES, TODAY)
    assert f[0]["type"] == "required_text" and f[0]["start"] is None
    assert f[0]["suggestion"] == text + "\n\nT&C apply"
    assert run_rules("Special offer this week. T&C apply.", RULES, TODAY) == []


def test_disclaimer_not_required_for_non_promotional_copy():
    assert run_rules("Our team met on Tuesday.", RULES, TODAY) == []


def test_default_trigger_covers_coaching_results():
    rules = RuleSet(required=[RequiredTextRule(1, "", "*Results reflect select candidates", ref="RULE-9")])
    assert len(run_rules("8 rank holders in the top 10", rules, TODAY)) == 1
    assert PROMO_TRIGGER


def test_word_boundaries():
    assert run_rules("This is a cheaper option.", RULES, TODAY) == []


def test_no_dot_split_inside_number():
    f = run_rules("We are No.1 in service.", RULES, TODAY)
    assert pairs(f) == [("claim", "medium", "missing")]


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
