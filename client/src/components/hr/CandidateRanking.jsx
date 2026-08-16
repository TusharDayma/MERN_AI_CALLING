import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { 
  Search, FileText, X, ChevronDown, Award, Activity, Users, 
  ShieldCheck, Trash2, Link as LinkIcon, Check, Mail, Send, MessageSquare 
} from 'lucide-react';
import DOMPurify from 'dompurify';

export default function CandidateRanking() {
  const [candidates, setCandidates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [erasing, setErasing] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [sendingInviteId, setSendingInviteId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Campaign filter from URL query param
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
  const fetchCandidates = async () => {
    try {
      const params = new URLSearchParams({ search, sortBy });
      if (campaignId) params.set('campaignId', campaignId);
      const res = await api.get(`/hr/candidates?${params.toString()}`);
      setCandidates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCandidates(), 300);
    return () => clearTimeout(timer);
  }, [search, sortBy, campaignId]);

  // Sync campaignId filter to URL
  const handleCampaignFilter = (val) => {
    setCampaignId(val);
    if (val) setSearchParams({ campaignId: val });
    else setSearchParams({});
  };

  const handleCopyMagicLink = (magicToken, id) => {
    if (!magicToken) return;
    const url = `${window.location.origin}/screening/${magicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendEmailInvite = async (candidateId, email) => {
    try {
      setSendingEmailId(candidateId);
      const res = await api.post(`/email/send-invite/${candidateId}`);
      if (res.data?.mode === 'SMTP') {
        alert(`Real email successfully dispatched to ${email}!`);
      } else {
        alert(`Email invitation generated for ${email}! (Running in terminal preview mode; set EMAIL_USER & EMAIL_PASS in .env to send real Gmail emails)`);
      }
      await fetchCandidates();
    } catch (err) {
      alert('Failed to send email invite: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendOmnichannelInvites = async (candidateId, name) => {
    try {
      setSendingInviteId(candidateId);
      const res = await api.post(`/hr/candidates/${candidateId}/send-invites`);
      alert(`Parallel Email & WhatsApp invitations dispatched for ${name || 'Candidate'}!`);
      await fetchCandidates();
    } catch (err) {
      alert('Failed to dispatch invitations: ' + (err.response?.data?.error || err.message));
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleEraseCandidateData = async (candidateId) => {
    if (!window.confirm('DPDP Section 12 Action: Are you sure you want to permanently erase this candidate\'s PII, transcripts, and evaluation score? This action is irreversible.')) {
      return;
    }

    try {
      setErasing(true);
      await api.post(`/dpdp/erase-candidate/${candidateId}`);
      setSelectedCandidate(null);
      await fetchCandidates();
      alert('Candidate data successfully purged under DPDP Right to Erasure.');
    } catch (err) {
      alert('Failed to erase candidate data: ' + (err.response?.data?.error || err.message));
    } finally {
      setErasing(false);
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

  return (
    <DashboardLayout role="HR">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
              Candidate Rankings
              <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> DPDP Compliant
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">Review AI scores, transcripts, and dispatch free email invitations.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
            {/* Campaign filter */}
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
                className="w-full pl-9"
              />
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
                  <th>Status & DPDP</th>
                  <th>Attempts</th>
                  <th>AI Score</th>
                  <th className="text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
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
                        <div className="flex flex-col gap-1 items-start">
                          <span className={
                            c.status === 'COMPLETED' ? 'badge-success' :
                            c.status === 'SCREENED' ? 'badge-primary' :
                            c.status === 'DATA_ERASED_DPDP' ? 'bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-semibold' :
                            'badge-warning'
                          }>
                            {c.status}
                          </span>
                          {c.dpdp_consent_given && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                              <ShieldCheck className="w-3 h-3" /> Consented ({c.dpdp_consent_channel || 'WA'})
                            </span>
                          )}
                        </div>
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
                          <span className="text-sm text-text-muted italic">
                            {c.status === 'DATA_ERASED_DPDP' ? 'Purged' : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {c.status !== 'DATA_ERASED_DPDP' && (
                            <button
                              onClick={() => handleSendOmnichannelInvites(c.id, c.name)}
                              disabled={sendingInviteId === c.id}
                              title="Dispatch Parallel Email & WhatsApp Invitations"
                              className="btn btn-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{sendingInviteId === c.id ? 'Inviting...' : 'Invites'}</span>
                            </button>
                          )}
                          {c.status !== 'DATA_ERASED_DPDP' && (
                            <button
                              onClick={() => handleSendEmailInvite(c.id, c.email)}
                              disabled={sendingEmailId === c.id}
                              title="Send / Resend Email Screening Invitation"
                              className="btn btn-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>{sendingEmailId === c.id ? 'Sending...' : 'Email'}</span>
                            </button>
                          )}
                          {c.magic_token && c.status !== 'DATA_ERASED_DPDP' && (
                            <button
                              onClick={() => handleCopyMagicLink(c.magic_token, c.id)}
                              title="Copy Candidate Web Screening Link"
                              className="btn btn-sm bg-surface-raised border border-border text-text-secondary hover:text-text-primary"
                            >
                              {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                              <span>{copiedId === c.id ? 'Copied' : 'Link'}</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCandidate(c)}
                            className="btn btn-sm bg-primary-light text-primary border border-primary/20 hover:bg-primary hover:text-white"
                          >
                            <FileText className="w-3.5 h-3.5" /> Dossier
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dossier & DPDP Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                  {selectedCandidate.name}'s Dossier
                  {selectedCandidate.dpdp_consent_given && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                      DPDP Consented
                    </span>
                  )}
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
                      selectedCandidate.status === 'SCREENED' ? 'badge-primary' :
                      selectedCandidate.status === 'DATA_ERASED_DPDP' ? 'bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold' :
                      'badge-warning'
                    }>
                      {selectedCandidate.status}
                    </span>
                  </div>
                  {selectedCandidate.magic_token && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleCopyMagicLink(selectedCandidate.magic_token, selectedCandidate.id)}
                        className="text-xs text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <LinkIcon className="w-3 h-3" /> Copy Web Screening Link
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Transcript */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  AI Interview Transcript & Evaluation
                </h3>
                <div className="bg-[#0F172A] border border-border rounded-xl p-5 font-mono text-[13px] text-slate-300 h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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

              {/* DPDP Right to Erasure Action Bar */}
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> DPDP Section 12 (Right to Erasure)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Permanently wipe candidate's phone, email, voice recordings, and AI evaluation logs.
                  </p>
                </div>
                <button
                  onClick={() => handleEraseCandidateData(selectedCandidate.id)}
                  disabled={erasing || selectedCandidate.status === 'DATA_ERASED_DPDP'}
                  className="btn btn-sm bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{erasing ? 'Purging...' : selectedCandidate.status === 'DATA_ERASED_DPDP' ? 'Data Purged' : 'Erase Candidate Data'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
