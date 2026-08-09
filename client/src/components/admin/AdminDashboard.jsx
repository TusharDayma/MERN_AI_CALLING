import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Users, Briefcase, Bot, TrendingUp, Activity, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalHRs: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    aiUsage: 0,
    aiCostSaved: 0,
    aiCost: 0,
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
    { title: 'Total HR accounts', value: metrics.totalHRs, icon: Users },
    { title: 'Active campaigns', value: metrics.activeCampaigns, icon: Briefcase },
    { title: 'Voice minutes consumed', value: metrics.aiUsage, icon: Bot },
    { title: 'API cost incurred', value: `$${metrics.aiCost}`, icon: TrendingUp },
  ];

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[.12em] text-primary">Platform intelligence</p><h2 className="text-3xl font-bold text-text-primary">Platform overview</h2><p className="mt-2 text-text-secondary">System-wide metrics and AI performance at a glance.</p></div><div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary"><ShieldCheck className="h-4 w-4 text-primary" /> Enterprise controls active</div></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, idx) => (
            <div key={idx} className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-0.5 card-hover">
              <div className="mb-7 flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary"><s.icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-primary" /></div>
              <p className="text-sm font-medium text-text-secondary">{s.title}</p><h3 className="mt-1 text-3xl font-bold tracking-tight text-text-primary">{s.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between"><div><h3 className="text-lg font-semibold text-text-primary">AI engine health</h3><p className="mt-1 text-sm text-text-secondary">Live service performance indicators</p></div><Activity className="h-5 w-5 text-primary" /></div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Success rate</span><span className="font-semibold text-text-primary">{metrics.aiSuccessRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div className="h-full bg-emerald-500" style={{ width: `${metrics.aiSuccessRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Average latency</span><span className="font-semibold text-text-primary">85ms</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
                  <div className="h-full bg-primary" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm"><h3 className="text-lg font-semibold text-text-primary">Operational distribution</h3><p className="mt-1 text-sm text-text-secondary">Campaign activity across the platform</p><div className="mt-7 flex items-center gap-7"><div className="flex h-32 w-32 items-center justify-center rounded-full border-[18px] border-surface-raised border-t-primary"><div className="text-center"><p className="text-2xl font-bold text-text-primary">{metrics.activeCampaigns}</p><p className="text-[11px] text-text-secondary">active</p></div></div><div className="space-y-3 text-sm"><p className="flex items-center gap-2 text-text-secondary"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Active campaigns</p><p className="flex items-center gap-2 text-text-secondary"><span className="h-2.5 w-2.5 rounded-full bg-border" /> Completed campaigns</p><p className="text-xs leading-5 text-text-muted">{metrics.completedCampaigns} campaigns have reached completion.</p></div></div></div>
        </div>
      </div>
    </DashboardLayout>
  );
}
