# Pratyay — An Intelligent Brand Governance Platform

> **Enterprise Brand Compliance, Terminology Enforcement & Claim Verification Portal**  
> Built for the CodeStar Hackathon.

---

## 1. Overview

**Pratyay** is an AI-assisted brand governance platform that checks draft marketing content against an organization's approved brand guidelines, terminology, factual claims, and available evidence.

### Core Principle
> *"Explain the issue, show the evidence where available, suggest a correction, and keep final approval with a human."*

The application is architected as a professional B2B SaaS platform rather than a generic conversational chatbot. Automated checks assist the review process; they do not independently authorize publication.

---

## 2. Project Phases & Deliverables Status

### Phase 1: Project Foundation & Dashboard (Completed)
- [x] **Project Foundation**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4 setup with strict typechecking and Oxlint configuration.
- [x] **Enterprise Design System**: Restrained B2B design palette with slate/indigo accents, crisp typography (`Plus Jakarta Sans`), subtle borders, accessible contrast, and Lucide icons.
- [x] **Dashboard Shell Layout**: Responsive Sidebar, dynamic TopNav, breadcrumbs, `⌘K` search, governance notification drawer, and user profile.
- [x] **Overview Dashboard (`/`)**: Welcome banner, summary metric cards, recent reviews table with filters, review activity feed, and getting-started workflow cards.

### Phase 2: Brand Guideline & Evidence Management (Completed)
- [x] **Brand Guidelines Directory (`/guidelines`)**:
  - Full management page replacing placeholder.
  - Summary metric cards: Total Rules, Active Rules, Restricted Terms, Facts with Evidence.
  - Interactive table with full-text search, category filter, status filter, and reset capability.
  - Realistic synthetic rules covering Preferred Terms, Restricted Superlatives (ASCI Code Chap 1), Required Disclaimers (CCPA 2026), Tone/Voice, Factual Specs, and Accessibility.
  - Actions: Edit rule, Quick toggle Active/Inactive, Delete rule with confirmation.
- [x] **Add & Edit Guideline Modal**:
  - Accessible modal dialog with focus management, `Esc` dismiss, and light dismiss backdrop.
  - Field inputs: Guideline name, Category, Rule type, Context-aware term/replacement mapping, Summary, Description, Status, and Governance notes.
  - Complete client-side validation with inline error messaging.
- [x] **Brand Facts & Supporting Evidence Registry**:
  - Dedicated tab view with live count badges.
  - Fact metrics: Total Facts, Evidence Available, Needs Review, Missing/Expired Evidence.
  - Responsible AI callout emphasizing that unbacked/expired claims require verification rather than being classified false.
  - Search and evidence status filter.
  - Add & Edit Fact Modal with claim name, approved statement, source reference, status, and validity date range.
### Phase 3: Content Submission & Draft Management (Completed)
- [x] **Content Reviews Workspace (`/reviews`)**:
  - Full management workspace replacing placeholder.
  - Summary metric cards: Total Submissions, Drafts, In Review, Needs Changes.
  - Interactive table with full-text search, status filter (`All`, `Draft`, `In Review`, `Needs Changes`, `Approved`), and reset capability.
  - Primary "New Content" button navigating to `/reviews/new`.
  - Submissions table showing Campaign/Content, Content Type, Created By, Last Updated/Submitted, Status badge, and contextual Actions.
  - Quick action: "Submit Draft for Review" directly from table for drafts.
- [x] **New Content Editor (`/reviews/new` & `/reviews/:id/edit`)**:
  - Dedicated form supporting draft creation and existing draft edits.
  - Fields: Campaign Title, Brand Guideline Pack selector, Content Type (`Social Media Post`, `Advertisement Copy`, `Product Description`, `Email Campaign`, `Landing Page Copy`, `Other`), Optional Campaign Context, and Draft Marketing Copy.
  - Live character count and word count telemetry.
  - Client-side validation for required fields.
  - Separate actions: "Save Draft" (keeps status as Draft), "Submit for Review" (transitions status to In Review), and "Cancel" with dirty-state confirmation.
  - Scope discipline maintained: No premature AI evaluation, approvals, or compliance scoring shown.
- [x] **State Management & Persistence**:
  - `ReviewContext` with custom hook `useReviews`.
  - State persisted across route changes and synced to `localStorage`.
  - Overview dashboard connected to live reviews context for synchronized metrics and recent submissions table.
- [x] **Toast Notifications**: Interactive feedback toasts confirming draft saves, submissions, and deletions.

