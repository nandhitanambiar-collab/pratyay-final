import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { PlusCircle, ShieldCheck, FileText, ArrowRight } from 'lucide-react';

interface WelcomeBannerProps {
  reviewCount?: number;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ reviewCount = 0 }) => {
  const navigate = useNavigate();

  if (reviewCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Heading & Message */}
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Intelligent Brand Governance Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              Welcome to Pratyay
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              No reviews yet. Start your first brand compliance review to check content against your brand guidelines and available evidence.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Add your brand guidelines and supporting evidence to improve your review results.</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/guidelines')}
              leftIcon={<FileText className="w-4 h-4 text-slate-500" />}
            >
              Add Guidelines & Evidence
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/reviews/new')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Your First Review
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Titles & Context */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Intelligent Brand Governance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Brand Governance Overview
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Review content against your approved brand standards. Pratyay combines deterministic checks for strict rules with AI-assisted analysis for tone and evidence-aware claims, keeping final approval under human control.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Active Standard: <strong className="font-medium text-slate-700">Enterprise Standard v2.4</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>ASCI & CCPA Substantiation Pack Active</span>
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/guidelines')}
            leftIcon={<FileText className="w-4 h-4 text-slate-500" />}
          >
            Brand Guidelines
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/reviews/new')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Review New Content
          </Button>
        </div>
      </div>
    </div>
  );
};
