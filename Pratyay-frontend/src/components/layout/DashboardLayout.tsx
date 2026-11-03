import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Sticky Top Navigation */}
        <TopNav onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Enterprise Governance Footer Note */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Pratyay — An Intelligent Brand Governance Platform</span>
            <span className="text-slate-300">•</span>
            <span>Enterprise Brand Compliance Portal</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Advisory Rule Engine & Human-in-the-Loop Editorial Governance
          </div>
        </footer>
      </div>
    </div>
  );
};
