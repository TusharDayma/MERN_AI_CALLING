import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Briefcase, Play, Pause, Users, Trash2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import UpgradeModal from '../shared/UpgradeModal';

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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();

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
    } catch (err) {
      console.error('Failed to toggle status', err);
      if (err.response?.status === 402) {
        setIsUpgradeModalOpen(true);
      } else {
        alert(err.response?.data?.error || 'Failed to toggle status');
      }
    }
  };

  const handleDeleteCampaign = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the campaign "${name || 'this campaign'}"? All candidates and questions in this campaign will be deleted permanently.`)) {
      try {
        await api.delete(`/hr/campaigns/${id}`);
        fetchCampaigns();
      } catch (err) {
        console.error('Failed to delete campaign', err);
        alert(err.response?.data?.error || 'Failed to delete campaign');
      }
    }
  };

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
                    onClick={(e) => { if (e.target.closest('button')) return; navigate(`/hr/campaigns/${camp.id}`); }}
                    className="cursor-pointer hover:bg-surface-raised transition-colors"
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

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          // Could refresh profile globally if using context, but page reload works for now or just fetch
          window.location.reload();
        }}
      />
    </DashboardLayout>
  );
}
