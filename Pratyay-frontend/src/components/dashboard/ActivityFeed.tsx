import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityEvent } from '../../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  FileUp, 
  BookOpen, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const navigate = useNavigate();

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'change_request':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
          bg: 'bg-amber-100 text-amber-700 ring-4 ring-white',
        };
      case 'verification':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          bg: 'bg-emerald-100 text-emerald-700 ring-4 ring-white',
        };
      case 'system_flag':
        return {
          icon: <Bot className="w-3.5 h-3.5 text-indigo-600" />,
          bg: 'bg-indigo-100 text-indigo-700 ring-4 ring-white',
        };
      case 'submission':
        return {
          icon: <FileUp className="w-3.5 h-3.5 text-blue-600" />,
          bg: 'bg-blue-100 text-blue-700 ring-4 ring-white',
        };
      case 'guideline_update':
      default:
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-slate-600" />,
          bg: 'bg-slate-100 text-slate-700 ring-4 ring-white',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Review Activity
          </h2>
          <p className="text-[11px] text-slate-500">
            Recent governance decisions and audit events
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Audit Log</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="mt-4 flex-1 space-y-4">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-semibold text-slate-700 text-xs">No review activity yet</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Audit events and human review decisions will appear here as you submit, inspect, and approve marketing content.
            </p>
          </div>
        ) : (
          activities.map((event, index) => {
          const config = getEventIcon(event.type);
          const isLast = index === activities.length - 1;

          return (
            <div key={event.id} className="relative flex items-start gap-3 text-xs">
              {/* Connecting line */}
              {!isLast && (
                <div 
                  className="absolute left-3.5 top-6 bottom-0 w-0.5 bg-slate-100" 
                  aria-hidden="true" 
                />
              )}

              {/* Icon badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${config.bg}`}>
                {config.icon}
              </div>

              {/* Event Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-slate-700 leading-snug">
                  <strong className="font-semibold text-slate-900">{event.actor}</strong>{' '}
                  <span className="text-slate-600">{event.action}</span>{' '}
                  <strong className="font-medium text-slate-900 break-words">{event.target}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.timestamp}
                  </span>
                  <span>•</span>
                  <span>{event.role}</span>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Footer hint */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        All review actions maintain full provenance and auditability.
      </div>
    </div>
  );
};
