import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import Papa from 'papaparse';
import { 
  Upload, 
  ChevronRight, 
  CheckCircle2, 
  UserPlus, 
  Trash2, 
  FileSpreadsheet, 
  Plus, 
  AlertCircle, 
  X,
  Search,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

// ── Pre-Screening Question Templates ─────────────────────────────────────────
const PRESCREEN_TEMPLATES = [
  { icon: '👤', label: 'Introduction',   category: 'Communication',  text: 'Could you briefly tell me about yourself and your current role?',           key_criteria: 'Should mention current role, years of experience, and key skills.' },
  { icon: '💰', label: 'Current CTC',    category: 'Compensation',   text: 'What is your current CTC or annual package?',                               key_criteria: 'Should mention a specific amount or range in LPA or per year.' },
  { icon: '💸', label: 'Expected CTC',   category: 'Compensation',   text: 'What is your expected CTC for this new role?',                              key_criteria: 'Should mention expected salary or range.' },
  { icon: '📅', label: 'Notice Period',  category: 'Availability',   text: 'What is your current notice period?',                                       key_criteria: 'Should state number of days, weeks, or say immediate joiner.' },
  { icon: '📍', label: 'Relocation',     category: 'Availability',   text: 'Are you open to relocation if this role requires it?',                      key_criteria: 'Yes or No, with preferred location or any constraints.' },
  { icon: '🏠', label: 'Work Mode',      category: 'Availability',   text: 'What is your preferred work mode — remote, hybrid, or on-site?',            key_criteria: 'Should clearly state their preference.' },
  { icon: '📆', label: 'Experience',     category: 'Pre-Screening',  text: 'How many years of total professional experience do you have?',              key_criteria: 'Should mention a specific number of years.' },
  { icon: '🗺️', label: 'Current City',   category: 'Pre-Screening',  text: 'What is your current city of residence?',                                   key_criteria: 'Should mention city and state or country.' },
  { icon: '🕐', label: 'Joining Date',   category: 'Availability',   text: 'If selected, when would you be available to join?',                         key_criteria: 'Should state a specific date or timeframe.' },
  { icon: '🎓', label: 'Qualification',  category: 'Pre-Screening',  text: 'What is your highest educational qualification?',                           key_criteria: 'Should mention degree, field of study, and institution.' },
  { icon: '🌐', label: 'Languages',      category: 'Communication',  text: 'Which languages are you comfortable working in professionally?',            key_criteria: 'Should mention languages and confidence level.' },
  { icon: '📊', label: 'Interview Stage',category: 'Pre-Screening',  text: 'Are you currently appearing for interviews with any other companies?',      key_criteria: 'Yes or No, with approximate stage if yes.' },
];

const CATEGORY_COLORS = {
  'Pre-Screening': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Compensation':  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Availability':  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Communication': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Other':         'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const newQuestion = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  text: '',
  key_criteria: '',
  category: 'Pre-Screening'
});

