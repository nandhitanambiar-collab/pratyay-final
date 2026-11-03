import re
from datetime import datetime, timedelta, timezone

from app import util

NOW = datetime(2026, 10, 29, 12, 0, tzinfo=timezone.utc)


def test_ids_roundtrip():
    assert util.parse_review_id(util.review_id(7, NOW)) == 7
    assert util.review_id(7, NOW) == "REV-2026-007"
    assert util.parse_id("RULE", "RULE-12") == 12 and util.parse_id("RULE", "FACT-12") is None
    assert util.parse_finding_id(util.finding_id(3, 41)) == (3, 41)
    assert util.parse_review_id("../etc") is None


def test_relative_time():
    assert util.relative_time(NOW - timedelta(seconds=5), NOW) == "Just now"
    assert util.relative_time(NOW - timedelta(minutes=5), NOW) == "5 min ago"
    assert util.relative_time(NOW - timedelta(hours=1), NOW) == "1 hour ago"
    assert util.relative_time(NOW - timedelta(days=3), NOW) == "3 days ago"
    assert util.relative_time(None, NOW) is None


def test_claim_pattern_matches_loosely_and_never_matches_empty():
    p = util.claim_pattern("India's fastest network", "")
    assert re.search(p, "Join INDIA'S   fastest-network today", re.I)
    assert not re.search(p, "Indian fastest networks", re.I)
    assert not re.search(util.claim_pattern("", None), "anything at all", re.I)


def test_compliance_score():
    assert util.compliance_score([]) == 100
    assert util.compliance_score(["High", "Medium", "Notice"]) == 72
    assert util.compliance_score(["High"] * 10) == 0


def test_parse_date():
    assert util.parse_date("2025-06-01").year == 2025 and util.parse_date("June 2025") is None


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
