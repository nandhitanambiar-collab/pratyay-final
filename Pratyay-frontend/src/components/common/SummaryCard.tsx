import React from 'react';
import type { SummaryMetric } from '../../types';
import { FileCheck2, Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface SummaryCardProps {
  metric: SummaryMetric;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ metric }) => {
  const getIcon = () => {
    switch (metric.iconName) {
      case 'total':
        return {
          icon: <FileCheck2 className="w-5 h-5 text-indigo-600" aria-hidden="true" />,
          bg: 'bg-indigo-50 border-indigo-100',
        };
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5 text-blue-600" aria-hidden="true" />,
          bg: 'bg-blue-50 border-blue-100',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />,
          bg: 'bg-amber-50 border-amber-100',
        };
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
          bg: 'bg-emerald-50 border-emerald-100',
        };
      default:
        return {
          icon: <TrendingUp className="w-5 h-5 text-slate-600" aria-hidden="true" />,
          bg: 'bg-slate-50 border-slate-200',
        };
    }
  };

  const getPillStyle = () => {
    switch (metric.changeType) {
      case 'positive':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'negative':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      case 'neutral':
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const iconConfig = getIcon();

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 hover:shadow-sm hover:border-slate-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {metric.title}
        </span>
        <div className={`p-2 rounded-lg border ${iconConfig.bg}`}>
          {iconConfig.icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
          {metric.value}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPillStyle()}`}>
          {metric.change}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500 line-clamp-1">
        {metric.description}
      </p>
    </div>
  );
};
