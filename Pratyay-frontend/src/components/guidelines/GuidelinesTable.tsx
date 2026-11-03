import React, { useState } from 'react';
import type { GuidelineRule, GuidelineCategory, GuidelineStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { 
  Search, 
  Edit3, 
  Power, 
  Trash2, 
  RotateCcw, 
  FileText,
  Tag,
  ArrowRight
} from 'lucide-react';

interface GuidelinesTableProps {
  rules: GuidelineRule[];
  onEdit: (rule: GuidelineRule) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

const CATEGORIES: Array<'ALL' | GuidelineCategory> = [
  'ALL',
  'Tone and Voice',
  'Terminology',
  'Required Wording',
  'Brand Facts',
  'Promotional Claims',
  'Accessibility',
];

export const GuidelinesTable: React.FC<GuidelinesTableProps> = ({
  rules,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | GuidelineCategory>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | GuidelineStatus>('ALL');

  // Filtering
  const filteredRules = rules.filter((rule) => {
    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || rule.status === selectedStatus;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      rule.name.toLowerCase().includes(query) ||
      rule.summary.toLowerCase().includes(query) ||
      rule.description.toLowerCase().includes(query) ||
      (rule.targetTerm && rule.targetTerm.toLowerCase().includes(query)) ||
      (rule.replacementTerm && rule.replacementTerm.toLowerCase().includes(query)) ||
      rule.category.toLowerCase().includes(query) ||
      rule.ruleType.toLowerCase().includes(query);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
  };

  const getCategoryBadgeClass = (category: GuidelineCategory) => {
    switch (category) {
      case 'Tone and Voice':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Terminology':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Required Wording':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Brand Facts':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Promotional Claims':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Accessibility':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, keywords, restricted terms..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Right: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-cat" className="text-xs font-medium text-slate-500">Category:</label>
            <select
              id="filter-cat"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'ALL' | GuidelineCategory)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-status" className="text-xs font-medium text-slate-500">Status:</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | GuidelineStatus)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Accessible Table Container */}
      <div 
        tabIndex={0} 
        role="region" 
        aria-label="Brand guidelines and rules" 
        className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">Directory of active and inactive brand guidelines and rulepacks</caption>
          <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="py-3.5 px-5">Guideline / Rule Name</th>
              <th scope="col" className="py-3.5 px-4">Category & Type</th>
              <th scope="col" className="py-3.5 px-5">Rule Summary</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4">Last Updated</th>
              <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                      <FileText className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">No guidelines match your filters</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {hasActiveFilters 
                        ? 'Try clearing search keywords or resetting status filters to see available rules.' 
                        : 'No brand guidelines created yet. Get started by adding your first rule.'}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      {hasActiveFilters ? (
                        <Button variant="secondary" size="sm" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" onClick={onAddNew}>
                          Add Guideline
                        </Button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr 
                  key={rule.id} 
                  className={`hover:bg-slate-50/80 transition-colors group ${
                    rule.status === 'Inactive' ? 'opacity-75 bg-slate-50/40' : ''
                  }`}
                >
                  {/* Guideline Name & Identifier */}
                  <th scope="row" className="py-3.5 px-5 font-normal">
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm">
                      {rule.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{rule.id}</span>
                      {rule.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500 font-sans italic truncate max-w-xs">{rule.notes}</span>
                        </>
                      )}
                    </div>
                  </th>

                  {/* Category & Rule Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadgeClass(rule.category)}`}>
                        {rule.category}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{rule.ruleType}</span>
                      </div>
                    </div>
                  </td>

                  {/* Summary & Target Term */}
                  <td className="py-3.5 px-5 max-w-md">
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">
                      {rule.summary}
                    </p>
                    {/* Target Term Highlight */}
                    {rule.targetTerm && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-semibold text-slate-500">
                          {rule.ruleType === 'Restricted Term' && 'Prohibited:'}
                          {rule.ruleType === 'Preferred Term' && 'Discouraged:'}
                          {rule.ruleType === 'Required Text' && 'Required:'}
                          {rule.ruleType === 'Factual Requirement' && 'Parameter:'}
                          {rule.ruleType === 'General Rule' && 'Target:'}
                        </span>
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] border border-slate-200">
                          {rule.targetTerm}
                        </code>
                        {rule.replacementTerm && (
                          <>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-semibold text-emerald-700">Use:</span>
                            <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] border border-emerald-200">
                              {rule.replacementTerm}
                            </code>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={rule.status} size="sm" />
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                    {rule.lastUpdated}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEdit(rule)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        title="Edit guideline"
                        aria-label={`Edit ${rule.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Toggle Active/Inactive */}
                      <button
                        type="button"
                        onClick={() => onToggleStatus(rule.id)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          rule.status === 'Active'
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={rule.status === 'Active' ? 'Deactivate rule' : 'Activate rule'}
                        aria-label={rule.status === 'Active' ? `Deactivate ${rule.name}` : `Activate ${rule.name}`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete guideline "${rule.name}"?`)) {
                            onDelete(rule.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete guideline"
                        aria-label={`Delete ${rule.name}`}
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

      {/* Table Footer */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-5">
        <span>Showing {filteredRules.length} of {rules.length} total guidelines</span>
        <span className="text-slate-400">Rules apply to all incoming campaign reviews</span>
      </div>
    </div>
  );
};
