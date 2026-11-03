import React from 'react';
import type { 
  ReviewStatus, 
  ClaimVerificationStatus, 
  GuidelineStatus, 
  EvidenceStatus 
} from '../../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileEdit, 
  ShieldAlert, 
  XCircle
} from 'lucide-react';

export type AnyBadgeStatus = 
  | ReviewStatus 
  | ClaimVerificationStatus 
  | GuidelineStatus 
  | EvidenceStatus;

interface StatusBadgeProps {
  status: AnyBadgeStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : 'px-2.5 py-1 text-xs font-semibold';

  const getStatusConfig = () => {
    switch (status) {
      case 'Active':
      case 'Approved':
      case 'Supported':
      case 'Evidence Available':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" aria-hidden="true" />,
        };
      case 'In Review':
      case 'Needs Human Review':
      case 'Needs Review':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-200',
          dot: 'bg-blue-500',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" aria-hidden="true" />,
        };
      case 'Needs Changes':
      case 'Contradicted':
      case 'Unsubstantiated':
      case 'Missing Evidence':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mr-1 shrink-0" aria-hidden="true" />,
        };
      case 'Expired':
      case 'Expired Evidence':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          dot: 'bg-rose-500',
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600 mr-1 shrink-0" aria-hidden="true" />,
        };
      case 'Inactive':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          border: 'border-slate-300',
          dot: 'bg-slate-400',
          icon: <XCircle className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" aria-hidden="true" />,
        };
      case 'Draft':
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
          dot: 'bg-slate-400',
          icon: <FileEdit className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" aria-hidden="true" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span 
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} shadow-xs transition-colors`}
    >
      {showIcon ? (
        config.icon
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5 shrink-0`} aria-hidden="true" />
      )}
      <span className="truncate">{status}</span>
    </span>
  );
};
