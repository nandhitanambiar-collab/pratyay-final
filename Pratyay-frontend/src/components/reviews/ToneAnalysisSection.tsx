import React from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReviewItem, Finding, GuidelineRule } from '../../types';

interface ToneAnalysisSectionProps {
  review: ReviewItem;
  rules?: GuidelineRule[];
  findings: Finding[];
}

export const ToneAnalysisSection: React.FC<ToneAnalysisSectionProps> = ({
  rules = [],
  findings,
}) => {
  // Active tone & voice rules from guidelines
  const toneRules = rules.filter(
    (r) => r.category === 'Tone and Voice' && r.status === 'Active'
  );

  // Tone-specific findings
  const toneFindings = findings.filter(
    (f) => f.type === 'rule_violation' && f.ruleReference?.toLowerCase().includes('tone')
  );

  return (
    <div className="space-y-6">
      {/* Honest Status Notice regarding Backend AI service */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <Cpu className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-amber-900 text-sm">
              AI Tone Analysis Service Status: Pending Backend Integration
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-medium text-[10px]">
              Offline Frontend Phase
            </span>
          </div>
          <p className="leading-relaxed text-amber-800">
            AI tone analysis not available yet. Automated sentiment and brand tone scoring require the backend AI service (planned for Python/FastAPI integration). In this offline demo, applicable brand voice guidelines and deterministic stylistic rules are evaluated below.
          </p>
        </div>
      </div>

      {/* Brand Tone Guidelines in Effect */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Active Brand Tone & Voice Standards ({toneRules.length})</span>
          </h4>
          <Link
            to="/guidelines"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Configure Tone Guidelines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {toneRules.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 bg-white text-center text-xs text-slate-500">
            No active tone & voice rules configured in the Brand Guidelines registry.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {toneRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rule.name}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] border border-indigo-100">
                    {rule.id}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {rule.summary}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Enforced during review evaluation</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tone Findings if any */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Detected Tone & Stylistic Findings ({toneFindings.length})
        </h4>

        {toneFindings.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
            <p className="font-semibold text-slate-700">No tone violations flagged by deterministic checks</p>
            <p className="text-[11px] text-slate-400">
              The copy maintains standard promotional syntax without hyperbole flags. Nuanced tone scoring will activate with the backend LLM service.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {toneFindings.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-bold text-slate-900">{f.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {f.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
