import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = process.cwd();

console.log('================================================================');
console.log('Pratyay — Clean Dashboard & First-Time Experience Verification');
console.log('================================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`[PASS] ${testName}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] ${testName}: ${err.message}`);
    failedCount++;
  }
}

// 1. Verify mockData has empty collections and zeroed summary metrics
runTest('Initial Mock Data is clean (0 reviews, 0 activity, 0 audit events, 0 facts)', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/data/mockData.ts'), 'utf-8');
  assert.ok(content.includes('export const mockRecentReviews: ReviewItem[] = [];'), 'mockRecentReviews must be empty array');
  assert.ok(content.includes('export const mockActivityFeed: ActivityEvent[] = [];'), 'mockActivityFeed must be empty array');
  assert.ok(content.includes('export const mockAuditEvents: AuditEvent[] = [];'), 'mockAuditEvents must be empty array');
  assert.ok(content.includes('export const initialBrandFactsEvidence: BrandFactEvidence[] = [];'), 'initialBrandFactsEvidence must be empty array');
  
  // Summary metrics must have 0 values
  assert.ok(content.includes("value: 0"), 'mockSummaryMetrics values must be 0');
  assert.ok(!content.includes("148"), 'Should not contain sample value 148');
  assert.ok(!content.includes("125"), 'Should not contain sample value 125');
  assert.ok(!content.includes("+14% this month"), 'Should not contain fake "+14% this month"');
  assert.ok(!content.includes("92.4% pass rate"), 'Should not contain fake "92.4% pass rate"');
});

// 2. Verify zero fictional brand names in user-facing source code
runTest('No fictional brand names in UI source code', () => {
  const filesToCheck = [
    'src/data/mockData.ts',
    'src/components/layout/TopNav.tsx',
    'src/pages/ContentEditorPage.tsx',
    'src/components/guidelines/FactEvidenceModal.tsx',
    'src/pages/OverviewPage.tsx',
    'src/pages/ContentReviewsPage.tsx',
    'src/pages/ReviewHistoryPage.tsx'
  ];

  const forbiddenTerms = [
    'chikmeshra',
    'avo botanicals',
    'aura botanicals',
    'hairfall defense',
    'hair-fall defense'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
      for (const term of forbiddenTerms) {
        assert.ok(
          !content.includes(term),
          `Found forbidden sample term "${term}" in ${relPath}`
        );
      }
    }
  }
});

// 3. Verify WelcomeBanner has required heading, message, primary button, and secondary guidance
runTest('WelcomeBanner empty dashboard requirements', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/dashboard/WelcomeBanner.tsx'), 'utf-8');
  assert.ok(content.includes('Welcome to Pratyay'), 'Must have heading "Welcome to Pratyay"');
  assert.ok(
    content.includes('No reviews yet. Start your first brand compliance review to check content against your brand guidelines and available evidence.'),
    'Must have exact empty dashboard message'
  );
  assert.ok(content.includes('Start Your First Review'), 'Must have primary button "Start Your First Review"');
  assert.ok(
    content.includes('Add your brand guidelines and supporting evidence to improve your review results.'),
    'Must have secondary guidance text'
  );
});

// 4. Verify FirstTimeWorkflowGuide implements all 9 steps and flexibility notice
runTest('FirstTimeWorkflowGuide contains all 9 steps and flexibility notice', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/dashboard/FirstTimeWorkflowGuide.tsx'), 'utf-8');
  
  // 9 steps
  assert.ok(content.includes('Add Brand Guidelines & Facts'), 'Step 1 must be present');
  assert.ok(content.includes('Start a New Review'), 'Step 2 must be present');
  assert.ok(content.includes('Paste Content or Upload Document'), 'Step 3 must be present');
  assert.ok(content.includes('Select Model Target'), 'Step 4 must be present');
  assert.ok(content.includes('Run Available Checks'), 'Step 5 must be present');
  assert.ok(content.includes('Review Findings & Verification'), 'Step 6 must be present');
  assert.ok(content.includes('Edit Proposed Revision'), 'Step 7 must be present');
  assert.ok(content.includes('Export Analysis as JSON'), 'Step 8 must be present');
  assert.ok(content.includes('Submit for Human Approval'), 'Step 9 must be present');
  
  // Flexibility notice
  assert.ok(
    content.includes('Setup is flexible: you do not need to configure every step before testing.'),
    'Must communicate setup is flexible'
  );
  assert.ok(
    content.includes('You can start a review right now with sample text to test deterministic checks'),
    'Must explain sample review can run immediately'
  );
  assert.ok(
    content.includes('configuring brand guidelines and evidence expands rule coverage'),
    'Must explain that missing guidelines or evidence may limit results'
  );
});

