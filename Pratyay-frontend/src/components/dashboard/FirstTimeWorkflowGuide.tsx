import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import {
  BookOpenCheck,
  PlusCircle,
  FileText,
  Cpu,
  SearchCheck,
  FileCheck2,
  Edit3,
  Download,
  UserCheck,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  route?: string;
  actionLabel?: string;
  badge?: string;
  icon: React.ReactNode;
}

export const FirstTimeWorkflowGuide: React.FC = () => {
  const navigate = useNavigate();

  const steps: WorkflowStep[] = [
    {
      step: 1,
      title: 'Add Brand Guidelines & Facts',
      description: 'Configure approved terminology, restricted phrases, tone requirements, and supporting brand facts with validity dates in the registry.',
      route: '/guidelines',
      actionLabel: 'Configure Guidelines',
      badge: 'Step 1: Standards',
      icon: <BookOpenCheck className="w-4 h-4 text-indigo-600" />,
    },
    {
      step: 2,
      title: 'Start a New Review',
      description: 'Initiate a new content review workspace by setting campaign context, content type, and choosing an applicable brand guideline pack.',
      route: '/reviews/new',
      actionLabel: 'Start Review',
      badge: 'Step 2: Workspace',
      icon: <PlusCircle className="w-4 h-4 text-blue-600" />,
    },
    {
      step: 3,
      title: 'Paste Content or Upload Document',
      description: 'Input raw marketing copy directly into the editor or upload supported document files (.txt, .docx, .pdf up to 5MB) with full text extraction.',
      route: '/reviews/new',
      actionLabel: 'Open Editor',
      badge: 'Step 3: Ingestion',
      icon: <FileText className="w-4 h-4 text-sky-600" />,
    },
    {
      step: 4,
      title: 'Select Model Target',
      description: 'Select an AI target model (Gemini 2.5 Flash, Pro, Claude 3.7, GPT-4o) with a clear indicator that the deterministic engine runs offline locally.',
      badge: 'Step 4: Engine Selection',
      icon: <Cpu className="w-4 h-4 text-purple-600" />,
    },
    {
      step: 5,
      title: 'Run Available Checks',
      description: 'Execute instant deterministic checks to evaluate prohibited ASCI superlatives, mandatory CCPA disclaimers, and registered claim benchmarks.',
      badge: 'Step 5: Automated Checks',
      icon: <SearchCheck className="w-4 h-4 text-emerald-600" />,
    },
    {
      step: 6,
      title: 'Review Findings & Verification',
      description: 'Inspect explainable findings distinguishing rule violations from factual claims categorized by evidence status: supported, missing, or expired.',
      badge: 'Step 6: Explainable Findings',
      icon: <FileCheck2 className="w-4 h-4 text-amber-600" />,
    },
    {
      step: 7,
      title: 'Edit Proposed Revision',
      description: 'Refine the proposed revision draft in the interactive editor or accept intent-preserving suggestions with a single click before submission.',
      badge: 'Step 7: Draft Revision',
      icon: <Edit3 className="w-4 h-4 text-teal-600" />,
    },
    {
      step: 8,
      title: 'Export Analysis as JSON',
      description: 'Export comprehensive audit provenance, findings severity breakdown, and claim verification records as a structured JSON report.',
      badge: 'Step 8: Governance Export',
      icon: <Download className="w-4 h-4 text-cyan-600" />,
    },
    {
      step: 9,
      title: 'Submit for Human Approval',
      description: 'Submit reviewed content for final editorial sign-off. Authorized human reviewers record their decision — Approve or Request Changes.',
      route: '/reviews',
      actionLabel: 'View Review Queue',
      badge: 'Step 9: Human Sign-Off',
      icon: <UserCheck className="w-4 h-4 text-rose-600" />,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 mb-1">
            <Sparkles className="w-3 h-3" />
            <span>First-Time Governance Guide</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Simple 9-Step Governance Workflow
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow these sequential steps to establish end-to-end brand governance from guideline creation to editorial sign-off.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/reviews/new')}
          leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
        >
          Start Your First Review
        </Button>
      </div>

      {/* Flexibility Notice Banner */}
      <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/70 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-amber-900">
            Setup is flexible: you do not need to configure every step before testing.
          </p>
          <p className="text-amber-800 text-[11px]">
            You can start a review right now with sample text to test deterministic checks; configuring brand guidelines and evidence expands rule coverage and claim verification.
          </p>
        </div>
      </div>

      {/* 9-Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {steps.map((item) => (
          <div
            key={item.step}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {item.badge}
                </span>
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                  {item.icon}
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                {item.title}
              </h3>

              <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.route && item.actionLabel && (
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate(item.route!)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
