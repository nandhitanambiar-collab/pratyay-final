import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  FileCheck2, 
  History, 
  Settings, 
  ShieldCheck, 
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Brand Guidelines', path: '/guidelines', icon: BookOpenCheck, badge: 'v2.4' },
  { name: 'Content Reviews', path: '/reviews', icon: FileCheck2 },
  { name: 'Review History', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white font-sans">
                  Pratyay
                </span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Gov
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Brand Governance</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-indigo-500/50 text-indigo-100'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Core Principle Callout */}
        <div className="p-3 mx-3 mb-3 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-400 font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Human-in-the-Loop</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            AI suggestions are advisory. Final publication sign-off remains with authorized human reviewers.
          </p>
        </div>

        {/* Workspace Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">Acme Global Brands</p>
              <p className="text-[11px] text-slate-400 truncate">Demo Organization</p>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
