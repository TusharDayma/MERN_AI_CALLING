import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Target, Users, PlayCircle, ArrowUpRight, Activity, Clock3, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BAR_HEIGHTS = [40, 62, 48, 75, 58, 86, 70];

export default function HrDashboard() {
  const [metrics, setMetrics] = useState({ totalCampaigns: 0, activeCampaigns: 0, screenedCandidates: 0 });
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
                    <span className="badge-success text-[11px]">
                      Live <ArrowUpRight className="h-3 w-3 inline" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-text-secondary">{label}</p>
                  <h3 className="mt-1 text-4xl font-extrabold tracking-tight text-text-primary">{value}</h3>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
              {/* Bar chart */}
              <section className="card-hover p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Screening Activity</h3>
                    <p className="mt-0.5 text-sm text-text-secondary">Candidate volume over the last 7 days</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-primary-light flex items-center justify-center border border-primary/15">
                    <Activity className="h-4.5 w-4.5 text-primary" />
                  </div>
                </div>

                <div className="flex h-44 items-end gap-2 sm:gap-3" aria-label="Screening activity visualization">
                  {BAR_HEIGHTS.map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col justify-end gap-2 group">
                      <div
                        className="relative w-full rounded-t-lg bg-primary/10 hover:bg-primary/20 transition-colors duration-150 overflow-hidden"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-300 group-hover:h-full"
                          style={{ height: '4px' }}
                        />
                      </div>
                      <span className="text-center text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                        {DAY_LABELS[index]}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Donut */}
              <section className="card-hover p-6 flex flex-col">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-text-primary">Engagement Rate</h3>
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center">
                    {/* Track ring */}
                    <div className="absolute inset-0 rounded-full border-[12px] border-border" />
                    {/* Fill ring (~82%) */}
                    <div
                      className="absolute inset-0 rounded-full border-[12px] border-primary border-r-transparent border-b-transparent"
                      style={{ transform: 'rotate(-45deg)' }}
                    />
                    <div className="text-center z-10">
                      <span className="text-3xl font-extrabold text-text-primary">82%</span>
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Completion</p>
                    </div>
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
