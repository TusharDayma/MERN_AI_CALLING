import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Activity, Server, PhoneCall, Zap, CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function SystemHealth() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    wsUptime: 99.98,
    sipStatus: 'Operational',
    ttsLatency: 242, // ms
    activeStreams: 14
  });

  const [logs, setLogs] = useState([]);

  // Fetch real telemetry from Node backend -> Python Engine
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/admin/health');
        setMetrics(res.data.metrics);
        setLogs(res.data.logs);
      } catch (err) {
        console.error('Failed to fetch system health', err);
        setMetrics(prev => ({...prev, sipStatus: 'Offline'}));
      } finally {
        setLoading(false);
      }
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Telephony & Infrastructure Health</h1>
          <p className="text-text-secondary flex items-center gap-2">Live monitor for WebSocket stability, SIP trunks, and AI latency. {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><Server className="w-5 h-5" /></div>
              <h3 className="font-semibold text-text-primary">WebSocket</h3>
            </div>
            <p className="text-3xl font-bold text-text-primary">{metrics.wsUptime}%</p>
            <p className="text-sm text-text-secondary mt-1">Uptime (Last 30 days)</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><PhoneCall className="w-5 h-5" /></div>
              <h3 className="font-semibold text-text-primary">Exotel SIP Trunk</h3>
            </div>
            <p className="text-xl font-bold text-emerald-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {metrics.sipStatus}
            </p>
            <p className="text-sm text-text-secondary mt-2">Routing active</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Zap className="w-5 h-5" /></div>
              <h3 className="font-semibold text-text-primary">Avg TTS Latency</h3>
            </div>
            <p className="text-3xl font-bold text-text-primary">{metrics.ttsLatency} <span className="text-lg text-text-muted">ms</span></p>
            <p className="text-sm text-text-secondary mt-1">Time to first byte</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Activity className="w-5 h-5" /></div>
              <h3 className="font-semibold text-text-primary">Active Streams</h3>
            </div>
            <p className="text-3xl font-bold text-text-primary">{metrics.activeStreams}</p>
            <p className="text-sm text-text-secondary mt-1">Live voice channels</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary">Recent Call Audit Logs</h3>
            <span className="text-sm text-text-secondary flex items-center gap-1"><Clock className="w-4 h-4"/> Last 24 Hours</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-raised border-b border-border text-text-muted text-sm">
                <th className="p-4 font-medium">Call SID</th>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Termination Reason</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-surface-raised/50 transition-colors">
                  <td className="p-4 font-medium text-text-primary">{log.id}</td>
                  <td className="p-4 text-text-secondary text-sm">{log.time}</td>
                  <td className="p-4 text-text-secondary text-sm">{log.reason}</td>
                  <td className="p-4">
                    {log.type === 'success' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5"/> Success</span>}
                    {log.type === 'warning' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertCircle className="w-3.5 h-3.5"/> Warning</span>}
                    {log.type === 'error' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5"/> Failed</span>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-text-muted">No recent call logs available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
