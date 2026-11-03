import React, { useState, useEffect, useCallback } from 'react';
import type { GuidelineRule, BrandFactEvidence } from '../types';
import { initialGuidelineRules, initialBrandFactsEvidence } from '../data/mockData';
import { GuidelineContext } from './GuidelineContextInstance';
import { apiClient } from '../services/api/client';
import type { CreateGuidelineRequest, CreateEvidenceRequest } from '../services/api/types';

const STORAGE_KEY_GUIDELINES = 'pratyay_demo_guidelines_v1';
const STORAGE_KEY_EVIDENCE = 'pratyay_demo_evidence_v1';

function isSampleFact(f: BrandFactEvidence): boolean {
  const sampleIds = ['FACT-201', 'FACT-202', 'FACT-203', 'FACT-204', 'FACT-205', 'FACT-206'];
  if (sampleIds.includes(f.id)) return true;
  const lower = `${f.claimName} ${f.approvedStatement} ${f.sourceReference || ''}`.toLowerCase();
  return (
    lower.includes('chikmeshra') ||
    lower.includes('avo botanicals') ||
    lower.includes('aura botanicals') ||
    lower.includes('hair-fall') ||
    lower.includes('hairfall') ||
    lower.includes('apex cloud') ||
    lower.includes('nexus health') ||
    lower.includes('veloce') ||
    lower.includes('kavach') ||
    lower.includes('wizard nutrimets')
  );
}

