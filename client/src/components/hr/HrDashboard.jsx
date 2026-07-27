import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Target, Users, PlayCircle, CheckCircle2 } from 'lucide-react';

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
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-slate-400 mb-8">Here's an overview of your active campaigns and candidates.</p>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface border border-white/5 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-16 h-16" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-2">Total Campaigns</p>
              <h3 className="text-4xl font-bold text-white">{metrics.totalCampaigns}</h3>
            </div>
            
            <div className="bg-surface border border-white/5 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <PlayCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-2">Active Campaigns</p>
              <h3 className="text-4xl font-bold text-white">{metrics.activeCampaigns}</h3>
            </div>

            <div className="bg-surface border border-white/5 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-2">Candidates Screened</p>
              <h3 className="text-4xl font-bold text-white">{metrics.screenedCandidates}</h3>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
