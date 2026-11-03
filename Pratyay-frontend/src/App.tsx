import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuidelineProvider } from './context/GuidelineContext';
import { AuditProvider } from './context/AuditContext';
import { ReviewProvider } from './context/ReviewContext';
import { FindingProvider } from './context/FindingContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { OverviewPage } from './pages/OverviewPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { ContentReviewsPage } from './pages/ContentReviewsPage';
import { ContentEditorPage } from './pages/ContentEditorPage';
import { ReviewDetailsPage } from './pages/ReviewDetailsPage';
import { ReviewHistoryPage } from './pages/ReviewHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <GuidelineProvider>
      <AuditProvider>
        <ReviewProvider>
          <FindingProvider>
            <BrowserRouter>
              <Routes>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/guidelines" element={<GuidelinesPage />} />
                <Route path="/reviews" element={<ContentReviewsPage />} />
                <Route path="/reviews/new" element={<ContentEditorPage />} />
                <Route path="/reviews/:id/edit" element={<ContentEditorPage />} />
                <Route path="/reviews/:id" element={<ReviewDetailsPage />} />
                <Route path="/history" element={<ReviewHistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Catch-all redirect to Overview */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FindingProvider>
      </ReviewProvider>
    </AuditProvider>
  </GuidelineProvider>
);
};

export default App;
