import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Briefcase, Play, Pause, Users, X, Activity, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'badge-success',
    PAUSED: 'badge-warning',
    COMPLETED: 'badge-primary',
    DRAFT: 'badge-muted',
  };
  return <span className={map[status] || 'badge-muted'}>{status}</span>;
}

export default function CampaignManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/hr/campaigns');
      setCampaigns(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/hr/campaigns/${id}/status`, { status: newStatus });
      fetchCampaigns();
      if (selectedCampaign === id) fetchCampaignDetails(id);
    } catch (err) { console.error('Failed to toggle status', err); }
  };

  const handleDeleteCampaign = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${name || 'this campaign'}"? All candidates and questions in this campaign will be deleted permanently.`)) {
      try {
        await api.delete(`/hr/campaigns/${id}`);
        if (selectedCampaign === id) closeDetails();
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
    } catch (err) { console.error(err); }
    finally { setLoadingDetails(false); }
  };

  const closeDetails = () => { setSelectedCampaign(null); setCampaignDetails(null); };

  return (
    <DashboardLayout role="HR">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Campaigns</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your active, paused, and draft AI calling campaigns.</p>
          </div>
          <Link to="/hr/campaigns/create" className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </Link>
        </div>

        {/* Table card */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Role & Location</th>
                  <th>Candidates</th>
                  <th>Status</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr
                    key={camp.id}
                    onClick={(e) => { if (e.target.closest('button')) return; fetchCampaignDetails(camp.id); }}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center border border-primary/15 flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-text-primary">{camp.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-text-primary">{camp.jobRole?.title || '—'}</div>
                      <div className="text-xs text-text-muted mt-0.5">{camp.location}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                        <Users className="w-3.5 h-3.5" />
                        {camp._count?.candidates || 0}
                      </div>
                    </td>
                    <td><StatusBadge status={camp.status} /></td>
                    <td className="pr-5">
                      <div className="flex items-center justify-end gap-2">
                        {camp.status !== 'COMPLETED' && (
                          <button
                            onClick={() => toggleStatus(camp.id, camp.status)}
                            className={`btn btn-sm ${camp.status === 'ACTIVE' ? 'bg-warning-bg text-warning border border-warning/30 hover:bg-warning hover:text-white' : 'bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white'}`}
                            title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
                          >
                            {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            {camp.status === 'ACTIVE' ? 'Pause' : 'Start'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCampaign(camp.id, camp.name)}
                          className="btn btn-sm bg-danger-bg text-danger border border-danger/25 hover:bg-danger hover:text-white"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {campaigns.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-muted">
                        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">No campaigns found</p>
                        <Link to="/hr/campaigns/create" className="btn-primary btn-sm mt-1">
                          <Plus className="w-3.5 h-3.5" /> Create your first campaign
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center border border-primary/20">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {loadingDetails ? 'Loading...' : campaignDetails?.name}
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    {campaignDetails?.jobRole?.title} · {campaignDetails?.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {campaignDetails && campaignDetails.status !== 'COMPLETED' && (
                  <button
                    onClick={() => toggleStatus(campaignDetails.id, campaignDetails.status)}
                    className={`btn btn-sm ${campaignDetails.status === 'ACTIVE' ? 'bg-warning-bg text-warning border border-warning/30 hover:bg-warning hover:text-white' : 'bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white'}`}
                  >
                    {campaignDetails.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {campaignDetails.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
                  </button>
                )}
                {campaignDetails && (
                  <button
                    onClick={() => handleDeleteCampaign(campaignDetails.id, campaignDetails.name)}
                    className="btn btn-sm bg-danger-bg text-danger border border-danger/25 hover:bg-danger hover:text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
                <button
                  onClick={closeDetails}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingDetails ? (
                <div className="flex justify-center items-center py-20 text-text-muted text-sm">
                  Loading campaign data...
                </div>
              ) : campaignDetails ? (
                <div className="space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Candidates', value: campaignDetails.candidates?.length || 0 },
                      { label: 'Status', value: campaignDetails.status?.toLowerCase() },
                      { label: 'Created', value: new Date(campaignDetails.created_at).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-surface-raised border border-border rounded-xl p-4 text-center">
                        <p className="text-xs font-medium text-text-muted mb-1">{label}</p>
                        <p className="text-xl font-bold text-text-primary capitalize">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Candidate table */}
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" /> Candidate Roster
                    </h3>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Candidate Name</th>
                            <th>Contact</th>
                            <th>Status</th>
                            <th className="text-right pr-5">AI Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignDetails.candidates?.map((c) => (
                            <tr key={c.id}>
                              <td>
                                <div className="font-semibold text-text-primary">{c.name}</div>
                                <div className="text-xs text-text-muted">{c.email}</div>
                              </td>
                              <td className="text-text-secondary">{c.contact}</td>
                              <td>
                                <span className={
                                  c.status === 'COMPLETED' ? 'badge-success' :
                                  c.status === 'SCREENED' ? 'badge-primary' : 'badge-muted'
                                }>
                                  {c.status}
                                </span>
                              </td>
                              <td className="text-right pr-5">
                                {c.ai_score ? (
                                  <span className={`font-bold ${c.ai_score >= 80 ? 'text-success' : c.ai_score >= 60 ? 'text-warning' : 'text-danger'}`}>
                                    {c.ai_score}/100
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-sm italic">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!campaignDetails.candidates || campaignDetails.candidates.length === 0) && (
                            <tr>
                              <td colSpan="4" className="py-8 text-center text-text-muted text-sm">
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
