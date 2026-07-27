import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Users, Briefcase, Bot, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalHRs: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    aiUsage: 0,
    aiCostSaved: 0,
    aiSuccessRate: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/admin/metrics');
        setMetrics(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, []);

  const stats = [
    { title: 'Total HR Accounts', value: metrics.totalHRs, icon: Users, color: 'text-blue-500' },
    { title: 'Active Campaigns', value: metrics.activeCampaigns, icon: Briefcase, color: 'text-emerald-500' },
    { title: 'AI Interviews Conducted', value: metrics.aiUsage, icon: Bot, color: 'text-primary' },
    { title: 'Estimated Cost Saved', value: `$${metrics.aiCostSaved}`, icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-slate-400 mb-8">System-wide metrics and AntiTalk AI performance.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-surface border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${s.color}`}>
                <s.icon className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-2">{s.title}</p>
              <h3 className="text-4xl font-bold text-white">{s.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">AI Engine Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Success Rate (Completed vs Failed Calls)</span>
                  <span className="text-white font-bold">{metrics.aiSuccessRate}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${metrics.aiSuccessRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">System Latency (Avg)</span>
                  <span className="text-white font-bold">85ms</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
