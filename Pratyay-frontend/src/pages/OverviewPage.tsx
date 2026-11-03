import React from 'react';
import { useReviews } from '../hooks/useReviews';
import { useAudit } from '../hooks/useAudit';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { SummaryCard } from '../components/common/SummaryCard';
import { RecentReviewsTable } from '../components/dashboard/RecentReviewsTable';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { FirstTimeWorkflowGuide } from '../components/dashboard/FirstTimeWorkflowGuide';
import type { SummaryMetric, ActivityEvent } from '../types';

export const OverviewPage: React.FC = () => {
  const { reviews } = useReviews();

  // Dynamic summary metrics based on actual review state
  const totalCount = reviews.length;
  const inReviewCount = reviews.filter((r) => r.status === 'In Review').length;
  const needsChangesCount = reviews.filter((r) => r.status === 'Needs Changes').length;
  const approvedCount = reviews.filter((r) => r.status === 'Approved').length;

  const dynamicSummaryMetrics: SummaryMetric[] = [
    {
      title: 'Total Reviews',
      value: totalCount,
      change: totalCount === 0 ? 'No submissions yet' : `${totalCount} total submitted`,
      changeType: totalCount === 0 ? 'neutral' : 'positive',
      description: 'All marketing copy evaluated',
      iconName: 'total',
    },
    {
      title: 'Pending Reviews',
      value: inReviewCount,
      change: totalCount === 0 ? '0 in review queue' : `${inReviewCount} awaiting review`,
      changeType: 'neutral',
      description: 'Requires human editorial sign-off',
      iconName: 'pending',
    },
    {
      title: 'Needs Changes',
      value: needsChangesCount,
      change: totalCount === 0 ? '0 flagged for revision' : `${needsChangesCount} revision flags`,
      changeType: totalCount === 0 ? 'neutral' : 'negative',
      description: 'Revisions suggested to creator',
      iconName: 'warning',
    },
    {
      title: 'Approved Reviews',
      value: approvedCount,
      change: totalCount === 0 ? '0 authorized to date' : `${Math.round((approvedCount / totalCount) * 100)}% pass rate`,
      changeType: totalCount === 0 ? 'neutral' : 'positive',
      description: 'Validated & authorized by reviewer',
      iconName: 'approved',
    },
  ];

  const { events } = useAudit();

  const activityFeedItems: ActivityEvent[] = events.slice(0, 5).map((e) => {
    let type: ActivityEvent['type'] = 'verification';
    let action = 'recorded action on';

    if (e.eventType === 'content_approved') {
      type = 'verification';
      action = 'approved and authorized';
    } else if (e.eventType === 'changes_requested') {
      type = 'change_request';
      action = 'requested revisions on';
    } else if (e.eventType === 'content_submitted') {
      type = 'submission';
      action = 'submitted draft for';
    } else if (e.eventType === 'revision_resubmitted') {
      type = 'submission';
      action = `submitted revision v${e.revisionVersion || 2} of`;
    } else if (e.eventType === 'guideline_updated') {
      type = 'guideline_update';
      action = 'updated standards for';
    } else if (e.eventType.startsWith('finding_')) {
      type = 'system_flag';
      action = 'updated finding on';
    }

    return {
      id: e.id,
      actor: e.actor,
      role: e.actorRole,
      action,
      target: e.reviewTitle || e.summary,
      timestamp: e.timestamp,
      type,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Welcome Section with Empty Dashboard handling */}
      <WelcomeBanner reviewCount={totalCount} />

      {/* 2. Summary Metric Cards */}
      <section aria-label="Governance Summary Metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicSummaryMetrics.map((metric) => (
            <SummaryCard key={metric.title} metric={metric} />
          ))}
        </div>
      </section>

      {/* 3. Main Dashboard Grid: Recent Reviews Table + Activity Feed */}
      <section aria-label="Review Workflow and Live Activity">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 cols wide on desktop): Recent Reviews Table */}
          <div className="lg:col-span-2">
            <RecentReviewsTable reviews={reviews} />
          </div>

          {/* Right Column (1 col wide on desktop): Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={activityFeedItems} />
          </div>
        </div>
      </section>

      {/* 4. First-Time Simple 9-Step Governance Workflow Guide */}
      <section aria-label="Governance Workflow Guide">
        <FirstTimeWorkflowGuide />
      </section>
    </div>
  );
};