### Phase 4: Explainable Content Review & Rule-Based Findings Interface (Completed)
- [x] **Review Details Route (`/reviews/:id`)**:
  - Full explainable review workspace displaying content title, brand pack, content type, review status, dates, and submitter details.
  - Graceful Not Found state handling unknown IDs with helpful guidance and one-click return to Content Reviews.
  - Action bar with "Back to Reviews", "Edit Original Draft", "Request Changes" (transitions review to Needs Changes), and "Reset Finding Decisions".
- [x] **Findings Data Model**:
  - Strongly typed `Finding`, `FindingType`, `FindingSeverity`, `FindingEvidenceStatus`, and `FindingStatus` in `src/types/index.ts`.
  - Comprehensive metadata: exact character offsets (`startIndex`, `endIndex`), matched text, guideline references, evidence IDs, plain-language explanations, and suggested revisions.
- [x] **Deterministic Rule & Evidence Engine (`src/utils/ruleChecker.ts`)**:
  - Framework-agnostic pure TypeScript engine evaluating content against active guidelines and brand facts registry.
  - Restricted Terms: detects unquantified superlatives and prohibited phrases with exact offsets and severity grading.
  - Preferred Terminology: detects colloquialisms and maps approved replacements.
  - Required Text: flags missing mandatory regulatory/CCPA disclaimers.
  - Claim Verification: cross-references statements against evidence registry with statuses (`Supported`, `Expired`, `Missing`, `Inconclusive`).
  - Strict responsible AI adherence: Missing or expired evidence is never labelled "false" and always displays: *"Supporting evidence was not found in the current registry. This does not establish that the claim is false."*
- [x] **Explainable Findings Panel**:
  - Filterable by Severity (`High`, `Medium`, `Low`, `Notice`) and Status (`Open`, `Accepted`, `Dismissed`, `Resolved`).
  - Derived live counts summary bar.
  - Card displays severity, category, title, matched text quote, plain-language explanation, guideline citation, linked registry evidence details, and intent-preserving suggested revisions.
  - Interactive human reviewer actions: Accept finding, Dismiss finding with customizable reason, Mark resolved, and Reopen.
- [x] **Draft Text and Finding Highlighting (Split-Pane)**:
  - Responsive two-column desktop / stacked mobile layout.
  - Original Submitted Text pane: preserved verbatim and read-only, rendering accessible semantic `<mark>` highlights with wavy/dashed underlines and keyboard navigation (`role="button"`, `tabIndex={0}`).
  - Bi-directional selection: clicking a highlighted span scrolls and focuses the finding card; clicking a finding focuses the text span.
  - Working Revision Draft pane: separate editable textarea where suggested revisions are previewed and applied safely without mutating original text.
- [x] **State Management & Persistence**:
  - `FindingContext` with custom hook `useFindings`.
  - Decisions and revision drafts synchronized to `localStorage` (`pratyay_finding_decisions_v1` and `pratyay_working_drafts_v1`).
- [x] **Modern Web Guidance Compliance**:
  - `highlight-text-ranges`: semantic `<mark>` elements with non-color indicators (wavy underlines, badges) for accessible text highlighting.

### Phase 5: Human Review Workflow, Approval Controls, and Audit History (Completed)
- [x] **Review Lifecycle & Transition Integrity**:
  - Supported lifecycle: `Draft` → `In Review` → `Needs Changes` → `Approved`.
  - Content submitted for review transitions to `In Review`.
  - Consequential reviewer action: "Request Changes" requires a mandatory reason, attaches comments to review, and logs `changes_requested`.
  - Resubmission workflow: creator can submit working revision as a new version snapshot (`v2.0`), updating active review draft while permanently preserving original submitted text.
  - Human review approval: requires explicit confirmation acknowledgment checkbox confirming editorial review. Never approves automatically.
- [x] **Human Reviewer Sign-Off Modal (`ReviewSignOffModal.tsx`)**:
  - Dialog modal for consequential editorial decisions (`Approve`, `Request Changes`, `Resubmit Revision`).
  - Labeled demo reviewer identities: Editorial Reviewer (Demo), Compliance Officer (Demo), Technical Specialist (Demo).
  - Explicit confirmation guard prevents accidental approval without reviewer acknowledgment.
  - Reviewer decision callouts prominently displayed on the review details page.
- [x] **Decision Audit Log (`/history`)**:
  - Full-featured audit trail replacing placeholder.
  - Summary cards: Total Audit Events, Approvals Granted, Changes Requested, Submissions & Revisions.
  - Full-text search and filtering by event type and review status.
  - Columns: Timestamp, Event Type badge, Content/Review link, Status Transition (`In Review → Approved`, etc.), Actor & Role, Summary & Reviewer Note.
  - Export functionality: 1-click "Export JSON Log" for compliance records.
  - Audit disclosure: transparent notice clarifying client-side localStorage demo persistence.
