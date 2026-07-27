import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, UserPlus, Briefcase, Bell, Settings, User, Bot, Activity, FileText } from 'lucide-react';

export default function DashboardLayout({ role, children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = role === 'ADMIN' ? [
    { name: 'Dashboard', path: '/admin', icon: Bot },
    { name: 'HR Users', path: '/admin/users', icon: Users },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ] : [
    { name: 'Dashboard', path: '/hr', icon: Bot },
    { name: 'Campaigns', path: '/hr/campaigns', icon: Briefcase },
    { name: 'Launch AI', path: '/hr/campaigns/create', icon: Activity },
    { name: 'Rankings', path: '/hr/ranking', icon: Users },
    { name: 'Job Roles', path: '/hr/job-roles', icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-white/5 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Bot className="w-6 h-6 text-primary" />
            <span>AntiTalk <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded ml-2">{role}</span></span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white w-full transition-all">
            <User className="w-5 h-5" />
            Profile
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
