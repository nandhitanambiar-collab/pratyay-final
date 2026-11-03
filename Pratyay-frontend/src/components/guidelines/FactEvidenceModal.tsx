import React, { useState, useEffect, useRef } from 'react';
import type { BrandFactEvidence, EvidenceStatus } from '../../types';
import { Button } from '../common/Button';
import { X, AlertCircle, ShieldCheck } from 'lucide-react';

interface FactEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (factData: Omit<BrandFactEvidence, 'id' | 'lastUpdated'>) => void;
  initialFact?: BrandFactEvidence | null;
}

const EVIDENCE_STATUSES: EvidenceStatus[] = [
  'Evidence Available',
  'Missing Evidence',
  'Expired Evidence',
  'Needs Review',
];

interface FormProps {
  initialFact?: BrandFactEvidence | null;
  onClose: () => void;
  onSave: (factData: Omit<BrandFactEvidence, 'id' | 'lastUpdated'>) => void;
}

const FactEvidenceFormInner: React.FC<FormProps> = ({ initialFact, onClose, onSave }) => {
  const [claimName, setClaimName] = useState(initialFact?.claimName ?? '');
  const [approvedStatement, setApprovedStatement] = useState(initialFact?.approvedStatement ?? '');
  const [evidenceDescription, setEvidenceDescription] = useState(initialFact?.evidenceDescription ?? '');
  const [sourceReference, setSourceReference] = useState(initialFact?.sourceReference ?? '');
  const [evidenceStatus, setEvidenceStatus] = useState<EvidenceStatus>(initialFact?.evidenceStatus ?? 'Evidence Available');
  const [validFrom, setValidFrom] = useState(initialFact?.validFrom ?? '');
  const [expiryDate, setExpiryDate] = useState(initialFact?.expiryDate ?? '');
  const [notes, setNotes] = useState(initialFact?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!claimName.trim()) newErrors.claimName = 'Claim / fact name is required.';
    if (!approvedStatement.trim()) newErrors.approvedStatement = 'Approved statement text is required.';
    if (!evidenceDescription.trim()) newErrors.evidenceDescription = 'Evidence description is required.';
    if (!sourceReference.trim()) newErrors.sourceReference = 'Source reference or document ID is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      claimName: claimName.trim(),
      approvedStatement: approvedStatement.trim(),
      evidenceDescription: evidenceDescription.trim(),
      sourceReference: sourceReference.trim(),
      evidenceStatus,
      validFrom: validFrom || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
      {/* Claim / Fact Name */}
      <div>
        <label htmlFor="claim-name" className="block font-semibold text-slate-700 mb-1">
          Claim or Fact Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="claim-name"
          ref={nameInputRef}
          type="text"
          value={claimName}
          onChange={(e) => setClaimName(e.target.value)}
          placeholder="e.g. Daily Probiotic CFU Viability Standard"
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.claimName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.claimName && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.claimName}
          </p>
        )}
      </div>

      {/* Approved Statement */}
      <div>
        <label htmlFor="approved-statement" className="block font-semibold text-slate-700 mb-1">
          Approved Statement (Exact allowed wording) <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="approved-statement"
          rows={2}
          value={approvedStatement}
          onChange={(e) => setApprovedStatement(e.target.value)}
          placeholder="e.g. Contains 10 Billion verified live cultures per daily dose at time of manufacture."
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.approvedStatement ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.approvedStatement && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.approvedStatement}
          </p>
        )}
      </div>

      {/* Evidence Description & Source Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="source-reference" className="block font-semibold text-slate-700 mb-1">
            Source Document Reference / ID <span className="text-rose-500">*</span>
          </label>
          <input
            id="source-reference"
            type="text"
            value={sourceReference}
            onChange={(e) => setSourceReference(e.target.value)}
            placeholder="e.g. Eurofins Dossier #ECL-2025-9921"
            className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
              errors.sourceReference ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
            }`}
          />
          {errors.sourceReference && (
            <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.sourceReference}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="evidence-status" className="block font-semibold text-slate-700 mb-1">
            Evidence Status <span className="text-rose-500">*</span>
          </label>
          <select
            id="evidence-status"
            value={evidenceStatus}
            onChange={(e) => setEvidenceStatus(e.target.value as EvidenceStatus)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
          >
            {EVIDENCE_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="evidence-desc" className="block font-semibold text-slate-700 mb-1">
          Evidence Description & Methodology <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="evidence-desc"
          rows={2}
          value={evidenceDescription}
          onChange={(e) => setEvidenceDescription(e.target.value)}
          placeholder="e.g. Third-party microbiology stability testing confirming active colony counts over 18 months."
          className={`w-full p-2.5 bg-slate-50 border rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors ${
            errors.evidenceDescription ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
          }`}
        />
        {errors.evidenceDescription && (
          <p className="mt-1 text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {errors.evidenceDescription}
          </p>
        )}
      </div>

      {/* Validity Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="valid-from" className="block font-semibold text-slate-700 mb-1">
            Valid From (Optional)
          </label>
          <input
            id="valid-from"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label htmlFor="expiry-date" className="block font-semibold text-slate-700 mb-1">
            Evidence Expiry Date (Optional)
          </label>
          <input
            id="expiry-date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="fact-notes" className="block font-semibold text-slate-700 mb-1">
          Internal Verification Notes (Optional)
        </label>
        <input
          id="fact-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Valid across APAC & North America batches"
          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
        />
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
          {initialFact ? 'Save Changes' : 'Register Fact'}
        </Button>
      </div>
    </form>
  );
};

export const FactEvidenceModal: React.FC<FactEvidenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialFact,
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
      aria-labelledby="fact-modal-headline"
    >
      <div 
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="fact-modal-headline" className="text-base font-bold text-slate-900">
                {initialFact ? 'Edit Approved Fact & Evidence' : 'Add Brand Fact & Evidence'}
              </h2>
              <p className="text-xs text-slate-500">
                Register approved factual statements and link supporting research citations.
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

        {/* Inner Form Keyed for Clean Mounting */}
        <FactEvidenceFormInner
          key={initialFact?.id ?? 'new-fact'}
          initialFact={initialFact}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
};
