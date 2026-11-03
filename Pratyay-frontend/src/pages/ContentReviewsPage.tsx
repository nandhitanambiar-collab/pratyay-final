import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReviews } from '../hooks/useReviews';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import type { ReviewStatus, ContentType } from '../types';
import { 
  Plus, 
  Search, 
  FileCheck2, 
  Clock, 
  AlertTriangle, 
  FileEdit, 
  Trash2, 
  Edit3, 
  Send, 
  RotateCcw, 
  X, 
  Check, 
  Tag, 
  Layers,
  FileSearch
} from 'lucide-react';

const STATUS_FILTERS: Array<'ALL' | ReviewStatus> = [
  'ALL',
  'Draft',
  'In Review',
  'Needs Changes',
  'Approved',
];

export const ContentReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { reviews, submitReview, deleteReview } = useReviews();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ReviewStatus>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | ContentType>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(() => {
    if (location.state && (location.state as { flashMessage?: string }).flashMessage) {
      return (location.state as { flashMessage: string }).flashMessage;
    }
    return null;
  });

  // Auto-dismiss toast and clean history state
  useEffect(() => {
    if (toastMessage) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Summary Metrics
  const totalSubmissions = reviews.length;
  const draftCount = reviews.filter((r) => r.status === 'Draft').length;
  const inReviewCount = reviews.filter((r) => r.status === 'In Review').length;
  const needsChangesCount = reviews.filter((r) => r.status === 'Needs Changes').length;
  const approvedCount = reviews.filter((r) => r.status === 'Approved').length;

  // Filtered reviews
  const filteredReviews = reviews.filter((item) => {
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesType = selectedType === 'ALL' || item.contentType === selectedType;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.campaignTitle.toLowerCase().includes(query) ||
      (item.draftText && item.draftText.toLowerCase().includes(query)) ||
      item.submittedBy.name.toLowerCase().includes(query) ||
      (item.campaignContext && item.campaignContext.toLowerCase().includes(query)) ||
      item.brandPackName.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query);

    return matchesStatus && matchesType && matchesSearch;
  });

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'ALL' || selectedType !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
  };

  const handleQuickSubmit = (id: string, title: string) => {
    submitReview(id);
    showToast(`Submitted "${title}" for brand governance review.`);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete draft "${title}"?`)) {
      deleteReview(id);
      showToast(`Deleted "${title}".`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Review Workspace & Submission</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              Content Reviews
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Prepare, submit, and manage marketing copy for brand governance review. Content drafts are queued for automated rule checks, claim verification, and human editorial approval.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Active Reviews: <strong className="font-medium text-slate-700">{inReviewCount} In Review</strong></span>
              </span>
              <span className="text-slate-300">•</span>
              <span>{draftCount} Private Draft{draftCount !== 1 ? 's' : ''}</span>
              <span className="text-slate-300">•</span>
              <span>{approvedCount} Approved Campaigns</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/reviews/new')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Content
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-label="Review Submission Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Submissions */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Total Submissions</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{totalSubmissions}</div>
            <p className="mt-1 text-xs text-slate-500">All marketing copy drafts</p>
          </div>

          {/* Drafts */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Drafts</span>
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                <FileEdit className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-700 font-mono">{draftCount}</div>
            <p className="mt-1 text-xs text-slate-500">Unsubmitted, editable drafts</p>
          </div>

          {/* In Review */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>In Review</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">{inReviewCount}</div>
            <p className="mt-1 text-xs text-slate-500">Awaiting editorial review</p>
          </div>

          {/* Needs Changes */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Needs Changes</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{needsChangesCount}</div>
            <p className="mt-1 text-xs text-slate-500">Returned for creator revision</p>
          </div>
        </div>
      </section>

      {/* Submissions Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Filter Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by campaign, draft text, or submitter..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Status & Type Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="review-status-filter" className="text-xs font-medium text-slate-500">Status:</label>
              <select
                id="review-status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | ReviewStatus)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {STATUS_FILTERS.map((s) => (
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
              variant="outline"
              size="sm"
              onClick={() => navigate('/reviews/new')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Draft
            </Button>
          </div>
        </div>

        {/* Submissions Table adhering to responsive-table guidance */}
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Marketing content submissions" 
          className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <table className="w-full text-left border-collapse text-xs">
            <caption className="sr-only">Directory of marketing drafts, reviews, and governance verification status</caption>
            <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th scope="col" className="py-3.5 px-5">Campaign / Content</th>
                <th scope="col" className="py-3.5 px-4">Content Type</th>
                <th scope="col" className="py-3.5 px-4">Created By</th>
                <th scope="col" className="py-3.5 px-4">Last Updated</th>
                <th scope="col" className="py-3.5 px-4">Status</th>
                <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 text-blue-600">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      {reviews.length === 0 ? (
                        <>
                          <h3 className="font-bold text-slate-900 text-sm">No reviews yet</h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Start your first brand compliance review to check content against your brand guidelines and available evidence.
                          </p>
                          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate('/reviews/new')}
                            >
                              Start Your First Review
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate('/guidelines')}
                            >
                              Configure Guidelines
                            </Button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2.5">
                            Add your brand guidelines and supporting evidence to improve your review results.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-800 text-sm">No content submissions found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {hasActiveFilters 
                              ? 'Try adjusting your search query or status filter.' 
                              : 'No marketing content drafts created yet.'}
                          </p>
                          {hasActiveFilters && (
                            <div className="mt-4">
                              <Button variant="secondary" size="sm" onClick={resetFilters}>
                                Reset Filters
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Campaign Title & Excerpt */}
                    <th scope="row" className="py-3.5 px-5 font-normal">
                      <button
                        type="button"
                        onClick={() => navigate(`/reviews/${item.id}`)}
                        className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-sm text-left cursor-pointer"
                      >
                        {item.campaignTitle}
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>{item.id}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-sans truncate max-w-xs">{item.brandPackName}</span>
                      </div>
                      {item.draftText && (
                        <p className="mt-1 text-[11px] text-slate-600 line-clamp-1 italic bg-slate-50/80 p-1 rounded max-w-md border border-slate-100">
                          "{item.draftText}"
                        </p>
                      )}
                    </th>

                    {/* Content Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{item.contentType}</span>
                      </span>
                    </td>

                    {/* Created By */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {item.submittedBy.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.submittedBy.name}</p>
                          <p className="text-[10px] text-slate-400">{item.submittedBy.role}</p>
                        </div>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>{item.lastUpdated}</div>
                      {item.submittedAt && (
                        <div className="text-[10px] text-indigo-600">Submitted: {item.submittedAt}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Inspect Findings / Review Details */}
                        <button
                          type="button"
                          onClick={() => navigate(`/reviews/${item.id}`)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="Inspect findings & rule review"
                          aria-label={`Inspect findings for ${item.campaignTitle}`}
                        >
                          <FileSearch className="w-4 h-4" />
                        </button>

                        {/* If Draft, offer quick Submit button */}
                        {item.status === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleQuickSubmit(item.id, item.campaignTitle)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Submit draft for review"
                            aria-label={`Submit ${item.campaignTitle} for review`}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => navigate(`/reviews/${item.id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="Edit draft"
                          aria-label={`Edit ${item.campaignTitle}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.campaignTitle)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete submission"
                          aria-label={`Delete ${item.campaignTitle}`}
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
          <span>Showing {filteredReviews.length} of {reviews.length} total content submissions</span>
          <span className="text-slate-400">Deterministic check & claim verification queued upon submission</span>
        </div>
      </div>
    </div>
  );
};
