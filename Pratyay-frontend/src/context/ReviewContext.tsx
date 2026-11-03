import React, { useState, useEffect, useCallback } from 'react';
import type { ReviewItem } from '../types';
import { ReviewContext } from './ReviewContextInstance';
import { useAudit } from '../hooks/useAudit';
import { apiClient } from '../services/api/client';
import type { CreateReviewRequest } from '../services/api/types';

const STORAGE_KEY_REVIEWS = 'pratyay_demo_reviews_v1';

function isSampleReview(r: ReviewItem): boolean {
  const sampleIds = ['REV-2026-089', 'REV-2026-088', 'REV-2026-087', 'REV-2026-086', 'REV-2026-085', 'REV-2026-084'];
  if (sampleIds.includes(r.id)) return true;
  const combined = `${r.campaignTitle} ${r.draftText || ''} ${r.brandPackName || ''}`.toLowerCase();
  return (
    combined.includes('chikmeshra') ||
    combined.includes('avo botanicals') ||
    combined.includes('aura botanicals') ||
    combined.includes('hair-fall defense') ||
    combined.includes('hairfall defense') ||
    combined.includes('apex cloud') ||
    combined.includes('nexus health') ||
    combined.includes('veloce mobility') ||
    combined.includes('kavach fintech') ||
    combined.includes('lumina smart')
  );
}

