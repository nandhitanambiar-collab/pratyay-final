import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReviewItem, ReviewStatus } from '../../types';
import type { SignOffMode } from './ReviewSignOffModal';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import { useReviews } from '../../hooks/useReviews';
import { 
  ArrowLeft, 
  FileEdit, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  RotateCcw,
  FileUp,
  UserCheck,
  Cpu,
  Server
} from 'lucide-react';

interface ReviewDetailsHeaderProps {
  review: ReviewItem;
  onOpenSignOff: (mode: SignOffMode) => void;
  onResetFindings: () => void;
}

export const ReviewDetailsHeader: React.FC<ReviewDetailsHeaderProps> = ({
  review,
  onOpenSignOff,
  onResetFindings,
}) => {
  const navigate = useNavigate();
  const { submitReview } = useReviews();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Navigation Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => navigate('/reviews')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group"
          aria-label="Back to content reviews list"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Content Reviews</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">ID: {review.id}</span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-medium text-slate-500">Workflow:</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            <UserCheck className="w-3 h-3 text-indigo-500" />
            <span>Human Review Gate</span>
          </span>
        </div>
      </div>

      {/* Main Header Info & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={review.status as ReviewStatus} size="sm" />
            
            {review.activeRevisionVersion && review.activeRevisionVersion > 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <FileUp className="w-3 h-3 text-purple-500" />
                <span>Version {review.activeRevisionVersion}.0</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{review.contentType}</span>
            </span>

            <span className="text-xs text-slate-500 font-medium bg-blue-50/70 border border-blue-100/70 text-blue-700 px-2.5 py-0.5 rounded-full">
              Pack: {review.brandPackName}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {review.campaignTitle}
          </h1>

          {review.campaignContext && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
              <strong className="font-semibold text-slate-700">Campaign Context: </strong>
              {review.campaignContext}
            </p>
          )}

          {/* Metadata pills */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                {review.submittedBy.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <span className="font-medium text-slate-700">{review.submittedBy.name}</span>
              <span className="text-slate-400">({review.submittedBy.role})</span>
            </div>

            <span className="text-slate-300">•</span>

            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created: {review.createdAt}</span>
            </div>

            {review.submittedAt && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-indigo-600 font-medium">
                  Submitted for Review: {review.submittedAt}
                </span>
              </>
            )}

            {review.targetModelId && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  <Cpu className="w-3 h-3 text-indigo-500" />
                  Target: {review.targetModelId}
                </span>
              </>
            )}

            {review.actualModelUsed && (
              <>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                  <Server className="w-3 h-3 text-emerald-600" />
                  Engine: {review.actualModelUsed}
                </span>
              </>
            )}
          </div>

          {review.analysisNote && (
            <div className="mt-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
              <span className="font-semibold shrink-0">Analysis Execution Note:</span>
              <span>{review.analysisNote}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">

          <Button
            variant="outline"
            size="sm"
            onClick={onResetFindings}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset any accepted or dismissed finding actions back to open state"
          >
            Reset Decisions
          </Button>

          {review.status !== 'Approved' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/reviews/${review.id}/edit`)}
              leftIcon={<FileEdit className="w-3.5 h-3.5" />}
            >
              Edit Draft
            </Button>
          )}

          {/* Primary Review Workflow Actions according to backend lifecycle */}
          {review.status === 'Draft' && (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await submitReview(review.id);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              leftIcon={<FileUp className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          )}

          {review.status === 'In Review' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenSignOff('approve')}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
              >
                Approve Content
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenSignOff('request_changes')}
                leftIcon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                className="text-amber-800 border-amber-200 hover:bg-amber-50"
              >
                Request Changes
              </Button>
            </>
          )}

          {review.status === 'Needs Changes' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenSignOff('resubmit')}
              leftIcon={<FileUp className="w-3.5 h-3.5" />}
            >
              Resubmit Revision
            </Button>
          )}

          {review.status === 'Approved' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Signed Off & Immutable</span>
            </span>
          )}
        </div>
      </div>

      {/* Reviewer Comment Banner if present */}
      {review.reviewerComment && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
          review.status === 'Approved'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : review.status === 'Needs Changes'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              {review.status === 'Approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>
                {review.status === 'Approved' ? 'Editorial Approval Note' : 'Reviewer Change Request'}
              </span>
            </span>
            {review.reviewedBy && (
              <span className="text-[11px] opacity-75 font-normal">
                By {review.reviewedBy} {review.reviewedAt ? `• ${review.reviewedAt}` : ''}
              </span>
            )}
          </div>
          <p className="italic pl-5.5 font-medium">"{review.reviewerComment}"</p>
        </div>
      )}
    </div>
  );
};
