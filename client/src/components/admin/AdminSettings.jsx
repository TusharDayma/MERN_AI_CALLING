import React, { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Settings as SettingsIcon, Save, Server, Shield, Database } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    maxConcurrentCalls: 50,
    dataRetentionDays: 90
  });

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    // Stub: simulate saving to backend
    setTimeout(() => {
      setLoading(false);
      alert('System settings updated successfully.');
    }, 800);
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-white" />
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">System Settings</h1>
            <p className="text-slate-400">Configure global platform behavior.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Settings */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Server className="w-5 h-5 text-primary" />
              Platform Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <p className="font-medium text-white">Maintenance Mode</p>
                  <p className="text-sm text-slate-400">Suspend all HR access and pause active campaigns.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Max Concurrent AI Calls</label>
                <p className="text-xs text-slate-500 mb-2">Maximum Twilio voice streams allowed simultaneously.</p>
                <input type="number" value={settings.maxConcurrentCalls} onChange={e => setSettings({...settings, maxConcurrentCalls: e.target.value})} className="w-full max-w-xs px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
            </div>
          </div>

          {/* Data Privacy */}
          <div className="bg-surface border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Database className="w-5 h-5 text-emerald-500" />
              Data Retention
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Candidate Data Retention (Days)</label>
              <p className="text-xs text-slate-500 mb-2">Automatically delete PII and transcripts after this period.</p>
              <input type="number" value={settings.dataRetentionDays} onChange={e => setSettings({...settings, dataRetentionDays: e.target.value})} className="w-full max-w-xs px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-glow transition-all">
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
