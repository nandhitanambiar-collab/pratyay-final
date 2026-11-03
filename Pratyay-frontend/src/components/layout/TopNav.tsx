import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronRight
} from 'lucide-react';
import { useAudit } from '../../hooks/useAudit';
import { useReviews } from '../../hooks/useReviews';

interface TopNavProps {
  onOpenSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenSidebar }) => {
  const location = useLocation();
  const { events } = useAudit();
  const { isBackendConnected } = useReviews();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const alerts = events.slice(0, 5);

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return { section: 'Governance', title: 'Overview Dashboard' };
      case '/guidelines':
        return { section: 'Standards', title: 'Brand Guidelines' };
      case '/reviews':
        return { section: 'Workflow', title: 'Content Reviews' };
      case '/history':
        return { section: 'Audit', title: 'Review History' };
      case '/settings':
        return { section: 'Configuration', title: 'Settings' };
      default:
        return { section: 'Platform', title: 'Dashboard' };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center text-sm font-medium">
          <span className="text-slate-400 hidden sm:inline">{pageMeta.section}</span>
          <ChevronRight className="w-4 h-4 text-slate-300 mx-1.5 hidden sm:inline" />
          <span className="text-slate-800 font-semibold">{pageMeta.title}</span>
        </nav>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Control */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <label htmlFor="top-search" className="sr-only">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="top-search"
              type="text"
              placeholder="Search reviews, claims, rules..."
              className="w-full pl-9 pr-9 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-medium text-slate-400 bg-white px-1.5 py-0.5 border border-slate-200 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Backend Connection Status Indicator */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200"
          title={isBackendConnected ? 'Backend API connected at http://127.0.0.1:8000/api/v1' : 'Backend offline - operating in deterministic local demo mode'}
        >
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
          <span className={isBackendConnected ? 'text-emerald-700 font-semibold text-[11px]' : 'text-amber-700 text-[11px]'}>
            {isBackendConnected ? 'Backend Live' : 'Demo Mode (Offline)'}
          </span>
        </div>

        {/* Notification Bell with Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="View notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in-50 duration-150"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Governance Alerts</span>
                {alerts.length > 0 ? (
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    {alerts.length} New
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">0 Alerts</span>
                )}
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    <Bell className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-slate-700">No governance alerts</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Audit actions and review decisions will appear here.</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="font-medium text-slate-800 line-clamp-1">{alert.summary}</p>
                      {alert.reviewTitle && (
                        <p className="text-slate-500 mt-0.5 text-[11px] line-clamp-1">{alert.reviewTitle}</p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 inline-block">{alert.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
              {alerts.length > 0 && (
                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-indigo-600 font-medium hover:underline cursor-pointer"
                  >
                    Dismiss all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="User profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center ring-1 ring-indigo-200">
              DR
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">Demo Reviewer</p>
              <p className="text-[10px] text-slate-500 leading-tight">Lead Brand Reviewer</p>
            </div>
          </button>

          {showProfileMenu && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs"
              role="menu"
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">Demo Reviewer</p>
                <p className="text-[11px] text-slate-500">reviewer@pratyay-governance.internal</p>
                <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  Pratyay Brand Workspace
                </span>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-slate-600 flex items-center justify-between">
                  <span>Role</span>
                  <span className="font-medium text-slate-800">Editorial Reviewer (Demo)</span>
                </div>
                <div className="px-3 py-1.5 text-slate-600 flex items-center justify-between">
                  <span>Environment</span>
                  <span className="font-medium text-slate-800">Local Demonstration</span>
                </div>
              </div>
              <div className="border-t border-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-2 py-1 rounded text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Close Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
