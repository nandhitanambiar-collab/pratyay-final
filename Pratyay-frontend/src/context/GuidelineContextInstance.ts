import { createContext } from 'react';
import type { GuidelineRule, BrandFactEvidence } from '../types';

export interface GuidelineContextType {
  guidelines: GuidelineRule[];
  addGuideline: (rule: Omit<GuidelineRule, 'id' | 'lastUpdated'>) => Promise<GuidelineRule> | GuidelineRule;
  updateGuideline: (id: string, updates: Partial<Omit<GuidelineRule, 'id'>>) => Promise<void> | void;
  toggleGuidelineStatus: (id: string) => Promise<void> | void;
  deleteGuideline: (id: string) => Promise<void> | void;

  factsEvidence: BrandFactEvidence[];
  addFactEvidence: (fact: Omit<BrandFactEvidence, 'id' | 'lastUpdated'>) => Promise<BrandFactEvidence> | BrandFactEvidence;
  updateFactEvidence: (id: string, updates: Partial<Omit<BrandFactEvidence, 'id'>>) => Promise<void> | void;
  deleteFactEvidence: (id: string) => Promise<void> | void;

  resetToDemoDefaults: () => void;
  refreshGuidelines: () => Promise<void>;
  isBackendConnected: boolean;
}

export const GuidelineContext = createContext<GuidelineContextType | undefined>(undefined);
