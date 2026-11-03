import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Finding, FindingStatus, ReviewItem } from '../types';
import { runDeterministicRuleChecks } from '../utils/ruleChecker';
import { useGuidelines } from '../hooks/useGuidelines';
import { useAudit } from '../hooks/useAudit';
import { FindingContext, type FindingDecision } from './FindingContextInstance';
import { apiClient } from '../services/api/client';

const STORAGE_KEY_DECISIONS = 'pratyay_finding_decisions_v1';
const STORAGE_KEY_WORKING_DRAFTS = 'pratyay_working_drafts_v1';

export const FindingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { guidelines, factsEvidence } = useGuidelines();
  const { logEvent } = useAudit();

  // Storage of user decisions: reviewId -> { findingId -> FindingDecision }
  const [decisions, setDecisions] = useState<Record<string, Record<string, FindingDecision>>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DECISIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback on storage errors
    }
    return {};
  });

  // Storage of separate editable working revision drafts: reviewId -> string
  const [workingDrafts, setWorkingDrafts] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WORKING_DRAFTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback on storage errors
    }
    return {};
  });

  // In-memory cache of server-reported findings: reviewId -> Finding[]
  const [serverFindings, setServerFindings] = useState<Record<string, Finding[]>>({});
  const requestedReviewsRef = useRef<Set<string>>(new Set());

  // Persist decisions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DECISIONS, JSON.stringify(decisions));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [decisions]);

  // Persist working drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORKING_DRAFTS, JSON.stringify(workingDrafts));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [workingDrafts]);

  const fetchFindingsForReview = useCallback(async (reviewId: string): Promise<Finding[]> => {
    try {
      const res = await apiClient.reviews.getFindings(reviewId);
      if (res && res.success && Array.isArray(res.data)) {
        setServerFindings((prev) => ({
          ...prev,
          [reviewId]: res.data,
        }));
        return res.data;
      }
    } catch {
      // Backend offline or findings endpoint error
    }
    return [];
  }, []);

  const analyzeReview = useCallback(
    async (reviewId: string, targetModelId?: string): Promise<Finding[]> => {
      try {
        const res = await apiClient.analysis.analyze(reviewId, {
          reviewId,
          draftText: workingDrafts[reviewId] || '',
          brandPackName: '',
          targetModelId: targetModelId || 'gemini-2.5-flash',
        });
        if (res && res.success && res.data?.findings) {
          setServerFindings((prev) => ({
            ...prev,
            [reviewId]: res.data.findings,
          }));
          return res.data.findings;
        }
      } catch (err) {
        console.info('[FindingContext] Backend re-analysis request failed:', err);
      }
      return [];
    },
    [workingDrafts]
  );

  // Evaluates findings from backend if available, or deterministically client-side
  const getFindingsForReview = useCallback(
    (review: ReviewItem): Finding[] => {
      const reviewDecisions = decisions[review.id] || {};

      // If we already have server findings for this review, use them
      if (serverFindings[review.id]) {
        return serverFindings[review.id].map((finding) => {
          const decision = reviewDecisions[finding.id];
          if (decision) {
            return {
              ...finding,
              status: decision.status,
              dismissReason: decision.dismissReason,
            };
          }
          return finding;
        });
      }

      // If review is saved on the server and hasn't been requested yet, fetch findings in background
      if (!requestedReviewsRef.current.has(review.id)) {
        requestedReviewsRef.current.add(review.id);
        fetchFindingsForReview(review.id);
      }

      // Initial or offline fallback: run client-side rule checks
      const rawFindings = runDeterministicRuleChecks(review, guidelines, factsEvidence);
      return rawFindings.map((finding) => {
        const decision = reviewDecisions[finding.id];
        if (decision) {
          return {
            ...finding,
            status: decision.status,
            dismissReason: decision.dismissReason,
          };
        }
        return finding;
      });
    },
    [guidelines, factsEvidence, decisions, serverFindings, fetchFindingsForReview]
  );

  const getWorkingDraft = useCallback(
    (reviewId: string, fallbackOriginal: string): string => {
      if (workingDrafts[reviewId] !== undefined) {
        return workingDrafts[reviewId];
      }
      return fallbackOriginal;
    },
    [workingDrafts]
  );

  const setWorkingDraft = useCallback((reviewId: string, draftText: string) => {
    setWorkingDrafts((prev) => ({
      ...prev,
      [reviewId]: draftText,
    }));
  }, []);

  const updateFindingStatus = useCallback(
    (
      reviewId: string,
      findingId: string,
      status: FindingStatus,
      dismissReason?: string,
      actorName?: string
    ) => {
      // Update local decisions map
      setDecisions((prev) => {
        const existingReviewDecisions = prev[reviewId] || {};
        return {
          ...prev,
          [reviewId]: {
            ...existingReviewDecisions,
            [findingId]: {
              status,
              dismissReason,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });

      // Update in server findings cache if present
      setServerFindings((prev) => {
        const current = prev[reviewId];
        if (!current) return prev;
        return {
          ...prev,
          [reviewId]: current.map((f) =>
            f.id === findingId ? { ...f, status, dismissReason } : f
          ),
        };
      });

      // Sync to backend if findingId matches backend format
      apiClient.decisions
        .updateFinding(reviewId, findingId, {
          status,
          dismissReason: status === 'dismissed' ? dismissReason || 'Dismissed by reviewer' : undefined,
          reviewerName: actorName || 'Editorial Reviewer (Demo)',
        })
        .catch((err) => {
          console.info('[FindingContext] Backend decision sync returned error, decision retained locally:', err);
        });

      const reviewer = actorName || 'Editorial Reviewer (Demo)';
      if (status === 'accepted') {
        logEvent({
          eventType: 'finding_accepted',
          reviewId,
          actor: reviewer,
          actorRole: 'Reviewer (Demo Identity)',
          summary: `Accepted finding ${findingId} for review ${reviewId}.`,
        });
      } else if (status === 'dismissed') {
        logEvent({
          eventType: 'finding_dismissed',
          reviewId,
          actor: reviewer,
          actorRole: 'Reviewer (Demo Identity)',
          summary: `Dismissed finding ${findingId} for review ${reviewId}.`,
          comment: dismissReason || 'Dismissed by reviewer',
        });
      } else if (status === 'resolved') {
        logEvent({
          eventType: 'finding_resolved',
          reviewId,
          actor: reviewer,
          actorRole: 'Reviewer (Demo Identity)',
          summary: `Marked finding ${findingId} as resolved.`,
        });
      } else if (status === 'open') {
        logEvent({
          eventType: 'finding_reopened',
          reviewId,
          actor: reviewer,
          actorRole: 'Reviewer (Demo Identity)',
          summary: `Reopened finding ${findingId}.`,
        });
      }
    },
    [logEvent]
  );

  const applySuggestionToWorkingDraft = useCallback(
    (
      reviewId: string,
      findingId: string,
      originalDraft: string,
      suggestedText: string,
      matchedText?: string
    ) => {
      setWorkingDrafts((prev) => {
        const currentDraft = prev[reviewId] !== undefined ? prev[reviewId] : originalDraft;
        let updatedDraft = currentDraft;

        if (matchedText && currentDraft.includes(matchedText)) {
          updatedDraft = currentDraft.replace(matchedText, suggestedText);
        } else if (suggestedText.startsWith(currentDraft)) {
          updatedDraft = suggestedText;
        } else {
          updatedDraft = `${currentDraft}\n\n[Applied Revision]: ${suggestedText}`;
        }

        return {
          ...prev,
          [reviewId]: updatedDraft,
        };
      });

      updateFindingStatus(reviewId, findingId, 'accepted');
    },
    [updateFindingStatus]
  );

  const resetFindingsForReview = useCallback((reviewId: string) => {
    setDecisions((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
    setWorkingDrafts((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
    setServerFindings((prev) => {
      const copy = { ...prev };
      delete copy[reviewId];
      return copy;
    });
    requestedReviewsRef.current.delete(reviewId);
  }, []);

  return (
    <FindingContext.Provider
      value={{
        getFindingsForReview,
        fetchFindingsForReview,
        analyzeReview,
        getWorkingDraft,
        setWorkingDraft,
        applySuggestionToWorkingDraft,
        updateFindingStatus,
        resetFindingsForReview,
      }}
    >
      {children}
    </FindingContext.Provider>
  );
};
