import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReviews } from '../hooks/useReviews';
import { Button } from '../components/common/Button';
import type { ContentType, ReviewItem } from '../types';
import { DocumentUploader } from '../components/reviews/DocumentUploader';
import { ModelSelector } from '../components/reviews/ModelSelector';
import { getStoredModelId, setStoredModelId } from '../config/models';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  X, 
  AlertCircle, 
  Info,
  FileEdit,
  PenLine,
  FileUp,
  FileCheck
} from 'lucide-react';

const CONTENT_TYPES: ContentType[] = [
  'Social Media Post',
  'Advertisement Copy',
  'Product Description',
  'Email Campaign',
  'Landing Page Copy',
  'Other',
];

const BRAND_PACKS = [
  { id: 'pack-corporate-v2.4', name: 'Enterprise Brand Standard v2.4 (Active)' },
  { id: 'pack-health-asci-2025', name: 'Healthcare & Personal Care Pack (ASCI 2025)' },
  { id: 'pack-b2b-tech', name: 'B2B Technical Collateral Pack' },
  { id: 'pack-fintech-ccpa-2026', name: 'FinTech & Lending Disclosure Pack (CCPA 2026)' },
];

interface InnerProps {
  existingReview?: ReviewItem;
  id?: string;
}

const ContentEditorInner: React.FC<InnerProps> = ({ existingReview, id }) => {
  const navigate = useNavigate();
  const { addReview, updateReview, submitReview } = useReviews();
  const isEditing = Boolean(id);

  const [campaignTitle, setCampaignTitle] = useState(existingReview?.campaignTitle ?? '');
  const [contentType, setContentType] = useState<ContentType>(existingReview?.contentType ?? 'Advertisement Copy');
  const [brandPackName, setBrandPackName] = useState(existingReview?.brandPackName ?? 'Enterprise Brand Standard v2.4 (Active)');
  const [campaignContext, setCampaignContext] = useState(existingReview?.campaignContext ?? '');
  const [draftText, setDraftText] = useState(existingReview?.draftText ?? '');
  
  // Document upload state
  const [uploadedDoc, setUploadedDoc] = useState<{
    filename: string;
    fileSize: number;
    fileType: string;
    extractedAt: string;
    originalExtractedText?: string;
  } | undefined>(existingReview?.uploadedDocument);

  // Model selection state
  const [selectedModelId, setSelectedModelId] = useState<string>(
    existingReview?.targetModelId ?? getStoredModelId()
  );

  // Input mode: direct text typing vs document upload
  const [inputMode, setInputMode] = useState<'text' | 'document'>(
    existingReview?.uploadedDocument ? 'document' : 'text'
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Word and character counts
  const charCount = draftText.length;
  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setStoredModelId(modelId);
    setIsDirty(true);
  };

  const handleDocumentExtracted = (
    text: string,
    originalText: string,
    meta: { filename: string; fileSize: number; fileType: string; extractedAt: string }
  ) => {
    setDraftText(text);
    setUploadedDoc({
      ...meta,
      originalExtractedText: originalText,
    });
    setIsDirty(true);
    // Clear draft text validation error if previously raised
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.draftText;
      return copy;
    });
  };

  const handleDocumentClear = () => {
    setUploadedDoc(undefined);
    setIsDirty(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!campaignTitle.trim()) {
      newErrors.campaignTitle = 'Campaign or content title is required.';
    }
    if (!draftText.trim()) {
      newErrors.draftText = 'Draft marketing text is required. Please type text or upload a document.';
    } else if (draftText.trim().length < 15) {
      newErrors.draftText = 'Draft copy should be at least 15 characters to allow governance evaluation.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        await updateReview(id, {
          campaignTitle: campaignTitle.trim(),
          contentType,
          brandPackName,
          campaignContext: campaignContext.trim() || undefined,
          draftText: draftText.trim(),
          uploadedDocument: uploadedDoc,
          targetModelId: selectedModelId,
          status: existingReview?.status === 'In Review' ? 'In Review' : 'Draft',
        });
      } else {
        await addReview({
          campaignTitle: campaignTitle.trim(),
          category: contentType,
          contentType,
          brandPackName,
          campaignContext: campaignContext.trim() || undefined,
          draftText: draftText.trim(),
          originalDraftText: draftText.trim(),
          uploadedDocument: uploadedDoc,
          targetModelId: selectedModelId,
          status: 'Draft',
          submittedBy: {
            name: 'Content Creator (Demo)',
            role: 'Content Creator (Demo)',
          },
          flaggedIssuesCount: 0,
          unverifiedClaimsCount: 0,
        });
      }

      setIsSubmitting(false);
      navigate('/reviews', { state: { flashMessage: `Draft "${campaignTitle.trim()}" saved successfully.` } });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Failed to save review draft.';
      setErrors((prev) => ({ ...prev, submit: msg }));
    }
  };

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        await updateReview(id, {
          campaignTitle: campaignTitle.trim(),
          contentType,
          brandPackName,
          campaignContext: campaignContext.trim() || undefined,
          draftText: draftText.trim(),
          uploadedDocument: uploadedDoc,
          targetModelId: selectedModelId,
          status: 'In Review',
        });
        await submitReview(id);
      } else {
        await addReview({
          campaignTitle: campaignTitle.trim(),
          category: contentType,
          contentType,
          brandPackName,
          campaignContext: campaignContext.trim() || undefined,
          draftText: draftText.trim(),
          originalDraftText: draftText.trim(),
          uploadedDocument: uploadedDoc,
          targetModelId: selectedModelId,
          status: 'In Review',
          submittedBy: {
            name: 'Content Creator (Demo)',
            role: 'Content Creator (Demo)',
          },
          flaggedIssuesCount: 0,
          unverifiedClaimsCount: 0,
        });
      }

      setIsSubmitting(false);
      navigate('/reviews', { state: { flashMessage: `Draft "${campaignTitle.trim()}" submitted for brand review.` } });
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Failed to submit review.';
      setErrors((prev) => ({ ...prev, submit: msg }));
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard and return to Content Reviews?')) {
        navigate('/reviews');
      }
    } else {
      navigate('/reviews');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Content Reviews</span>
        </button>
      </div>

      {/* Editor Surface Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md">
                {isEditing ? 'Draft Revision Workspace' : 'Content Submission Workspace'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-sans mt-2">
                {isEditing ? 'Edit Marketing Draft' : 'Prepare Marketing Content'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Draft promotional copy, upload collateral documents, select AI model targets, and submit for explainable governance checks.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hidden sm:block">
              <FileEdit className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form className="p-6 space-y-6 text-xs">
          {errors.submit && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold">Submission failed:</span> {errors.submit}
              </div>
            </div>
          )}

          {/* Campaign / Content Title */}
          <div>
            <label htmlFor="campaign-title" className="block font-semibold text-slate-800 mb-1.5">
              Campaign Name or Content Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="campaign-title"
              type="text"
              value={campaignTitle}
              onChange={(e) => {
                setCampaignTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Q4 Consumer Product Launch — Social Ad Copy"
              className={`w-full p-3 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors text-sm ${
                errors.campaignTitle ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
              }`}
            />
            {errors.campaignTitle && (
              <p className="mt-1.5 text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.campaignTitle}
              </p>
            )}
          </div>

          {/* Metadata Grid: Brand Pack & Content Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand-pack" className="block font-semibold text-slate-800 mb-1.5">
                Brand Guideline Pack <span className="text-rose-500">*</span>
              </label>
              <select
                id="brand-pack"
                value={brandPackName}
                onChange={(e) => {
                  setBrandPackName(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {BRAND_PACKS.map((pack) => (
                  <option key={pack.id} value={pack.name}>{pack.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Determines which terminology dictionaries and claim rules are applied.
              </p>
            </div>

            <div>
              <label htmlFor="content-type" className="block font-semibold text-slate-800 mb-1.5">
                Content Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="content-type"
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value as ContentType);
                  setIsDirty(true);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden cursor-pointer"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400">
                Sets channel-specific constraints and disclosure guidelines.
              </p>
            </div>
          </div>

          {/* Campaign Context (Optional) */}
          <div>
            <label htmlFor="campaign-context" className="block font-semibold text-slate-800 mb-1.5">
              Campaign Context & Target Audience <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              id="campaign-context"
              type="text"
              value={campaignContext}
              onChange={(e) => {
                setCampaignContext(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Meta feed ads targeting young professionals interested in clean personal care"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* Model Selection UI */}
          <div className="pt-2">
            <ModelSelector
              selectedModelId={selectedModelId}
              onSelectModel={handleModelChange}
            />
          </div>

          {/* Content Input Mode Selector Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="font-semibold text-slate-800 text-sm">
                Marketing Content & Copy Source <span className="text-rose-500">*</span>
              </label>

              {/* Mode Toggle Buttons */}
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'text'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Direct Input</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('document')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'document'
                      ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Document Uploader View (when active) */}
            {inputMode === 'document' && (
              <div className="space-y-3">
                <DocumentUploader
                  onTextExtracted={handleDocumentExtracted}
                  onClear={handleDocumentClear}
                  currentDocument={uploadedDoc}
                />
              </div>
            )}

            {/* Notice if document was extracted */}
            {uploadedDoc && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    Source Document: <strong>{uploadedDoc.filename}</strong> ({(uploadedDoc.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Original text preserved separately
                </span>
              </div>
            )}

            {/* Editable Draft Text Area (always available to view/edit working text) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="draft-text" className="font-semibold text-slate-800 text-xs">
                  {uploadedDoc ? 'Editable Working Copy (Extracted Text)' : 'Marketing Draft Text'}
                </label>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                </div>
              </div>

              <textarea
                id="draft-text"
                rows={8}
                value={draftText}
                onChange={(e) => {
                  setDraftText(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Enter or paste draft marketing copy here... (e.g. headlines, body copy, call-to-actions, or product claims)"
                className={`w-full p-3.5 bg-slate-50 border rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors font-sans leading-relaxed text-sm ${
                  errors.draftText ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {errors.draftText && (
                <p className="mt-1.5 text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.draftText}
                </p>
              )}
            </div>
          </div>

          {/* Governance Notice Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 text-xs">
                Submission & Governance Workflow
              </p>
              <p className="text-[11px] leading-relaxed">
                Saving as a draft keeps your content private and editable. Submitting for review runs automated deterministic checks against active brand guidelines and queues the submission for authorized human review.
              </p>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                leftIcon={<Save className="w-4 h-4 text-slate-600" />}
                className="flex-1 sm:flex-initial"
              >
                Save Draft
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                Submit for Review
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ContentEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getReviewById } = useReviews();

  const isEditing = Boolean(id);
  const existingReview = id ? getReviewById(id) : undefined;

  // Handle missing record in edit mode
  if (isEditing && !existingReview) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Draft Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested content draft (<span className="font-mono">{id}</span>) could not be found or may have been deleted.
        </p>
        <div className="mt-6">
          <Button variant="primary" size="sm" onClick={() => navigate('/reviews')}>
            Return to Content Reviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ContentEditorInner
      key={id ?? 'new-draft'}
      existingReview={existingReview}
      id={id}
    />
  );
};
