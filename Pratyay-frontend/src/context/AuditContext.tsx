import React, { useState, useEffect, useCallback } from 'react';
import type { AuditEvent } from '../types';
import { AuditContext } from './AuditContextInstance';
import { apiClient } from '../services/api/client';
import type { CreateAuditEventRequest } from '../services/api/types';

const STORAGE_KEY_AUDIT = 'pratyay_audit_events_v1';

function isSampleAuditEvent(e: AuditEvent): boolean {
  if (e.isSyntheticDemo) return true;
  const sampleIds = ['AUD-1001', 'AUD-1002', 'AUD-1003', 'AUD-1004', 'AUD-1005', 'AUD-1006'];
  if (sampleIds.includes(e.id)) return true;
  const lower = `${e.reviewTitle || ''} ${e.summary || ''} ${e.comment || ''}`.toLowerCase();
  return (
    lower.includes('chikmeshra') ||
    lower.includes('avo botanicals') ||
    lower.includes('aura botanicals') ||
    lower.includes('hair-fall defense') ||
    lower.includes('hairfall defense') ||
    lower.includes('apex cloud') ||
    lower.includes('nexus health') ||
    lower.includes('veloce mobility') ||
    lower.includes('kavach fintech') ||
    lower.includes('lumina smart')
  );
}

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [events, setEvents] = useState<AuditEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (stored) {
        const parsed: AuditEvent[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((e) => !isSampleAuditEvent(e));
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return [];
  });

  const refreshAuditEvents = useCallback(async () => {
    try {
      const res = await apiClient.audit.list();
      if (res && res.success && Array.isArray(res.data)) {
        setEvents(res.data);
        setIsBackendConnected(true);
      }
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  // Hydrate audit trail from backend on mount
  useEffect(() => {
    let isMounted = true;
    apiClient.audit.list()
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && Array.isArray(res.data)) {
          setEvents(res.data);
          setIsBackendConnected(true);
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(events));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [events]);

  const logEvent = useCallback(
    (eventData: Omit<AuditEvent, 'id' | 'timestamp' | 'isoTimestamp'>): AuditEvent => {
      const now = new Date();
      const newEvent: AuditEvent = {
        ...eventData,
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: 'Just now',
        isoTimestamp: now.toISOString(),
      };

      // Attempt backend persistence asynchronously
      const payload: CreateAuditEventRequest = {
        eventType: eventData.eventType,
        reviewId: eventData.reviewId,
        reviewTitle: eventData.reviewTitle,
        previousStatus: eventData.previousStatus,
        newStatus: eventData.newStatus,
        actor: eventData.actor,
        actorRole: eventData.actorRole,
        summary: eventData.summary,
        comment: eventData.comment,
        revisionVersion: eventData.revisionVersion,
      };

      apiClient.audit.log(payload)
        .then((res) => {
          if (res && res.success && res.data) {
            setEvents((prev) => [res.data, ...prev.filter((e) => e.id !== newEvent.id && e.id !== res.data.id)]);
          }
        })
        .catch(() => {
          // Backend offline; retain local event
        });

      setEvents((prev) => [newEvent, ...prev]);
      return newEvent;
    },
    []
  );

  const resetAuditLog = useCallback(() => {
    setEvents([]);
    try {
      localStorage.removeItem(STORAGE_KEY_AUDIT);
    } catch {
      // Ignore
    }
  }, []);

  const getEventsForReview = useCallback(
    (reviewId: string): AuditEvent[] => {
      return events.filter((e) => e.reviewId === reviewId);
    },
    [events]
  );

  return (
    <AuditContext.Provider
      value={{
        events,
        logEvent,
        resetAuditLog,
        getEventsForReview,
        refreshAuditEvents,
        isBackendConnected,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};
