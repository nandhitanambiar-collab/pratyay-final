import React, { useState, useEffect, useRef } from 'react';
import type { GuidelineRule, GuidelineCategory, RuleType, GuidelineStatus } from '../../types';
import { Button } from '../common/Button';
import { X, AlertCircle, Info, BookOpenCheck } from 'lucide-react';

interface GuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: Omit<GuidelineRule, 'id' | 'lastUpdated'>) => void;
  initialRule?: GuidelineRule | null;
}

const CATEGORIES: GuidelineCategory[] = [
  'Tone and Voice',
  'Terminology',
  'Required Wording',
  'Brand Facts',
  'Promotional Claims',
  'Accessibility',
];

const RULE_TYPES: RuleType[] = [
  'Preferred Term',
  'Restricted Term',
  'Required Text',
  'Factual Requirement',
  'General Rule',
];

interface FormProps {
  initialRule?: GuidelineRule | null;
  onClose: () => void;
  onSave: (ruleData: Omit<GuidelineRule, 'id' | 'lastUpdated'>) => void;
}

const GuidelineFormInner: React.FC<FormProps> = ({ initialRule, onClose, onSave }) => {
  const [name, setName] = useState(initialRule?.name ?? '');
  const [category, setCategory] = useState<GuidelineCategory>(initialRule?.category ?? 'Terminology');
  const [ruleType, setRuleType] = useState<RuleType>(initialRule?.ruleType ?? 'Preferred Term');
  const [summary, setSummary] = useState(initialRule?.summary ?? '');
  const [description, setDescription] = useState(initialRule?.description ?? '');
  const [targetTerm, setTargetTerm] = useState(initialRule?.targetTerm ?? '');
  const [replacementTerm, setReplacementTerm] = useState(initialRule?.replacementTerm ?? '');
  const [status, setStatus] = useState<GuidelineStatus>(initialRule?.status ?? 'Active');
  const [notes, setNotes] = useState(initialRule?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Guideline name is required.';
    if (!summary.trim()) newErrors.summary = 'A concise rule summary is required.';
    if (!description.trim()) newErrors.description = 'Detailed rule description is required.';
    
    if (ruleType === 'Restricted Term' && !targetTerm.trim()) {
      newErrors.targetTerm = 'Please specify the restricted term or phrase.';
    }
    if (ruleType === 'Preferred Term' && !targetTerm.trim()) {
      newErrors.targetTerm = 'Please specify the discouraged term to replace.';
    }
    if (ruleType === 'Preferred Term' && !replacementTerm.trim()) {
      newErrors.replacementTerm = 'Please specify the approved preferred term.';
    }
    if (ruleType === 'Required Text' && !targetTerm.trim()) {
      newErrors.targetTerm = 'Please specify the required text or mandatory disclaimer.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      category,
      ruleType,
      summary: summary.trim(),
      description: description.trim(),
      targetTerm: targetTerm.trim() || undefined,
      replacementTerm: ruleType === 'Preferred Term' ? replacementTerm.trim() || undefined : undefined,
      status,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
      {/* Guideline Name */}
      <div>
        <label htmlFor="guideline-name" className="block font-semibold text-slate-700 mb-1">
          Guideline / Rule Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="guideline-name"
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Prohibited ASCI Superlatives & Unbacked Claims"
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
          </p>
        )}
      </div>

      {/* Category & Rule Type Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="guideline-category" className="block font-semibold text-slate-700 mb-1">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="guideline-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as GuidelineCategory)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="guideline-type" className="block font-semibold text-slate-700 mb-1">
            Rule Type <span className="text-rose-500">*</span>
          </label>
          <select
            id="guideline-type"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as RuleType)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
          >
            {RULE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Context-aware Term Inputs */}
      {ruleType === 'Preferred Term' && (
        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg space-y-3">
          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
            <Info className="w-3.5 h-3.5" />
            <span>Preferred Terminology Mapping</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="discouraged-term" className="block font-medium text-slate-700 mb-1">
                Discouraged / Avoided Term <span className="text-rose-500">*</span>
              </label>
              <input
                id="discouraged-term"
                type="text"
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                placeholder="e.g. Green Cars / Miracle Vehicles"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
              {errors.targetTerm && <p className="mt-1 text-rose-600 text-[11px]">{errors.targetTerm}</p>}
            </div>
            <div>
              <label htmlFor="preferred-replacement" className="block font-medium text-slate-700 mb-1">
                Approved Preferred Term <span className="text-rose-500">*</span>
              </label>
              <input
                id="preferred-replacement"
                type="text"
                value={replacementTerm}
                onChange={(e) => setReplacementTerm(e.target.value)}
                placeholder="e.g. Clean Energy Commercial Fleet"
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
              {errors.replacementTerm && <p className="mt-1 text-rose-600 text-[11px]">{errors.replacementTerm}</p>}
            </div>
          </div>
        </div>
      )}

      {ruleType === 'Restricted Term' && (
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
          <label htmlFor="restricted-phrase" className="block font-semibold text-amber-900 mb-1">
            Restricted Term(s) or Superlative(s) <span className="text-rose-500">*</span>
          </label>
          <input
            id="restricted-phrase"
            type="text"
            value={targetTerm}
            onChange={(e) => setTargetTerm(e.target.value)}
            placeholder="e.g. India's #1 / Guaranteed Cure / 100% Effective"
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
          <p className="text-[11px] text-amber-700">Separate multiple synonyms or prohibited phrases with slashes or commas.</p>
          {errors.targetTerm && <p className="text-rose-600 text-[11px] font-medium">{errors.targetTerm}</p>}
        </div>
      )}

      {ruleType === 'Required Text' && (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
          <label htmlFor="required-clause" className="block font-semibold text-blue-900 mb-1">
            Mandatory Disclaimer or Required Text <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="required-clause"
            rows={2}
            value={targetTerm}
            onChange={(e) => setTargetTerm(e.target.value)}
            placeholder="e.g. *Results reflect select top candidates from specialized intensive coaching programs."
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
          {errors.targetTerm && <p className="text-rose-600 text-[11px] font-medium">{errors.targetTerm}</p>}
        </div>
      )}

      {ruleType === 'Factual Requirement' && (
        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg space-y-2">
          <label htmlFor="factual-parameter" className="block font-semibold text-slate-800 mb-1">
            Approved Fact / Quantity Specification
          </label>
          <input
            id="factual-parameter"
            type="text"
            value={targetTerm}
            onChange={(e) => setTargetTerm(e.target.value)}
            placeholder="e.g. 10 Billion Live CFUs at time of manufacture"
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      )}

      {/* Rule Summary */}
      <div>
        <label htmlFor="rule-summary" className="block font-semibold text-slate-700 mb-1">
          Rule Summary (One-liner) <span className="text-rose-500">*</span>
        </label>
        <input
          id="rule-summary"
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. Prohibit unproven efficacy superlatives without certified test reports"
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.summary ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.summary && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.summary}
          </p>
        )}
      </div>

      {/* Detailed Description */}
      <div>
        <label htmlFor="rule-desc" className="block font-semibold text-slate-700 mb-1">
          Detailed Rule Description & Rationale <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="rule-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain why this rule exists, where it applies, and how reviewers should enforce it..."
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
          </p>
        )}
      </div>

      {/* Status & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="block font-semibold text-slate-700 mb-1.5">Enforcement Status</span>
          <div className="flex items-center gap-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input
                type="radio"
                name="rule-status"
                checked={status === 'Active'}
                onChange={() => setStatus('Active')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-600">
              <input
                type="radio"
                name="rule-status"
                checked={status === 'Inactive'}
                onChange={() => setStatus('Inactive')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Inactive (Paused)</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="rule-notes" className="block font-semibold text-slate-700 mb-1">
            Internal Governance Notes (Optional)
          </label>
          <input
            id="rule-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. ASCI Code Chap 1 reference"
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Modal Actions Footer */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
        >
          {initialRule ? 'Save Changes' : 'Create Guideline'}
        </Button>
      </div>
    </form>
  );
};

export const GuidelineModal: React.FC<GuidelineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-base font-bold text-slate-900">
                {initialRule ? 'Edit Brand Guideline' : 'Add New Brand Guideline'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure explicit governance rules, terminology dictionaries, and requirements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Keyed for Clean Mounting */}
        <GuidelineFormInner
          key={initialRule?.id ?? 'new-guideline'}
          initialRule={initialRule}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
};
