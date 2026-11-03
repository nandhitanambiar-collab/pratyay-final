"""Request bodies. Field names are camelCase to match the frontend (src/services/api/types.ts)."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


Category = Literal["Tone and Voice", "Terminology", "Required Wording", "Brand Facts",
                   "Promotional Claims", "Accessibility"]
RuleType = Literal["Preferred Term", "Restricted Term", "Required Text", "Factual Requirement", "General Rule"]
EvidenceStatus = Literal["Evidence Available", "Missing Evidence", "Expired Evidence", "Needs Review"]
ReviewStatus = Literal["Draft", "In Review", "Needs Changes", "Approved"]


class GuidelineIn(Camel):
    name: str = Field(min_length=1, max_length=300)
    category: Category
    rule_type: RuleType
    summary: str = ""
    description: str = ""
    target_term: str | None = None
    replacement_term: str | None = None
    status: Literal["Active", "Inactive"] = "Active"
    notes: str | None = None


class GuidelineUpdate(Camel):
    name: str | None = Field(default=None, min_length=1, max_length=300)
    category: Category | None = None
    rule_type: RuleType | None = None
    summary: str | None = None
    description: str | None = None
    target_term: str | None = None
    replacement_term: str | None = None
    status: Literal["Active", "Inactive"] | None = None
    notes: str | None = None


class EvidenceIn(Camel):
    claim_name: str = Field(min_length=1, max_length=300)
    approved_statement: str = ""
    evidence_description: str = ""
    source_reference: str = ""
    evidence_status: EvidenceStatus = "Evidence Available"
    valid_from: str | None = None
    expiry_date: str | None = None
    notes: str | None = None


class EvidenceUpdate(Camel):
    claim_name: str | None = Field(default=None, min_length=1, max_length=300)
    approved_statement: str | None = None
    evidence_description: str | None = None
    source_reference: str | None = None
    evidence_status: EvidenceStatus | None = None
    valid_from: str | None = None
    expiry_date: str | None = None
    notes: str | None = None


class Person(Camel):
    name: str
    role: str = ""


class UploadedDocument(Camel):
    filename: str
    file_size: int = 0
    file_type: str = ""
    extracted_at: str = ""
    original_extracted_text: str | None = None


class ReviewCreate(Camel):
    campaign_title: str = Field(min_length=1, max_length=300)
    content_type: str = "Other"
    brand_pack_name: str = ""
    campaign_context: str | None = None
    draft_text: str = Field(min_length=1, max_length=100_000)
    status: Literal["Draft", "In Review"] = "Draft"
    submitted_by: Person
    target_model_id: str | None = None
    uploaded_document: UploadedDocument | None = None


class ReviewUpdate(Camel):
    campaign_title: str | None = Field(default=None, min_length=1, max_length=300)
    content_type: str | None = None
    brand_pack_name: str | None = None
    campaign_context: str | None = None
    draft_text: str | None = Field(default=None, min_length=1, max_length=100_000)
    status: ReviewStatus | None = None
    uploaded_document: UploadedDocument | None = None
    target_model_id: str | None = None


class SignOffIn(Camel):
    decision: Literal["Approved", "Needs Changes"]
    reviewer_name: str = Field(min_length=1)
    reviewer_role: str = ""
    comment: str | None = None
    confirmation_acknowledged: bool = False


class ResubmitIn(Camel):
    new_draft_text: str = Field(min_length=1, max_length=100_000)
    change_summary: str | None = None
    submitter_name: str | None = None


class FindingDecisionIn(Camel):
    status: Literal["open", "accepted", "dismissed", "resolved"]
    dismiss_reason: str | None = None
    reviewer_name: str | None = None


class AuditCreate(Camel):
    event_type: str
    review_id: str | None = None
    review_title: str | None = None
    previous_status: str | None = None
    new_status: str | None = None
    actor: str
    actor_role: str = ""
    summary: str = ""
    comment: str | None = None
    revision_version: int | None = None


class SelfHostedModelIn(Camel):
    name: str = Field(min_length=1, max_length=100)
    base_url: str = Field(min_length=1, max_length=300)       # e.g. http://localhost:8080/v1
    model: str = Field(default="local", min_length=1, max_length=200)
    api_key: str | None = Field(default=None, max_length=300)  # only if llama-server was started with --api-key

    @field_validator("name", "base_url", "model")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("base_url")
    @classmethod
    def _http_url(cls, v: str) -> str:
        if not v.lower().startswith(("http://", "https://")):
            raise ValueError("must start with http:// or https://")
        return v.rstrip("/")
