import React, { useState, useEffect } from 'react';
import type { ReviewItem, Finding } from '../../types';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  FileUp, 
  X, 
  ShieldCheck, 
  Sparkles,
  AlertOctagon
} from 'lucide-react';

export type SignOffMode = 'approve' | 'request_changes' | 'resubmit';

interface ReviewSignOffModalProps {
  isOpen: boolean;
  initialMode: SignOffMode;
  review: ReviewItem;
  findings: Finding[];
  workingDraftText: string;
  onClose: () => void;
  onApprove: (reviewerName: string, comment?: string) => void;
  onRequestChanges: (reviewerName: string, reason: string) => void;
  onResubmitRevision: (newText: string, changeSummary?: string, submitterName?: string) => void;
}

const DEMO_REVIEWERS = [
  { name: 'Editorial Reviewer (Demo)', role: 'Lead Editorial Sign-Off' },
  { name: 'Compliance Officer (Demo)', role: 'Regulatory & Claim Substantiation' },
  { name: 'Technical Specialist (Demo)', role: 'Technical Collateral Review' },
];

interface ReviewSignOffInnerProps {
  initialMode: SignOffMode;
  review: ReviewItem;
  findings: Finding[];
  workingDraftText: string;
  onClose: () => void;
  onApprove: (reviewerName: string, comment?: string) => void;
  onRequestChanges: (reviewerName: string, reason: string) => void;
  onResubmitRevision: (newText: string, changeSummary?: string, submitterName?: string) => void;
}

