import React from 'react';
import type { Finding, FindingSeverity, FindingStatus } from '../../types';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  ListFilter,
  Check,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface FindingsSummaryBarProps {
  findings: Finding[];
  selectedSeverity: 'ALL' | FindingSeverity;
  selectedStatus: 'ALL' | FindingStatus;
  onSelectSeverity: (severity: 'ALL' | FindingSeverity) => void;
  onSelectStatus: (status: 'ALL' | FindingStatus) => void;
  onResetFilters: () => void;
}

export const FindingsSummaryBar: React.FC<FindingsSummaryBarProps> = ({
  findings,
  selectedSeverity,
  selectedStatus,
  onSelectSeverity,
  onSelectStatus,
  onResetFilters,
}) => {
  // Live counts derived strictly from the actual findings
  const totalCount = findings.length;
  const highCount = findings.filter((f) => f.severity === 'High').length;
  const mediumCount = findings.filter((f) => f.severity === 'Medium').length;
  const lowCount = findings.filter((f) => f.severity === 'Low').length;
  const noticeCount = findings.filter((f) => f.severity === 'Notice').length;

  const openCount = findings.filter((f) => f.status === 'open').length;
  const acceptedCount = findings.filter((f) => f.status === 'accepted').length;
  const dismissedCount = findings.filter((f) => f.status === 'dismissed').length;
  const resolvedCount = findings.filter((f) => f.status === 'resolved').length;

  const hasFilter = selectedSeverity !== 'ALL' || selectedStatus !== 'ALL';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Findings */}
        <button
          type="button"
          onClick={() => onSelectSeverity('ALL')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedSeverity === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              Total Issues
            </span>
            <ListFilter className="w-3.5 h-3.5 opacity-70" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono">{totalCount}</div>
          <div className="text-[10px] opacity-75 mt-0.5">
            {openCount} Open • {acceptedCount + dismissedCount + resolvedCount} Handled
          </div>
        </button>

        {/* High Severity */}
        <button
          type="button"
          onClick={() => onSelectSeverity('High')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedSeverity === 'High'
              ? 'bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-300'
              : 'bg-rose-50/70 hover:bg-rose-100/70 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              High
            </span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-rose-950">{highCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Requires immediate action</div>
        </button>

        {/* Medium Severity */}
        <button
          type="button"
          onClick={() => onSelectSeverity('Medium')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedSeverity === 'Medium'
              ? 'bg-amber-700 text-white border-amber-700 shadow-xs ring-2 ring-amber-300'
              : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Medium
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-950">{mediumCount}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Tone & claims review</div>
        </button>

        {/* Low Severity */}
        <button
          type="button"
          onClick={() => onSelectSeverity('Low')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
            selectedSeverity === 'Low'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs ring-2 ring-blue-300'
              : 'bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              Low
            </span>
            <Info className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-950">{lowCount}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Stylistic suggestions</div>
        </button>

        {/* Notices */}
        <button
          type="button"
          onClick={() => onSelectSeverity('Notice')}
          className={`p-3 rounded-lg border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            selectedSeverity === 'Notice'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
              : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Notices
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-950">{noticeCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Supported & verified</div>
        </button>
      </div>

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-500 mr-1">Status Filter:</span>

          {(['ALL', 'open', 'accepted', 'dismissed', 'resolved'] as const).map((status) => {
            const count = 
              status === 'ALL' ? totalCount :
              status === 'open' ? openCount :
              status === 'accepted' ? acceptedCount :
              status === 'dismissed' ? dismissedCount : resolvedCount;

            const isSelected = selectedStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => onSelectStatus(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {status === 'ALL' && <span>All</span>}
                {status === 'open' && <AlertOctagon className="w-3 h-3 text-amber-500" />}
                {status === 'accepted' && <Check className="w-3 h-3 text-emerald-500" />}
                {status === 'dismissed' && <CheckCircle2 className="w-3 h-3 text-slate-400" />}
                {status === 'resolved' && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                <span className="capitalize">{status === 'ALL' ? 'All Statuses' : status}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
