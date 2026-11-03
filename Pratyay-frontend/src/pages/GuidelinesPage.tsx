import React, { useState } from 'react';
import { useGuidelines } from '../hooks/useGuidelines';
import type { GuidelineRule, BrandFactEvidence } from '../types';
import { GuidelinesTable } from '../components/guidelines/GuidelinesTable';
import { GuidelineModal } from '../components/guidelines/GuidelineModal';
import { BrandFactsEvidenceSection } from '../components/guidelines/BrandFactsEvidenceSection';
import { FactEvidenceModal } from '../components/guidelines/FactEvidenceModal';
import { Button } from '../components/common/Button';
import { 
  BookOpenCheck, 
  Plus, 
  FileCheck2, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Check, 
  X,
  FileText
} from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
  const {
    guidelines,
    addGuideline,
    updateGuideline,
    toggleGuidelineStatus,
    deleteGuideline,
    factsEvidence,
    addFactEvidence,
    updateFactEvidence,
    deleteFactEvidence,
  } = useGuidelines();

  // Active View Tab: 'rules' or 'evidence'
  const [activeTab, setActiveTab] = useState<'rules' | 'evidence'>('rules');

  // Guideline Modal State
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GuidelineRule | null>(null);

  // Fact Evidence Modal State
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<BrandFactEvidence | null>(null);

  // Feedback Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Rule summary calculations
  const totalRules = guidelines.length;
  const activeRulesCount = guidelines.filter((g) => g.status === 'Active').length;
  const restrictedTermsCount = guidelines.filter((g) => g.ruleType === 'Restricted Term').length;
  const factsWithEvidenceCount = factsEvidence.filter(
    (f) => f.evidenceStatus === 'Evidence Available'
  ).length;

  // Handlers for Guideline Rules
  const handleOpenAddGuideline = () => {
    setEditingRule(null);
    setIsGuidelineModalOpen(true);
  };

  const handleOpenEditGuideline = (rule: GuidelineRule) => {
    setEditingRule(rule);
    setIsGuidelineModalOpen(true);
  };

  const handleSaveGuideline = (ruleData: Omit<GuidelineRule, 'id' | 'lastUpdated'>) => {
    if (editingRule) {
      void updateGuideline(editingRule.id, ruleData);
      showToast(`Updated guideline "${ruleData.name}"`);
    } else {
      void addGuideline(ruleData);
      showToast(`Created guideline "${ruleData.name}"`);
    }
  };

  const handleToggleRuleStatus = (id: string) => {
    const target = guidelines.find((g) => g.id === id);
    if (target) {
      const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
      toggleGuidelineStatus(id);
      showToast(`Set "${target.name}" to ${nextStatus}`);
    }
  };

  const handleDeleteRule = (id: string) => {
    const target = guidelines.find((g) => g.id === id);
    deleteGuideline(id);
    if (target) {
      showToast(`Deleted guideline "${target.name}"`);
    }
  };

  // Handlers for Fact & Evidence
  const handleOpenAddFact = () => {
    setEditingFact(null);
    setIsFactModalOpen(true);
  };

  const handleOpenEditFact = (fact: BrandFactEvidence) => {
    setEditingFact(fact);
    setIsFactModalOpen(true);
  };

  const handleSaveFact = (factData: Omit<BrandFactEvidence, 'id' | 'lastUpdated'>) => {
    if (editingFact) {
      void updateFactEvidence(editingFact.id, factData);
      showToast(`Updated fact "${factData.claimName}"`);
    } else {
      void addFactEvidence(factData);
      showToast(`Registered fact "${factData.claimName}"`);
    }
  };

  const handleDeleteFact = (id: string) => {
    const target = factsEvidence.find((f) => f.id === id);
    deleteFactEvidence(id);
    if (target) {
      showToast(`Deleted fact "${target.claimName}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span>Standard & Knowledge Governance</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              Brand Guidelines
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              These rules define approved brand standards, preferred phrasing, restricted superlatives, and factual evidence requirements for all marketing drafts.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Standard: <strong className="font-medium text-slate-700">Enterprise Guideline Pack v2.4</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>Deterministic rules check + AI claim verification</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {activeTab === 'rules' ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAddGuideline}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Guideline
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenAddFact}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Fact & Evidence
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section View Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          aria-current={activeTab === 'rules' ? 'true' : undefined}
        >
          <Layers className="w-4 h-4" />
          <span>Brand Rules & Terminology</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'rules' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {totalRules}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'evidence'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          aria-current={activeTab === 'evidence' ? 'true' : undefined}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Approved Facts & Evidence</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'evidence' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {factsEvidence.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Rules & Terminology */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <section aria-label="Guideline Summary Statistics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Total Rules</span>
                  <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900 font-mono">{totalRules}</div>
                <p className="mt-1 text-xs text-slate-500">Configured brand standards</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Active Rules</span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-emerald-700 font-mono">{activeRulesCount}</div>
                <p className="mt-1 text-xs text-slate-500">Actively enforced in checks</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Restricted Terms</span>
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-700 font-mono">{restrictedTermsCount}</div>
                <p className="mt-1 text-xs text-slate-500">Prohibited words & superlatives</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Facts with Evidence</span>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-700 font-mono">{factsWithEvidenceCount}</div>
                <p className="mt-1 text-xs text-slate-500">Substantiated claim records</p>
              </div>
            </div>
          </section>

          {/* Guidelines Interactive Table */}
          <section aria-label="Brand Guidelines Directory">
            <GuidelinesTable
              rules={guidelines}
              onEdit={handleOpenEditGuideline}
              onToggleStatus={handleToggleRuleStatus}
              onDelete={handleDeleteRule}
              onAddNew={handleOpenAddGuideline}
            />
          </section>
        </div>
      )}

      {/* Tab 2: Brand Facts & Supporting Evidence */}
      {activeTab === 'evidence' && (
        <section aria-label="Brand Facts and Evidence Registry">
          <BrandFactsEvidenceSection
            facts={factsEvidence}
            onAddNew={handleOpenAddFact}
            onEdit={handleOpenEditFact}
            onDelete={handleDeleteFact}
          />
        </section>
      )}

      {/* Add / Edit Guideline Modal */}
      <GuidelineModal
        isOpen={isGuidelineModalOpen}
        onClose={() => setIsGuidelineModalOpen(false)}
        onSave={handleSaveGuideline}
        initialRule={editingRule}
      />

      {/* Add / Edit Fact & Evidence Modal */}
      <FactEvidenceModal
        isOpen={isFactModalOpen}
        onClose={() => setIsFactModalOpen(false)}
        onSave={handleSaveFact}
        initialFact={editingFact}
      />
    </div>
  );
};
