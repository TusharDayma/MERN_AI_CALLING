import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { Search, Filter, FileText, X } from 'lucide-react';

export default function CandidateRanking() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await api.get(`/hr/candidates?search=${search}&sortBy=${sortBy}`);
        setCandidates(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(() => fetchCandidates(), 300);
    return () => clearTimeout(timer);
  }, [search, sortBy]);

  return (
    <DashboardLayout role="HR">
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Candidate Rankings</h1>
            <p className="text-slate-400">Review AI scores and detailed transcripts.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
              />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-surface border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option className="bg-slate-900" value="date_desc">Newest First</option>
              <option className="bg-slate-900" value="score_high">Highest AI Score</option>
            </select>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-sm font-medium text-slate-300">Candidate Name</th>
                <th className="p-4 text-sm font-medium text-slate-300">Campaign</th>
                <th className="p-4 text-sm font-medium text-slate-300">Status</th>
                <th className="p-4 text-sm font-medium text-slate-300">AI Score</th>
                <th className="p-4 text-sm font-medium text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400">No candidates found.</td></tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-sm text-slate-400">{c.email}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{c.campaign?.name || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        c.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        c.status === 'SCREENED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {c.ai_score ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${c.ai_score}%` }} />
                          </div>
                          <span className="text-sm font-bold text-white">{c.ai_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedCandidate(c)}
                        className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dossier Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95">
            <button onClick={() => setSelectedCandidate(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">{selectedCandidate.name}'s Dossier</h2>
            <p className="text-slate-400 mb-6">{selectedCandidate.email} • {selectedCandidate.contact}</p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-slate-400 text-sm mb-1">Overall AI Score</p>
                <p className="text-5xl font-bold text-primary">{selectedCandidate.ai_score || '-'}</p>
              </div>
              <div className="p-6 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-slate-400 text-sm mb-1">Interview Status</p>
                <p className="text-3xl font-bold text-white mt-3">{selectedCandidate.status}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Raw Transcript
              </h3>
              <div className="bg-slate-900 border border-white/10 rounded-xl p-4 font-mono text-sm text-slate-300 h-64 overflow-y-auto whitespace-pre-wrap">
                {selectedCandidate.dossier_json ? 
                  JSON.stringify(selectedCandidate.dossier_json, null, 2) : 
                  "Waiting for AntiGravity Engine to complete the interview and post the transcript payload..."
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
