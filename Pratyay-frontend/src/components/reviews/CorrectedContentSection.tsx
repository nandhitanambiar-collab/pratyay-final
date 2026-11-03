import React from 'react';
import { 
  Sparkles, 
  Check, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  Info
} from 'lucide-react';
import { Button } from '../common/Button';
import type { Finding } from '../../types';

interface CorrectedContentSectionProps {
  originalText: string;
  workingDraftText: string;
  findings: Finding[];
  onApplySuggestion: (findingId: string, fix: string, match?: string) => void;
  onUpdateWorkingDraft: (newText: string) => void;
  onResetWorkingDraft: () => void;
}

export const CorrectedContentSection: React.FC<CorrectedContentSectionProps> = ({
  originalText,
  workingDraftText,
  findings,
  onApplySuggestion,
  onUpdateWorkingDraft,
  onResetWorkingDraft,
}) => {
  // Compute automated proposed draft by applying all available deterministic fixes to originalText
  const findingsWithFixes = findings.filter((f) => Boolean(f.suggestedRevision && f.matchedText));
  const findingsWithoutFixes = findings.filter((f) => !f.suggestedRevision || !f.matchedText);

  // Generate automated revision
  let automatedProposedText = originalText;
  findingsWithFixes.forEach((f) => {
    if (f.matchedText && f.suggestedRevision && automatedProposedText.includes(f.matchedText)) {
      automatedProposedText = automatedProposedText.replace(f.matchedText, f.suggestedRevision);
    }
  });

  const isWorkingDraftModified = workingDraftText !== originalText;

  const handleApplyAll = () => {
    onUpdateWorkingDraft(automatedProposedText);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Corrected Content & Automated Revision Proposals
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Based strictly on deterministic terminology rules, superlatives, and required wording checks. Final editorial authority and sign-off remain with authorized human reviewers.
            </p>
          </div>
        </div>

        {findingsWithFixes.length > 0 && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleApplyAll}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Apply All Suggested Corrections ({findingsWithFixes.length})
          </Button>
        )}
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Submitted Copy */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Original Submitted Copy
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
              Verbatim Submission
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs font-sans text-slate-800 leading-relaxed min-h-[140px] whitespace-pre-wrap border border-slate-200/60">
            {originalText}
          </div>
        </div>

        {/* Proposed / Working Revision */}
        <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-xs space-y-3 ring-1 ring-indigo-500/10">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Working Revision Draft (Editable)
            </span>
            {isWorkingDraftModified && (
              <button
                type="button"
                onClick={onResetWorkingDraft}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Original
              </button>
            )}
          </div>

          <textarea
            rows={5}
            value={workingDraftText}
            onChange={(e) => onUpdateWorkingDraft(e.target.value)}
            className="w-full p-3 bg-white rounded-lg text-xs font-sans text-slate-900 leading-relaxed min-h-[140px] border border-indigo-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            placeholder="Edit working revision copy..."
          />
        </div>
      </div>

      {/* Suggested Fixes Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Proposed Rule-Based Replacements ({findingsWithFixes.length})
        </h4>

        {findingsWithFixes.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 bg-white text-center text-xs text-slate-500">
            No rule-based automated substitutions found for this content.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {findingsWithFixes.map((f) => {
              const isApplied = Boolean(f.suggestedRevision && workingDraftText.includes(f.suggestedRevision));
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border bg-white shadow-xs transition-all ${
                    isApplied ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{f.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {f.ruleReference}
                        </span>
                        {isApplied && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Applied in Working Draft
                          </span>
                        )}
                      </div>

                      {/* Substitution diff preview */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5 text-rose-700 font-mono line-through bg-rose-50 px-2 py-1 rounded border border-rose-100">
                          <span>{f.matchedText}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          <span>{f.suggestedRevision}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {f.explanation}
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Button
                        type="button"
                        variant={isApplied ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isApplied}
                        onClick={() => f.suggestedRevision && onApplySuggestion(f.id, f.suggestedRevision, f.matchedText)}
                        leftIcon={isApplied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Sparkles className="w-3.5 h-3.5" />}
                      >
                        {isApplied ? 'Applied' : 'Apply Fix'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issues without Automated Fixes */}
      {findingsWithoutFixes.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Findings Requiring Human Editorial Action ({findingsWithoutFixes.length})
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
              No Automated Fix Available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {findingsWithoutFixes.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-slate-900">{f.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {f.ruleReference}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    Manual Resolution Needed
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {f.explanation}
                </p>

                <div className="p-2 rounded bg-white border border-amber-200/60 text-slate-500 text-[11px] flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    No automated suggestion available for this rule. An authorized reviewer must substantiate evidence or rewrite manually.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
