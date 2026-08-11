import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Target, Users, PlayCircle, ArrowUpRight, Clock3, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function HrDashboard() {
  const [metrics, setMetrics] = useState({
    totalCampaigns: 0, activeCampaigns: 0, screenedCandidates: 0,
    statusCounts: {}, avgScore: 0, scoreBuckets: { low: 0, mid: 0, high: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/hr/metrics');
        setMetrics(res.data);
      } catch (err) {
        console.error('Error fetching metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  // Priority 6 — Build funnel chart data from statusCounts
  const statusCounts = metrics.statusCounts || {};
  const funnelData = [
    { name: 'Dialled', value: (statusCounts.VOICE_FALLBACK_DISPATCHED || 0) + (statusCounts.COMPLETED || 0) + (statusCounts.SCREENED || 0) },
    { name: 'Screened', value: (statusCounts.SCREENED || 0) + (statusCounts.COMPLETED || 0) },
    { name: 'Completed', value: statusCounts.COMPLETED || 0 },
    { name: 'Score ≥70', value: metrics.scoreBuckets?.high || 0 },
  ];

  const scoreBuckets = metrics.scoreBuckets || { low: 0, mid: 0, high: 0 };
  const scoreDistData = [
    { name: '0–40', value: scoreBuckets.low, color: 'var(--color-danger,  #ef4444)' },
    { name: '40–70', value: scoreBuckets.mid, color: 'var(--color-warning, #f59e0b)' },
    { name: '70–100', value: scoreBuckets.high, color: 'var(--color-success, #22c55e)' },
  ];

  const FUNNEL_COLOR = 'var(--color-primary, #6366f1)';

  return (
    <DashboardLayout role="HR">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-primary">Hiring Intelligence</p>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-text-secondary">A clear view of your active recruitment operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text-secondary shadow-sm">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              Updated in real time
            </div>
            <Link to="/hr/campaigns/create" className="btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              New Campaign
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-shimmer rounded-2xl border border-border" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[
                { label: 'Total Campaigns', value: metrics.totalCampaigns, icon: Target, color: 'text-primary', bg: 'bg-primary-light' },
                { label: 'Active Campaigns', value: metrics.activeCampaigns, icon: PlayCircle, color: 'text-success', bg: 'bg-success-bg' },
                { label: 'Candidates Screened', value: metrics.screenedCandidates, icon: Users, color: 'text-warning', bg: 'bg-warning-bg' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="card-hover p-6 relative overflow-hidden">
                  <div className="mb-5 flex items-center justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${color} border border-current/10`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="badge-success text-[11px]">Live <ArrowUpRight className="h-3 w-3 inline" /></span>
                  </div>
                  <p className="text-sm font-medium text-text-secondary">{label}</p>
                  <h3 className="mt-1 text-4xl font-extrabold tracking-tight text-text-primary">{value}</h3>
                </div>
              ))}
            </div>

            {/* Priority 6 — Real charts */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
              {/* Campaign Funnel Bar Chart */}
              <section className="card-hover p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Screening Funnel</h3>
                    <p className="mt-0.5 text-sm text-text-secondary">Candidate pipeline across all campaigns</p>
                  </div>
                  {metrics.avgScore > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-0.5">Avg Score</p>
                      <p className="text-2xl font-extrabold text-primary">{metrics.avgScore}</p>
                    </div>
                  )}
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-surface, #1e293b)',
                          border: '1px solid var(--color-border, #334155)',
                          borderRadius: 8,
                          color: 'var(--color-text-primary, #f1f5f9)',
                          fontSize: 12
                        }}
                        cursor={{ fill: 'var(--color-primary-light, rgba(99,102,241,0.08))' }}
                      />
                      <Bar dataKey="value" fill={FUNNEL_COLOR} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Score Distribution */}
              <section className="card-hover p-6 flex flex-col">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary">Score Distribution</h3>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>

                <div className="flex-1">
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted, #9ca3af)' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--color-surface, #1e293b)',
                            border: '1px solid var(--color-border, #334155)',
                            borderRadius: 8,
                            color: 'var(--color-text-primary, #f1f5f9)',
                            fontSize: 12
                          }}
                          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {scoreDistData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-5 p-4 rounded-xl bg-surface-raised border border-border">
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    Active Programs: {metrics.activeCampaigns}
                  </p>
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Launch new AI screening workflows from the campaign workspace to scale hiring.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
