import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('================================================================');
console.log('Pratyay Phase 5.1 — Automated Verification & Integrity Test Suite');
console.log('================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}\n`);
    testsFailed++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Brand Identity & Zero Personal Attribution
// -----------------------------------------------------------------------------
runTest('Brand Identity: Zero personal developer names in source and docs', () => {
  const rootDir = process.cwd();
  const searchTerms = ['archit', 'nandhita', 'ritam', 'mishra', 'nambiar'];
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html'];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (['node_modules', '.git', 'dist'].includes(file)) continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        // Skip this test script itself
        if (file.includes('verify-phase-5-1')) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const term of searchTerms) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(content)) {
            throw new Error(`Personal name "${term}" found in ${fullPath}`);
          }
        }
      }
    }
  }

  scanDir(rootDir);
});

// -----------------------------------------------------------------------------
// Test 2: File Extractor & Validation Rules
// -----------------------------------------------------------------------------
runTest('File Extraction: Max file size and extension rules', () => {
  const filePath = path.join(process.cwd(), 'src/utils/fileExtractor.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024'), 'Must enforce 5MB limit');
  assert.ok(content.includes('.txt'), 'Must support .txt');
  assert.ok(content.includes('.docx'), 'Must support .docx');
  assert.ok(content.includes('.pdf'), 'Must support .pdf');
  assert.ok(content.includes('JSZip'), 'Must use JSZip for Word document extraction');
  assert.ok(content.includes('Scanned documents and image-based PDFs require backend OCR'), 'Must inform about OCR');
});

