import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReviews } from '../hooks/useReviews';
import { useFindings } from '../hooks/useFindings';
import { useGuidelines } from '../hooks/useGuidelines';
import { ReviewDetailsHeader } from '../components/reviews/ReviewDetailsHeader';
import { FindingsSummaryBar } from '../components/reviews/FindingsSummaryBar';
import { DraftTextPane } from '../components/reviews/DraftTextPane';
import { ExplainableFindingsList } from '../components/reviews/ExplainableFindingsList';
import { CorrectedContentSection } from '../components/reviews/CorrectedContentSection';
import { ClaimVerificationSection } from '../components/reviews/ClaimVerificationSection';
import { ToneAnalysisSection } from '../components/reviews/ToneAnalysisSection';
import { ReviewSignOffModal, type SignOffMode } from '../components/reviews/ReviewSignOffModal';
import { Button } from '../components/common/Button';
import type { FindingSeverity, FindingStatus } from '../types';
import { 
  FileSearch, 
  ArrowLeft, 
  Check, 
  X,
  Columns,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';

type ReviewInspectionTab = 'editor' | 'corrections' | 'claims' | 'tone';

export const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { 
    getReviewById, 
    approveReview, 
    requestChanges, 
    resubmitRevision 
  } = useReviews();

  const { 
    getFindingsForReview, 
    getWorkingDraft, 
    setWorkingDraft, 
    applySuggestionToWorkingDraft, 
    updateFindingStatus, 
    resetFindingsForReview 
  } = useFindings();

  const { guidelines, factsEvidence } = useGuidelines();

  const [activeTab, setActiveTab] = useState<ReviewInspectionTab>('editor');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | FindingSeverity>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | FindingStatus>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [signOffMode, setSignOffMode] = useState<SignOffMode>('approve');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const review = id ? getReviewById(id) : undefined;

  // Derive findings for this review
  const findings = useMemo(() => {
    if (!review) return [];
    return getFindingsForReview(review);
  }, [review, getFindingsForReview]);

  // Derive working draft
  const workingDraft = useMemo(() => {
    if (!review) return '';
    return getWorkingDraft(review.id, review.draftText);
  }, [review, getWorkingDraft]);

  // Filtered findings for display
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchesSeverity = selectedSeverity === 'ALL' || f.severity === selectedSeverity;
      const matchesStatus = selectedStatus === 'ALL' || f.status === selectedStatus;
      return matchesSeverity && matchesStatus;
    });
  }, [findings, selectedSeverity, selectedStatus]);

  // Metrics for tabs
  const fixableFindingsCount = useMemo(() => {
    return findings.filter((f) => Boolean(f.suggestedRevision && f.matchedText)).length;
  }, [findings]);

  const claimFindingsCount = useMemo(() => {
    return findings.filter((f) => f.type === 'factual_claim' || f.evidenceStatus !== 'not_applicable').length;
  }, [findings]);

  const toneRulesCount = useMemo(() => {
    return guidelines.filter((r) => r.category === 'Tone and Voice' && r.status === 'Active').length;
  }, [guidelines]);

  // Handle finding selection and smooth scroll to card
  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    // Smoothly scroll finding card into view
    setTimeout(() => {
      const el = document.getElementById(`finding-${findingId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleApplySuggestion = (
    findingId: string, 
    suggestedText: string, 
    matchedText?: string
  ) => {
    if (!review) return;
    applySuggestionToWorkingDraft(
      review.id,
      findingId,
      review.draftText,
      suggestedText,
      matchedText
    );
    showToast('Applied suggestion to Working Revision Draft.');
  };

  const handleUpdateStatus = (
    findingId: string, 
    status: FindingStatus, 
    dismissReason?: string
  ) => {
    if (!review) return;
    updateFindingStatus(review.id, findingId, status, dismissReason);
    if (status === 'accepted') {
      showToast('Finding marked as accepted.');
    } else if (status === 'dismissed') {
      showToast('Finding dismissed.');
    } else if (status === 'resolved') {
      showToast('Finding marked as resolved.');
    } else {
      showToast('Finding reopened.');
    }
  };

  const handleOpenSignOff = (mode: SignOffMode) => {
    setSignOffMode(mode);
    setIsSignOffModalOpen(true);
  };

  const handleApprove = (reviewerName: string, comment?: string) => {
    if (!review) return;
    approveReview(review.id, reviewerName, comment);
    showToast(`Content approved for publication by ${reviewerName}.`);
  };

  const handleRequestChanges = (reviewerName: string, reason: string) => {
    if (!review) return;
    requestChanges(review.id, reviewerName, reason);
    showToast(`Changes requested by ${reviewerName}. Draft returned to creator.`);
  };

  const handleResubmitRevision = (
    newText: string,
    changeSummary?: string,
    submitterName?: string
  ) => {
    if (!review) return;
    resubmitRevision(review.id, newText, changeSummary, submitterName);
    showToast(`Resubmitted Version ${(review.activeRevisionVersion || 1) + 1} for review.`);
  };

  const handleResetFindings = () => {
    if (!review) return;
    if (window.confirm('Reset all finding decisions and working revisions for this review?')) {
      resetFindingsForReview(review.id);
      showToast('Finding decisions and revision drafts reset to initial state.');
    }
  };

  const handleResetWorkingDraft = () => {
    if (!review) return;
    if (window.confirm('Discard revision edits and reset back to verbatim original?')) {
      setWorkingDraft(review.id, review.draftText);
      showToast('Working draft reset to original submitted text.');
    }
  };

  // 1. Not Found State
  if (!review) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <FileSearch className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Review Record Not Found
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We could not locate a content review with ID <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-xs">{id}</code>. It may have been deleted, or the address may be incorrect.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/reviews')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Content Reviews
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Review Header Banner */}
      <ReviewDetailsHeader
        review={review}
        onOpenSignOff={handleOpenSignOff}
        onResetFindings={handleResetFindings}
      />

      {/* Review Sign-Off Decision Dialog Modal */}
      <ReviewSignOffModal
        isOpen={isSignOffModalOpen}
        initialMode={signOffMode}
        review={review}
        findings={findings}
        workingDraftText={workingDraft}
        onClose={() => setIsSignOffModalOpen(false)}
        onApprove={handleApprove}
        onRequestChanges={handleRequestChanges}
        onResubmitRevision={handleResubmitRevision}
      />

      {/* Findings Metrics Summary & Filters Bar */}
      <FindingsSummaryBar
        findings={findings}
        selectedSeverity={selectedSeverity}
        selectedStatus={selectedStatus}
        onSelectSeverity={setSelectedSeverity}
        onSelectStatus={setSelectedStatus}
        onResetFilters={() => {
          setSelectedSeverity('ALL');
          setSelectedStatus('ALL');
        }}
      />

      {/* Navigation Tabs for Dedicated Inspection Sections */}
      <div className="border-b border-slate-200 bg-white rounded-xl px-2 shadow-xs">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Review Inspection Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-3 border-b-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'editor'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>All Findings & Split Editor</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
              {findings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('corrections')}
            className={`py-3 px-3 border-b-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'corrections'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Proposed Corrections</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-mono">
              {fixableFindingsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            className={`py-3 px-3 border-b-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'claims'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Claim Verification</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-mono">
              {claimFindingsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tone')}
            className={`py-3 px-3 border-b-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'tone'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Brand Tone & Voice</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-800 font-mono">
              {toneRulesCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab 1: All Findings & Split-Pane Editor */}
      {activeTab === 'editor' && (
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Submitted & Working Draft Text (5 cols on lg) */}
          <section 
            className="lg:col-span-5 h-[calc(100vh-280px)] min-h-[500px] sticky top-6"
            aria-label="Marketing draft text editor and viewer"
          >
            <DraftTextPane
              originalText={review.draftText}
              workingDraftText={workingDraft}
              findings={findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={handleSelectFinding}
              onUpdateWorkingDraft={(text) => setWorkingDraft(review.id, text)}
              onResetWorkingDraft={handleResetWorkingDraft}
            />
          </section>

          {/* Right Pane: Explainable Findings List (7 cols on lg) */}
          <section 
            className="lg:col-span-7 space-y-4"
            aria-label="Explainable governance findings and citations"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Explainable Governance Findings
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredFindings.length} of {findings.length}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Select finding or highlight to cross-reference
              </div>
            </div>

            <ExplainableFindingsList
              findings={findings}
              filteredFindings={filteredFindings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={handleSelectFinding}
              onUpdateStatus={handleUpdateStatus}
              onApplySuggestion={handleApplySuggestion}
              onResetFilters={() => {
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
              }}
            />
          </section>
        </main>
      )}

      {/* Tab 2: Dedicated Corrected Content Section */}
      {activeTab === 'corrections' && (
        <CorrectedContentSection
          originalText={review.draftText}
          workingDraftText={workingDraft}
          findings={findings}
          onApplySuggestion={handleApplySuggestion}
          onUpdateWorkingDraft={(text) => setWorkingDraft(review.id, text)}
          onResetWorkingDraft={handleResetWorkingDraft}
        />
      )}

      {/* Tab 3: Dedicated Claim Verification Section */}
      {activeTab === 'claims' && (
        <ClaimVerificationSection
          review={review}
          findings={findings}
          facts={factsEvidence}
        />
      )}

      {/* Tab 4: Dedicated Brand Tone Section */}
      {activeTab === 'tone' && (
        <ToneAnalysisSection
          review={review}
          rules={guidelines}
          findings={findings}
        />
      )}
    </div>
  );
};