- [x] **State Management & Cross-App Synchronization**:
  - `AuditContext` with custom hook `useAudit`, persisted in `localStorage` (`pratyay_audit_events_v1`).
  - Overview dashboard (`/`) activity feed dynamically linked to live audit events.
  - Synchronization across Overview, Content Reviews, Review Details, and Audit Log.
- [x] **Modern Web Guidance Compliance**:
  - `dialog`: accessible modal dialog with focus management, `Escape` key dismiss, and confirmation guards against accidental discard.

### Phase 6: Frontend-to-Backend Integration & Universal LLM Configuration (Completed)
- [x] **FastAPI Service Integration**:
  - Full typed HTTP client in `src/services/api/client.ts` and `src/services/api/types.ts` implementing all `/api/v1` routes: `/health`, `/models`, `/guidelines`, `/evidence`, `/reviews`, `/analyze`, `/report`, `/decisions/sign-off`, `/decisions/resubmit`, `/findings/{id}/decision`, `/audit-events`, and `/self-hosted-models`.
  - Configurable via `VITE_API_BASE_URL` (`http://127.0.0.1:8000/api/v1`).
  - Seamless offline demonstration fallback when backend is unreachable.
- [x] **Universal Compatible LLM Support & Dynamic Model Management**:
  - Eliminated the four-model hardcoded limit.
  - Dedicated `CustomModelModal.tsx` for registering Ollama, llama.cpp, vLLM, LM Studio, and any private OpenAI-compatible endpoints (`/self-hosted-models`).
  - Native Ollama preset defaulting to `http://localhost:11434/v1` with transparent disclosure that `localhost` is evaluated from the FastAPI backend's perspective.
  - Model selection architecture (`ModelSelector.tsx`) merges built-in catalog models and registered self-hosted endpoints.
  - Transparent execution telemetry: distinguishes Target Model from Server Execution Engine, displaying `analysisNote` notifications for missing keys or fallback execution.
- [x] **Zero Secret Leakage Guarantee**:
  - API keys and tokens are submitted directly to backend storage, never saved in browser `localStorage`, and never exposed in `GET` responses (`hasApiKey` boolean flag).
- [x] **Platform Configuration Portal (`/settings`)**:
  - Added dedicated "LLM & Model Endpoints" tab with live gateway connectivity probe, registered self-hosted model list, deletion controls, and backend catalog view.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-driven UI architecture |
| **Build Tool** | Vite 8 | Ultra-fast HMR and bundling |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Responsive, utility-first design system |
| **Routing** | React Router DOM v7 | Single-page application navigation |
| **Icons** | Lucide React | Clean, consistent enterprise iconography |
| **Backend Integration** | Python 3.12+ + FastAPI | Governance analysis, rules & AI pipeline |
| **Database** | SQLite / PostgreSQL via SQLAlchemy | Persistent guidelines, evidence, reviews & audit events |
| **LLM Protocol** | OpenAI-Compatible (`/chat/completions`) | Universal connectivity for Ollama, vLLM, private models, and cloud LLMs |

---

## 4. Project Structure

```
c:\Users\nandh\Desktop\Pratyay-frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── SummaryCard.tsx
│   │   ├── dashboard/
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── GettingStartedCards.tsx
│   │   │   ├── RecentReviewsTable.tsx
│   │   │   └── WelcomeBanner.tsx
│   │   └── layout/
│   │       ├── DashboardLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── TopNav.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── pages/
│   │   ├── ContentReviewsPage.tsx
│   │   ├── GuidelinesPage.tsx
│   │   ├── OverviewPage.tsx
│   │   ├── ReviewHistoryPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Start Local Development Server
```bash
npm run dev
```
Accessible at: `http://localhost:5173/`

### Production Build & Typecheck
```bash
npm run build
```

### Linting
```bash
npm run lint
```

---

## 6. Verification Status

- **Build (`npm run build`)**: Pass (0 errors, 0 warnings).
- **TypeScript Typecheck (`tsc -b`)**: Pass (Strict `verbatimModuleSyntax` and `noUnusedLocals` verified).
- **Linter (`oxlint`)**: Pass (0 errors, 0 warnings across all 20 source files).
- **Responsive Layout**: Pass (Tested on desktop, tablet, and mobile drawer).
- **Route Navigation**: Pass (All 5 routes functional with browser history support).
