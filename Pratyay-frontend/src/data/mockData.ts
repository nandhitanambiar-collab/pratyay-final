import type { 
  ReviewItem, 
  ActivityEvent, 
  AuditEvent,
  SummaryMetric, 
  GettingStartedItem,
  GuidelineRule,
  BrandFactEvidence
} from '../types';

export const mockSummaryMetrics: SummaryMetric[] = [
  {
    title: 'Total Reviews',
    value: 0,
    change: 'No submissions yet',
    changeType: 'neutral',
    description: 'All marketing copy evaluated',
    iconName: 'total',
  },
  {
    title: 'Pending Reviews',
    value: 0,
    change: '0 in review queue',
    changeType: 'neutral',
    description: 'Requires human editorial sign-off',
    iconName: 'pending',
  },
  {
    title: 'Needs Changes',
    value: 0,
    change: '0 flagged for revision',
    changeType: 'neutral',
    description: 'Revisions suggested to creator',
    iconName: 'warning',
  },
  {
    title: 'Approved Reviews',
    value: 0,
    change: '0 authorized to date',
    changeType: 'neutral',
    description: 'Validated & authorized by reviewer',
    iconName: 'approved',
  },
];

export const mockRecentReviews: ReviewItem[] = [];

export const mockActivityFeed: ActivityEvent[] = [];

export const mockAuditEvents: AuditEvent[] = [];


export const mockGettingStartedItems: GettingStartedItem[] = [
  {
    id: 'gs-1',
    stepNumber: 1,
    title: 'Set up brand guidelines',
    description: 'Configure approved terminology, restricted phrases, brand tone guidelines, and verified evidence documents.',
    route: '/guidelines',
    actionLabel: 'Configure Guidelines',
    badge: 'Step 1: Standards',
  },
  {
    id: 'gs-2',
    stepNumber: 2,
    title: 'Submit marketing content',
    description: 'Submit draft copy or campaigns to trigger deterministic checks and AI-assisted claim verification against rules.',
    route: '/reviews/new',
    actionLabel: 'Submit Content',
    badge: 'Step 2: Analysis',
  },
  {
    id: 'gs-3',
    stepNumber: 3,
    title: 'Review findings and evidence',
    description: 'Inspect explainable findings, evaluate uncertainty scores, accept intent-preserving rewrites, and approve drafts.',
    route: '/history',
    actionLabel: 'Inspect Decisions',
    badge: 'Step 3: Governance',
  },
];

export const initialGuidelineRules: GuidelineRule[] = [
  {
    id: 'RULE-101',
    name: 'Prohibited ASCI Superlatives & Unbacked Claims',
    category: 'Promotional Claims',
    ruleType: 'Restricted Term',
    summary: 'Prohibit unquantified superlatives such as "India\'s #1", "Best-in-class", "Guaranteed Cure" without certified evidence.',
    description: 'Claims claiming market leadership or absolute efficacy must be backed by documented third-party research or removed before publication.',
    targetTerm: "India's #1 / Guaranteed Cure / Miracle Result",
    status: 'Active',
    lastUpdated: 'Today at 10:15 AM',
    notes: 'Enforces ASCI Code Chapter 1 (Honest Representation).',
  },
  {
    id: 'RULE-102',
    name: 'Approved Clean Energy Fleet Phrasing',
    category: 'Terminology',
    ruleType: 'Preferred Term',
    summary: 'Use "Clean Energy Commercial Fleet" instead of vague terms like "100% Green Vehicles" or "Eco Miracles".',
    description: 'Standardizes environmental terminology across press releases, annual reports, and digital campaigns.',
    targetTerm: '100% Green Vehicles / Eco Miracle',
    replacementTerm: 'Clean Energy Commercial Fleet',
    status: 'Active',
    lastUpdated: 'Yesterday at 3:40 PM',
    notes: 'Aligns with corporate sustainability disclosure framework.',
  },
  {
    id: 'RULE-103',
    name: 'Mandatory CCPA Course Outcome Disclaimer',
    category: 'Required Wording',
    ruleType: 'Required Text',
    summary: 'Promotional headlines showcasing top qualifiers must include total cohort size and course type disclaimers.',
    description: 'CCPA guidelines require clear disclaimers that prevent misleading readers about overall batch selection percentages.',
    targetTerm: '*Results reflect select top candidates from specialized intensive coaching programs.',
    status: 'Active',
    lastUpdated: '3 days ago',
    notes: 'Mandated by CCPA Feb 2026 enforcement circulars.',
  },
  {
    id: 'RULE-104',
    name: 'Objective Technical Tone Standard',
    category: 'Tone and Voice',
    ruleType: 'General Rule',
    summary: 'Marketing copy must remain factual, measured, and informative. Avoid sensational hype and artificial urgency.',
    description: 'Maintain professional B2B tone. Avoid phrases like "Act now or lose everything" or "Unbelievable game-changer".',
    status: 'Active',
    lastUpdated: '4 days ago',
    notes: 'Applies across all technical collateral and whitepapers.',
  },
  {
    id: 'RULE-105',
    name: 'Probiotic Live Culture Specification',
    category: 'Brand Facts',
    ruleType: 'Factual Requirement',
    summary: 'All packaging and ad copy referencing probiotic cultures must specify "10 Billion Live CFUs at manufacturing date".',
    description: 'Exact CFU count must be cited whenever digestive health claims or bacterial cultures are discussed.',
    targetTerm: '10 Billion Live CFUs',
    status: 'Active',
    lastUpdated: '1 week ago',
    notes: 'Backed by QA Stability Report QA-2026-B9.',
  },
  {
    id: 'RULE-106',
    name: 'Restricted Cosmetic Hair-Regrowth Claims',
    category: 'Promotional Claims',
    ruleType: 'Restricted Term',
    summary: 'Prohibit claiming "reverses baldness" or "stops permanent hair loss" for topical cosmetic products.',
    description: 'Cosmetic shampoos cannot make medicinal claims about curing alopecia or baldness under ASCI guidelines.',
    targetTerm: 'Reverses baldness / Stops permanent hair loss',
    status: 'Active',
    lastUpdated: '2 weeks ago',
    notes: 'Based on official ASCI complaint precedent.',
  },
  {
    id: 'RULE-107',
    name: 'WCAG 2.2 Image Alternative Text Requirement',
    category: 'Accessibility',
    ruleType: 'General Rule',
    summary: 'All promotional hero banners and social carousels must include concise, descriptive alternative text.',
    description: 'Ensure blind and low-vision users using screen readers receive full contextual information from campaign graphics.',
    status: 'Active',
    lastUpdated: '2 weeks ago',
    notes: 'Adheres to WCAG 2.2 AA accessibility guidelines.',
  },
  {
    id: 'RULE-108',
    name: 'Sunset Q2 Promotional Discount Disclaimer',
    category: 'Required Wording',
    ruleType: 'Required Text',
    summary: 'Legacy discount disclosure wording for Q2 introductory pricing campaigns.',
    description: 'Required clause stating discount eligibility for contracts signed before June 30, 2025.',
    targetTerm: 'Terms apply. Valid exclusively for contracts executed prior to June 30, 2025.',
    status: 'Inactive',
    lastUpdated: '1 month ago',
    notes: 'Archived after campaign conclusion.',
  },
];

export const initialBrandFactsEvidence: BrandFactEvidence[] = [];

