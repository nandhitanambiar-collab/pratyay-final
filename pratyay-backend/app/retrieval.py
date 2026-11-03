"""
Retrieval over approved material. Keyword-based (BM25) for now: works on SQLite and
Postgres with no extra services. Embedding search (pgvector) can replace `rank()`
later without touching the rest of the code: same inputs, same outputs.
"""
import math
import re
from dataclasses import dataclass, field
from datetime import date

STOP = {
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "is", "are", "was",
    "were", "be", "by", "at", "as", "it", "its", "this", "that", "we", "our", "you", "your",
    "from", "has", "have", "had", "will", "can", "all", "any", "now", "today", "join",
}


@dataclass
class Doc:
    id: str                      # e.g. "claim:3" or "guideline:7"
    kind: str                    # 'claim' | 'general' | 'tone'
    text: str
    valid_to: date | None = None
    meta: dict = field(default_factory=dict)


def _stem(t: str) -> str:
    return t[:-1] if len(t) > 3 and t.endswith("s") and not t.endswith("ss") else t


def tokenize(s: str) -> list[str]:
    toks = re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", s.lower())
    return [_stem(t) for t in toks if t not in STOP]


def rank(query: str, docs: list[Doc], k: int = 4) -> list[tuple[Doc, float, float]]:
    """Returns [(doc, bm25_score, coverage)] best first. Coverage = share of the query's
    distinct words found in the doc; it is what we gate on before calling the verifier."""
    q = list(dict.fromkeys(tokenize(query)))
    if not q or not docs:
        return []
    doc_tokens = [tokenize(d.text) for d in docs]
    n = len(docs)
    avg = (sum(len(t) for t in doc_tokens) / n) or 1.0
    df = {w: sum(1 for t in doc_tokens if w in t) for w in q}
    results = []
    for d, toks in zip(docs, doc_tokens):
        if not toks:
            continue
        score = 0.0
        for w in q:
            tf = toks.count(w)
            if not tf:
                continue
            idf = math.log(1 + (n - df[w] + 0.5) / (df[w] + 0.5))
            score += idf * tf * 2.5 / (tf + 1.5 * (0.25 + 0.75 * len(toks) / avg))
        coverage = sum(1 for w in q if w in set(toks)) / len(q)
        if score > 0:
            results.append((d, score, coverage))
    results.sort(key=lambda r: (-r[1], -r[2]))
    return results[:k]
