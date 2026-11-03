"""Small pure helpers (no database, no web framework), so they can be unit-tested anywhere."""
import re
from datetime import date, datetime, timezone


# ---------- ids shown by the frontend ----------

def fmt_id(prefix: str, n: int) -> str:
    return f"{prefix}-{n}"


def parse_id(prefix: str, s: str) -> int | None:
    m = re.fullmatch(rf"{re.escape(prefix)}-(\d+)", s or "")
    return int(m.group(1)) if m else None


def review_id(n: int, created: datetime | None = None) -> str:
    year = (created or datetime.now(timezone.utc)).year
    return f"REV-{year}-{n:03d}"


def parse_review_id(s: str) -> int | None:
    m = re.fullmatch(r"REV-\d{4}-(\d+)", s or "")
    return int(m.group(1)) if m else None


def finding_id(submission_n: int, finding_n: int) -> str:
    return f"FIND-{submission_n}-{finding_n}"


def parse_finding_id(s: str) -> tuple[int, int] | None:
    m = re.fullmatch(r"FIND-(\d+)-(\d+)", s or "")
    return (int(m.group(1)), int(m.group(2))) if m else None


# ---------- display times ----------

def relative_time(dt: datetime | None, now: datetime | None = None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = now or datetime.now(timezone.utc)
    secs = int((now - dt).total_seconds())
    if secs < 60:
        return "Just now"
    if secs < 3600:
        return f"{secs // 60} min ago"
    if secs < 86400:
        h = secs // 3600
        return f"{h} hour{'s' if h > 1 else ''} ago"
    if secs < 7 * 86400:
        d = secs // 86400
        return f"{d} day{'s' if d > 1 else ''} ago"
    return dt.strftime("%d %b %Y")


def parse_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


# ---------- evidence ----------

EVIDENCE_STATUS = {
    "Evidence Available": "available",
    "Expired Evidence": "expired",
    "Missing Evidence": "missing",
    "Needs Review": "review",
}


def claim_pattern(*texts: str | None) -> str:
    """Build a forgiving regex that finds an approved claim in a draft: the words must appear in
    order, separated by any punctuation or whitespace. Several texts become alternatives."""
    alts = []
    for t in texts:
        words = re.findall(r"[A-Za-z0-9%#']+", t or "")
        if len(words) >= 2 or (len(words) == 1 and len(words[0]) >= 5):
            alts.append(r"(?<!\w)" + r"[\W_]+".join(re.escape(w) for w in words) + r"(?!\w)")
    alts = list(dict.fromkeys(alts))
    return "|".join(alts) if alts else r"(?!x)x"      # a pattern that never matches


# ---------- scoring ----------

_WEIGHT = {"High": 20, "Medium": 8, "Low": 3, "Notice": 0}


def compliance_score(open_severities: list[str]) -> int:
    """100 minus a penalty per unresolved finding, never below 0."""
    return max(0, 100 - sum(_WEIGHT.get(s, 0) for s in open_severities))


def title_severity(s: str) -> str:
    return {"high": "High", "medium": "Medium", "low": "Low", "notice": "Notice"}.get(s.lower(), "Medium")
