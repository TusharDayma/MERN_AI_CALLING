import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Search, FileText, X, ChevronDown, Award, Activity, Users } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function CandidateRanking() {
  const [candidates, setCandidates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Priority 2 — Campaign filter (read initial value from URL param)
  const [campaignId, setCampaignId] = useState(searchParams.get('campaignId') || '');

  // Fetch campaign list for filter dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/hr/campaigns');
        setCampaigns(res.data || []);
      } catch (err) {
        console.error('Failed to load campaigns for filter', err);
      }
    };
    load();
  }, []);

  // Fetch candidates whenever search/sort/campaign filter changes (debounced 300ms)
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const params = new URLSearchParams({ search, sortBy });
        if (campaignId) params.set('campaignId', campaignId);
        const res = await api.get(`/hr/candidates?${params.toString()}`);
        setCandidates(res.data);
      } catch (err) { console.error(err); }
    };
    const timer = setTimeout(() => fetchCandidates(), 300);
    return () => clearTimeout(timer);
  }, [search, sortBy, campaignId]);

  // Sync campaignId filter to URL
  const handleCampaignFilter = (val) => {
    setCampaignId(val);
    if (val) setSearchParams({ campaignId: val });
    else setSearchParams({});
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

  return (
    <DashboardLayout role="HR">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Candidate Rankings</h1>
            <p className="text-sm text-text-secondary mt-1">Review AI scores and detailed technical transcripts.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
            {/* Priority 2 — Campaign filter */}
            <div className="relative">
              <select
                value={campaignId}
                onChange={(e) => handleCampaignFilter(e.target.value)}
                className="w-full sm:w-52 appearance-none pl-4 pr-9 cursor-pointer"
              >
                <option value="">All Campaigns</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-44 appearance-none pl-4 pr-9 cursor-pointer"
              >
                <option value="date_desc">Newest First</option>
                <option value="score_high">Highest AI Score</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate Profile</th>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>AI Score</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-text-muted">
                        <div className="w-12 h-12 rounded-2xl bg-surface-raised border border-border flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium">No candidates found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-sm">{c.name}</p>
                            <p className="text-xs text-text-muted">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-text-secondary">{c.campaign?.name || '—'}</td>
                      <td>
                        <span className={
                          c.status === 'COMPLETED' ? 'badge-success' :
                            c.status === 'SCREENED' ? 'badge-primary' : 'badge-warning'
                        }>
                          {c.status}
                        </span>
                      </td>
                      <td className="text-sm text-text-secondary font-medium pl-4">{c.call_attempts || 0}</td>
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
                      <td className="pr-5 text-right">
                        <button
                          onClick={() => setSelectedCandidate(c)}
                          className="btn btn-sm bg-primary-light text-primary border border-primary/20 hover:bg-primary hover:text-white"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight">
                  {selectedCandidate.name}'s Dossier
                </h2>
                <p className="text-sm text-text-muted mt-0.5">
                  {selectedCandidate.email} · {selectedCandidate.contact}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Score + Status cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-raised border border-border rounded-xl p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
                    <Award className="w-3.5 h-3.5" />
                    Overall AI Score
                  </div>
                  <p className={`text-5xl font-extrabold ${scoreColor(selectedCandidate.ai_score)}`}>
                    {selectedCandidate.ai_score || '—'}
                  </p>
                  {selectedCandidate.ai_score && (
                    <div className="mt-3 w-full bg-border rounded-full h-1.5">
                      <div
                        className={`h-1.5 ${scoreBg(selectedCandidate.ai_score)} rounded-full`}
                        style={{ width: `${selectedCandidate.ai_score}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="bg-surface-raised border border-border rounded-xl p-5 text-center">
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Interview Status</p>
                  <div className="mt-4">
                    <span className={
                      selectedCandidate.status === 'COMPLETED' ? 'badge-success' :
                        selectedCandidate.status === 'SCREENED' ? 'badge-primary' : 'badge-warning'
                    }>
                      {selectedCandidate.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  AI Interview Transcript & Evaluation
                </h3>
                <div className="bg-[#0F172A] border border-border rounded-xl p-5 font-mono text-[13px] text-slate-300 h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedCandidate.dossier_json ? (
                    <span dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(JSON.stringify(selectedCandidate.dossier_json, null, 2))
                    }} />
                  ) : (
                    <div className="flex h-full items-center justify-center flex-col text-slate-500">
                      <Activity className="w-8 h-8 mb-3 animate-pulse text-primary/50" />
                      <p>Waiting for AI Engine to complete the interview...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
