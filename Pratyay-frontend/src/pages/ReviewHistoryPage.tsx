import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudit } from '../hooks/useAudit';
import { useReviews } from '../hooks/useReviews';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import type { AuditEventType, ReviewStatus } from '../types';
import { 
  History, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileUp, 
  Check, 
  X, 
  RotateCcw, 
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const EVENT_TYPE_OPTIONS: Array<{ value: 'ALL' | AuditEventType; label: string }> = [
  { value: 'ALL', label: 'All Event Types' },
  { value: 'content_approved', label: 'Content Approved' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'content_submitted', label: 'Content Submitted' },
  { value: 'revision_resubmitted', label: 'Revision Resubmitted' },
  { value: 'finding_accepted', label: 'Finding Accepted' },
  { value: 'finding_dismissed', label: 'Finding Dismissed' },
  { value: 'finding_resolved', label: 'Finding Resolved' },
  { value: 'finding_reopened', label: 'Finding Reopened' },
  { value: 'guideline_updated', label: 'Guideline Updated' },
];

const STATUS_FILTER_OPTIONS: Array<{ value: 'ALL' | ReviewStatus; label: string }> = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Needs Changes', label: 'Needs Changes' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Draft', label: 'Draft' },
];

export const ReviewHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { events, resetAuditLog } = useAudit();
  const { getReviewById } = useReviews();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<'ALL' | AuditEventType>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ReviewStatus>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Metrics
  const totalEventsCount = events.length;
  const approvalsCount = events.filter((e) => e.eventType === 'content_approved').length;
  const changesRequestedCount = events.filter((e) => e.eventType === 'changes_requested').length;
  const submissionsCount = events.filter(
    (e) => e.eventType === 'content_submitted' || e.eventType === 'revision_resubmitted'
  ).length;

  // Filtering
  const filteredEvents = events.filter((event) => {
    const matchesType = selectedEventType === 'ALL' || event.eventType === selectedEventType;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      event.newStatus === selectedStatus ||
      event.previousStatus === selectedStatus;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (event.reviewTitle && event.reviewTitle.toLowerCase().includes(query)) ||
      (event.reviewId && event.reviewId.toLowerCase().includes(query)) ||
      event.actor.toLowerCase().includes(query) ||
      event.summary.toLowerCase().includes(query) ||
      (event.comment && event.comment.toLowerCase().includes(query));

    return matchesType && matchesStatus && matchesSearch;
  });

  const hasActiveFilters = searchQuery !== '' || selectedEventType !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedEventType('ALL');
    setSelectedStatus('ALL');
  };

  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `pratyay_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Audit log exported successfully.');
    } catch {
      showToast('Failed to export audit log.');
    }
  };

  const getEventBadge = (type: AuditEventType) => {
    switch (type) {
      case 'content_approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Content Approved</span>
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Changes Requested</span>
          </span>
        );
      case 'revision_resubmitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <FileUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Revision Resubmitted</span>
          </span>
        );
      case 'content_submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <FileUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Content Submitted</span>
          </span>
        );
      case 'finding_accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Finding Accepted</span>
          </span>
        );
      case 'finding_dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            <span>Finding Dismissed</span>
          </span>
        );
      case 'finding_resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            <span>Finding Resolved</span>
          </span>
        );
      case 'finding_reopened':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            <span>Finding Reopened</span>
          </span>
        );
      case 'guideline_updated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-slate-500" />
            <span>Guideline Updated</span>
          </span>
        );
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
              <History className="w-3.5 h-3.5" />
              <span>Governance Audit Trail</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              Review History & Decision Audit Log
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Trace past human editorial decisions, change request justifications, claim evidence validations, and content resubmissions across the brand portfolio.
            </p>

            {/* Governance disclaimer note adhering to prompt */}
            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500">
                Audit Trail Notice: Records are maintained locally in browser persistence for demonstration. This is not a cryptographically secured or immutable production audit database.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {events.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Clear all audit event history?')) {
                    resetAuditLog();
                    showToast('Audit log cleared.');
                  }
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear Audit Log
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportJSON}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export JSON Log
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <section aria-label="Audit Activity Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Total Audit Events</span>
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{totalEventsCount}</div>
            <p className="mt-1 text-xs text-slate-500">Recorded lifecycle actions</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Approvals Granted</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{approvalsCount}</div>
            <p className="mt-1 text-xs text-slate-500">Human editorial sign-offs</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Changes Requested</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{changesRequestedCount}</div>
            <p className="mt-1 text-xs text-slate-500">Returned with reviewer notes</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>Submissions & Revisions</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <FileUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">{submissionsCount}</div>
            <p className="mt-1 text-xs text-slate-500">Creator review submissions</p>
          </div>
        </div>
      </section>

      {/* Main Audit History Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search & Filter Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by review title, actor, or comment..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <label htmlFor="event-type-filter" className="text-xs font-medium text-slate-500">Event:</label>
              <select
                id="event-type-filter"
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as 'ALL' | AuditEventType)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="status-filter" className="text-xs font-medium text-slate-500">Status:</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | ReviewStatus)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
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
          </div>
        </div>

        {/* Audit Log Table */}
        <div 
          tabIndex={0} 
          role="region" 
          aria-label="Brand governance decision audit log" 
          className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <table className="w-full text-left border-collapse text-xs">
            <caption className="sr-only">Chronological log of editorial review decisions, change requests, and approval records</caption>
            <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th scope="col" className="py-3.5 px-5">Timestamp</th>
                <th scope="col" className="py-3.5 px-4">Event Type</th>
                <th scope="col" className="py-3.5 px-4">Content / Review</th>
                <th scope="col" className="py-3.5 px-4">Transition</th>
                <th scope="col" className="py-3.5 px-4">Actor</th>
                <th scope="col" className="py-3.5 px-5">Summary & Reviewer Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto px-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3 text-slate-500">
                        <History className="w-6 h-6" />
                      </div>
                      {events.length === 0 ? (
                        <>
                          <h3 className="font-bold text-slate-900 text-sm">No review history yet</h3>
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            No review actions recorded yet. Audit events and human review decisions will appear here as you submit, revise, and approve marketing drafts.
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
                          <p className="font-semibold text-slate-800 text-sm">No audit records found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {hasActiveFilters 
                              ? 'Try adjusting your search query or event filters.' 
                              : 'No review actions recorded yet.'}
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
                filteredEvents.map((event) => {
                  const reviewExists = event.reviewId ? !!getReviewById(event.reviewId) : false;

                  return (
                    <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Timestamp */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 font-medium">
                        <div>{event.timestamp}</div>
                        {event.isoTimestamp && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {event.isoTimestamp.slice(0, 10)}
                          </div>
                        )}
                        {event.isSyntheticDemo && (
                          <span className="inline-block mt-0.5 text-[9px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">
                            Demo Seed
                          </span>
                        )}
                      </td>

                      {/* Event Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getEventBadge(event.eventType)}
                      </td>

                      {/* Review Target */}
                      <td className="py-3.5 px-4">
                        {event.reviewId ? (
                          reviewExists ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/reviews/${event.reviewId}`)}
                              className="text-left font-semibold text-slate-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 cursor-pointer group-hover:underline"
                            >
                              <span className="line-clamp-1 max-w-xs">{event.reviewTitle || event.reviewId}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                            </button>
                          ) : (
                            <span className="font-semibold text-slate-700 line-clamp-1 max-w-xs">
                              {event.reviewTitle || event.reviewId}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                        {event.reviewId && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {event.reviewId} {event.revisionVersion ? `• v${event.revisionVersion}.0` : ''}
                          </div>
                        )}
                      </td>

                      {/* Status Transition */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {event.previousStatus && event.newStatus ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <StatusBadge status={event.previousStatus} size="sm" />
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <StatusBadge status={event.newStatus} size="sm" />
                          </div>
                        ) : event.newStatus ? (
                          <StatusBadge status={event.newStatus} size="sm" />
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <div className="font-medium text-slate-900">{event.actor}</div>
                        <div className="text-[10px] text-slate-400">{event.actorRole}</div>
                      </td>

                      {/* Summary & Reviewer Comment */}
                      <td className="py-3.5 px-5">
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {event.summary}
                        </p>
                        {event.comment && (
                          <div className="mt-1 p-2 bg-slate-50 border border-slate-200/80 rounded text-[11px] text-slate-600 italic">
                            <strong className="font-semibold text-slate-700 not-italic">Note: </strong>
                            "{event.comment}"
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 px-5">
          <span>Showing {filteredEvents.length} of {events.length} total audit entries</span>
          <span className="text-slate-400">Append-oriented governance event log</span>
        </div>
      </div>
    </div>
  );
};