const ReviewSignOffInner: React.FC<ReviewSignOffInnerProps> = ({
  initialMode,
  review,
  findings,
  workingDraftText,
  onClose,
  onApprove,
  onRequestChanges,
  onResubmitRevision,
}) => {
  const [mode, setMode] = useState<SignOffMode>(initialMode);
  const [selectedReviewer, setSelectedReviewer] = useState(DEMO_REVIEWERS[0].name);
  const [comment, setComment] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openFindings = findings.filter((f) => f.status === 'open');
  const highOpenCount = openFindings.filter((f) => f.severity === 'High').length;
  const isRevisionModified = workingDraftText.trim() !== review.draftText.trim();
  const nextVersion = (review.activeRevisionVersion || 1) + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'approve') {
      if (!approvalConfirmed) {
        setErrorMsg('You must check the confirmation acknowledgment to proceed with human approval.');
        return;
      }
      if (highOpenCount > 0 && !comment.trim()) {
        setErrorMsg(
          `There are ${highOpenCount} high-severity finding(s) still open. You must provide an explanation in the approval notes to approve anyway.`
        );
        return;
      }
      onApprove(selectedReviewer, comment.trim() || undefined);
      onClose();
    } else if (mode === 'request_changes') {
      if (!comment.trim()) {
        setErrorMsg('A detailed reason is required when requesting changes.');
        return;
      }
      onRequestChanges(selectedReviewer, comment.trim());
      onClose();
    } else if (mode === 'resubmit') {
      onResubmitRevision(
        workingDraftText,
        changeSummary.trim() || `Resubmitted as Version ${nextVersion}`,
        selectedReviewer
      );
      onClose();
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden text-left"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Human Editorial Sign-Off
            </span>
            <StatusBadge status={review.status} size="sm" />
          </div>
          <h2 id="signoff-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {review.campaignTitle}
          </h2>
          <p className="text-xs text-slate-500">
            ID: <span className="font-mono text-slate-600">{review.id}</span> • Pack: {review.brandPackName}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Mode Switcher Tabs */}
      <div className="px-5 sm:px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 mr-1">Decision Action:</span>

        <button
          type="button"
          onClick={() => setMode('approve')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'approve'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Approve Content</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('request_changes')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'request_changes'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Request Changes</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('resubmit')}
          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'resubmit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Resubmit Revision</span>
          {isRevisionModified && <span className="w-2 h-2 rounded-full bg-blue-300"></span>}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        {/* Findings Summary Callout */}
        <div className="p-3.5 rounded-xl border text-xs flex items-start gap-3 bg-slate-50 border-slate-200 text-slate-700">
          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">Governance Findings Summary</span>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                {openFindings.length} open issue{openFindings.length !== 1 ? 's' : ''} remaining
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Automated rule checks provide decision support; final authority rests with the authorized human editor.
            </p>
            {highOpenCount > 0 && mode === 'approve' && (
              <div className="mt-1 flex items-center gap-1 text-rose-700 font-semibold text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Warning: {highOpenCount} high-severity issue(s) are currently open.</span>
              </div>
            )}
          </div>
        </div>

        {/* Demo Reviewer Persona Selector */}
        <div className="space-y-1.5">
          <label htmlFor="reviewer-persona" className="block text-xs font-semibold text-slate-700">
            Signing Off As (Demo Persona):
          </label>
          <div className="relative">
            <select
              id="reviewer-persona"
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {DEMO_REVIEWERS.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name} — {r.role}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-slate-400">
            *Demo identity simulation only. Real role-based access control and production authentication are not yet connected.
          </p>
        </div>

        {/* Mode-Specific Content & Inputs */}
        {mode === 'approve' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="approval-comment" className="block text-xs font-semibold text-slate-700">
                Approval Notes or Editorial Comments (Optional):
              </label>
              <textarea
                id="approval-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="e.g. Verified clinical trial credentials and approved educational positioning..."
                className="w-full p-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-hidden font-sans"
              />
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-emerald-950 font-medium">
                <input
                  type="checkbox"
                  checked={approvalConfirmed}
                  onChange={(e) => setApprovalConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>
                  I confirm that I have personally inspected this marketing copy and governance findings, and hereby grant <strong>human editorial approval</strong> for publication.
                </span>
              </label>
            </div>
          </div>
        )}

        {mode === 'request_changes' && (
          <div className="space-y-2">
            <label htmlFor="change-reason" className="block text-xs font-semibold text-slate-700">
              Reason for Change Request <span className="text-rose-600">*</span>:
            </label>
            <textarea
              id="change-reason"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
              placeholder="State clearly what needs to be revised (e.g. Please replace unbacked hair-loss claims with qualified cosmetic language and attach updated laboratory test dossiers)..."
              className="w-full p-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-hidden font-sans"
            />
            <p className="text-[11px] text-slate-500">
              This comment will be attached to the review, returned to the content creator, and recorded in the audit trail.
            </p>
          </div>
        )}

        {mode === 'resubmit' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Resubmitting as Revision Version {nextVersion}</span>
              </div>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                The current Working Revision Draft will become the active submitted copy for brand review. The original submitted text (Version 1) will be permanently preserved in the audit record.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="change-summary" className="block text-xs font-semibold text-slate-700">
                Summary of Revisions Made (Optional):
              </label>
              <input
                id="change-summary"
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Applied approved terminology and removed unsubstantiated claims..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Working text preview */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Text to be Submitted for Version {nextVersion}:
              </span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 max-h-32 overflow-y-auto font-mono italic">
                "{workingDraftText}"
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {mode === 'approve' && (
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!approvalConfirmed}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                Confirm Editorial Approval
              </Button>
            )}

            {mode === 'request_changes' && (
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!comment.trim()}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
                className="bg-amber-600 hover:bg-amber-700 border-amber-600"
              >
                Confirm Change Request
              </Button>
            )}

            {mode === 'resubmit' && (
              <Button
                variant="primary"
                size="sm"
                type="submit"
                leftIcon={<FileUp className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 border-blue-600"
              >
                Resubmit Version {nextVersion}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export const ReviewSignOffModal: React.FC<ReviewSignOffModalProps> = ({
  isOpen,
  initialMode,
  review,
  findings,
  workingDraftText,
  onClose,
  onApprove,
  onRequestChanges,
  onResubmitRevision,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signoff-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
    >
      <ReviewSignOffInner
        key={`${review.id}-${initialMode}`}
        initialMode={initialMode}
        review={review}
        findings={findings}
        workingDraftText={workingDraftText}
        onClose={onClose}
        onApprove={onApprove}
        onRequestChanges={onRequestChanges}
        onResubmitRevision={onResubmitRevision}
      />
    </div>
  );
};
