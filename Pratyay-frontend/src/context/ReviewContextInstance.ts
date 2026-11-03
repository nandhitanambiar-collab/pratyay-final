import { createContext } from 'react';
import type { ReviewItem } from '../types';

export interface ReviewContextType {
  reviews: ReviewItem[];
  addReview: (item: Omit<ReviewItem, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<ReviewItem> | ReviewItem;
  updateReview: (id: string, updates: Partial<Omit<ReviewItem, 'id'>>) => Promise<ReviewItem | void> | void;
  submitReview: (id: string) => Promise<void> | void;
  requestChanges: (id: string, reviewerName: string, reason: string) => Promise<void> | void;
  approveReview: (id: string, reviewerName: string, comment?: string) => Promise<void> | void;
  resubmitRevision: (id: string, newDraftText: string, changeSummary?: string, submitterName?: string) => Promise<void> | void;
  deleteReview: (id: string) => Promise<void> | void;
  getReviewById: (id: string) => ReviewItem | undefined;
  resetToDemoReviews: () => void;
  refreshReviews: () => Promise<void>;
  isBackendConnected: boolean;
  isLoading: boolean;
}

export const ReviewContext = createContext<ReviewContextType | undefined>(undefined);
