import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Briefcase, Play, Pause, Users, ExternalLink, X, Activity, Trash2 } from 'lucide-react';

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/hr/campaigns');
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/hr/campaigns/${id}/status`, { status: newStatus });
      fetchCampaigns();
      if (selectedCampaign === id) {
        fetchCampaignDetails(id);
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteCampaign = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${name || 'this campaign'}"? All candidates and questions in this campaign will be deleted permanently.`)) {
      try {
        await api.delete(`/hr/campaigns/${id}`);
        if (selectedCampaign === id) {
          closeDetails();
        }
        fetchCampaigns();
      } catch (err) {
        console.error('Failed to delete campaign', err);
        alert(err.response?.data?.error || 'Failed to delete campaign');
      }
    }
  };

  const fetchCampaignDetails = async (id) => {
    setSelectedCampaign(id);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/hr/campaigns/${id}`);
      setCampaignDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedCampaign(null);
    setCampaignDetails(null);
  };

  return (
    <DashboardLayout role="HR">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Campaigns</h1>
            <p className="text-slate-400">Manage your active, paused, and draft AI calling campaigns.</p>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-sm font-medium text-slate-300">Campaign Name</th>
                <th className="p-4 text-sm font-medium text-slate-300">Role & Location</th>
                <th className="p-4 text-sm font-medium text-slate-300">Candidates</th>
                <th className="p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="p-4 text-sm font-medium text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer" onClick={(e) => {
                  if (e.target.closest('button')) return; // ignore if clicking buttons
                  fetchCampaignDetails(camp.id);
                }}>
                  <td className="p-4 font-medium text-white flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    {camp.name}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white">{camp.jobRole?.title || 'Unknown Role'}</div>
                    <div className="text-xs text-slate-400">{camp.location}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Users className="w-4 h-4" />
                      {camp._count?.candidates || 0}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      camp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      camp.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      camp.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {camp.status !== 'COMPLETED' && (
                        <button 
                          onClick={() => toggleStatus(camp.id, camp.status)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            camp.status === 'ACTIVE' 
                              ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          }`}
                          title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
                        >
                          {camp.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {camp.status === 'ACTIVE' ? 'Pause' : 'Start'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    <p className="mb-2">No campaigns found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {loadingDetails ? 'Loading...' : campaignDetails?.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    {campaignDetails?.jobRole?.title} • {campaignDetails?.location}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {campaignDetails && campaignDetails.status !== 'COMPLETED' && (
                  <button 
                    onClick={() => toggleStatus(campaignDetails.id, campaignDetails.status)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      campaignDetails.status === 'ACTIVE' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {campaignDetails.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {campaignDetails.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
                  </button>
                )}
                {campaignDetails && (
                  <button
                    onClick={() => handleDeleteCampaign(campaignDetails.id, campaignDetails.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Campaign
                  </button>
                )}
                <button onClick={closeDetails} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-20 text-slate-400">Loading campaign data...</div>
              ) : campaignDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Total Candidates</p>
                      <p className="text-2xl font-bold text-white">{campaignDetails.candidates?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Status</p>
                      <p className="text-2xl font-bold text-white capitalize">{campaignDetails.status.toLowerCase()}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-sm text-slate-400 mb-1">Created</p>
                      <p className="text-lg font-bold text-white">{new Date(campaignDetails.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Candidate Roster
                    </h3>
                    
                    <div className="bg-background border border-white/10 rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="p-3 text-sm font-medium text-slate-300">Candidate Name</th>
                            <th className="p-3 text-sm font-medium text-slate-300">Contact</th>
                            <th className="p-3 text-sm font-medium text-slate-300">Status</th>
                            <th className="p-3 text-sm font-medium text-slate-300 text-right">AI Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignDetails.candidates?.map(c => (
                            <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                              <td className="p-3">
                                <div className="font-medium text-white">{c.name}</div>
                                <div className="text-xs text-slate-400">{c.email}</div>
                              </td>
                              <td className="p-3 text-sm text-slate-300">{c.contact}</td>
                              <td className="p-3">
                                <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  c.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                                  c.status === 'SCREENED' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {c.ai_score ? (
                                  <span className={`font-bold ${c.ai_score >= 80 ? 'text-emerald-400' : c.ai_score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                    {c.ai_score}/100
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-sm">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!campaignDetails.candidates || campaignDetails.candidates.length === 0) && (
                            <tr>
                              <td colSpan="4" className="p-6 text-center text-slate-400 text-sm">
                                No candidates uploaded for this campaign yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
