import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Landing Page Components
import Header from './components/Header';
import Hero from './components/Hero';
import WorkflowScroll from './components/WorkflowScroll';
import Features from './components/Features';
import AboutPrivacy from './components/AboutPrivacy';
import Pricing from './components/Pricing';
import DocsTeaser from './components/DocsTeaser';
import Footer from './components/Footer';
import DemoModal from './components/DemoModal';

// Auth Components
import AuthPage from './pages/auth/AuthPage';

// Shared Components
import Profile from './components/shared/Profile';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import AdminNotifications from './components/admin/AdminNotifications';
import AdminSettings from './components/admin/AdminSettings';

// HR Components
import HrDashboard from './components/hr/HrDashboard';
import CandidateRanking from './components/hr/CandidateRanking';
import CreateCampaignWizard from './components/hr/CreateCampaignWizard';
import JobRoles from './components/hr/JobRoles';
import CampaignManagement from './components/hr/CampaignManagement';

function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = React.useState(false);

  const openDemoModal = () => setIsDemoModalOpen(true);
  const closeDemoModal = () => setIsDemoModalOpen(false);

  return (
    <>
      <Header onBookDemo={openDemoModal} />
      <main>
        <Hero onBookDemo={openDemoModal} />
        <WorkflowScroll />
        <Features />
        <AboutPrivacy />
        <Pricing onBookDemo={openDemoModal} />
        <DocsTeaser />
      </main>
      <Footer />
      <DemoModal isOpen={isDemoModalOpen} onClose={closeDemoModal} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen text-slate-100 font-sans selection:bg-primary/30">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
          <Route path="/signin" element={<AuthPage defaultMode="signin" />} />
          
          {/* Shared Routes */}
          <Route path="/profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* HR Routes */}
          <Route path="/hr" element={<HrDashboard />} />
          <Route path="/hr/campaigns" element={<CampaignManagement />} />
          <Route path="/hr/ranking" element={<CandidateRanking />} />
          <Route path="/hr/campaigns/create" element={<CreateCampaignWizard />} />
          <Route path="/hr/job-roles" element={<JobRoles />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
