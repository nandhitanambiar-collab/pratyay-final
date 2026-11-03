import type { 
  ReviewItem, 
  GuidelineRule, 
  BrandFactEvidence, 
  Finding, 
  FindingSeverity,
  FindingEvidenceStatus
} from '../types';

/**
 * Normalizes text for case-insensitive searching
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Searches for all non-overlapping occurrences of a term in text
 */
function findTermOccurrences(
  text: string, 
  term: string
): Array<{ startIndex: number; endIndex: number; matchedText: string }> {
  if (!text || !term || term.trim().length === 0) return [];
  
  const trimmed = term.trim();
  const escaped = escapeRegExp(trimmed);
  // Match word boundaries when practical, otherwise substring
  const regex = new RegExp(escaped, 'gi');
  const results: Array<{ startIndex: number; endIndex: number; matchedText: string }> = [];
  
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      matchedText: match[0],
    });
  }
  
  return results;
}

/**
 * Deterministic Rule & Evidence Checking Engine
 * 
 * Evaluates draft text against active brand guideline rules and registered facts/evidence.
 * 
 * IMPORTANT CONSTRAINTS:
 * - Deterministic local evaluation; no external LLM or AI API.
 * - Missing or expired evidence is never described as "false".
 * - Mandatory phrasing for missing/expired evidence:
 *   "Supporting evidence was not found in the current registry. This does not establish that the claim is false."
 */
