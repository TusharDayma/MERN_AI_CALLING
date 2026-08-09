import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
// Landing Page Components
import LandingPage from './components/LandingPage';
const DocsPage = lazy(() => import('./pages/DocsPage'));

// Auth Components
const AuthPage = lazy(() => import('./pages/auth/AuthPage'));
const Profile = lazy(() => import('./components/shared/Profile'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const SystemHealth = lazy(() => import('./components/admin/SystemHealth'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const AdminNotifications = lazy(() => import('./components/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));
const HrDashboard = lazy(() => import('./components/hr/HrDashboard'));
const CandidateRanking = lazy(() => import('./components/hr/CandidateRanking'));
const CreateCampaignWizard = lazy(() => import('./components/hr/CreateCampaignWizard'));
const JobRoles = lazy(() => import('./components/hr/JobRoles'));
const CampaignManagement = lazy(() => import('./components/hr/CampaignManagement'));
const CampaignDetails = lazy(() => import('./components/hr/CampaignDetails'));
const AgentStudio = lazy(() => import('./components/hr/AgentStudio'));

function PageLoader() {
  return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-light border-t-primary" aria-label="Loading page" /></div>;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-text-primary font-sans selection:bg-primary/30">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}><Routes>
            {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
          <Route path="/signin" element={<AuthPage defaultMode="signin" />} />
          
          {/* Protected Shared Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/health" element={<SystemHealth />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
          
          {/* Protected HR Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR', 'hr']} />}>
            <Route path="/hr" element={<HrDashboard />} />
            <Route path="/hr/campaigns" element={<CampaignManagement />} />
            <Route path="/hr/campaigns/:id" element={<CampaignDetails />} />
            <Route path="/hr/ranking" element={<CandidateRanking />} />
            <Route path="/hr/campaigns/create" element={<CreateCampaignWizard />} />
            <Route path="/hr/job-roles" element={<JobRoles />} />
            <Route path="/hr/agent-studio" element={<AgentStudio />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes></Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}
