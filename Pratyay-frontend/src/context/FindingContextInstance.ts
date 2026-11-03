import { createContext } from 'react';
import type { Finding, FindingStatus, ReviewItem } from '../types';

export interface FindingDecision {
  status: FindingStatus;
  dismissReason?: string;
  updatedAt?: string;
}

export interface FindingContextType {
  getFindingsForReview: (review: ReviewItem) => Finding[];
  fetchFindingsForReview: (reviewId: string) => Promise<Finding[]>;
  analyzeReview: (reviewId: string, targetModelId?: string) => Promise<Finding[]>;
  getWorkingDraft: (reviewId: string, fallbackOriginal: string) => string;
  setWorkingDraft: (reviewId: string, draftText: string) => void;
  applySuggestionToWorkingDraft: (
    reviewId: string,
    findingId: string,
    originalDraft: string,
    suggestedText: string,
    matchedText?: string
  ) => void;
  updateFindingStatus: (
    reviewId: string,
    findingId: string,
    status: FindingStatus,
    dismissReason?: string,
    actorName?: string
  ) => void;
  resetFindingsForReview: (reviewId: string) => void;
}

export const FindingContext = createContext<FindingContextType | undefined>(undefined);
