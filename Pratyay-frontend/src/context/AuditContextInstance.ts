import { createContext } from 'react';
import type { AuditEvent } from '../types';

export interface AuditContextType {
  events: AuditEvent[];
  logEvent: (event: Omit<AuditEvent, 'id' | 'timestamp' | 'isoTimestamp'>) => AuditEvent;
  resetAuditLog: () => void;
  getEventsForReview: (reviewId: string) => AuditEvent[];
  refreshAuditEvents: () => Promise<void>;
  isBackendConnected: boolean;
}

export const AuditContext = createContext<AuditContextType | undefined>(undefined);
