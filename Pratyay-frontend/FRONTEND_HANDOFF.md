# Pratyay — Frontend Handoff Specification for Backend Developer

> **Product**: Pratyay — An Intelligent Brand Governance Platform  
> **Core Principle**: *"Explain the issue, show the evidence where available, suggest a correction, and keep final approval with a human."*  
> **Target Backend**: Python + FastAPI + PostgreSQL + Google Gemini API (or configured LLM provider)  
> **Frontend Stack**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4  

---

## Table of Contents
1. [Frontend Architecture & Setup](#1-frontend-architecture--setup)
2. [Routes & Major UI Components](#2-routes--major-ui-components)
3. [State Management, Contexts & Types](#3-state-management-contexts--types)
4. [Content Upload & Client-Side Extraction](#4-content-upload--client-side-extraction)
5. [Model Selection Architecture & Engine Distinction](#5-model-selection-architecture--engine-distinction)
6. [Analysis-Result JSON Schema (`GovernanceAnalysisResult`)](#6-analysis-result-json-schema)
7. [Proposed API Endpoints & Request/Response Shapes](#7-proposed-api-endpoints--requestresponse-shapes)
8. [Existing LocalStorage Persistence Keys](#8-existing-localstorage-persistence-keys)
9. [Feature Matrix: Implemented vs Simulated vs Backend-Dependent](#9-feature-matrix)
10. [Backend Integration Guide for the FastAPI Developer](#10-backend-integration-guide-for-the-fastapi-developer)
11. [Environment Configuration](#11-environment-configuration)
12. [Known Limitations & Recommendations](#12-known-limitations--recommendations)

---

## 1. Frontend Architecture & Setup

The frontend is a single-page application built with React 19, TypeScript, and Vite. It is styled with Tailwind CSS v4 and uses Lucide React for consistent icons.

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Quickstart Commands
```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server (runs on http://localhost:5173/)
npm run dev

# 3. Typecheck and build for production
npm run build

# 4. Run Oxlint code quality checks (0 warnings, 0 errors policy)
npm run lint

# 5. Run Phase 5.1 automated verification test suite
node scripts/verify-phase-5-1.mjs
```

---

## 2. Routes & Major UI Components

| Route | Page Component | Description & Responsibilities |
|---|---|---|
| `/` | `OverviewPage.tsx` | Executive governance dashboard with summary metric cards, recent reviews queue, live activity feed, and getting-started guide. |
| `/guidelines` | `GuidelinesPage.tsx` | Brand Guidelines management directory with two tabs: (1) Active Rules & Superlatives, (2) Brand Facts & Supporting Evidence Registry. |
| `/reviews` | `ContentReviewsPage.tsx` | Content Reviews workspace with status filters (`Draft`, `In Review`, `Needs Changes`, `Approved`), full-text search, and "New Content" launcher. |
| `/reviews/new` | `ContentEditorPage.tsx` | Content submission form supporting paste-text and document upload (`.txt`, `.docx`, `.pdf`), model targeting, live telemetry, and Draft saving / Review submission. |
| `/reviews/:id` | `ReviewDetailsPage.tsx` | Deep explainable governance inspection workspace with 4 tabs: (1) Split-Pane Findings & Editor, (2) Proposed Corrections, (3) Claim Verification, (4) Brand Tone & Voice. Contains Review Sign-Off dialog and JSON Report exporter. |
| `/reviews/:id/edit`| `ContentEditorPage.tsx` | Edit mode for existing drafts or revisions. Preserves existing metadata and original extracted documents. |
| `/history` | `DecisionAuditPage.tsx` | Immutable decision audit trail capturing submissions, reviewer change requests, approved publications, and rule modifications. |
| `/settings` | `SettingsPage.tsx` | Platform configuration portal displaying workspace standards, authorized demo reviewer personas, FastAPI endpoint URL, and compliance policy packs. |

---

## 3. State Management, Contexts & Types

The frontend manages state using four dedicated React Contexts backed by local storage persistence for demonstration resilience:

### Context Summary
1. **`GuidelineContext` (`src/context/GuidelineContext.tsx`)**:
   - Manages `GuidelineRule[]` (active brand rules, restricted terms, required wording) and `BrandFactEvidence[]` (approved claim dossiers, source citations, validity dates).
2. **`ReviewContext` (`src/context/ReviewContext.tsx`)**:
   - Manages `ReviewItem[]` (all marketing drafts, status transitions, reviewer comments, revision versions, and document attachments).
3. **`FindingContext` (`src/context/FindingContext.tsx`)**:
   - Runs deterministic rule checks (`src/utils/ruleChecker.ts`) on review copy.
   - Manages per-finding decision state (`accepted`, `dismissed`, `resolved`, `open`) and the mutable `workingDraftText`.
4. **`AuditContext` (`src/context/AuditContext.tsx`)**:
   - Appends and persists `AuditEvent[]` records whenever consequential workflow actions take place. Synchronizes the Overview dashboard activity feed.

### Core Domain Models (`src/types/index.ts`)
- **`ReviewItem`**: Represents a marketing copy submission. Includes `id`, `campaignTitle`, `contentType`, `brandPackName`, `draftText`, `originalDraftText`, `activeRevisionVersion`, `status` (`Draft` | `In Review` | `Needs Changes` | `Approved`), `reviewerDecision`, `reviewerComment`, `reviewedBy`, `reviewedAt`, `targetModelId`, and `uploadedDocument`.
- **`Finding`**: Represents an explainable issue. Includes `id`, `reviewId`, `type` (`rule_violation` | `terminology` | `required_text` | `factual_claim` | `informational_notice`), `severity` (`High` | `Medium` | `Low` | `Notice`), `title`, `description`, `matchedText`, `startIndex`, `endIndex`, `ruleReference`, `evidenceStatus` (`supported` | `missing` | `expired` | `inconclusive` | `not_applicable`), `suggestedRevision`, `explanation`, and `status`.
- **`BrandFactEvidence`**: Approved factual claim registry. Includes `claimName`, `approvedStatement`, `evidenceDescription`, `sourceReference`, `evidenceStatus`, `validFrom`, and `expiryDate`.

---

## 4. Content Upload & Client-Side Extraction

Located in `src/components/reviews/DocumentUploader.tsx` and `src/utils/fileExtractor.ts`.

### Capabilities & Specifications
- **Supported File Types**: `.txt`, `.docx`, and text-based `.pdf`.
- **File Size Limit**: Strictly enforced at 5.0 MB (`5 * 1024 * 1024` bytes).
- **Extraction Behavior**:
  - **`.txt`**: Reads UTF-8 plain text using `File.text()`.
  - **`.docx`**: Uses `JSZip` to extract `word/document.xml`, parses XML via the browser `DOMParser`, and extracts all `<w:p>` and `<w:t>` elements into structured paragraphs.
  - **`.pdf`**: Inspects array buffer text streams (`BT ... ET`, literal strings, TJ operators). If extractable plain text exceeds 15 words, populates the editor with a verification notice.
- **OCR Limitation Notice**: Scanned PDFs and rasterized images cannot be parsed client-side. The UI explicitly alerts users:
  > *"Scanned documents and image-based PDFs require backend OCR service (Python/FastAPI). Please paste your text directly or upload a .txt or .docx file."*
- **Separation of Originals**: When a file is uploaded, its original text is stored in `ReviewItem.uploadedDocument.originalExtractedText`, while the editable working copy populates `draftText` in the editor.

---

## 5. Model Selection Architecture & Engine Distinction

Located in `src/config/models.ts` and `src/components/reviews/ModelSelector.tsx`.

### Available Model Options
1. **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) — *Default & Recommended for Speed*
2. **Google Gemini 2.5 Pro** (`gemini-2.5-pro`) — *Multimodal & Deep Contextual Reasoning*
3. **Claude 3.7 Sonnet** (`claude-3-7-sonnet`) — *Editorial Nuance & Brand Voice*
4. **GPT-4o** (`gpt-4o`) — *General Enterprise Compliance*

### Clear Separation of Roles
- **Target Model (`selectedModelId`)**: Represents the user's desired LLM to execute in the cloud once connected. Stored in `localStorage` under `pratyay_selected_model_v1`. Passed in review submission payloads as `targetModelId`.
- **Live Local Engine (`ACTUAL_OFFLINE_ENGINE`)**: The frontend prominently displays:
  > *"Current Execution Engine: Deterministic Rule Engine (Client Offline v1.4.0) — Local keyword, regex, superlative, and disclaimer pattern matching. Operates client-side without external network calls."*
- **Security**: No API keys or secrets are exposed or collected in the frontend.

---

## 6. Analysis-Result JSON Schema

Located in `src/types/index.ts` and `src/utils/exportGovernanceJson.ts`.

### TypeScript Interface (`GovernanceAnalysisResult`)
```typescript
export interface GovernanceAnalysisResult {
  reportVersion: '1.0';
  platform: string;
  metadata: {
    reviewId: string;
    campaignTitle: string;
    contentType: ContentType;
    brandPackName: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewerDecision?: 'Approved' | 'Needs Changes';
    status: ReviewStatus;
    revisionVersion: number;
  };
  engine: {
    configuredModelId: string;
    configuredModelName: string;
    configuredProvider: string;
    actualEngineUsed: string;
    executionMode: 'offline_deterministic' | 'llm_service';
    generatedAt: string;
    disclaimer: string;
  };
  summary: {
    totalFindings: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    noticesCount: number;
    unverifiedClaimsCount: number;
    complianceScore: number;
  };
  findings: Finding[];
  claimVerifications: GovernanceClaimVerification[];
  toneAnalysis: {
    status: 'pending_ai_service' | 'evaluated';
    toneGuidelines: string[];
    summary: string;
    applicableFindings: Finding[];
  };
  correctedContent: {
    originalText: string;
    proposedRevisedText: string;
    isFullyFixable: boolean;
    replacementsCount: number;
    unresolvedIssuesCount: number;
  };
  signOff?: {
    actor?: string;
    actorRole?: string;
    decision?: 'Approved' | 'Needs Changes';
    comment?: string;
    signedOffAt?: string;
  };
}
```

### Complete Sample JSON Payload
```json
{
  "reportVersion": "1.0",
  "platform": "Pratyay — An Intelligent Brand Governance Platform",
  "metadata": {
    "reviewId": "REV-2026-089",
    "campaignTitle": "Aura Botanicals — Hair-Fall Defense Shampoo Ad Copy",
    "contentType": "Advertisement Copy",
    "brandPackName": "Healthcare & Personal Care Pack (ASCI 2025)",
    "submittedAt": "Today at 10:00 AM",
    "reviewedAt": "Today at 10:18 AM",
    "reviewerDecision": "Needs Changes",
    "status": "Needs Changes",
    "revisionVersion": 1
  },
  "engine": {
    "configuredModelId": "gemini-2.5-flash",
    "configuredModelName": "Gemini 2.5 Flash",
    "configuredProvider": "Google",
    "actualEngineUsed": "Deterministic Rule Engine (Client Offline)",
    "executionMode": "offline_deterministic",
    "generatedAt": "2026-10-28T00:30:00.000Z",
    "disclaimer": "Generated in offline frontend demonstration mode using deterministic regex and rule matching. No external cloud LLM API calls were executed."
  },
  "summary": {
    "totalFindings": 2,
    "highSeverityCount": 1,
    "mediumSeverityCount": 1,
    "lowSeverityCount": 0,
    "noticesCount": 0,
    "unverifiedClaimsCount": 1,
    "complianceScore": 62
  },
  "findings": [
    {
      "id": "FIND-001",
      "reviewId": "REV-2026-089",
      "type": "factual_claim",
      "severity": "High",
      "title": "Expired Clinical Trial Dossier",
      "description": "Claim of up to 72% reduction in breakage cites clinical trial #DTI-2024-04 which expired in June 2025.",
      "matchedText": "reduces breakage by up to 72% within 4 weeks",
      "startIndex": 105,
      "endIndex": 150,
      "ruleReference": "ASCI Code Chapter 1.4 (Substantiation)",
      "evidenceIds": ["FACT-101"],
      "evidenceStatus": "expired",
      "explanation": "ASCI regulations require human clinical studies to be re-validated every 12 months for consumer cosmetics.",
      "status": "open",
      "createdAt": "2026-10-28T00:00:00.000Z"
    },
    {
      "id": "FIND-002",
      "reviewId": "REV-2026-089",
      "type": "terminology",
      "severity": "Medium",
      "title": "Prohibited Absolute Guarantee Superlative",
      "description": "Absolute regrowth guarantee violates personal care promotional standards.",
      "matchedText": "guarantees 100% regrowth",
      "suggestedRevision": "promotes natural hair growth",
      "startIndex": 155,
      "endIndex": 179,
      "ruleReference": "ASCI Prohibited Claims",
      "evidenceStatus": "not_applicable",
      "explanation": "Absolute efficacy guarantees in topical haircare products cannot be substantiated without pharmaceutical drug approval.",
      "status": "open",
      "createdAt": "2026-10-28T00:00:00.000Z"
    }
  ],
  "claimVerifications": [
    {
      "id": "FIND-001",
      "claimText": "reduces breakage by up to 72% within 4 weeks",
      "status": "Expired",
      "evidenceReference": "Clinical Trial Dossier #DTI-2024-04",
      "evidenceValidity": {
        "validFrom": "2024-06-01",
        "expiryDate": "2025-06-01",
        "isExpired": true
      },
      "explanation": "ASCI regulations require human clinical studies to be re-validated every 12 months for consumer cosmetics.",
      "requiresHumanReview": true
    }
  ],
  "toneAnalysis": {
    "status": "pending_ai_service",
    "toneGuidelines": [
      "Objective Health Communication: Maintain educational tone without absolute promises."
    ],
    "summary": "Automated sentiment and tone scoring require the backend AI service (planned for Python/FastAPI integration).",
    "applicableFindings": []
  },
  "correctedContent": {
    "originalText": "Stop hair-fall in its tracks with Aura Botanicals Hair-Fall Defense Shampoo! Our proprietary herbal formula reduces breakage by up to 72% within 4 weeks and guarantees 100% regrowth for thinning crowns.",
    "proposedRevisedText": "Stop hair-fall in its tracks with Aura Botanicals Hair-Fall Defense Shampoo! Our proprietary herbal formula reduces breakage by up to 72% within 4 weeks and promotes natural hair growth for thinning crowns.",
    "isFullyFixable": false,
    "replacementsCount": 1,
    "unresolvedIssuesCount": 1
  },
  "signOff": {
    "actor": "Compliance Officer (Demo)",
    "actorRole": "Compliance Officer (Demo)",
    "decision": "Needs Changes",
    "comment": "Clinical trial dossier #DTI-2024-04 expired in June 2025. Prohibited cosmetic claim 'guarantees 100% regrowth' must be removed per ASCI Chapter 1.",
    "signedOffAt": "Today at 10:18 AM"
  }
}
```

---

## 7. Proposed API Endpoints & Request/Response Shapes

The frontend service layer is centralized in `src/services/api/client.ts` and `src/services/api/types.ts`.

### 1. Health & Status
- **`GET /api/v1/health`**
  - Response: `{ "status": "ok", "timestamp": "2026-10-28T00:00:00Z" }`

### 2. Brand Guidelines
- **`GET /api/v1/guidelines`**
  - Query Params: `category`, `status` (`Active` | `Inactive`), `search`, `limit`, `offset`
  - Response: `{ "success": true, "data": GuidelineRule[], "timestamp": "..." }`
- **`POST /api/v1/guidelines`**
  - Request: `CreateGuidelineRequest` (`name`, `category`, `ruleType`, `summary`, `description`, `targetTerm`, `replacementTerm`, `status`, `notes`)
  - Response: `{ "success": true, "data": GuidelineRule, "timestamp": "..." }`
- **`PUT /api/v1/guidelines/{id}`**
  - Request: `UpdateGuidelineRequest`
  - Response: `{ "success": true, "data": GuidelineRule, "timestamp": "..." }`
- **`DELETE /api/v1/guidelines/{id}`**
  - Response: `{ "success": true, "data": { "deleted": true, "id": "RULE-101" }, "timestamp": "..." }`

### 3. Facts & Evidence Registry
- **`GET /api/v1/evidence`**
  - Query Params: `status`, `search`, `limit`, `offset`
  - Response: `{ "success": true, "data": BrandFactEvidence[], "timestamp": "..." }`
- **`POST /api/v1/evidence`**
  - Request: `CreateEvidenceRequest` (`claimName`, `approvedStatement`, `evidenceDescription`, `sourceReference`, `evidenceStatus`, `validFrom`, `expiryDate`, `notes`)
  - Response: `{ "success": true, "data": BrandFactEvidence, "timestamp": "..." }`
- **`PUT /api/v1/evidence/{id}`**
  - Request: `UpdateEvidenceRequest`
  - Response: `{ "success": true, "data": BrandFactEvidence, "timestamp": "..." }`
- **`DELETE /api/v1/evidence/{id}`**
  - Response: `{ "success": true, "data": { "deleted": true, "id": "FACT-101" }, "timestamp": "..." }`

### 4. Content Reviews
- **`GET /api/v1/reviews`**
  - Query Params: `status` (`Draft` | `In Review` | `Needs Changes` | `Approved` | `All`), `category`, `search`, `limit`, `offset`
  - Response: `{ "success": true, "data": ReviewItem[], "timestamp": "..." }`
- **`GET /api/v1/reviews/{id}`**
  - Response: `{ "success": true, "data": ReviewItem, "timestamp": "..." }`
- **`POST /api/v1/reviews`**
  - Request: `CreateReviewRequest` (`campaignTitle`, `contentType`, `brandPackName`, `campaignContext`, `draftText`, `status`, `submittedBy`, `targetModelId`, `uploadedDocument`)
  - Response: `{ "success": true, "data": ReviewItem, "timestamp": "..." }`
- **`PUT /api/v1/reviews/{id}`**
  - Request: `UpdateReviewRequest`
  - Response: `{ "success": true, "data": ReviewItem, "timestamp": "..." }`

### 5. Content Analysis & LLM Inference
- **`POST /api/v1/reviews/{id}/analyze`**
  - Request:
    ```json
    {
      "reviewId": "REV-2026-089",
      "draftText": "Stop hair-fall...",
      "brandPackName": "Healthcare & Personal Care Pack (ASCI 2025)",
      "targetModelId": "gemini-2.5-flash",
      "campaignContext": "Q4 Social Campaign"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "data": {
        "analysisResult": { ... },
        "findings": [ ... ],
        "complianceScore": 62,
        "flaggedIssuesCount": 2,
        "unverifiedClaimsCount": 1
      },
      "timestamp": "..."
    }
    ```
- **`GET /api/v1/reviews/{id}/report`**
  - Response: `{ "success": true, "data": GovernanceAnalysisResult, "timestamp": "..." }`

### 6. Review Decisions & Sign-Off
- **`POST /api/v1/reviews/{id}/decisions/sign-off`**
  - Request:
    ```json
    {
      "decision": "Approved",
      "reviewerName": "Editorial Reviewer (Demo)",
      "reviewerRole": "Editorial Reviewer (Demo)",
      "comment": "Verified lab documentation.",
      "confirmationAcknowledged": true
    }
    ```
  - Response: `{ "success": true, "data": ReviewItem, "timestamp": "..." }`
- **`POST /api/v1/reviews/{id}/decisions/resubmit`**
  - Request:
    ```json
    {
      "newDraftText": "Revised copy...",
      "changeSummary": "Substituted claims with verified pilot statistics.",
      "submitterName": "Content Creator (Demo)"
    }
    ```
  - Response: `{ "success": true, "data": ReviewItem, "timestamp": "..." }`
- **`PATCH /api/v1/reviews/{id}/findings/{finding_id}/decision`**
  - Request:
    ```json
    {
      "status": "accepted",
      "dismissReason": "Approved clinical exception",
      "reviewerName": "Compliance Officer (Demo)"
    }
    ```
  - Response: `{ "success": true, "data": Finding, "timestamp": "..." }`

### 7. Models Catalog
- **`GET /api/v1/models`**
  - Response: `{ "success": true, "data": { "models": [ ... ], "activeEngine": { ... }, "defaultModelId": "gemini-2.5-flash" }, "timestamp": "..." }`

### 8. Audit Events
- **`GET /api/v1/audit-events`**
  - Query Params: `reviewId`, `eventType`, `limit`, `offset`
  - Response: `{ "success": true, "data": AuditEvent[], "timestamp": "..." }`
- **`POST /api/v1/audit-events`**
  - Request: `CreateAuditEventRequest`
  - Response: `{ "success": true, "data": AuditEvent, "timestamp": "..." }`

---

## 8. Existing LocalStorage Persistence Keys

For demo resilience, the frontend currently synchronizes state to `localStorage`. The backend developer can use these keys for seeding initial database fixtures or running migration scripts:

| LocalStorage Key | Type | Description |
|---|---|---|
| `pratyay_demo_guidelines_v1` | `GuidelineRule[]` | Brand standards, restricted phrases, and wording requirements. |
| `pratyay_demo_evidence_v1` | `BrandFactEvidence[]` | Factual claims, approved evidence dossiers, and validity dates. |
| `pratyay_demo_reviews_v1` | `ReviewItem[]` | Submitted marketing copy records, statuses, comments, and versions. |
| `pratyay_findings_decisions_v1`| `Record<string, Record<string, FindingStatus>>` | Reviewer decisions per finding (`accepted`, `dismissed`, etc.). |
| `pratyay_working_drafts_v1` | `Record<string, string>` | User's active working revision draft text for each review. |
| `pratyay_audit_events_v1` | `AuditEvent[]` | Chronological immutable log of workflow actions and status transitions. |
| `pratyay_selected_model_v1` | `string` | User's configured target AI model ID (`gemini-2.5-flash`). |

---

## 9. Feature Matrix

| Feature | Frontend Status | Implementation Details | Backend Dependency |
|---|---|---|---|
| **Dashboard & Navigation** | Complete | Responsive layout, metric summary cards, recent reviews queue. | None |
| **Brand Guidelines Registry** | Complete | Search, category filters, Add/Edit modals, Active/Inactive toggles. | PostgreSQL `guidelines` table |
| **Evidence & Facts Registry** | Complete | Dossier citations, validity date tracking, Responsible AI notice. | PostgreSQL `evidence` table |
| **Content Upload** | Complete | `.txt`, `.docx` (XML parse), text `.pdf` extraction (<=5MB), clear replace/remove. | Optional server-side parser |
| **Model Selection UI** | Complete | Provider display, badge indicators, target vs offline engine distinction. | LLM client orchestration |
| **Deterministic Rule Checks** | Complete | Client regex keyword pattern matching for superlatives and terms. | Optional server parity |
| **Proposed Corrections Section**| Complete | Side-by-side comparison, rule citations, apply button, unfixable cards. | Suggested text generation |
| **Factual Claim Verification** | Complete | Separate section with evidence dossiers, dates, and human verification badges. | Vector / DB retrieval |
| **Brand Tone & Voice Section** | Complete | Active tone standards display + explicit pending backend status notice. | Python FastAPI + Gemini NLP |
| **Structured JSON Exporter** | Complete | Validated `GovernanceAnalysisResult` preview and 1-click JSON download. | Report generation endpoint |
| **Human Sign-Off Workflow** | Complete | Transitions: `Draft` → `In Review` → `Needs Changes` → `Approved`. | Concurrency & authorization |
| **Decision Audit Log** | Complete | Search, filter by event type, JSON export, demo notice. | PostgreSQL `audit_logs` table |
| **API Client Service Layer** | Complete | `src/services/api/client.ts` with typed methods and offline fallback. | FastAPI router endpoints |

---

## 10. Backend Integration Guide for the FastAPI Developer

Follow these steps to wire up the Python/FastAPI backend to this frontend:

### Step 1: Initialize FastAPI Project
```bash
# Recommended structure:
backend/
├── app/
│   ├── main.py              # FastAPI app initialization & CORS setup
│   ├── api/v1/              # Routers matching /api/v1/*
│   │   ├── guidelines.py
│   │   ├── evidence.py
│   │   ├── reviews.py
│   │   ├── analyze.py
│   │   ├── decisions.py
│   │   ├── models.py
│   │   └── audit.py
│   ├── core/
│   │   ├── config.py        # Settings (DATABASE_URL, GEMINI_API_KEY)
│   │   └── security.py
│   ├── db/
│   │   ├── session.py       # SQLAlchemy / asyncpg engine
│   │   └── models.py        # PostgreSQL tables matching TypeScript types
│   ├── schemas/             # Pydantic models matching src/services/api/types.ts
│   └── services/
│       ├── gemini_service.py # Gemini 2.5 Flash / Pro integration
│       └── rule_engine.py
├── requirements.txt
└── .env
```

### Step 2: Configure CORS in `main.py`
The frontend runs by default on `http://localhost:5173`. Ensure CORS middleware allows this origin:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pratyay Brand Governance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 3: Implement Database Schema in PostgreSQL
Create tables reflecting domain models:
- `guidelines`: `id`, `name`, `category`, `rule_type`, `summary`, `description`, `target_term`, `replacement_term`, `status`, `notes`, `updated_at`.
- `evidence`: `id`, `claim_name`, `approved_statement`, `evidence_description`, `source_reference`, `evidence_status`, `valid_from`, `expiry_date`, `notes`, `updated_at`.
- `reviews`: `id`, `campaign_title`, `category`, `content_type`, `brand_pack_name`, `campaign_context`, `draft_text`, `original_draft_text`, `revision_version`, `status`, `submitted_by`, `reviewed_by`, `reviewer_comment`, `reviewer_decision`, `target_model_id`, `compliance_score`, `created_at`, `updated_at`.
- `audit_events`: `id`, `timestamp`, `iso_timestamp`, `event_type`, `review_id`, `review_title`, `previous_status`, `new_status`, `actor`, `actor_role`, `summary`, `comment`, `revision_version`.

### Step 4: Implement AI Analysis with Gemini 2.5 (`POST /api/v1/reviews/{id}/analyze`)
Use the official Google GenAI SDK (`google-genai`):
```python
from google import genai
from google.genai import types

client = genai.Client()

# System instruction enforces the core governance principle:
system_instruction = """
You are the Pratyay Brand Governance Engine.
Your role: Explain the issue, cite the relevant brand rule or evidence, suggest an intent-preserving correction, and leave approval to the human reviewer.
Never classify an unverified claim as false solely due to absence of proof; mark it as 'Unsubstantiated'.
Return your evaluation strictly conforming to the GovernanceAnalysisResult JSON schema.
"""

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[f"Brand Guidelines: {guidelines}\nEvidence Registry: {evidence}\nDraft Marketing Copy:\n{draft_text}"],
    config=types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=GovernanceAnalysisResultSchema,
    ),
)
```

### Step 5: Switch Frontend Contexts from LocalStorage to API Client
Each React Context has been designed so that switching to the API client is straightforward:
- In `GuidelineContext.tsx`: Replace `useState(mockGuidelines)` with `useEffect(() => { apiClient.guidelines.list().then(...) })`.
- In `ReviewContext.tsx`: Replace `useState(mockReviews)` with `useEffect(() => { apiClient.reviews.list().then(...) })`.
- In `FindingContext.tsx`: Call `apiClient.analysis.analyze(review.id, ...)` to retrieve server-side findings.

---

## 11. Environment Configuration

### Frontend (`.env` or `.env.local`)
Create `.env` using `.env.example` as a template:
```env
# Point to your running FastAPI server
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pratyay_db
GEMINI_API_KEY=AIzaSy...
ENVIRONMENT=development
PORT=8000
```

---

## 12. Known Limitations & Recommendations

1. **Scanned PDF & OCR**:
   - The frontend handles plain text extraction from standard PDFs. Scanned image-based PDFs require the backend to implement PyMuPDF (`fitz`), pdfplumber, or OCR libraries (e.g. Tesseract or Google Cloud Document AI).
2. **Brand Tone Scoring**:
   - The frontend marks tone evaluation as `pending_ai_service`. The backend should implement structured prompt evaluation using Gemini 2.5 to score sentiment, formality, confidence, and brand voice adherence.
3. **Authentication & Multi-Tenant Authorization**:
   - The frontend currently uses generic demo personas (`Editorial Reviewer (Demo)`, `Compliance Officer (Demo)`, `Content Creator (Demo)`). The backend should establish real JWT / OAuth2 authentication with role-based access control (RBAC).
4. **Prompt Injection Hardening**:
   - Draft marketing submissions may contain adversarial or tricky copy. The backend should isolate marketing copy in the prompt and ensure the model does not execute instructions embedded in draft text.

---

**Prepared by Frontend Engineering**  
*Pratyay — An Intelligent Brand Governance Platform*
