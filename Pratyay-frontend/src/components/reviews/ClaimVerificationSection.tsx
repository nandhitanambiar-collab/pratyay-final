import React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Calendar, 
  UserCheck, 
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReviewItem, Finding, BrandFactEvidence } from '../../types';

interface ClaimVerificationSectionProps {
  review: ReviewItem;
  findings: Finding[];
  facts?: BrandFactEvidence[];
}

export const ClaimVerificationSection: React.FC<ClaimVerificationSectionProps> = ({
  findings,
  facts = [],
}) => {
  // Factual claim findings
  const claimFindings = findings.filter(
    (f) => f.type === 'factual_claim' || f.evidenceStatus !== 'not_applicable'
  );

  return (
    <div className="space-y-6">
      {/* Responsible AI Callout Notice */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-950 flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-blue-900 text-sm">
            Factual Claim Verification & Substantiation Protocol
          </h3>
          <p className="leading-relaxed text-blue-800">
            <strong>Core Responsible AI Principle:</strong> An unverified or expired claim is classified as <em>Unsubstantiated</em> or <em>Needs Human Review</em>, <strong>never as false</strong> solely due to lack of recorded evidence. Final approval authority resides with authorized compliance reviewers.
          </p>
        </div>
      </div>

      {/* Claim Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detected Factual Claims ({claimFindings.length})
          </h4>
          <Link
            to="/guidelines?tab=facts"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Manage Evidence Registry</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {claimFindings.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No unverified factual claims detected</p>
            <p className="text-[11px] text-slate-400">
              This marketing text does not contain high-risk statistics, clinical percentages, or superlative market leadership assertions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {claimFindings.map((f) => {
              // Match with facts if any
              const matchedFact = facts.find(
                (fact) =>
                  f.evidenceIds?.includes(fact.id) ||
                  (f.matchedText && fact.approvedStatement.toLowerCase().includes(f.matchedText.toLowerCase()))
              );

              // Status badge styling
              let statusLabel = 'Unsubstantiated';
              let statusBg = 'bg-amber-50 text-amber-800 border-amber-200';
              let StatusIcon = AlertCircle;

              if (f.evidenceStatus === 'supported') {
                statusLabel = 'Supported by Evidence';
                statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                StatusIcon = ShieldCheck;
              } else if (f.evidenceStatus === 'expired') {
                statusLabel = 'Evidence Expired';
                statusBg = 'bg-rose-50 text-rose-800 border-rose-200';
                StatusIcon = Clock;
              } else if (f.evidenceStatus === 'inconclusive') {
                statusLabel = 'Inconclusive Dossier';
                statusBg = 'bg-purple-50 text-purple-800 border-purple-200';
                StatusIcon = HelpCircle;
              }

              return (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{f.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${statusBg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
                        "{f.matchedText || f.title}"
                      </p>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center gap-1 shrink-0 border border-slate-200">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Human Verification Required</span>
                    </div>
                  </div>

                  {/* Plain Language Explanation */}
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-slate-800">Governance Evaluation: </span>
                    {f.explanation}
                  </div>

                  {/* Evidence Dossier Metadata */}
                  <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">Source Dossier:</span>
                      <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-slate-800">
                        {matchedFact ? matchedFact.sourceReference : f.ruleReference}
                      </code>
                    </div>

                    {matchedFact && (
                      <div className="flex items-center gap-3">
                        {matchedFact.validFrom && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            Valid: {matchedFact.validFrom} {matchedFact.expiryDate ? `to ${matchedFact.expiryDate}` : ''}
                          </span>
                        )}
                        {matchedFact.evidenceStatus === 'Expired Evidence' && (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Expired Dossier
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
