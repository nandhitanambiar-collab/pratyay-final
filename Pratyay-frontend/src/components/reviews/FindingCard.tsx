import React, { useState } from 'react';
import type { Finding, FindingStatus, FindingSeverity, BrandFactEvidence } from '../../types';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Check, 
  X, 
  ArrowRight, 
  BookOpen, 
  FileCheck, 
  Sparkles,
  HelpCircle,
  FileQuestion,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  isSelected: boolean;
  linkedFacts?: BrandFactEvidence[];
  onSelect: () => void;
  onUpdateStatus: (status: FindingStatus, dismissReason?: string) => void;
  onApplySuggestion: (suggestedText: string, matchedText?: string) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isSelected,
  linkedFacts = [],
  onSelect,
  onUpdateStatus,
  onApplySuggestion,
}) => {
  const [showDismissInput, setShowDismissInput] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [showEvidenceDetails, setShowEvidenceDetails] = useState(false);

  const getSeverityBadge = (severity: FindingSeverity) => {
    switch (severity) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>High Severity</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Medium Severity</span>
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Low Severity</span>
          </span>
        );
      case 'Notice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notice / Substantiated</span>
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rule_violation':
        return 'Deterministic Rule Match';
      case 'terminology':
        return 'Brand Terminology';
      case 'required_text':
        return 'Mandatory Text Check';
      case 'factual_claim':
        return 'Claim Verification';
      default:
        return 'Informational Notice';
    }
  };

  const getEvidenceStatusBadge = (evidenceStatus: string) => {
    switch (evidenceStatus) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Supported by Registered Evidence</span>
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <History className="w-3 h-3 text-amber-600" />
            <span>Evidence Expired (Unverified)</span>
          </span>
        );
      case 'inconclusive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <HelpCircle className="w-3 h-3 text-purple-600" />
            <span>Inconclusive (Audit Pending)</span>
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <FileQuestion className="w-3 h-3 text-rose-600" />
            <span>Evidence Missing in Registry</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleDismissSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus('dismissed', dismissReason.trim() || 'Dismissed by reviewer');
    setShowDismissInput(false);
  };

  const isHandled = finding.status !== 'open';

  return (
    <div
      id={`finding-${finding.id}`}
      onClick={onSelect}
      className={`rounded-xl border transition-all p-4 sm:p-5 text-left cursor-pointer ${
        isSelected
          ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
          : isHandled
          ? 'bg-slate-50/70 border-slate-200 opacity-90'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      {/* Header: Severity, Type, Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {getSeverityBadge(finding.severity)}
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {getTypeLabel(finding.type)}
          </span>
          {getEvidenceStatusBadge(finding.evidenceStatus)}
        </div>

        {/* Current Finding Status Pill */}
        <div className="flex items-center gap-1.5">
          {finding.status === 'open' && (
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
              Open
            </span>
          )}
          {finding.status === 'accepted' && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Accepted</span>
            </span>
          )}
          {finding.status === 'dismissed' && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
              <X className="w-3 h-3 text-slate-500" />
              <span>Dismissed</span>
            </span>
          )}
          {finding.status === 'resolved' && (
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              <span>Resolved</span>
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 tracking-tight">
        {finding.title}
      </h3>

      {/* Matched Text Quote */}
      {finding.matchedText && (
        <div className="mt-2 flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
          <span className="text-slate-400 font-sans font-medium shrink-0">Matched text:</span>
          <span className="font-semibold text-slate-900 break-words">"{finding.matchedText}"</span>
        </div>
      )}

      {/* Plain Language Explanation */}
      <div className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white/90 p-3 rounded-lg border border-slate-100">
        <p>{finding.explanation}</p>
      </div>

      {/* Rule Citation */}
      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="font-medium text-slate-600">Standard Citation:</span>
        <span className="font-semibold text-slate-800 font-mono">{finding.ruleReference}</span>
      </div>

      {/* Linked Evidence Section if exists */}
      {linkedFacts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEvidenceDetails(!showEvidenceDetails);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              {showEvidenceDetails ? 'Hide Registry Evidence Details' : 'View Linked Registry Evidence'} ({linkedFacts.length})
            </span>
            {showEvidenceDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showEvidenceDetails && (
            <div className="mt-2 space-y-2">
              {linkedFacts.map((fact) => (
                <div key={fact.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{fact.claimName}</span>
                    <span className="font-mono text-[11px] text-slate-500">{fact.id}</span>
                  </div>
                  <p className="text-slate-600 italic">"{fact.approvedStatement}"</p>
                  <p className="text-slate-500 font-mono text-[11px]">Source: {fact.sourceReference}</p>
                  {fact.expiryDate && (
                    <p className="text-slate-500 text-[11px]">
                      Validity: {fact.validFrom || 'N/A'} through <strong className="font-semibold text-slate-700">{fact.expiryDate}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Revision Box */}
      {finding.suggestedRevision && (
        <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Suggested Revision</span>
            </span>
            <span className="text-[10px] text-blue-700">Intent-preserving replacement</span>
          </div>

          <div className="text-xs text-blue-950 font-medium bg-white/90 p-2.5 rounded-lg border border-blue-100 font-sans">
            {finding.suggestedRevision}
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApplySuggestion(finding.suggestedRevision!, finding.matchedText);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <span>Apply Suggestion to Revision Draft</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dismissal Reason Note if already dismissed */}
      {finding.status === 'dismissed' && finding.dismissReason && (
        <div className="mt-3 p-2 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">
          <strong className="font-semibold text-slate-700">Dismissal Reason: </strong>
          <span>{finding.dismissReason}</span>
        </div>
      )}

      {/* Reviewer Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Interactive Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {finding.status === 'open' ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus('accepted');
                }}
                className="px-2.5 py-1 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                title="Accept finding as a valid issue"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept Finding</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDismissInput(true);
                }}
                className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Dismiss finding with reason"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus('resolved');
                }}
                className="px-2.5 py-1 rounded-md font-medium text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Mark finding as resolved"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Resolved</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus('open');
              }}
              className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Reopen Finding
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-400 font-mono">{finding.id}</span>
      </div>

      {/* Dismiss Reason Form Modal/Inline */}
      {showDismissInput && (
        <form
          onSubmit={handleDismissSubmit}
          onClick={(e) => e.stopPropagation()}
          className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-2 animate-in fade-in duration-150"
        >
          <label htmlFor={`dismiss-reason-${finding.id}`} className="block text-xs font-semibold text-slate-700">
            Reason for Dismissing Finding:
          </label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {[
              'Contextually permitted',
              'Legal exception approved',
              'False positive in deterministic match',
              'Evidence under verification',
            ].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setDismissReason(quick)}
                className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
              >
                {quick}
              </button>
            ))}
          </div>
          <input
            id={`dismiss-reason-${finding.id}`}
            type="text"
            value={dismissReason}
            onChange={(e) => setDismissReason(e.target.value)}
            placeholder="Enter reason (e.g. Legal exception approved)..."
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:border-indigo-500 focus:outline-hidden"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDismissInput(false)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold bg-slate-800 text-white rounded hover:bg-slate-900"
            >
              Confirm Dismissal
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