// 5. Verify OverviewPage summary metrics show 0 and neutral change when reviews are 0
runTest('OverviewPage dynamic metrics are clean when reviews.length === 0', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/pages/OverviewPage.tsx'), 'utf-8');
  assert.ok(content.includes("totalCount === 0 ? 'No submissions yet'"), 'Must handle totalCount === 0 with neutral text');
  assert.ok(content.includes("totalCount === 0 ? '0 in review queue'"), 'Must handle pending reviews === 0');
  assert.ok(content.includes("totalCount === 0 ? '0 flagged for revision'"), 'Must handle needs changes === 0');
  assert.ok(content.includes("totalCount === 0 ? '0 authorized to date'"), 'Must handle approved reviews === 0');
  assert.ok(content.includes('<WelcomeBanner reviewCount={totalCount} />'), 'Must pass reviewCount to WelcomeBanner');
  assert.ok(content.includes('<FirstTimeWorkflowGuide />'), 'Must embed FirstTimeWorkflowGuide');
});

// 6. Verify RecentReviewsTable has empty state with required buttons
runTest('RecentReviewsTable empty state matches requirements', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/dashboard/RecentReviewsTable.tsx'), 'utf-8');
  assert.ok(content.includes('No reviews yet'), 'Must show "No reviews yet" heading');
  assert.ok(
    content.includes('Start your first brand compliance review to check content against your brand guidelines and available evidence.'),
    'Must show compliance review message'
  );
  assert.ok(content.includes('Start Your First Review'), 'Must have "Start Your First Review" button');
  assert.ok(
    content.includes('Add your brand guidelines and supporting evidence to improve your review results.'),
    'Must show secondary guidance'
  );
});

// 7. Verify ContentReviewsPage has empty state with required buttons
runTest('ContentReviewsPage empty state matches requirements', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/pages/ContentReviewsPage.tsx'), 'utf-8');
  assert.ok(content.includes('No reviews yet'), 'Must show "No reviews yet" heading');
  assert.ok(
    content.includes('Start your first brand compliance review to check content against your brand guidelines and available evidence.'),
    'Must show compliance review message'
  );
  assert.ok(content.includes('Start Your First Review'), 'Must have "Start Your First Review" button');
  assert.ok(
    content.includes('Add your brand guidelines and supporting evidence to improve your review results.'),
    'Must show secondary guidance'
  );
});

// 8. Verify ReviewHistoryPage has empty state with required text
runTest('ReviewHistoryPage empty state matches requirements', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/pages/ReviewHistoryPage.tsx'), 'utf-8');
  assert.ok(content.includes('No review history yet'), 'Must show "No review history yet" heading');
  assert.ok(
    content.includes('No review actions recorded yet. Audit events and human review decisions will appear here as you submit, revise, and approve marketing drafts.'),
    'Must show audit explanation message'
  );
  assert.ok(content.includes('Start Your First Review'), 'Must have "Start Your First Review" button');
  assert.ok(
    content.includes('Add your brand guidelines and supporting evidence to improve your review results.'),
    'Must show secondary guidance'
  );
});

// 9. Verify Contexts filter legacy synthetic sample items on hydration
runTest('Context providers filter legacy synthetic records on hydration', () => {
  const reviewContext = fs.readFileSync(path.join(ROOT, 'src/context/ReviewContext.tsx'), 'utf-8');
  assert.ok(reviewContext.includes('function isSampleReview'), 'ReviewContext must have isSampleReview sanitizer');
  assert.ok(reviewContext.includes('.filter((r) => !isSampleReview(r))'), 'ReviewContext must filter out sample reviews on hydration');

  const auditContext = fs.readFileSync(path.join(ROOT, 'src/context/AuditContext.tsx'), 'utf-8');
  assert.ok(auditContext.includes('function isSampleAuditEvent'), 'AuditContext must have isSampleAuditEvent sanitizer');
  assert.ok(auditContext.includes('.filter((e) => !isSampleAuditEvent(e))'), 'AuditContext must filter out sample events on hydration');

  const guidelineContext = fs.readFileSync(path.join(ROOT, 'src/context/GuidelineContext.tsx'), 'utf-8');
  assert.ok(guidelineContext.includes('function isSampleFact'), 'GuidelineContext must have isSampleFact sanitizer');
  assert.ok(guidelineContext.includes('.filter((f) => !isSampleFact(f))'), 'GuidelineContext must filter out sample facts on hydration');
});

// 10. Verify TopNav notifications are dynamic and clean when empty
runTest('TopNav notifications are dynamic and display empty state', () => {
  const content = fs.readFileSync(path.join(ROOT, 'src/components/layout/TopNav.tsx'), 'utf-8');
  assert.ok(content.includes('useAudit'), 'TopNav must import and use useAudit');
  assert.ok(content.includes('No governance alerts'), 'TopNav must have empty state');
  assert.ok(content.includes('alerts.length > 0'), 'TopNav red dot only shown when alerts exist');
});

console.log('\n----------------------------------------------------------------');
console.log(`Results: ${passedCount} passed, ${failedCount} failed.`);
console.log('----------------------------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
}
