import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { GettingStartedItem } from '../../types';
import { Button } from '../common/Button';
import { 
  BookOpenCheck, 
  FileUp, 
  CheckCheck, 
  ArrowRight
} from 'lucide-react';

interface GettingStartedCardsProps {
  items: GettingStartedItem[];
}

export const GettingStartedCards: React.FC<GettingStartedCardsProps> = ({ items }) => {
  const navigate = useNavigate();

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <BookOpenCheck className="w-5 h-5 text-indigo-600" />;
      case 2:
        return <FileUp className="w-5 h-5 text-blue-600" />;
      case 3:
      default:
        return <CheckCheck className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Getting Started with Pratyay</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Workflow Guide
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the 3-step governance workflow to establish brand compliance across marketing drafts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/80">
                  {item.badge}
                </span>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                  {getStepIcon(item.stepNumber)}
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {item.title}
              </h3>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(item.route)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full justify-between"
              >
                {item.actionLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
