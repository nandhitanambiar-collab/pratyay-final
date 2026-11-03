import type {
  ReviewItem,
  Finding,
  BrandFactEvidence,
  GuidelineRule,
  GovernanceAnalysisResult,
  GovernanceClaimVerification,
} from '../types';
import { getModelById, ACTUAL_OFFLINE_ENGINE } from '../config/models';

export function buildGovernanceAnalysisResult(
  review: ReviewItem,
  findings: Finding[],
  facts: BrandFactEvidence[] = [],
  rules: GuidelineRule[] = []
): GovernanceAnalysisResult {
  const modelConfig = getModelById(review.targetModelId || 'gemini-2.5-flash');

  // Build claim verification items
  const factualFindings = findings.filter((f) => f.type === 'factual_claim' || f.evidenceStatus !== 'not_applicable');
  
  const claimVerifications: GovernanceClaimVerification[] = factualFindings.map((f) => {
    // Cross reference evidence if available
    const matchedEvidence = facts.find((fact) => 
      f.evidenceIds?.includes(fact.id) || 
      (f.matchedText && fact.approvedStatement.toLowerCase().includes(f.matchedText.toLowerCase()))
    );

    let status: GovernanceClaimVerification['status'] = 'Not Evaluated';
    if (f.evidenceStatus === 'supported') status = 'Supported';
    else if (f.evidenceStatus === 'missing') status = 'Unsubstantiated';
    else if (f.evidenceStatus === 'expired') status = 'Expired';
    else if (f.evidenceStatus === 'inconclusive') status = 'Inconclusive';

    return {
      id: f.id,
      claimText: f.matchedText || f.title,
      status,
      evidenceReference: matchedEvidence ? matchedEvidence.sourceReference : (f.ruleReference || 'Pending backend dossier lookup'),
      evidenceValidity: matchedEvidence ? {
        validFrom: matchedEvidence.validFrom,
        expiryDate: matchedEvidence.expiryDate,
        isExpired: matchedEvidence.evidenceStatus === 'Expired Evidence',
      } : undefined,
      explanation: f.explanation,
      requiresHumanReview: true,
    };
  });

  // Tone guidelines
  const toneRules = rules.filter((r) => r.category === 'Tone and Voice' && r.status === 'Active');
  const toneFindings = findings.filter((f) => 
    f.ruleReference?.toLowerCase().includes('tone') || 
    f.title?.toLowerCase().includes('tone')
  );

  // Proposed text derivation
  let proposedText = review.draftText;
  let replacementsCount = 0;
  let unresolvedCount = 0;

  findings.forEach((f) => {
    if (f.suggestedRevision && f.matchedText && proposedText.includes(f.matchedText)) {
      proposedText = proposedText.replace(f.matchedText, f.suggestedRevision);
      replacementsCount++;
    } else {
      unresolvedCount++;
    }
  });

  const highSeverity = findings.filter((f) => f.severity === 'High').length;
  const mediumSeverity = findings.filter((f) => f.severity === 'Medium').length;
  const lowSeverity = findings.filter((f) => f.severity === 'Low').length;
  const notices = findings.filter((f) => f.severity === 'Notice').length;

  return {
    reportVersion: '1.0',
    platform: 'Pratyay — An Intelligent Brand Governance Platform',
    metadata: {
      reviewId: review.id,
      campaignTitle: review.campaignTitle,
      contentType: review.contentType,
      brandPackName: review.brandPackName,
      submittedAt: review.submittedAt || review.createdAt,
      reviewedAt: review.reviewedAt,
      reviewerDecision: review.reviewerDecision,
      status: review.status,
      revisionVersion: review.activeRevisionVersion || 1,
    },
    engine: {
      configuredModelId: modelConfig.id,
      configuredModelName: modelConfig.name,
      configuredProvider: modelConfig.provider,
      actualEngineUsed: ACTUAL_OFFLINE_ENGINE.name,
      executionMode: 'offline_deterministic',
      generatedAt: new Date().toISOString(),
      disclaimer: 'Generated in offline frontend demonstration mode using deterministic regex and rule matching. No external cloud LLM API calls were executed.',
    },
    summary: {
      totalFindings: findings.length,
      highSeverityCount: highSeverity,
      mediumSeverityCount: mediumSeverity,
      lowSeverityCount: lowSeverity,
      noticesCount: notices,
      unverifiedClaimsCount: factualFindings.filter((f) => f.evidenceStatus === 'missing' || f.evidenceStatus === 'expired').length,
      complianceScore: review.complianceScore || 75,
    },
    findings,
    claimVerifications,
    toneAnalysis: {
      status: 'pending_ai_service',
      toneGuidelines: toneRules.map((r) => `${r.name}: ${r.summary}`),
      summary: 'Automated sentiment and tone scoring require the backend AI service (planned for Python/FastAPI integration).',
      applicableFindings: toneFindings,
    },
    correctedContent: {
      originalText: review.draftText,
      proposedRevisedText: proposedText,
      isFullyFixable: unresolvedCount === 0,
      replacementsCount,
      unresolvedIssuesCount: unresolvedCount,
    },
    signOff: review.reviewerDecision ? {
      actor: review.reviewedBy,
      decision: review.reviewerDecision,
      comment: review.reviewerComment,
      signedOffAt: review.reviewedAt,
    } : undefined,
  };
}

export function downloadGovernanceJsonReport(
  review: ReviewItem,
  findings: Finding[],
  facts: BrandFactEvidence[] = [],
  rules: GuidelineRule[] = []
): void {
  const report = buildGovernanceAnalysisResult(review, findings, facts, rules);
  const jsonString = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `pratyay_governance_report_${review.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