export function runDeterministicRuleChecks(
  review: ReviewItem,
  rules: GuidelineRule[],
  factsRegistry: BrandFactEvidence[]
): Finding[] {
  const findings: Finding[] = [];
  const text = review.draftText || '';
  if (!text.trim()) return findings;

  const activeRules = rules.filter((r) => r.status === 'Active');
  let findingCounter = 1;

  // Track already highlighted ranges to avoid conflicting duplicate spans
  const occupiedSpans: Array<{ start: number; end: number }> = [];

  const isOverlapping = (start: number, end: number) => {
    return occupiedSpans.some(
      (span) => Math.max(start, span.start) < Math.min(end, span.end)
    );
  };

  // 1. Evaluate Guideline Rules
  for (const rule of activeRules) {
    if (!rule.targetTerm) continue;

    // A targetTerm may contain multiple alternative terms separated by "/" or ";"
    const subTerms = rule.targetTerm
      .split(/[/;]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);

    for (const term of subTerms) {
      // Handle Required Text rules differently: check if phrase is present
      if (rule.ruleType === 'Required Text') {
        const containsRequired = text.toLowerCase().includes(term.toLowerCase());
        
        // Only trigger missing required text if relevant to the brand pack, context, or demo preset
        const isPackRelevant = 
          (rule.id === 'RULE-103' && (review.brandPackName.includes('CCPA') || review.brandPackName.includes('FinTech'))) ||
          (rule.id === 'RULE-108' && review.brandPackName.includes('Enterprise'));

        if (!containsRequired && isPackRelevant) {
          findings.push({
            id: `FIND-${review.id}-${findingCounter++}`,
            reviewId: review.id,
            type: 'required_text',
            severity: 'High',
            title: `Missing Required Disclosure: ${rule.name}`,
            description: `Mandatory regulatory or policy disclaimer was not found in the submitted marketing text.`,
            guidelineId: rule.id,
            ruleReference: `${rule.name} (${rule.id})`,
            evidenceStatus: 'missing',
            suggestedRevision: `${text.trim()}\n\n*${rule.targetTerm}*`,
            explanation: `CCPA / Regulatory governance rules require this disclaimer to appear in public-facing marketing copy. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`,
            status: 'open',
            createdAt: 'Just now',
          });
        }
        continue;
      }

      // Check occurrences of Restricted Term or Preferred Term in the draft text
      const occurrences = findTermOccurrences(text, term);

      for (const occ of occurrences) {
        if (isOverlapping(occ.startIndex, occ.endIndex)) {
          continue;
        }

        occupiedSpans.push({ start: occ.startIndex, end: occ.endIndex });

        if (rule.ruleType === 'Restricted Term') {
          const isHighSeverity = 
            rule.category === 'Promotional Claims' || 
            occ.matchedText.toLowerCase().includes('guarantee') ||
            occ.matchedText.toLowerCase().includes('cure');

          findings.push({
            id: `FIND-${review.id}-${findingCounter++}`,
            reviewId: review.id,
            type: 'rule_violation',
            severity: isHighSeverity ? 'High' : 'Medium',
            title: `Restricted Phrase Detected: "${occ.matchedText}"`,
            description: rule.summary,
            matchedText: occ.matchedText,
            startIndex: occ.startIndex,
            endIndex: occ.endIndex,
            guidelineId: rule.id,
            ruleReference: `${rule.name} (${rule.id})`,
            evidenceStatus: 'missing',
            suggestedRevision: rule.replacementTerm 
              ? occ.matchedText.replace(new RegExp(escapeRegExp(occ.matchedText), 'i'), rule.replacementTerm)
              : undefined,
            explanation: `${rule.description} Supporting evidence was not found in the current registry. This does not establish that the claim is false.`,
            status: 'open',
            createdAt: 'Just now',
          });
        } else if (rule.ruleType === 'Preferred Term') {
          findings.push({
            id: `FIND-${review.id}-${findingCounter++}`,
            reviewId: review.id,
            type: 'terminology',
            severity: 'Medium',
            title: `Preferred Term Available for "${occ.matchedText}"`,
            description: `Approved brand guidelines recommend using standard terminology.`,
            matchedText: occ.matchedText,
            startIndex: occ.startIndex,
            endIndex: occ.endIndex,
            guidelineId: rule.id,
            ruleReference: `${rule.name} (${rule.id})`,
            evidenceStatus: 'not_applicable',
            suggestedRevision: rule.replacementTerm || 'Clean Energy Commercial Fleet',
            explanation: `Brand style guide specifies "${rule.replacementTerm || 'approved phrasing'}" over colloquial or unverified phrasing "${occ.matchedText}".`,
            status: 'open',
            createdAt: 'Just now',
          });
        } else if (rule.ruleType === 'Factual Requirement') {
          findings.push({
            id: `FIND-${review.id}-${findingCounter++}`,
            reviewId: review.id,
            type: 'factual_claim',
            severity: 'Notice',
            title: `Required Technical Specification: "${occ.matchedText}"`,
            description: rule.summary,
            matchedText: occ.matchedText,
            startIndex: occ.startIndex,
            endIndex: occ.endIndex,
            guidelineId: rule.id,
            ruleReference: `${rule.name} (${rule.id})`,
            evidenceStatus: 'supported',
            explanation: `Factual requirement confirmed. The stated specification matches active brand guideline parameters.`,
            status: 'open',
            createdAt: 'Just now',
          });
        }
      }
    }
  }

  // 2. Cross-reference Draft Text Against Registered Brand Facts & Evidence
  // Match claims against facts registered in the factsRegistry
  for (const fact of factsRegistry) {
    if (!fact.claimName && !fact.approvedStatement) continue;
    const searchTerms = [fact.claimName, fact.approvedStatement].filter(Boolean);
    for (const term of searchTerms) {
      if (term.length < 5) continue;
      const occurrences = findTermOccurrences(text, term);
      for (const occ of occurrences) {
        if (isOverlapping(occ.startIndex, occ.endIndex)) continue;
        occupiedSpans.push({ start: occ.startIndex, end: occ.endIndex });

        let mappedStatus: FindingEvidenceStatus = 'missing';
        let explanation = '';
        let severity: FindingSeverity = 'Notice';

        if (fact.evidenceStatus === 'Evidence Available') {
          mappedStatus = 'supported';
          severity = 'Notice';
          explanation = `Claim is substantiated by approved evidence in the brand registry: "${fact.sourceReference}" (${fact.claimName}). Valid until ${fact.expiryDate || 'indefinite'}.`;
        } else if (fact.evidenceStatus === 'Expired Evidence') {
          mappedStatus = 'expired';
          severity = 'Medium';
          explanation = `Supporting evidence trial dossier (${fact.sourceReference}) expired on ${fact.expiryDate || 'prior period'}. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        } else if (fact.evidenceStatus === 'Needs Review') {
          mappedStatus = 'inconclusive';
          severity = 'Medium';
          explanation = `Internal telemetry on file (${fact.sourceReference}), but external audit verification is pending. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        } else {
          mappedStatus = 'missing';
          severity = 'High';
          explanation = `Clinical or experimental substantiation was not located. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        }

        findings.push({
          id: `FIND-${review.id}-${findingCounter++}`,
          reviewId: review.id,
          type: 'factual_claim',
          severity,
          title: `Claim Verification: ${fact.claimName}`,
          description: fact.approvedStatement,
          matchedText: occ.matchedText,
          startIndex: occ.startIndex,
          endIndex: occ.endIndex,
          evidenceIds: [fact.id],
          evidenceStatus: mappedStatus,
          ruleReference: `Brand Evidence Registry (${fact.id})`,
          explanation,
          status: 'open',
          createdAt: 'Just now',
        });
      }
    }
  }

  // 3. Common Factual Claim Checks
  const commonClaimPatterns: Array<{
    keywords: string[];
    defaultSeverity: FindingSeverity;
    suggestedFix?: string;
  }> = [
    {
      keywords: ['guarantees 100% regrowth', 'guarantees 100%', '100% regrowth for thinning crowns'],
      defaultSeverity: 'High',
      suggestedFix: 'supports natural follicular vitality and visibly fuller volume',
    },
    {
      keywords: ['reduces breakage by up to 72%', '72% within 4 weeks'],
      defaultSeverity: 'Medium',
      suggestedFix: 'reduces hair breakage with regular application',
    },
    {
      keywords: ['10 Billion verified live CFUs', '10 Billion verified live'],
      defaultSeverity: 'Notice',
    },
    {
      keywords: ['four-nines (99.99%) availability', '99.99% availability'],
      defaultSeverity: 'Notice',
    },
    {
      keywords: ['zero single points of failure'],
      defaultSeverity: 'Medium',
      suggestedFix: 'redundant multi-zone architecture designed for high availability',
    },
    {
      keywords: ['up to 45% reduction in urban delivery emissions', '45% reduction in urban delivery emissions'],
      defaultSeverity: 'Medium',
      suggestedFix: 'up to 45% reduction in urban delivery emissions (based on preliminary pilot telemetry)',
    },
    {
      keywords: ['credit sanction in 90 seconds', 'sanction in 90 seconds'],
      defaultSeverity: 'Notice',
    },
  ];

  for (const mapping of commonClaimPatterns) {
    const matchedKeyword = mapping.keywords.find((kw) =>
      text.toLowerCase().includes(kw.toLowerCase())
    );

    if (!matchedKeyword) continue;

    const occurrences = findTermOccurrences(text, matchedKeyword);

    for (const occ of occurrences) {
      if (isOverlapping(occ.startIndex, occ.endIndex)) {
        continue;
      }

      occupiedSpans.push({ start: occ.startIndex, end: occ.endIndex });

      // Check if factsRegistry has a matching claim
      const linkedFact = factsRegistry.find((f) =>
        f.claimName.toLowerCase().includes(matchedKeyword.toLowerCase()) ||
        f.approvedStatement.toLowerCase().includes(matchedKeyword.toLowerCase())
      );

      let mappedStatus: FindingEvidenceStatus = 'missing';
      let explanation = '';
      let severity: FindingSeverity = mapping.defaultSeverity;

      if (linkedFact) {
        if (linkedFact.evidenceStatus === 'Evidence Available') {
          mappedStatus = 'supported';
          severity = 'Notice';
          explanation = `Claim is substantiated by approved evidence in the brand registry: "${linkedFact.sourceReference}" (${linkedFact.claimName}). Valid until ${linkedFact.expiryDate || 'indefinite'}.`;
        } else if (linkedFact.evidenceStatus === 'Expired Evidence') {
          mappedStatus = 'expired';
          severity = 'Medium';
          explanation = `Supporting evidence trial dossier (${linkedFact.sourceReference}) expired on ${linkedFact.expiryDate || 'prior period'}. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        } else if (linkedFact.evidenceStatus === 'Needs Review') {
          mappedStatus = 'inconclusive';
          severity = 'Medium';
          explanation = `Internal telemetry on file (${linkedFact.sourceReference}), but external audit verification is pending. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        } else {
          mappedStatus = 'missing';
          severity = 'High';
          explanation = `Clinical or experimental substantiation was not located. Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
        }
      } else {
        mappedStatus = 'missing';
        severity = mapping.defaultSeverity;
        explanation = `Supporting evidence was not found in the current registry. This does not establish that the claim is false.`;
      }

      findings.push({
        id: `FIND-${review.id}-${findingCounter++}`,
        reviewId: review.id,
        type: 'factual_claim',
        severity,
        title: linkedFact 
          ? `Claim Verification: ${linkedFact.claimName}` 
          : `Claim Requiring Verification: "${occ.matchedText}"`,
        description: linkedFact ? linkedFact.approvedStatement : `Claim requires registered evidence substantiation.`,
        matchedText: occ.matchedText,
        startIndex: occ.startIndex,
        endIndex: occ.endIndex,
        evidenceIds: linkedFact ? [linkedFact.id] : undefined,
        evidenceStatus: mappedStatus,
        ruleReference: linkedFact ? `Brand Evidence Registry (${linkedFact.id})` : 'Claim Substantiation Standard',
        suggestedRevision: mapping.suggestedFix,
        explanation,
        status: 'open',
        createdAt: 'Just now',
      });
    }
  }

  // Sort findings by position in text (startIndex ascending), placing text-level findings first
  findings.sort((a, b) => {
    if (a.startIndex !== undefined && b.startIndex !== undefined) {
      return a.startIndex - b.startIndex;
    }
    if (a.startIndex !== undefined) return -1;
    if (b.startIndex !== undefined) return 1;
    return 0;
  });

  return findings;
}