export const GuidelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [guidelines, setGuidelines] = useState<GuidelineRule[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GUIDELINES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback on storage errors
    }
    return initialGuidelineRules;
  });

  const [factsEvidence, setFactsEvidence] = useState<BrandFactEvidence[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EVIDENCE);
      if (stored) {
        const parsed: BrandFactEvidence[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((f) => !isSampleFact(f));
        }
      }
    } catch {
      // Fallback on storage errors
    }
    return initialBrandFactsEvidence;
  });

  const refreshGuidelines = useCallback(async () => {
    try {
      const [gRes, eRes] = await Promise.all([
        apiClient.guidelines.list(),
        apiClient.evidence.list(),
      ]);

      if (gRes && gRes.success && Array.isArray(gRes.data)) {
        setGuidelines(gRes.data);
      }
      if (eRes && eRes.success && Array.isArray(eRes.data)) {
        setFactsEvidence(eRes.data);
      }
      setIsBackendConnected(true);
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  // Fetch guidelines and evidence from backend on mount
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      apiClient.guidelines.list().catch(() => null),
      apiClient.evidence.list().catch(() => null),
    ]).then(([gRes, eRes]) => {
      if (!isMounted) return;
      if (gRes && gRes.success && Array.isArray(gRes.data)) {
        setGuidelines(gRes.data);
        setIsBackendConnected(true);
      }
      if (eRes && eRes.success && Array.isArray(eRes.data)) {
        setFactsEvidence(eRes.data);
        setIsBackendConnected(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage for demonstration resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GUIDELINES, JSON.stringify(guidelines));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [guidelines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify(factsEvidence));
    } catch {
      // Ignore quota errors in demo mode
    }
  }, [factsEvidence]);

  const addGuideline = async (rule: Omit<GuidelineRule, 'id' | 'lastUpdated'>): Promise<GuidelineRule> => {
    try {
      const payload: CreateGuidelineRequest = {
        name: rule.name,
        category: rule.category,
        ruleType: rule.ruleType,
        summary: rule.summary,
        description: rule.description,
        targetTerm: rule.targetTerm,
        replacementTerm: rule.replacementTerm,
        status: rule.status,
        notes: rule.notes,
      };

      const res = await apiClient.guidelines.create(payload);
      if (res && res.success && res.data) {
        setGuidelines((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)]);
        setIsBackendConnected(true);
        return res.data;
      }
    } catch (err) {
      console.info('[GuidelineContext] Backend create failed, saving to local state:', err);
    }

    const fallbackRule: GuidelineRule = {
      ...rule,
      id: `RULE-${Math.floor(100 + Math.random() * 900)}`,
      lastUpdated: 'Just now',
    };
    setGuidelines((prev) => [fallbackRule, ...prev]);
    return fallbackRule;
  };

  const updateGuideline = async (id: string, updates: Partial<Omit<GuidelineRule, 'id'>>) => {
    try {
      const res = await apiClient.guidelines.update(id, updates);
      if (res && res.success && res.data) {
        setGuidelines((prev) => prev.map((item) => (item.id === id ? res.data : item)));
        return;
      }
    } catch (err) {
      console.info('[GuidelineContext] Backend update failed, updating local state:', err);
    }

    setGuidelines((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              lastUpdated: 'Just now',
            }
          : item
      )
    );
  };

  const toggleGuidelineStatus = async (id: string) => {
    const target = guidelines.find((g) => g.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const res = await apiClient.guidelines.update(id, { status: nextStatus });
      if (res && res.success && res.data) {
        setGuidelines((prev) => prev.map((item) => (item.id === id ? res.data : item)));
        return;
      }
    } catch (err) {
      console.info('[GuidelineContext] Backend status toggle failed, toggling local state:', err);
    }

    setGuidelines((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              lastUpdated: 'Just now',
            }
          : item
      )
    );
  };

  const deleteGuideline = async (id: string) => {
    try {
      await apiClient.guidelines.delete(id);
    } catch (err) {
      console.info('[GuidelineContext] Backend delete failed, removing locally:', err);
    }
    setGuidelines((prev) => prev.filter((item) => item.id !== id));
  };

  const addFactEvidence = async (fact: Omit<BrandFactEvidence, 'id' | 'lastUpdated'>): Promise<BrandFactEvidence> => {
    try {
      const payload: CreateEvidenceRequest = {
        claimName: fact.claimName,
        approvedStatement: fact.approvedStatement,
        evidenceDescription: fact.evidenceDescription,
        sourceReference: fact.sourceReference,
        evidenceStatus: fact.evidenceStatus,
        validFrom: fact.validFrom,
        expiryDate: fact.expiryDate,
        notes: fact.notes,
      };

      const res = await apiClient.evidence.create(payload);
      if (res && res.success && res.data) {
        setFactsEvidence((prev) => [res.data, ...prev.filter((f) => f.id !== res.data.id)]);
        setIsBackendConnected(true);
        return res.data;
      }
    } catch (err) {
      console.info('[GuidelineContext] Backend create fact failed, saving locally:', err);
    }

    const fallbackFact: BrandFactEvidence = {
      ...fact,
      id: `FACT-${Math.floor(200 + Math.random() * 800)}`,
      lastUpdated: 'Just now',
    };
    setFactsEvidence((prev) => [fallbackFact, ...prev]);
    return fallbackFact;
  };

  const updateFactEvidence = async (id: string, updates: Partial<Omit<BrandFactEvidence, 'id'>>) => {
    try {
      const res = await apiClient.evidence.update(id, updates);
      if (res && res.success && res.data) {
        setFactsEvidence((prev) => prev.map((item) => (item.id === id ? res.data : item)));
        return;
      }
    } catch (err) {
      console.info('[GuidelineContext] Backend update fact failed, updating locally:', err);
    }

    setFactsEvidence((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              lastUpdated: 'Just now',
            }
          : item
      )
    );
  };

  const deleteFactEvidence = async (id: string) => {
    try {
      await apiClient.evidence.delete(id);
    } catch (err) {
      console.info('[GuidelineContext] Backend delete fact failed, removing locally:', err);
    }
    setFactsEvidence((prev) => prev.filter((item) => item.id !== id));
  };

  const resetToDemoDefaults = () => {
    setGuidelines(initialGuidelineRules);
    setFactsEvidence(initialBrandFactsEvidence);
    localStorage.removeItem(STORAGE_KEY_GUIDELINES);
    localStorage.removeItem(STORAGE_KEY_EVIDENCE);
  };

  return (
    <GuidelineContext.Provider
      value={{
        guidelines,
        addGuideline,
        updateGuideline,
        toggleGuidelineStatus,
        deleteGuideline,
        factsEvidence,
        addFactEvidence,
        updateFactEvidence,
        deleteFactEvidence,
        resetToDemoDefaults,
        refreshGuidelines,
        isBackendConnected,
      }}
    >
      {children}
    </GuidelineContext.Provider>
  );
};
