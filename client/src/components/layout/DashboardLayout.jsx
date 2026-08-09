import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut, Users, Briefcase, Bell, Settings, User, Bot,
  Activity, FileText, ChevronRight, Menu, X, LayoutDashboard,
  Calendar, Radio
} from 'lucide-react';

import api from '../../services/api';

export default function DashboardLayout({ role, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState(null);

  React.useEffect(() => {
    api.get('/auth/profile')
      .then(res => setUserProfile(res.data.user))
      .catch(err => console.error('Failed to fetch profile', err));
  }, []);

  const links = role === 'ADMIN' ? [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'System Health', path: '/admin/health', icon: Activity },
    { name: 'HR Users', path: '/admin/users', icon: Users },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ] : [
    { name: 'Dashboard', path: '/hr', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/hr/campaigns', icon: Briefcase },
    { name: 'Launch AI', path: '/hr/campaigns/create', icon: Activity },
    { name: 'Rankings', path: '/hr/ranking', icon: Users },
    { name: 'Voice Studio', path: '/hr/agent-studio', icon: Radio },
    { name: 'Job Roles', path: '/hr/job-roles', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const activeLink = links.find((link) => link.path === location.pathname);
  const pageTitle = activeLink?.name || 'Profile';

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans flex">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-text-primary/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#111827' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/8">
          <Link to={role === 'ADMIN' ? '/admin' : '/hr'} className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <Bot className="h-4.5 w-4.5" />
            </span>
            <span className="font-bold text-white text-[17px] tracking-tight">AntiTalk</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 pt-6 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {role === 'ADMIN' ? 'Platform Control' : 'Recruitment Workspace'}
        </div>

        {/* Nav */}
        <nav aria-label="Dashboard navigation" className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:bg-white/6 hover:text-white'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/8 space-y-0.5">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/6 hover:text-white transition-all duration-150"
          >
            <User className="w-4.5 h-4.5" />
            Profile Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 min-h-screen lg:ml-64 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/90 backdrop-blur-md px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 -ml-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary lg:hidden transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted mb-0.5">
                <span className="uppercase tracking-wider">Workspace</span>
                <ChevronRight className="h-3 w-3" />
                <span className="uppercase tracking-wider text-primary">{role === 'ADMIN' ? 'Admin' : 'HR'}</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">{pageTitle}</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            {userProfile && role === 'HR' && (
              <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold flex items-center gap-2 ${
                userProfile.credits_balance < 20 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-surface-raised border-border text-text-primary'
              }`}>
                <span className="text-primary font-bold">Credits:</span> 
                {userProfile.credits_balance}
              </div>
            )}
            <div className="badge-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              System Operational
            </div>
            <Link to="/profile" className="h-9 w-9 rounded-full bg-primary-light border border-primary/20 flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-colors cursor-pointer" title="Profile Settings">
              <User className="h-4.5 w-4.5" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-5 lg:p-8 mx-auto w-full max-w-[1600px] animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
}
