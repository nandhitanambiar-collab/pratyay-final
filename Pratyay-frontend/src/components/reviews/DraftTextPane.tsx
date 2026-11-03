import React, { useState, useMemo } from 'react';
import type { Finding, FindingSeverity } from '../../types';
import { 
  FileText, 
  Edit3, 
  Copy, 
  Check, 
  RotateCcw, 
  Lock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface TextSegment {
  text: string;
  isHighlight: boolean;
  finding?: Finding;
}

interface DraftTextPaneProps {
  originalText: string;
  workingDraftText: string;
  findings: Finding[];
  selectedFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
  onUpdateWorkingDraft: (newText: string) => void;
  onResetWorkingDraft: () => void;
}

export const DraftTextPane: React.FC<DraftTextPaneProps> = ({
  originalText,
  workingDraftText,
  findings,
  selectedFindingId,
  onSelectFinding,
  onUpdateWorkingDraft,
  onResetWorkingDraft,
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'working'>('original');
  const [copied, setCopied] = useState(false);

  // Compute non-overlapping highlighted spans for the original text
  const textSegments = useMemo<TextSegment[]>(() => {
    if (!originalText) return [];

    // Filter findings that have valid character offsets
    const validFindings = findings
      .filter((f) => 
        typeof f.startIndex === 'number' && 
        typeof f.endIndex === 'number' &&
        f.startIndex >= 0 &&
        f.endIndex <= originalText.length &&
        f.startIndex < f.endIndex
      )
      .sort((a, b) => (a.startIndex! - b.startIndex!));

    // Resolve any overlapping ranges by prioritizing higher severity
    const severityRank: Record<FindingSeverity, number> = {
      High: 4,
      Medium: 3,
      Low: 2,
      Notice: 1,
    };

    const cleanSpans: Finding[] = [];
    for (const f of validFindings) {
      const overlapIdx = cleanSpans.findIndex(
        (existing) =>
          Math.max(existing.startIndex!, f.startIndex!) <
          Math.min(existing.endIndex!, f.endIndex!)
      );

      if (overlapIdx === -1) {
        cleanSpans.push(f);
      } else {
        const existing = cleanSpans[overlapIdx];
        if (severityRank[f.severity] > severityRank[existing.severity]) {
          cleanSpans[overlapIdx] = f;
        }
      }
    }

    cleanSpans.sort((a, b) => a.startIndex! - b.startIndex!);

    const segments: TextSegment[] = [];
    let currentIndex = 0;

    for (const finding of cleanSpans) {
      const start = finding.startIndex!;
      const end = finding.endIndex!;

      // Leading plain text
      if (start > currentIndex) {
        segments.push({
          text: originalText.slice(currentIndex, start),
          isHighlight: false,
        });
      }

      // Highlighted match
      segments.push({
        text: originalText.slice(start, end),
        isHighlight: true,
        finding,
      });

      currentIndex = end;
    }

    // Trailing plain text
    if (currentIndex < originalText.length) {
      segments.push({
        text: originalText.slice(currentIndex),
        isHighlight: false,
      });
    }

    return segments;
  }, [originalText, findings]);

  const handleCopy = async () => {
    const textToCopy = activeTab === 'original' ? originalText : workingDraftText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard write fallback
    }
  };

  const getHighlightClass = (severity: FindingSeverity, isSelected: boolean, status: string) => {
    const isHandled = status === 'accepted' || status === 'dismissed' || status === 'resolved';

    let base = 'cursor-pointer px-1 py-0.5 rounded transition-all inline font-sans text-xs sm:text-sm ';

    if (isSelected) {
      base += 'ring-2 ring-indigo-600 ring-offset-1 shadow-xs ';
    }

    if (isHandled) {
      return base + 'bg-slate-100 text-slate-700 border-b border-dashed border-slate-400 line-through/20';
    }

    switch (severity) {
      case 'High':
        return base + 'bg-rose-100/90 text-rose-950 border-b-2 border-rose-500 underline decoration-rose-500 decoration-wavy';
      case 'Medium':
        return base + 'bg-amber-100/90 text-amber-950 border-b-2 border-amber-500 underline decoration-amber-500 decoration-dashed';
      case 'Low':
        return base + 'bg-blue-100/90 text-blue-950 border-b border-blue-400';
      case 'Notice':
        return base + 'bg-emerald-100/90 text-emerald-950 border-b border-emerald-500';
    }
  };

  const wordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Pane Tab Navigation */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Draft text view mode">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'original'}
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'original'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Original Submitted Draft</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'working'}
            onClick={() => setActiveTab('working')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'working'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Working Revision Draft</span>
            {workingDraftText !== originalText && (
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'working' && workingDraftText !== originalText && (
            <button
              type="button"
              onClick={onResetWorkingDraft}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              title="Reset revision draft back to verbatim original"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Revision</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
            title="Copy text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pane Body */}
      <div className="p-5 flex-1 overflow-y-auto">
        {activeTab === 'original' ? (
          <div className="space-y-4">
            {/* Status notice */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Original Submitted Copy (Unchanged & Read-Only)</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Click any highlighted span to jump to its explainable finding
              </span>
            </div>

            {/* Interactive highlighted text adhering to modern-web-guidance for highlight-text-ranges & accessibility */}
            <div 
              tabIndex={0}
              role="region"
              aria-label="Submitted marketing copy with governance highlights"
              className="p-5 bg-white border border-slate-200 rounded-xl min-h-[300px] text-slate-800 text-sm sm:text-base leading-relaxed tracking-normal focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 select-text"
            >
              {textSegments.map((segment, index) => {
                if (!segment.isHighlight || !segment.finding) {
                  return (
                    <span key={index} className="whitespace-pre-wrap">
                      {segment.text}
                    </span>
                  );
                }

                const finding = segment.finding;
                const isSelected = selectedFindingId === finding.id;

                return (
                  <mark
                    key={index}
                    role="button"
                    tabIndex={0}
                    aria-label={`Flagged text: "${segment.text}". Severity: ${finding.severity}. Status: ${finding.status}. Press Enter to view finding.`}
                    onClick={() => onSelectFinding(finding.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectFinding(finding.id);
                      }
                    }}
                    className={getHighlightClass(finding.severity, isSelected, finding.status)}
                    title={`Severity: ${finding.severity} • ${finding.title}`}
                  >
                    {segment.text}
                  </mark>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 h-full flex flex-col">
            {/* Working Draft Notice */}
            <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-900">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Editable Working Revision (Applies suggested corrections safely)</span>
              </span>
              <span className="text-[11px] text-indigo-700">
                Original submitted text remains untouched
              </span>
            </div>

            <label htmlFor="working-draft-editor" className="sr-only">
              Editable revision draft marketing text
            </label>
            <textarea
              id="working-draft-editor"
              value={workingDraftText}
              onChange={(e) => onUpdateWorkingDraft(e.target.value)}
              rows={12}
              className="w-full flex-1 p-4 text-sm sm:text-base leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors resize-y font-sans min-h-[300px]"
              placeholder="Edit your revision draft here..."
            />
          </div>
        )}
      </div>

      {/* Pane Footer: Word and Character counts */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-5">
        <div className="flex items-center gap-3">
          <span>
            Words: <strong className="font-semibold text-slate-700">
              {wordCount(activeTab === 'original' ? originalText : workingDraftText)}
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Characters: <strong className="font-semibold text-slate-700">
              {(activeTab === 'original' ? originalText : workingDraftText).length}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <span>Original draft preserved independently</span>
        </div>
      </div>
    </div>
  );
};