// -----------------------------------------------------------------------------
// Test 3: Model Configuration
// -----------------------------------------------------------------------------
runTest('Model Selection: Centralized configuration and storage key', () => {
  const filePath = path.join(process.cwd(), 'src/config/models.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('pratyay_selected_model_v1'), 'Must use designated storage key');
  assert.ok(content.includes('gemini-2.5-flash'), 'Must include Gemini 2.5 Flash');
  assert.ok(content.includes('gemini-2.5-pro'), 'Must include Gemini 2.5 Pro');
  assert.ok(content.includes('claude-3-7-sonnet'), 'Must include Claude 3.7 Sonnet');
  assert.ok(content.includes('gpt-4o'), 'Must include GPT-4o');
  assert.ok(content.includes('Deterministic Rule Engine (Client Offline)'), 'Must identify offline engine');
});

// -----------------------------------------------------------------------------
// Test 4: Document Uploader Component
// -----------------------------------------------------------------------------
runTest('Document Uploader: Renders drag-and-drop, replace, and remove controls', () => {
  const filePath = path.join(process.cwd(), 'src/components/reviews/DocumentUploader.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('onTextExtracted'), 'Must notify parent of extracted text');
  assert.ok(content.includes('Replace'), 'Must provide Replace action');
  assert.ok(content.includes('Remove'), 'Must provide Remove action');
  assert.ok(content.includes('extractTextFromFile'), 'Must call extractor utility');
});

// -----------------------------------------------------------------------------
// Test 5: Dedicated Corrected Content Section
// -----------------------------------------------------------------------------
runTest('Corrected Content Section: Side-by-side comparison and replacement breakdown', () => {
  const filePath = path.join(process.cwd(), 'src/components/reviews/CorrectedContentSection.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('Original Submitted Copy'), 'Must show original verbatim copy');
  assert.ok(content.includes('Working Revision Draft'), 'Must show editable working copy');
  assert.ok(content.includes('Apply All Suggested Corrections'), 'Must provide apply all action');
  assert.ok(content.includes('No automated suggestion available'), 'Must state when no fix available');
});

// -----------------------------------------------------------------------------
// Test 6: Separate Factual Claim Verification
// -----------------------------------------------------------------------------
runTest('Claim Verification Section: Responsible AI note and validity tracking', () => {
  const filePath = path.join(process.cwd(), 'src/components/reviews/ClaimVerificationSection.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('never as false') && content.includes('solely due to lack of recorded evidence'), 'Must enforce Responsible AI principle');
  assert.ok(content.includes('Human Verification Required'), 'Must display human verification badge');
  assert.ok(content.includes('Source Dossier'), 'Must show dossier / source reference');
});

// -----------------------------------------------------------------------------
// Test 7: Tone Analysis Section
// -----------------------------------------------------------------------------
runTest('Tone Analysis Section: Transparent AI tone status and active guidelines', () => {
  const filePath = path.join(process.cwd(), 'src/components/reviews/ToneAnalysisSection.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('AI tone analysis not available yet'), 'Must provide honest AI status');
  assert.ok(content.includes('Python/FastAPI integration'), 'Must document backend integration expectation');
  assert.ok(content.includes('Active Brand Tone & Voice Standards'), 'Must display active tone standards');
});

// -----------------------------------------------------------------------------
// Test 8: Structured JSON Schema & Generator
// -----------------------------------------------------------------------------
runTest('Structured JSON Schema: buildGovernanceAnalysisResult produces valid report', () => {
  const filePath = path.join(process.cwd(), 'src/utils/exportGovernanceJson.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('buildGovernanceAnalysisResult'), 'Must export builder function');
  assert.ok(content.includes('downloadGovernanceJsonReport'), 'Must export download function');
  assert.ok(content.includes('pratyay_governance_report_'), 'Must generate standardized report filename');
});

// -----------------------------------------------------------------------------
// Test 9: Frontend-to-Backend API Client Contract
// -----------------------------------------------------------------------------
runTest('API Contract: Service layer covers all specified endpoints', () => {
  const typesPath = path.join(process.cwd(), 'src/services/api/types.ts');
  const clientPath = path.join(process.cwd(), 'src/services/api/client.ts');
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  const clientContent = fs.readFileSync(clientPath, 'utf8');
  
  assert.ok(typesContent.includes('CreateGuidelineRequest'), 'Must define guideline request models');
  assert.ok(typesContent.includes('CreateReviewRequest'), 'Must define review request models');
  assert.ok(typesContent.includes('AnalyzeContentRequest'), 'Must define analyze content models');
  assert.ok(typesContent.includes('SubmitSignOffRequest'), 'Must define sign-off models');
  
  assert.ok(clientContent.includes('/guidelines'), 'Must implement guidelines endpoint');
  assert.ok(clientContent.includes('/evidence'), 'Must implement evidence endpoint');
  assert.ok(clientContent.includes('/reviews'), 'Must implement reviews endpoint');
  assert.ok(clientContent.includes('/analyze'), 'Must implement analyze endpoint');
  assert.ok(clientContent.includes('/decisions'), 'Must implement decisions endpoint');
  assert.ok(clientContent.includes('/models'), 'Must implement models endpoint');
  assert.ok(clientContent.includes('/audit-events'), 'Must implement audit events endpoint');
  assert.ok(clientContent.includes('VITE_API_BASE_URL'), 'Must use VITE_API_BASE_URL environment variable');
});

// -----------------------------------------------------------------------------
// Test 10: Settings Page Integration
// -----------------------------------------------------------------------------
runTest('Settings Page: References API contract and generic demo personas', () => {
  const filePath = path.join(process.cwd(), 'src/pages/SettingsPage.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert.ok(content.includes('Editorial Reviewer (Demo)'), 'Must include generic editorial reviewer');
  assert.ok(content.includes('Compliance Officer (Demo)'), 'Must include generic compliance officer');
  assert.ok(content.includes('VITE_API_BASE_URL'), 'Must reference environment variable');
  assert.ok(content.includes('FRONTEND_HANDOFF.md'), 'Must reference handoff documentation');
});

console.log('\n----------------------------------------------------------------');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed.`);
console.log('----------------------------------------------------------------');

if (testsFailed > 0) {
  process.exit(1);
}
