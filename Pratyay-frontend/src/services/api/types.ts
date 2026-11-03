/**
 * Pratyay Frontend-to-Backend API Contract Definitions
 * Target Backend: Python + FastAPI + PostgreSQL
 * Base URL: /api/v1
 */

import type { 
  GuidelineRule, 
  BrandFactEvidence, 
  ReviewItem, 
  Finding, 
  AuditEvent, 
  ReviewStatus, 
  FindingStatus,
  GovernanceAnalysisResult
} from '../../types';
import type { ModelOption } from '../../config/models';

// ==========================================
// 1. Common & Error Models
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorDetail {
  loc?: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  success: false;
  detail: string | ApiErrorDetail[];
  errorCode?: string;
  timestamp: string;
}

// ==========================================
// 2. Guidelines API (/api/v1/guidelines)
// ==========================================

export interface GetGuidelinesParams {
  category?: string;
  status?: 'Active' | 'Inactive';
  search?: string;
  limit?: number;
  offset?: number;
}

export type CreateGuidelineRequest = Omit<GuidelineRule, 'id' | 'lastUpdated'>;
export type UpdateGuidelineRequest = Partial<CreateGuidelineRequest>;

// ==========================================
// 3. Evidence & Facts API (/api/v1/evidence)
// ==========================================

export interface GetEvidenceParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export type CreateEvidenceRequest = Omit<BrandFactEvidence, 'id' | 'lastUpdated'>;
export type UpdateEvidenceRequest = Partial<CreateEvidenceRequest>;

// ==========================================
// 4. Content Reviews API (/api/v1/reviews)
// ==========================================

export interface GetReviewsParams {
  status?: ReviewStatus | 'All';
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateReviewRequest {
  campaignTitle: string;
  contentType: ReviewItem['contentType'];
  brandPackName: string;
  campaignContext?: string;
  draftText: string;
  status?: 'Draft' | 'In Review';
  submittedBy: {
    name: string;
    role: string;
  };
  targetModelId?: string;
  uploadedDocument?: {
    filename: string;
    fileSize: number;
    fileType: string;
    extractedAt: string;
    originalExtractedText?: string;
  };
}

export interface UpdateReviewRequest {
  campaignTitle?: string;
  contentType?: ReviewItem['contentType'];
  brandPackName?: string;
  campaignContext?: string;
  draftText?: string;
  status?: ReviewStatus;
  uploadedDocument?: {
    filename: string;
    fileSize: number;
    fileType: string;
    extractedAt: string;
    originalExtractedText?: string;
  };
  targetModelId?: string;
}

// ==========================================
// 5. Analysis & Inference API (/api/v1/reviews/:id/analyze)
// ==========================================

export interface AnalyzeContentRequest {
  reviewId: string;
  draftText: string;
  brandPackName: string;
  targetModelId: string;
  campaignContext?: string;
}

export interface AnalyzeContentResponse {
  analysisResult: GovernanceAnalysisResult;
  findings: Finding[];
  complianceScore: number;
  flaggedIssuesCount: number;
  unverifiedClaimsCount: number;
}

// ==========================================
// 6. Review Decisions & Sign-Off API (/api/v1/reviews/:id/decisions)
// ==========================================

export interface SubmitSignOffRequest {
  decision: 'Approved' | 'Needs Changes';
  reviewerName: string;
  reviewerRole: string;
  comment?: string;
  confirmationAcknowledged: boolean;
}

export interface ResubmitRevisionRequest {
  newDraftText: string;
  changeSummary?: string;
  submitterName?: string;
}

export interface UpdateFindingDecisionRequest {
  status: FindingStatus;
  dismissReason?: string;
  reviewerName?: string;
}

// ==========================================
// 7. Models API (/api/v1/models)
// ==========================================

export interface ModelsCatalogResponse {
  models: ModelOption[];
  tasks?: {
    extract?: { enabled: boolean; model?: string };
    verify?: { enabled: boolean; model?: string };
    tone?: { enabled: boolean; model?: string };
  };
  activeEngine: {
    name: string;
    version: string;
    mode: 'offline_deterministic' | 'llm_service';
  };
  defaultModelId: string;
}

// ==========================================
// 8. Self-Hosted Models API (/api/v1/self-hosted-models)
// ==========================================

export interface SelfHostedModel {
  id: string; // formatted by backend as "selfhosted:<numeric_id>"
  name: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
}

export interface CreateSelfHostedModelRequest {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

// ==========================================
// 9. Audit Events API (/api/v1/audit-events)
// ==========================================

export interface GetAuditEventsParams {
  reviewId?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}

export type CreateAuditEventRequest = Omit<AuditEvent, 'id' | 'timestamp' | 'isoTimestamp'>;

