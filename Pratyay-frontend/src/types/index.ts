export type ReviewStatus = 'Draft' | 'In Review' | 'Needs Changes' | 'Approved';

export type ClaimVerificationStatus = 
  | 'Supported' 
  | 'Contradicted' 
  | 'Unsubstantiated' 
  | 'Expired' 
  | 'Needs Human Review';

export type GuidelineStatus = 'Active' | 'Inactive';

export type GuidelineCategory = 
  | 'Tone and Voice'
  | 'Terminology'
  | 'Required Wording'
  | 'Brand Facts'
  | 'Promotional Claims'
  | 'Accessibility';

export type RuleType = 
  | 'Preferred Term'
  | 'Restricted Term'
  | 'Required Text'
  | 'Factual Requirement'
  | 'General Rule';

export type EvidenceStatus = 
  | 'Evidence Available'
  | 'Missing Evidence'
  | 'Expired Evidence'
  | 'Needs Review';

export type ContentType = 
  | 'Social Media Post'
  | 'Advertisement Copy'
  | 'Product Description'
  | 'Email Campaign'
  | 'Landing Page Copy'
  | 'Other';

export interface GuidelineRule {
  id: string;
  name: string;
  category: GuidelineCategory;
  ruleType: RuleType;
  summary: string;
  description: string;
  targetTerm?: string;       // Restricted term, preferred term, or required snippet
  replacementTerm?: string;  // Suggested alternative if preferred term
  status: GuidelineStatus;
  lastUpdated: string;
  notes?: string;
}

export interface BrandFactEvidence {
  id: string;
  claimName: string;
  approvedStatement: string;
  evidenceDescription: string;
  sourceReference: string;
  evidenceStatus: EvidenceStatus;
  validFrom?: string;
  expiryDate?: string;
  notes?: string;
  lastUpdated: string;
}

export interface ReviewItem {
  id: string;
  campaignTitle: string;
  category: string;
  contentType: ContentType;
  brandPackName: string;
  campaignContext?: string;
  draftText: string;
  originalDraftText?: string;
  activeRevisionVersion?: number;
  reviewerComment?: string;
  reviewerDecision?: 'Approved' | 'Needs Changes';
  reviewedBy?: string;
  reviewedAt?: string;
  submittedBy: {
    name: string;
    role: string;
    avatar?: string;
  };
  createdAt: string;
  lastUpdated: string;
  submittedAt?: string;
  status: ReviewStatus;
  flaggedIssuesCount: number;
  unverifiedClaimsCount: number;
  complianceScore?: number;
  uploadedDocument?: {
    filename: string;
    fileSize: number;
    fileType: string;
    extractedAt: string;
    originalExtractedText?: string;
  };
  targetModelId?: string;
  actualModelUsed?: string;
  analysisNote?: string;
}

export type AuditEventType = 
  | 'content_submitted'
  | 'changes_requested'
  | 'revision_resubmitted'
  | 'content_approved'
  | 'finding_accepted'
  | 'finding_dismissed'
  | 'finding_resolved'
  | 'finding_reopened'
  | 'guideline_updated';

export interface AuditEvent {
  id: string;
  timestamp: string;
  isoTimestamp: string;
  eventType: AuditEventType;
  reviewId?: string;
  reviewTitle?: string;
  previousStatus?: ReviewStatus;
  newStatus?: ReviewStatus;
  actor: string;
  actorRole: string;
  summary: string;
  comment?: string;
  revisionVersion?: number;
  isSyntheticDemo?: boolean;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'change_request' | 'verification' | 'system_flag' | 'submission' | 'guideline_update';
}

export interface SummaryMetric {
  title: string;
  value: number | string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  description: string;
  iconName: 'total' | 'pending' | 'warning' | 'approved';
}

export interface GettingStartedItem {
  id: string;
  title: string;
  description: string;
  route: string;
  actionLabel: string;
  stepNumber: number;
  badge?: string;
}

export type FindingType = 
  | 'rule_violation' 
  | 'terminology' 
  | 'required_text' 
  | 'factual_claim' 
  | 'informational_notice';

export type FindingSeverity = 'High' | 'Medium' | 'Low' | 'Notice';

export type FindingEvidenceStatus = 
  | 'supported' 
  | 'missing' 
  | 'expired' 
  | 'inconclusive' 
  | 'not_applicable';

export type FindingStatus = 'open' | 'accepted' | 'dismissed' | 'resolved';

export interface Finding {
  id: string;
  reviewId: string;
  type: FindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  matchedText?: string;
  startIndex?: number;
  endIndex?: number;
  guidelineId?: string;
  ruleReference: string;
  evidenceIds?: string[];
  evidenceStatus: FindingEvidenceStatus;
  suggestedRevision?: string;
  explanation: string;
  status: FindingStatus;
  dismissReason?: string;
  createdAt: string;
  isDemoOnly?: boolean;
}

export interface GovernanceAnalysisMetadata {
  reviewId: string;
  campaignTitle: string;
  contentType: ContentType;
  brandPackName: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerDecision?: 'Approved' | 'Needs Changes';
  status: ReviewStatus;
  revisionVersion: number;
}

export interface GovernanceEngineInfo {
  configuredModelId: string;
  configuredModelName: string;
  configuredProvider: string;
  actualEngineUsed: string;
  executionMode: 'offline_deterministic' | 'llm_service';
  generatedAt: string;
  disclaimer: string;
}

export interface GovernanceClaimVerification {
  id: string;
  claimText: string;
  status: 'Supported' | 'Contradicted' | 'Unsubstantiated' | 'Expired' | 'Inconclusive' | 'Not Evaluated';
  evidenceReference?: string;
  evidenceValidity?: {
    validFrom?: string;
    expiryDate?: string;
    isExpired?: boolean;
  };
  explanation: string;
  requiresHumanReview: boolean;
}

export interface GovernanceToneAnalysis {
  status: 'pending_ai_service' | 'evaluated';
  toneGuidelines: string[];
  summary: string;
  applicableFindings: Finding[];
}

export interface GovernanceCorrectedContent {
  originalText: string;
  proposedRevisedText: string;
  isFullyFixable: boolean;
  replacementsCount: number;
  unresolvedIssuesCount: number;
}

export interface GovernanceReviewerSignOff {
  actor?: string;
  actorRole?: string;
  decision?: 'Approved' | 'Needs Changes';
  comment?: string;
  signedOffAt?: string;
}

export interface GovernanceAnalysisResult {
  reportVersion: '1.0';
  platform: string;
  metadata: GovernanceAnalysisMetadata;
  engine: GovernanceEngineInfo;
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
  toneAnalysis: GovernanceToneAnalysis;
  correctedContent: GovernanceCorrectedContent;
  signOff?: GovernanceReviewerSignOff;
}
