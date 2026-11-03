import React, { useState } from 'react';
import type { BrandFactEvidence, EvidenceStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  FileCheck,
  RotateCcw,
  Info
} from 'lucide-react';

interface BrandFactsEvidenceSectionProps {
  facts: BrandFactEvidence[];
  onAddNew: () => void;
  onEdit: (fact: BrandFactEvidence) => void;
  onDelete: (id: string) => void;
}

const EVIDENCE_STATUS_FILTERS: Array<'ALL' | EvidenceStatus> = [
  'ALL',
  'Evidence Available',
  'Missing Evidence',
  'Expired Evidence',
  'Needs Review',
];

export const BrandFactsEvidenceSection: React.FC<BrandFactsEvidenceSectionProps> = ({
  facts,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | EvidenceStatus>('ALL');

  // Counts for summary cards
  const totalFacts = facts.length;
  const availableCount = facts.filter((f) => f.evidenceStatus === 'Evidence Available').length;
  const needsReviewCount = facts.filter((f) => f.evidenceStatus === 'Needs Review').length;
  const missingOrExpiredCount = facts.filter(
    (f) => f.evidenceStatus === 'Missing Evidence' || f.evidenceStatus === 'Expired Evidence'
  ).length;

  const filteredFacts = facts.filter((fact) => {
    const matchesStatus = selectedStatus === 'ALL' || fact.evidenceStatus === selectedStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      fact.claimName.toLowerCase().includes(query) ||
      fact.approvedStatement.toLowerCase().includes(query) ||
      fact.evidenceDescription.toLowerCase().includes(query) ||
      fact.sourceReference.toLowerCase().includes(query) ||
      (fact.notes && fact.notes.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Evidence Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Total Facts on File</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{totalFacts}</div>
          <p className="mt-1 text-xs text-slate-500">Registered product claims & specifications</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Evidence Available</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{availableCount}</div>
          <p className="mt-1 text-xs text-slate-500">Valid third-party lab & audit evidence</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Needs Review</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">{needsReviewCount}</div>
          <p className="mt-1 text-xs text-slate-500">Internal data awaiting external certification</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Missing / Expired</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{missingOrExpiredCount}</div>
          <p className="mt-1 text-xs text-slate-500">Requires renewal before campaign approval</p>
        </div>
      </div>

      {/* Governance Principle Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-indigo-950">
            Responsible AI & Evidence Governance Principle
          </p>
          <p className="text-indigo-800 leading-relaxed">
            Missing or expired evidence does <strong>not</strong> classify a claim as false. Rather, it flags that substantiation must be reviewed or updated by an authorized human reviewer before promotional material can be approved.
          </p>
        </div>
      </div>

      {/* Facts Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims, lab reports, dossiers..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="evidence-status-filter" className="text-xs font-medium text-slate-500">Status:</label>
              <select
                id="evidence-status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | EvidenceStatus)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {EVIDENCE_STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Fact & Evidence
            </Button>
          </div>
        </div>

        {/* Table */}
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Brand facts and supporting evidence" 
          className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <table className="w-full text-left border-collapse text-xs">
            <caption className="sr-only">Registry of approved brand facts, claims, and verified citations</caption>
            <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th scope="col" className="py-3.5 px-5">Claim / Fact Name</th>
                <th scope="col" className="py-3.5 px-5">Approved Statement</th>
                <th scope="col" className="py-3.5 px-5">Evidence & Source Reference</th>
                <th scope="col" className="py-3.5 px-4">Validity</th>
                <th scope="col" className="py-3.5 px-4">Evidence Status</th>
                <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">No fact records found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {hasActiveFilters 
                          ? 'Try adjusting your search query or status filter.' 
                          : 'No approved brand facts registered yet.'}
                      </p>
                      <div className="mt-4">
                        {hasActiveFilters ? (
                          <Button variant="secondary" size="sm" onClick={resetFilters}>
                            Reset Filters
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" onClick={onAddNew}>
                            Add Fact & Evidence
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFacts.map((fact) => (
                  <tr key={fact.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Name & ID */}
                    <th scope="row" className="py-3.5 px-5 font-normal">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                        {fact.claimName}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>{fact.id}</span>
                        {fact.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 font-sans italic truncate max-w-xs">{fact.notes}</span>
                          </>
                        )}
                      </div>
                    </th>

                    {/* Approved Statement */}
                    <td className="py-3.5 px-5 max-w-xs">
                      <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200/80">
                        "{fact.approvedStatement}"
                      </p>
                    </td>

                    {/* Evidence & Source */}
                    <td className="py-3.5 px-5 max-w-sm">
                      <p className="text-slate-700 line-clamp-2 leading-relaxed">
                        {fact.evidenceDescription}
                      </p>
                      <div className="mt-1 font-mono text-[10px] text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100 inline-block truncate max-w-xs">
                        Ref: {fact.sourceReference}
                      </div>
                    </td>

                    {/* Validity Dates */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {fact.validFrom || fact.expiryDate ? (
                        <div className="space-y-1 text-[11px]">
                          {fact.validFrom && (
                            <div className="flex items-center gap-1 text-slate-500">
                              <span className="text-[10px] text-slate-400">From:</span> {fact.validFrom}
                            </div>
                          )}
                          {fact.expiryDate && (
                            <div className={`flex items-center gap-1 ${
                              fact.evidenceStatus === 'Expired Evidence' ? 'text-rose-600 font-bold' : 'text-slate-600'
                            }`}>
                              <span className="text-[10px] text-slate-400">Exp:</span> {fact.expiryDate}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No expiry specified</span>
                      )}
                    </td>

                    {/* Evidence Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={fact.evidenceStatus} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(fact)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="Edit fact and evidence"
                          aria-label={`Edit ${fact.claimName}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${fact.claimName}"?`)) {
                              onDelete(fact.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete fact"
                          aria-label={`Delete ${fact.claimName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-5">
          <span>Showing {filteredFacts.length} of {facts.length} total brand facts & citations</span>
          <span className="text-slate-400">Evidence citations mapped during AI review analysis</span>
        </div>
      </div>
    </div>
  );
};
