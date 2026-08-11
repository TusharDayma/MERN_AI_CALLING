import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Briefcase, Play, Pause, Users, Trash2, Plus, Search, HelpCircle } from 'lucide-react';
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
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchCampaigns(); }, []);

  useEffect(() => {
    let filtered = [...campaigns];
    if (searchQuery) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.jobRole?.title || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'candidates_high') {
      filtered.sort((a, b) => (b._count?.candidates || 0) - (a._count?.candidates || 0));
    } else if (sortBy === 'candidates_low') {
      filtered.sort((a, b) => (a._count?.candidates || 0) - (b._count?.candidates || 0));
    }
    setFilteredCampaigns(filtered);
  }, [campaigns, searchQuery, sortBy]);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/hr/campaigns');
      setCampaigns(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (e, id, currentStatus, candidatesCount) => {
    e.stopPropagation();
    if (candidatesCount === 0 && currentStatus !== 'ACTIVE') {
      alert("Please add candidates before starting this campaign.");
      return;
    }
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

  const handleDeleteCampaign = async (e, id, name) => {
    e.stopPropagation();
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

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoString));
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

        {/* Search & Sort Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-surface mx-auto sm:mx-0 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary transition-colors cursor-pointer min-w-[160px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="candidates_high">Most Candidates</option>
            <option value="candidates_low">Fewest Candidates</option>
          </select>
        </div>

        {/* Table card */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-1/3">Campaign Name & Progress</th>
                  <th>Role & Location</th>
                  <th>Candidates</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((camp) => {
                  const total = camp._count?.candidates || 0;
                  const completed = camp.completed_candidates || 0;
                  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

                  return (
                    <tr
                      key={camp.id}
                      onClick={() => navigate(`/hr/campaigns/${camp.id}`)}
                      className="cursor-pointer hover:bg-surface-raised transition-colors"
                    >
                      <td>
                        <div className="flex flex-col gap-2 relative group w-full max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center border border-primary/15 flex-shrink-0">
                              <Briefcase className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-text-primary truncate" title={camp.name}>{camp.name}</span>
                          </div>
                          {camp.status === 'ACTIVE' && total > 0 && (
                            <div className="w-full">
                              <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-text-muted">
                                <span>{completed} / {total} Screened</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                                <div className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-text-primary">{camp.jobRole?.title || '—'}</div>
                        <div className="text-xs text-text-muted mt-0.5">{camp.location}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                          <Users className="w-3.5 h-3.5" />
                          {total}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm text-text-secondary">
                          {formatDate(camp.created_at)}
                        </div>
                      </td>
                      <td><StatusBadge status={camp.status} /></td>
                      <td className="pr-5">
                        <div className="flex items-center justify-end gap-2">
                          {camp.status !== 'COMPLETED' && (
                            <div className="relative group/tooltip">
                              <button
                                onClick={(e) => toggleStatus(e, camp.id, camp.status, total)}
                                disabled={total === 0 && camp.status !== 'ACTIVE'}
                                className={`btn btn-sm ${camp.status === 'ACTIVE' ? 'bg-warning-bg text-warning border border-warning/30 hover:bg-warning hover:text-white' : 'bg-success-bg text-success border border-success/30 hover:bg-success hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                {camp.status === 'ACTIVE' ? 'Pause' : 'Start'}
                              </button>
                              {total === 0 && camp.status !== 'ACTIVE' && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-surface text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                  Add candidates first
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={(e) => handleDeleteCampaign(e, camp.id, camp.name)}
                            className="btn btn-sm bg-danger-bg text-danger border border-danger/25 hover:bg-danger hover:text-white"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-muted">
                        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">{campaigns.length === 0 ? "No campaigns found" : "No campaigns match your search"}</p>
                        {campaigns.length === 0 && (
                          <Link to="/hr/campaigns/create" className="btn-primary btn-sm mt-1">
                            <Plus className="w-3.5 h-3.5" /> Create your first campaign
                          </Link>
                        )}
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
        onSuccess={() => window.location.reload()}
      />
    </DashboardLayout>
  );
}
