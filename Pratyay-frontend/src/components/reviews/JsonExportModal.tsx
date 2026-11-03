import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Info,
  Cpu,
  Server
} from 'lucide-react';
import { Button } from '../common/Button';
import type { ReviewItem, Finding, BrandFactEvidence, GuidelineRule, GovernanceAnalysisResult } from '../../types';
import { buildGovernanceAnalysisResult } from '../../utils/exportGovernanceJson';
import { apiClient } from '../../services/api/client';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem;
  findings: Finding[];
  facts?: BrandFactEvidence[];
  rules?: GuidelineRule[];
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  isOpen,
  onClose,
  review,
  findings,
  facts = [],
  rules = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [serverReport, setServerReport] = useState<GovernanceAnalysisResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let isMounted = true;
    apiClient.analysis
      .getReport(review.id)
      .then((res) => {
        if (isMounted && res && res.data) {
          setServerReport(res.data);
        }
      })
      .catch(() => {
        // Fallback to client-generated report
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, review.id]);

  if (!isOpen) return null;

  const report = serverReport || buildGovernanceAnalysisResult(review, findings, facts, rules);
  const jsonString = JSON.stringify(report, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pratyay_governance_report_${review.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-export-title"
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="json-export-title" className="text-base font-bold text-slate-900">
                Governance Analysis Report (Structured JSON)
              </h2>
              <p className="text-xs text-slate-500">
                Complete typed analysis payload adhering to the Pratyay backend contract schema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100/70 flex items-center justify-between text-xs text-indigo-900 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Target: <strong>{report.engine.configuredModelName}</strong></span>
            <span>•</span>
            <span className="text-indigo-700">Engine: <strong>{report.engine.actualEngineUsed}</strong></span>
            <span>•</span>
            {serverReport ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                <Server className="w-3 h-3 text-emerald-600" />
                Backend Report
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-medium">
                Client Preview
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-700">
            <span>{report.summary.totalFindings} findings</span>
            <span>•</span>
            <span>{report.claimVerifications.length} claims verified</span>
          </div>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-[55vh]">
          <pre className="whitespace-pre overflow-x-auto selection:bg-indigo-500 selection:text-white">
            {jsonString}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-[11px]">Filename: <code>pratyay_governance_report_{review.id}.json</code></span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied to Clipboard' : 'Copy JSON'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Analysis JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
