import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Users, FileText, Activity, Award, ArrowLeft, Play, Pause, Trash2, X } from 'lucide-react';
import DossierViewer from './DossierViewer';

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchCampaignDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hr/campaigns/${id}`);
      setCampaign(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const toggleStatus = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/hr/campaigns/${campaign.id}/status`, { status: newStatus });
      fetchCampaignDetails();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    if (window.confirm(`Are you sure you want to delete the campaign "${campaign.name}"? All candidates and questions will be deleted permanently.`)) {
      try {
        await api.delete(`/hr/campaigns/${campaign.id}`);
        navigate('/hr/campaigns');
      } catch (err) {
        console.error('Failed to delete campaign', err);
        alert(err.response?.data?.error || 'Failed to delete campaign');
      }
    }
  };

  const scoreColor = (score) => {
    if (!score) return 'text-text-muted';
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  const scoreBg = (score) => {
    if (!score) return 'bg-border';
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  if (loading) {
    return (
      <DashboardLayout role="HR">
        <div className="flex justify-center items-center py-20 text-text-muted text-sm">
          Loading campaign data...
        </div>
      </DashboardLayout>
    );
  }

  if (!campaign) {
    return (
      <DashboardLayout role="HR">
        <div className="flex flex-col items-center py-20 gap-4">
          <p className="text-text-muted text-sm">Campaign not found.</p>
          <Link to="/hr/campaigns" className="btn-primary btn-sm">Back to Campaigns</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="HR">
      <div className="w-full space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/hr/campaigns" className="p-2 text-text-muted hover:text-text-primary bg-surface-raised rounded-lg border border-border transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {campaign.name}
              </h1>
              <p className="text-sm text-text-muted mt-1">
                {campaign.jobRole?.title} · {campaign.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {campaign.status !== 'COMPLETED' && (
              <button
                onClick={toggleStatus}
                className={`btn btn-sm ${campaign.status === 'ACTIVE' ? 'bg-warning-bg text-warning border border-warning/30 hover:bg-warning hover:text-white' : 'bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white'}`}
              >
                {campaign.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {campaign.status === 'ACTIVE' ? 'Pause Campaign' : 'Start Campaign'}
              </button>
            )}
            <button
              onClick={handleDeleteCampaign}
              className="btn btn-sm bg-danger-bg text-danger border border-danger/25 hover:bg-danger hover:text-white"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Candidates', value: campaign.candidates?.length || 0 },
            { label: 'Status', value: campaign.status?.toLowerCase() },
            { label: 'Created', value: new Date(campaign.created_at).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">{label}</p>
              <p className="text-2xl font-bold text-text-primary capitalize">{value}</p>
            </div>
          ))}
        </div>

        {/* Candidate table */}
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Candidate Rankings
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>AI Score</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaign.candidates?.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold text-text-primary">{c.name}</div>
                      <div className="text-xs text-text-muted">{c.email}</div>
                    </td>
                    <td className="text-text-secondary">{c.contact}</td>
                    <td>
                      <span className={
                        c.status === 'COMPLETED' ? 'badge-success' :
                        c.status === 'SCREENED' ? 'badge-primary' : 'badge-warning'
                      }>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {c.ai_score ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full ${scoreBg(c.ai_score)} rounded-full transition-all`}
                              style={{ width: `${c.ai_score}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold w-7 ${scoreColor(c.ai_score)}`}>{c.ai_score}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted italic">Pending</span>
                      )}
                    </td>
                    <td className="text-right pr-5">
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="btn btn-sm bg-primary-light text-primary border border-primary/20 hover:bg-primary hover:text-white"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
                {(!campaign.candidates || campaign.candidates.length === 0) && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-text-muted text-sm">
                      <div className="flex flex-col items-center gap-3">
                         <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
                          <Users className="w-5 h-5 text-text-muted" />
                        </div>
                        <p>No candidates uploaded for this campaign yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedCandidate && (
        <DossierViewer 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
          onScoreUpdate={fetchCampaignDetails} 
        />
      )}
    </DashboardLayout>
  );
}
