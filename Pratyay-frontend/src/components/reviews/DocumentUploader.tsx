import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, X, RefreshCw, FileCode, Info } from 'lucide-react';
import { extractTextFromFile, validateUploadFile, type ExtractionResult } from '../../utils/fileExtractor';

interface DocumentUploaderProps {
  onTextExtracted: (text: string, originalText: string, metadata: { filename: string; fileSize: number; fileType: string; extractedAt: string }) => void;
  onClear: () => void;
  currentDocument?: {
    filename: string;
    fileSize: number;
    fileType: string;
    extractedAt: string;
  };
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onTextExtracted,
  onClear,
  currentDocument,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    setExtractionResult(null);

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file.');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractTextFromFile(file);
      setIsExtracting(false);
      setExtractionResult(result);

      if (result.success && result.text) {
        onTextExtracted(result.text, result.text, {
          filename: result.filename,
          fileSize: result.fileSize,
          fileType: result.fileType,
          extractedAt: new Date().toISOString(),
        });
      } else {
        setUploadError(result.error || 'Failed to extract text from document.');
      }
    } catch (err) {
      setIsExtracting(false);
      setUploadError(err instanceof Error ? err.message : 'Unknown extraction error.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setExtractionResult(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const activeDocName = extractionResult?.filename || currentDocument?.filename;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* When a document is loaded or extracted successfully */}
      {activeDocName && !isExtracting ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 text-sm">{activeDocName}</p>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Text Extracted
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 mt-1 flex-wrap">
                  {extractionResult?.wordCount !== undefined && (
                    <span><strong>{extractionResult.wordCount}</strong> words</span>
                  )}
                  {extractionResult?.charCount !== undefined && (
                    <span><strong>{extractionResult.charCount}</strong> characters</span>
                  )}
                  {extractionResult?.fileSize && (
                    <span>{(extractionResult.fileSize / 1024).toFixed(1)} KB</span>
                  )}
                </div>

                {extractionResult?.notice && (
                  <p className="text-[11px] text-emerald-900 mt-2 bg-emerald-100/60 rounded px-2 py-1">
                    {extractionResult.notice}
                  </p>
                )}
                
                <p className="text-[11px] text-slate-500 mt-1.5">
                  The extracted copy has populated the editor below. You can make adjustments before submitting for governance review.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                title="Replace document"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                title="Remove uploaded document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone / Upload area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleTriggerFileInput}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
          }`}
        >
          {isExtracting ? (
            <div className="py-3 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-800">Extracting readable text from document...</p>
              <p className="text-[11px] text-slate-500">Parsing paragraphs and formatting structure</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  <span className="text-indigo-600 hover:underline">Click to upload</span> or drag and drop marketing copy
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Supports <strong>.txt</strong>, <strong>.docx</strong>, and text-based <strong>.pdf</strong> (up to 5 MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload error banner if any */}
      {uploadError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Document Processing Notice</p>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Informative footer disclaimer regarding OCR & offline frontend capabilities */}
      <div className="flex items-center gap-2 px-1 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span>
          Note: Scanned PDFs, photographed assets, and rasterized images require backend OCR (Python/FastAPI). Text is extracted locally in this demo phase.
        </span>
      </div>
    </div>
  );
};
