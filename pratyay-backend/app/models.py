"""Database tables. Field names follow the frontend's types (src/types/index.ts)."""
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def now():
    return datetime.now(timezone.utc)


# ---------- Knowledge: approved guidelines and evidence ----------

class Rule(Base):
    """A guideline rule (frontend: GuidelineRule)."""
    __tablename__ = "rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(40))      # Tone and Voice | Terminology | Required Wording | ...
    rule_type: Mapped[str] = mapped_column(String(40))     # Preferred Term | Restricted Term | Required Text | Factual Requirement | General Rule
    summary: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
    target_term: Mapped[str | None] = mapped_column(Text, nullable=True)
    replacement_term: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="Active")   # Active | Inactive
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Evidence(Base):
    """Approved fact with its evidence (frontend: BrandFactEvidence)."""
    __tablename__ = "evidence"
    id: Mapped[int] = mapped_column(primary_key=True)
    claim_name: Mapped[str] = mapped_column(String(300))
    approved_statement: Mapped[str] = mapped_column(Text, default="")
    evidence_description: Mapped[str] = mapped_column(Text, default="")
    source_reference: Mapped[str] = mapped_column(String(300), default="")
    evidence_status: Mapped[str] = mapped_column(String(30), default="Evidence Available")
    valid_from: Mapped[str | None] = mapped_column(String(20), nullable=True)     # ISO date text
    expiry_date: Mapped[str | None] = mapped_column(String(20), nullable=True)    # ISO date text
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class CacheEntry(Base):
    """Exact-match result cache. Key = hash of (stage, normalised input, knowledge-base version, model, prompt version)."""
    __tablename__ = "cache_entries"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict | list] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class SelfHostedModel(Base):
    """A llama.cpp (or other OpenAI-compatible) server the user saved. Referenced by reviews as 'selfhosted:<id>'."""
    __tablename__ = "self_hosted_models"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    base_url: Mapped[str] = mapped_column(String(300))
    model: Mapped[str] = mapped_column(String(200), default="local")
    api_key: Mapped[str | None] = mapped_column(String(300), nullable=True)   # stored as plain text, never sent back to the browser
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


# ---------- Workflow ----------

class Submission(Base):
    """A content review (frontend: ReviewItem)."""
    __tablename__ = "submissions"
    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_title: Mapped[str] = mapped_column(String(300))
    category: Mapped[str] = mapped_column(String(80), default="")
    content_type: Mapped[str] = mapped_column(String(60), default="Other")
    brand_pack_name: Mapped[str] = mapped_column(String(200), default="")
    campaign_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    draft_text: Mapped[str] = mapped_column(Text)
    original_draft_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(20), default="Draft")   # Draft | In Review | Needs Changes | Approved
    submitted_by_name: Mapped[str] = mapped_column(String(100), default="")
    submitted_by_role: Mapped[str] = mapped_column(String(100), default="")
    reviewer_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    uploaded_document: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    target_model_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    actual_model_used: Mapped[str | None] = mapped_column(String(300), nullable=True)
    analysis_note: Mapped[str | None] = mapped_column(Text, nullable=True)   # e.g. "tone check unavailable: ..."
    analysis_kb: Mapped[str | None] = mapped_column(String(32), nullable=True)   # knowledge-base fingerprint used for the findings
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Revision(Base):
    """Every earlier version of the draft text, kept for history."""
    __tablename__ = "revisions"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"))
    version: Mapped[int] = mapped_column(Integer)
    draft_text: Mapped[str] = mapped_column(Text)
    author: Mapped[str] = mapped_column(String(100))
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Finding(Base):
    __tablename__ = "findings"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"))
    version: Mapped[int] = mapped_column(Integer, default=1)
    type: Mapped[str] = mapped_column(String(30))              # rule_violation | terminology | required_text | factual_claim | informational_notice
    category: Mapped[str] = mapped_column(String(30))          # internal: claim | terminology | disclaimer | tone
    severity: Mapped[str] = mapped_column(String(10))          # High | Medium | Low | Notice
    source: Mapped[str] = mapped_column(String(10))            # rule | ai
    ai_model: Mapped[str | None] = mapped_column(String(200), nullable=True)   # disclosure: which model produced it
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text, default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    matched_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    rule_reference: Mapped[str] = mapped_column(Text, default="")
    guideline_ref: Mapped[str | None] = mapped_column(String(40), nullable=True)   # e.g. RULE-3
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    evidence_status: Mapped[str] = mapped_column(String(20), default="not_applicable")
    suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="open")   # open | accepted | dismissed | resolved
    dismiss_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AuditEvent(Base):
    """Append-only log of workflow actions (frontend: AuditEvent)."""
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int | None] = mapped_column(ForeignKey("submissions.id"), nullable=True)
    review_ref: Mapped[str | None] = mapped_column(String(40), nullable=True)   # e.g. REV-2026-007, kept even if the review is deleted
    event_type: Mapped[str] = mapped_column(String(40))
    review_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    previous_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    actor: Mapped[str] = mapped_column(String(100))
    actor_role: Mapped[str] = mapped_column(String(100), default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    revision_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
