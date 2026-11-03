import React from 'react';
import type { Finding, FindingStatus } from '../../types';
import { useGuidelines } from '../../hooks/useGuidelines';
import { FindingCard } from './FindingCard';
import { CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface ExplainableFindingsListProps {
  findings: Finding[];
  filteredFindings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  onUpdateStatus: (findingId: string, status: FindingStatus, dismissReason?: string) => void;
  onApplySuggestion: (findingId: string, suggestedText: string, matchedText?: string) => void;
  onResetFilters: () => void;
}

export const ExplainableFindingsList: React.FC<ExplainableFindingsListProps> = ({
  findings,
  filteredFindings,
  selectedFindingId,
  onSelectFinding,
  onUpdateStatus,
  onApplySuggestion,
  onResetFilters,
}) => {
  const { factsEvidence } = useGuidelines();

  return (
    <div className="space-y-4">
      {/* Responsible AI & Evidence Governance Notice */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            Explainable Governance Standard
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Issues and claim verification statuses are identified deterministically against configured brand guidelines and registered evidence. 
            <strong className="font-medium text-slate-700"> Missing or expired evidence indicates lack of verification in the current registry, not falsity.</strong> Final authorization rests exclusively with the human reviewer.
          </p>
        </div>
      </div>

      {/* Findings Cards List */}
      {findings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            No Governance Issues Detected
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The submitted copy passed all deterministic restricted-term, terminology, and registered claim verification checks.
          </p>
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            No Findings Match Current Filters
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try resetting your severity or status filters to view all {findings.length} findings.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const linkedFacts = finding.evidenceIds
              ? factsEvidence.filter((fact) => finding.evidenceIds!.includes(fact.id))
              : [];

            return (
              <FindingCard
                key={finding.id}
                finding={finding}
                isSelected={selectedFindingId === finding.id}
                linkedFacts={linkedFacts}
                onSelect={() => onSelectFinding(finding.id)}
                onUpdateStatus={(status, reason) => onUpdateStatus(finding.id, status, reason)}
                onApplySuggestion={(suggestedText, matchedText) =>
                  onApplySuggestion(finding.id, suggestedText, matchedText)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