export default function CreateCampaignWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Step 1: Metadata
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [jobRoleId, setJobRoleId] = useState('');
  const [jobRoles, setJobRoles] = useState([]);

  // Step 2: Candidates State & Mode
  const [candidates, setCandidates] = useState([]);
  const [inputMode, setInputMode] = useState('manual');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Manual Candidate Form State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [manualEmpDetails, setManualEmpDetails] = useState('');
  const [manualFormError, setManualFormError] = useState('');

  // Step 3: Questions
  const [questions, setQuestions] = useState([newQuestion()]);
  const [showTemplates, setShowTemplates] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/hr/job-roles');
        setJobRoles(res.data);
        if (res.data.length > 0) setJobRoleId(res.data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoles();
  }, []);

  // ── Candidate helpers ─────────────────────────────────────────────────────
  const cleanAndNormalizeCandidate = (raw, source = 'CSV') => {
    const getVal = (possibleKeys) => {
      for (const key of Object.keys(raw)) {
        if (possibleKeys.includes(key.toLowerCase().trim())) {
          return String(raw[key] || '').trim();
        }
      }
      return '';
    };
    const nameVal    = raw.name    ? String(raw.name).trim()    : getVal(['name', 'full name', 'fullname', 'candidate name', 'candidate']);
    const emailVal   = raw.email   ? String(raw.email).trim().toLowerCase() : getVal(['email', 'e-mail', 'email address']).toLowerCase();
    const contactVal = raw.contact ? String(raw.contact).trim() : getVal(['contact', 'phone', 'mobile', 'phone number', 'contact number']);
    const empDetailsVal = raw.emp_details ? String(raw.emp_details).trim() : getVal(['emp_details', 'emp details', 'details', 'experience', 'role details']);
    return {
      tempId: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: nameVal, email: emailVal, contact: contactVal,
      emp_details: empDetailsVal || 'N/A', source
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map(row => cleanAndNormalizeCandidate(row, 'CSV'))
          .filter(c => c.name !== '' || c.contact !== '');
        setCandidates(prev => [...prev, ...parsed]);
        e.target.value = '';
      }
    });
  };

  const handleAddManualCandidate = (e) => {
    e.preventDefault();
    setManualFormError('');
    if (!manualName.trim()) { setManualFormError('Candidate name is required.'); return; }
    if (!manualContact.trim()) { setManualFormError('Contact number is required for voice calling.'); return; }
    const newCandidate = cleanAndNormalizeCandidate({ name: manualName, email: manualEmail, contact: manualContact, emp_details: manualEmpDetails }, 'Manual');
    setCandidates(prev => [...prev, newCandidate]);
    setManualName(''); setManualEmail(''); setManualContact(''); setManualEmpDetails('');
  };

  const handleDeleteCandidate = (tempId) => setCandidates(prev => prev.filter(c => c.tempId !== tempId));
  const handleClearAllCandidates = () => { if (window.confirm('Remove all added candidates?')) setCandidates([]); };

  // ── Question helpers ──────────────────────────────────────────────────────
  const addQuestion = () => setQuestions(prev => [...prev, newQuestion()]);
  const removeQuestion = (id) => setQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id, field, value) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));

  const insertTemplate = (tpl) => {
    const exists = questions.some(q => q.text.trim() === tpl.text.trim());
    if (exists) return;
    // If only one empty question, replace it
    if (questions.length === 1 && !questions[0].text.trim()) {
      setQuestions([{ ...questions[0], text: tpl.text, key_criteria: tpl.key_criteria, category: tpl.category }]);
    } else {
      setQuestions(prev => [...prev, { id: `q_${Date.now()}`, text: tpl.text, key_criteria: tpl.key_criteria, category: tpl.category }]);
    }
  };

  const validQuestions = questions.filter(q => q.text.trim());

  // ── Launch ────────────────────────────────────────────────────────────────
  const handleLaunch = async () => {
    if (candidates.length === 0) {
      setError('Please add at least one candidate to launch the campaign.');
      setStep(2); return;
    }
    if (validQuestions.length === 0) {
      setError('Please add at least one screening question.');
      setStep(3); return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Create Campaign
      const campRes = await api.post('/hr/campaigns', { name, location: location || 'Not specified', job_role_id: jobRoleId });
      const campaignId = campRes.data.id;
      // 2. Import Candidates
      await api.post(`/hr/campaigns/${campaignId}/candidates`, { candidates });
      // 3. Save Questions
      await api.post(`/hr/campaigns/${campaignId}/questions`, { questions: validQuestions });
      // 4. Launch
      await api.post(`/hr/campaigns/${campaignId}/launch`);
      navigate('/hr');
    } catch (err) {
      setError('Failed to launch campaign. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contact.includes(searchQuery)
  );

  return (
    <DashboardLayout role="HR">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary" />
              Create AntiGravity Campaign
            </h1>
            <p className="text-slate-400 text-sm mt-1">Configure job metadata, candidate roster, and AI screening questions.</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-2.5 w-12 rounded-full transition-all ${s <= step ? 'bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="bg-surface/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* ── STEP 1: METADATA ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-white mb-4">Step 1: Campaign Metadata</h2>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Campaign Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Q3 Senior Node.js Developers" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Remote / New York / San Francisco" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Target Job Role</label>
                <select value={jobRoleId} onChange={e => setJobRoleId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary transition-colors">
                  {jobRoles.map(r => (<option key={r.id} value={r.id} className="bg-slate-900">{r.title} ({r.department})</option>))}
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setStep(2)} disabled={!name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  Next: Add Candidates <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: CANDIDATE ROSTER ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Step 2: Candidate Roster</h2>
                  <p className="text-sm text-slate-400">Add candidates manually or bulk upload via CSV.</p>
                </div>
                {candidates.length > 0 && (
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-full">
                    {candidates.length} Candidate{candidates.length === 1 ? '' : 's'} Ready
                  </span>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex border-b border-white/10 gap-4">
                {[['manual', UserPlus, 'Manual Addition'], ['csv', FileSpreadsheet, 'CSV Bulk Upload']].map(([mode, Icon, label]) => (
                  <button key={mode} type="button" onClick={() => setInputMode(mode)}
                    className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all ${inputMode === mode ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {inputMode === 'manual' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" /> Add New Candidate
                  </h3>
                  {manualFormError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />{manualFormError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[['Full Name *', 'text', manualName, setManualName, 'e.g. Sarah Jenkins'],
                      ['Email Address', 'email', manualEmail, setManualEmail, 'e.g. sarah@example.com'],
                      ['Phone / Contact *', 'text', manualContact, setManualContact, 'e.g. +1234567890'],
                      ['Employment / Role Details', 'text', manualEmpDetails, setManualEmpDetails, 'e.g. 5 yrs React, Node.js, AWS']
                    ].map(([label, type, val, setter, ph]) => (
                      <div key={label}>
                        <label className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
                        <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                          className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleAddManualCandidate}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary/90 text-white text-sm font-medium rounded-xl hover:bg-primary transition-all">
                      <Plus className="w-4 h-4" /> Add Candidate
                    </button>
                  </div>
                </div>
              )}

              {inputMode === 'csv' && (
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors relative bg-white/5">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white mb-1">Upload Candidate CSV</h3>
                  <p className="text-xs text-slate-400 mb-2">Supported columns: name, email, contact, emp_details</p>
                  <span className="inline-block px-3 py-1 bg-white/10 text-slate-300 text-xs rounded-full font-mono">ETL Auto-normalization active</span>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-white">Added Candidates ({candidates.length})</h3>
                    {candidates.length > 0 && (
                      <button type="button" onClick={handleClearAllCandidates} className="text-xs text-red-400 hover:text-red-300 transition-colors">Clear All</button>
                    )}
                  </div>
                  {candidates.length > 3 && (
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input type="text" placeholder="Search candidate..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-primary" />
                    </div>
                  )}
                </div>
                {candidates.length === 0 ? (
                  <div className="p-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                    <UserPlus className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-slate-400 font-medium">No candidates added yet</p>
                    <p className="text-xs text-slate-500 mt-1">Use the form above or upload a CSV file.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/5 text-slate-400 uppercase font-semibold sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Candidate</th><th className="p-3">Contact</th>
                          <th className="p-3">Details</th><th className="p-3">Source</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredCandidates.map(c => (
                          <tr key={c.tempId} className="hover:bg-white/5 transition-colors">
                            <td className="p-3"><div className="font-medium text-white">{c.name}</div><div className="text-slate-400 text-[11px]">{c.email || 'No email'}</div></td>
                            <td className="p-3 font-mono text-slate-200">{c.contact}</td>
                            <td className="p-3 text-slate-300 max-w-xs truncate">{c.emp_details}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${c.source === 'Manual' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>{c.source}</span>
                            </td>
                            <td className="p-3 text-right">
                              <button type="button" onClick={() => handleDeleteCandidate(c.tempId)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={candidates.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  Next: Screening Questions ({candidates.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: SCREENING QUESTION BUILDER ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Step 3: Screening Questions
                </h2>
                <p className="text-slate-400 text-sm">
                  Define the pre-screening questions AntiTalk will ask candidates. The AI will ask <strong className="text-white">only these questions</strong> — no technical quizzes.
                </p>
              </div>

              {/* ── Template Quick-Insert Panel ─────────────────────────── */}
              <div className="border border-primary/20 bg-primary/5 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTemplates(v => !v)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-white">Quick-Insert Templates</span>
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">{PRESCREEN_TEMPLATES.length} ready-made</span>
                  </div>
                  {showTemplates ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showTemplates && (
                  <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {PRESCREEN_TEMPLATES.map(tpl => {
                      const alreadyAdded = questions.some(q => q.text.trim() === tpl.text.trim());
                      return (
                        <button
                          key={tpl.label}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => insertTemplate(tpl)}
                          className={`group flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                            alreadyAdded
                              ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                              : 'border-white/10 bg-white/5 hover:border-primary/40 hover:bg-primary/10 cursor-pointer'
                          }`}
                        >
                          <span className="text-base">{tpl.icon}</span>
                          <span className="text-xs font-medium text-white">{tpl.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[tpl.category]}`}>{tpl.category}</span>
                          {alreadyAdded && <span className="text-[10px] text-emerald-400">✓ Added</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Question Cards ──────────────────────────────────────── */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 relative group">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        <select
                          value={q.category}
                          onChange={e => updateQuestion(q.id, 'category', e.target.value)}
                          className="text-xs bg-transparent border-none text-slate-300 focus:outline-none cursor-pointer"
                        >
                          {Object.keys(CATEGORY_COLORS).map(cat => (
                            <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                          ))}
                        </select>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[q.category] || CATEGORY_COLORS['Other']}`}>{q.category}</span>
                      </div>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(q.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Question Text *</label>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                        placeholder="e.g. What is your current CTC?"
                        className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                      />
                    </div>

                    {/* Key Criteria */}
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Expected Answer / Key Criteria
                        <span className="ml-1 text-slate-500">(optional — helps the AI evaluate the response)</span>
                      </label>
                      <textarea
                        rows={1}
                        value={q.key_criteria}
                        onChange={e => updateQuestion(q.id, 'key_criteria', e.target.value)}
                        placeholder="e.g. Should mention a specific amount in LPA"
                        className="w-full px-4 py-2 bg-slate-900/40 border border-white/5 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-primary/50 resize-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              {questions.length < 15 && (
                <button type="button" onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium">
                  <Plus className="w-4 h-4" /> Add Another Question
                </button>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="text-xs text-slate-500">
                  {validQuestions.length} of {questions.length} question{questions.length !== 1 ? 's' : ''} ready
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Back</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={validQuestions.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    Review & Launch <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW & LAUNCH ───────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-white mb-4">Step 4: Review & Launch</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {[['Campaign Name', name, 'text-white'],
                  ['Target Location', location || 'Global Remote', 'text-white'],
                  ['Total Candidates', `${candidates.length} candidates`, 'text-emerald-400']
                ].map(([label, val, cls]) => (
                  <div key={label} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className={`text-lg font-bold mt-1 ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Questions Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> {validQuestions.length} Screening Questions
                </h4>
                <div className="space-y-2">
                  {validQuestions.map((q, i) => (
                    <div key={q.id} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <div>
                        <p className="text-slate-200">{q.text}</p>
                        {q.key_criteria && <p className="text-xs text-slate-500 mt-0.5">Criteria: {q.key_criteria}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster Preview */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Roster Summary</h4>
                <div className="flex flex-wrap gap-2">
                  {candidates.map(c => (
                    <span key={c.tempId} className="px-2.5 py-1 bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-lg flex items-center gap-1.5">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">({c.contact})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Clicking launch will save the campaign, import {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}, save {validQuestions.length} screening question{validQuestions.length !== 1 ? 's' : ''}, and trigger the AntiGravity AI Voice Engine.</p>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(3)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Back</button>
                <button onClick={handleLaunch} disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50">
                  {loading ? 'Launching Engine...' : 'Launch AntiGravity Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