export const ReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logEvent } = useAudit();
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (stored) {
        const parsed: ReviewItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => !isSampleReview(r));
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return [];
  });

  const refreshReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.reviews.list();
      if (res && res.success && Array.isArray(res.data)) {
        setIsBackendConnected(true);
        setReviews(res.data);
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch reviews on mount from backend if reachable
  useEffect(() => {
    let isMounted = true;
    apiClient.reviews.list()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && Array.isArray(res.data)) {
          setIsBackendConnected(true);
          setReviews(res.data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setIsBackendConnected(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to local storage for demo fallback resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [reviews]);

  const addReview = useCallback(
    async (item: Omit<ReviewItem, 'id' | 'createdAt' | 'lastUpdated'>): Promise<ReviewItem> => {
      // Attempt backend creation first
      try {
        const payload: CreateReviewRequest = {
          campaignTitle: item.campaignTitle,
          contentType: item.contentType,
          brandPackName: item.brandPackName,
          campaignContext: item.campaignContext,
          draftText: item.draftText,
          status: item.status === 'In Review' ? 'In Review' : 'Draft',
          submittedBy: {
            name: item.submittedBy.name,
            role: item.submittedBy.role,
          },
          targetModelId: item.targetModelId,
          uploadedDocument: item.uploadedDocument,
        };

        const res = await apiClient.reviews.create(payload);
        if (res && res.success && res.data) {
          setIsBackendConnected(true);
          setReviews((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)]);
          return res.data;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend unavailable or failed, creating in local state:', err);
      }

      // Offline / Demo Fallback
      const newId = `REV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = 'Just now';
      const fallbackReview: ReviewItem = {
        ...item,
        id: newId,
        originalDraftText: item.originalDraftText || item.draftText,
        activeRevisionVersion: 1,
        createdAt: now,
        lastUpdated: now,
        submittedAt: item.status === 'In Review' ? now : item.submittedAt,
      };

      setReviews((prev) => [fallbackReview, ...prev]);

      if (item.status === 'In Review') {
        logEvent({
          eventType: 'content_submitted',
          reviewId: newId,
          reviewTitle: item.campaignTitle,
          previousStatus: 'Draft',
          newStatus: 'In Review',
          actor: item.submittedBy.name,
          actorRole: item.submittedBy.role,
          summary: `Created and submitted "${item.campaignTitle}" for brand governance review.`,
          revisionVersion: 1,
        });
      }

      return fallbackReview;
    },
    [logEvent]
  );

  const updateReview = useCallback(
    async (id: string, updates: Partial<Omit<ReviewItem, 'id'>>) => {
      try {
        const res = await apiClient.reviews.update(id, updates);
        if (res && res.success && res.data) {
          setReviews((prev) => prev.map((item) => (item.id === id ? res.data : item)));
          return res.data;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend update failed, updating local state:', err);
      }

      const now = 'Just now';
      setReviews((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updates,
                lastUpdated: now,
                submittedAt:
                  updates.status === 'In Review' && !item.submittedAt
                    ? now
                    : updates.submittedAt ?? item.submittedAt,
              }
            : item
        )
      );
    },
    []
  );

  const submitReview = useCallback(
    async (id: string) => {
      try {
        const res = await apiClient.reviews.update(id, { status: 'In Review' });
        if (res && res.success && res.data) {
          setReviews((prev) => prev.map((item) => (item.id === id ? res.data : item)));
          return;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend submit failed, falling back to local state:', err);
      }

      const now = 'Just now';
      setReviews((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            logEvent({
              eventType: 'content_submitted',
              reviewId: item.id,
              reviewTitle: item.campaignTitle,
              previousStatus: item.status,
              newStatus: 'In Review',
              actor: item.submittedBy.name,
              actorRole: item.submittedBy.role,
              summary: `Submitted "${item.campaignTitle}" for brand governance review.`,
              revisionVersion: item.activeRevisionVersion || 1,
            });
            return {
              ...item,
              status: 'In Review',
              lastUpdated: now,
              submittedAt: now,
            };
          }
          return item;
        })
      );
    },
    [logEvent]
  );

  const requestChanges = useCallback(
    async (id: string, reviewerName: string, reason: string) => {
      try {
        const res = await apiClient.decisions.submitSignOff(id, {
          decision: 'Needs Changes',
          reviewerName,
          reviewerRole: 'Editorial Reviewer (Demo)',
          comment: reason,
          confirmationAcknowledged: true,
        });
        if (res && res.success && res.data) {
          setReviews((prev) => prev.map((item) => (item.id === id ? res.data : item)));
          return;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend request changes failed, using local state:', err);
      }

      const now = 'Just now';
      setReviews((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            logEvent({
              eventType: 'changes_requested',
              reviewId: item.id,
              reviewTitle: item.campaignTitle,
              previousStatus: item.status,
              newStatus: 'Needs Changes',
              actor: reviewerName,
              actorRole: 'Reviewer (Demo Identity)',
              summary: `Changes requested on "${item.campaignTitle}": ${reason}`,
              comment: reason,
              revisionVersion: item.activeRevisionVersion || 1,
            });
            return {
              ...item,
              status: 'Needs Changes',
              reviewerDecision: 'Needs Changes',
              reviewerComment: reason,
              reviewedBy: reviewerName,
              reviewedAt: now,
              lastUpdated: now,
            };
          }
          return item;
        })
      );
    },
    [logEvent]
  );

  const approveReview = useCallback(
    async (id: string, reviewerName: string, comment?: string) => {
      const finalComment = comment || 'Verified and approved for brand compliance standards.';
      try {
        const res = await apiClient.decisions.submitSignOff(id, {
          decision: 'Approved',
          reviewerName,
          reviewerRole: 'Editorial Reviewer (Demo)',
          comment: finalComment,
          confirmationAcknowledged: true,
        });
        if (res && res.success && res.data) {
          setReviews((prev) => prev.map((item) => (item.id === id ? res.data : item)));
          return;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend sign-off failed, using local state:', err);
      }

      const now = 'Just now';
      setReviews((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            logEvent({
              eventType: 'content_approved',
              reviewId: item.id,
              reviewTitle: item.campaignTitle,
              previousStatus: item.status,
              newStatus: 'Approved',
              actor: reviewerName,
              actorRole: 'Reviewer (Demo Identity)',
              summary: `Approved "${item.campaignTitle}" for publication.`,
              comment: finalComment,
              revisionVersion: item.activeRevisionVersion || 1,
            });
            return {
              ...item,
              status: 'Approved',
              reviewerDecision: 'Approved',
              reviewerComment: finalComment,
              reviewedBy: reviewerName,
              reviewedAt: now,
              lastUpdated: now,
            };
          }
          return item;
        })
      );
    },
    [logEvent]
  );

  const resubmitRevision = useCallback(
    async (id: string, newDraftText: string, changeSummary?: string, submitterName?: string) => {
      try {
        const res = await apiClient.decisions.resubmitRevision(id, {
          newDraftText,
          changeSummary,
          submitterName,
        });
        if (res && res.success && res.data) {
          setReviews((prev) => prev.map((item) => (item.id === id ? res.data : item)));
          return;
        }
      } catch (err) {
        console.info('[ReviewContext] Backend resubmit failed, using local state:', err);
      }

      const now = 'Just now';
      setReviews((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const nextVersion = (item.activeRevisionVersion || 1) + 1;
            const author = submitterName || item.submittedBy.name;
            const summaryText = changeSummary || `Resubmitted with revisions (Version ${nextVersion})`;
            logEvent({
              eventType: 'revision_resubmitted',
              reviewId: item.id,
              reviewTitle: item.campaignTitle,
              previousStatus: item.status,
              newStatus: 'In Review',
              actor: author,
              actorRole: item.submittedBy.role,
              summary: `Resubmitted "${item.campaignTitle}" as Version ${nextVersion}.`,
              comment: summaryText,
              revisionVersion: nextVersion,
            });
            return {
              ...item,
              originalDraftText: item.originalDraftText || item.draftText,
              draftText: newDraftText,
              activeRevisionVersion: nextVersion,
              status: 'In Review',
              reviewerDecision: undefined,
              lastUpdated: now,
              submittedAt: now,
            };
          }
          return item;
        })
      );
    },
    [logEvent]
  );

  const deleteReview = useCallback(async (id: string) => {
    try {
      await apiClient.reviews.delete(id);
    } catch (err) {
      console.info('[ReviewContext] Backend delete returned error, removing from local state:', err);
    }
    setReviews((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const getReviewById = useCallback(
    (id: string): ReviewItem | undefined => {
      return reviews.find((item) => item.id === id);
    },
    [reviews]
  );

  const resetToDemoReviews = useCallback(() => {
    setReviews([]);
    try {
      localStorage.removeItem(STORAGE_KEY_REVIEWS);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        addReview,
        updateReview,
        submitReview,
        requestChanges,
        approveReview,
        resubmitRevision,
        deleteReview,
        getReviewById,
        resetToDemoReviews,
        refreshReviews,
        isBackendConnected,
        isLoading,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};
