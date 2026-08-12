import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import Papa from 'papaparse';
import LocationSelector from '../shared/LocationSelector';
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
  { icon: '👤', label: 'Introduction', category: 'Communication', text: 'Could you briefly tell me about yourself and your current role?', key_criteria: 'Should mention current role, years of experience, and key skills.' },
  { icon: '💰', label: 'Current CTC', category: 'Compensation', text: 'What is your current CTC or annual package?', key_criteria: 'Should mention a specific amount or range in LPA or per year.' },
  { icon: '💸', label: 'Expected CTC', category: 'Compensation', text: 'What is your expected CTC for this new role?', key_criteria: 'Should mention expected salary or range.' },
  { icon: '📅', label: 'Notice Period', category: 'Availability', text: 'What is your current notice period?', key_criteria: 'Should state number of days, weeks, or say immediate joiner.' },
  { icon: '📍', label: 'Relocation', category: 'Availability', text: 'Are you open to relocation if this role requires it?', key_criteria: 'Yes or No, with preferred location or any constraints.' },
  { icon: '🏠', label: 'Work Mode', category: 'Availability', text: 'What is your preferred work mode — remote, hybrid, or on-site?', key_criteria: 'Should clearly state their preference.' },
  { icon: '📆', label: 'Experience', category: 'Pre-Screening', text: 'How many years of total professional experience do you have?', key_criteria: 'Should mention a specific number of years.' },
  { icon: '🗺️', label: 'Current City', category: 'Pre-Screening', text: 'What is your current city of residence?', key_criteria: 'Should mention city and state or country.' },
  { icon: '🕐', label: 'Joining Date', category: 'Availability', text: 'If selected, when would you be available to join?', key_criteria: 'Should state a specific date or timeframe.' },
  { icon: '🎓', label: 'Qualification', category: 'Pre-Screening', text: 'What is your highest educational qualification?', key_criteria: 'Should mention degree, field of study, and institution.' },
  { icon: '🌐', label: 'Languages', category: 'Communication', text: 'Which languages are you comfortable working in professionally?', key_criteria: 'Should mention languages and confidence level.' },
  { icon: '📊', label: 'Interview Stage', category: 'Pre-Screening', text: 'Are you currently appearing for interviews with any other companies?', key_criteria: 'Yes or No, with approximate stage if yes.' },
];

const CATEGORY_COLORS = {
  'Pre-Screening': 'badge-primary',
  'Compensation': 'badge-success',
  'Availability': 'badge-warning',
  'Communication': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Other': 'badge-muted',
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
  // ── Security & Sanitization Helpers ─────────────────────────────────────────
  const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/^[=+\-@]/, '').trim();
  };

  const normalizePhone = (phoneStr) => {
    let cleaned = String(phoneStr || '').replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) cleaned = `+91${cleaned}`;
      else cleaned = `+${cleaned}`;
    }
    return cleaned;
  };

  const isValidPhone = (phoneStr) => {
    const normalized = normalizePhone(phoneStr);
    const digitsOnly = normalized.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15 && /^\+[1-9]\d{9,14}$/.test(normalized);
  };

  const isValidEmail = (emailStr) => {
    if (!emailStr || emailStr.trim() === '' || emailStr.toLowerCase() === 'n/a') return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const deduplicateCandidates = (candList) => {
    const seenContacts = new Set();
    const seenEmails = new Set();
    const unique = [];

    for (const c of candList) {
      const phoneKey = normalizePhone(c.contact);
      const emailKey = (c.email || '').toLowerCase().trim();

      if (phoneKey && seenContacts.has(phoneKey)) continue;
      if (emailKey && emailKey !== 'n/a' && seenEmails.has(emailKey)) continue;

      if (phoneKey) seenContacts.add(phoneKey);
      if (emailKey && emailKey !== 'n/a') seenEmails.add(emailKey);
      unique.push({ ...c, contact: phoneKey || c.contact });
    }

    return unique;
  };

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
    const nameVal = sanitizeInput(raw.name ? String(raw.name) : getVal(['name', 'full name', 'fullname', 'candidate name', 'candidate']));
    const emailVal = sanitizeInput(raw.email ? String(raw.email).toLowerCase() : getVal(['email', 'e-mail', 'email address']).toLowerCase());
    const contactVal = normalizePhone(raw.contact ? String(raw.contact) : getVal(['contact', 'phone', 'mobile', 'phone number', 'contact number']));
    const empDetailsVal = sanitizeInput(raw.emp_details ? String(raw.emp_details) : getVal(['emp_details', 'emp details', 'details', 'experience', 'role details']));
    return {
      tempId: `cand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: nameVal, email: emailVal || 'N/A', contact: contactVal,
      emp_details: empDetailsVal || 'N/A', source
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    // Security Check: File Size Limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      const msg = 'CSV File size exceeds the maximum limit of 5MB.';
      setError(msg);
      alert(`⚠️ File Error:\n\n${msg}`);
      e.target.value = '';
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map(row => cleanAndNormalizeCandidate(row, 'CSV'))
          .filter(c => c.name.length >= 2 && isValidPhone(c.contact) && isValidEmail(c.email));

        if (parsed.length === 0) {
          const msg = 'No valid candidates found in CSV. Please ensure names, valid emails, and full phone numbers (10+ digits) are provided.';
          setError(msg);
          alert(`⚠️ Invalid CSV Data:\n\n${msg}`);
          e.target.value = '';
          return;
        }

        setCandidates(prev => deduplicateCandidates([...prev, ...parsed]));
        e.target.value = '';
      }
    });
  };

  const handleAddManualCandidate = (e) => {
    e.preventDefault();
    setManualFormError('');
    const cleanName = sanitizeInput(manualName);
    const cleanEmail = sanitizeInput(manualEmail).toLowerCase();
    const cleanContact = normalizePhone(manualContact);

    if (cleanName.length < 2) {
      const msg = 'Candidate full name is required (at least 2 characters).';
      setManualFormError(msg);
      alert(`⚠️ Validation Error:\n\n${msg}`);
      return;
    }

    if (cleanEmail && cleanEmail !== 'n/a' && !isValidEmail(cleanEmail)) {
      const msg = `Invalid email address "${manualEmail}". Please enter a valid email format (e.g. name@company.com).`;
      setManualFormError(msg);
      alert(`⚠️ Invalid Email Format:\n\n${msg}`);
      return;
    }

    if (!isValidPhone(cleanContact)) {
      const msg = `Invalid phone number "${manualContact}". Please enter a full phone number with country code (minimum 10 digits, e.g. +14155552671 or +919876543210).`;
      setManualFormError(msg);
      alert(`⚠️ Invalid Phone Number:\n\n${msg}`);
      return;
    }

    const newCandidate = cleanAndNormalizeCandidate({ name: cleanName, email: cleanEmail, contact: cleanContact, emp_details: manualEmpDetails }, 'Manual');
    setCandidates(prev => deduplicateCandidates([...prev, newCandidate]));
    setManualName(''); setManualEmail(''); setManualContact(''); setManualEmpDetails('');
  };

  const handleDeleteCandidate = (tempId) => setCandidates(prev => prev.filter(c => c.tempId !== tempId));
  const handleClearAllCandidates = () => { if (window.confirm('Remove all added candidates?')) setCandidates([]); };

  // ── Question helpers ──────────────────────────────────────────────────────
  const addQuestion = () => setQuestions(prev => [...prev, newQuestion()]);
  const removeQuestion = (id) => setQuestions(prev => prev.filter(q => q.id !== id));
  const updateQuestion = (id, field, value) =>
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: sanitizeInput(value) } : q));

  const insertTemplate = (tpl) => {
    const exists = questions.some(q => q.text.trim() === tpl.text.trim());
    if (exists) return;
    if (questions.length === 1 && !questions[0].text.trim()) {
      setQuestions([{ ...questions[0], text: tpl.text, key_criteria: tpl.key_criteria, category: tpl.category }]);
    } else {
      setQuestions(prev => [...prev, { id: `q_${Date.now()}`, text: tpl.text, key_criteria: tpl.key_criteria, category: tpl.category }]);
    }
  };

  const validQuestions = questions
    .map(q => ({
      ...q,
      text: sanitizeInput(q.text),
      key_criteria: sanitizeInput(q.key_criteria)
    }))
    .filter(q => q.text.length >= 5);

  // ── Launch ────────────────────────────────────────────────────────────────
  const handleLaunch = async () => {
    const cleanName = sanitizeInput(name);
    const cleanLocation = sanitizeInput(location);

    if (cleanName.length < 3) {
      setError('Campaign Name must be at least 3 characters long.');
      setStep(1); return;
    }
    if (candidates.length === 0) {
      setError('Please add at least one candidate to launch the campaign.');
      setStep(2); return;
    }
    if (validQuestions.length === 0) {
      setError('Please add at least one valid screening question (min 5 characters).');
      setStep(3); return;
    }

    // Read saved voice config from AgentStudio settings
    let ttsVoice = 'en-US-AvaNeural';
    try {
      const studioConfig = localStorage.getItem('antitalk_agent_studio_config');
      if (studioConfig) {
        const parsed = JSON.parse(studioConfig);
        if (parsed.selectedVoice) ttsVoice = parsed.selectedVoice;
      }
    } catch (_) {}

    setLoading(true);
    setError('');
    try {
      const campRes = await api.post('/hr/campaigns', { name: cleanName, location: cleanLocation || 'Not specified', job_role_id: jobRoleId });
      const campaignId = campRes.data.id;
      await api.post(`/hr/campaigns/${campaignId}/candidates`, { candidates });
      await api.post(`/hr/campaigns/${campaignId}/questions`, { questions: validQuestions });
      await api.post(`/hr/campaigns/${campaignId}/launch`, { ttsVoice });
      navigate('/hr');
    } catch (err) {
      console.error('[CreateCampaignWizard] Failed to launch campaign:', err);
      let errMsg = err.response?.data?.error || 'Failed to launch campaign. Please check input parameters.';
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        errMsg += ': ' + err.response.data.details.join(', ');
      }
      setError(errMsg);
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
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 tracking-tight">
              <Sparkles className="w-7 h-7 text-primary" />
              Create AntiTalk Campaign
            </h1>
            <p className="text-text-secondary text-sm mt-1">Configure job metadata, candidate roster, and AI screening questions.</p>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['Metadata', 'Candidates', 'Questions', 'Launch'].map((label, idx) => {
              const s = idx + 1;
              const isActive = s === step;
              const isPast = s < step;
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`flex flex-col items-center justify-center transition-all ${isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'}`}>
                    <div className={`text-[10px] font-bold mb-1 uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                      {label}
                    </div>
                    <div className={`h-1.5 w-16 sm:w-20 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-border'}`} />
                  </div>
                  {s < 4 && <div className="text-border mt-3 mx-0.5"><ChevronRight className="w-3 h-3" /></div>}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-bg text-danger border border-danger/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="card p-8 shadow-xl">

          {/* ── STEP 1: METADATA ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-text-primary mb-4">Step 1: Campaign Metadata</h2>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Campaign Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full"
                  placeholder="e.g. Q3 Senior Node.js Developers" />
              </div>
              <LocationSelector value={location} onChange={setLocation} />
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Target Job Role</label>
                <select value={jobRoleId} onChange={e => setJobRoleId(e.target.value)}
                  className="w-full">
                  {jobRoles.map(r => (<option key={r.id} value={r.id}>{r.title} ({r.department})</option>))}
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={() => setStep(2)} disabled={!name.trim()}
                  className="btn-primary">
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
                  <h2 className="text-xl font-bold text-text-primary">Step 2: Candidate Roster</h2>
                  <p className="text-sm text-text-secondary">Add candidates manually or bulk upload via CSV.</p>
                </div>
                {candidates.length > 0 && (
                  <span className="badge-success">
                    {candidates.length} Candidate{candidates.length === 1 ? '' : 's'} Ready
                  </span>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex border-b border-border gap-4">
                {[['manual', UserPlus, 'Manual Addition'], ['csv', FileSpreadsheet, 'CSV Bulk Upload']].map(([mode, Icon, label]) => (
                  <button key={mode} type="button" onClick={() => setInputMode(mode)}
                    className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${inputMode === mode ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {inputMode === 'manual' && (
                <div className="bg-surface-raised border border-border rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" /> Add New Candidate
                  </h3>
                  {manualFormError && (
                    <div className="p-3 bg-danger-bg border border-danger/20 rounded-lg text-danger text-xs font-medium flex items-center gap-2">
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
                        <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>
                        <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                          className="w-full px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={handleAddManualCandidate}
                      className="btn btn-sm bg-primary text-white hover:bg-primary-hover">
                      <Plus className="w-4 h-4" /> Add Candidate
                    </button>
                  </div>
                </div>
              )}

              {inputMode === 'csv' && (
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/40 transition-colors relative bg-surface-raised">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="text-base font-bold text-text-primary mb-1">Upload Candidate CSV</h3>
                  <p className="text-xs text-text-muted mb-2">Supported columns: name, email, contact, emp_details</p>
                  <span className="inline-block px-3 py-1 bg-white border border-border text-text-secondary text-xs rounded-full font-mono font-medium">ETL Auto-normalization active</span>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-text-primary">Added Candidates ({candidates.length})</h3>
                    {candidates.length > 0 && (
                      <button type="button" onClick={handleClearAllCandidates} className="text-xs font-semibold text-danger hover:text-red-700 transition-colors">Clear All</button>
                    )}
                  </div>
                  {candidates.length > 3 && (
                    <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input type="text" placeholder="Search candidate..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm" />
                    </div>
                  )}
                </div>
                {candidates.length === 0 ? (
                  <div className="p-8 text-center border border-border rounded-xl bg-surface-raised">
                    <UserPlus className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-secondary font-medium">No candidates added yet</p>
                    <p className="text-xs text-text-muted mt-1">Use the form above or upload a CSV file.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto border border-border rounded-xl overflow-hidden bg-surface">
                    <table className="data-table">
                      <thead className="sticky top-0 bg-surface-raised z-10 shadow-sm">
                        <tr>
                          <th>Candidate</th>
                          <th>Contact</th>
                          <th>Details</th>
                          <th>Source</th>
                          <th className="text-right pr-5">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.map(c => (
                          <tr key={c.tempId}>
                            <td><div className="font-semibold text-text-primary">{c.name}</div><div className="text-text-muted text-[11px]">{c.email || 'No email'}</div></td>
                            <td className="font-mono text-sm text-text-secondary">{c.contact}</td>
                            <td className="text-sm text-text-secondary max-w-xs truncate">{c.emp_details}</td>
                            <td>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c.source === 'Manual' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-cyan-100 text-cyan-700 border border-cyan-200'}`}>{c.source}</span>
                            </td>
                            <td className="text-right pr-5">
                              <button type="button" onClick={() => handleDeleteCandidate(c.tempId)}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-lg transition-colors">
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
                <button onClick={() => setStep(1)} className="px-6 py-2 text-text-secondary hover:text-text-primary font-medium transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={candidates.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  Next: Screening Questions ({candidates.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: SCREENING QUESTION BUILDER ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Step 3: Screening Questions
                </h2>
                <p className="text-text-secondary text-sm">
                  Define the pre-screening questions AntiTalk will ask candidates. The AI will ask <strong className="text-text-primary">only these questions</strong> — no technical quizzes.
                </p>
              </div>

              {/* ── Template Quick-Insert Panel ─────────────────────────── */}
              <div className="border border-primary/20 bg-primary-light rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowTemplates(v => !v)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Quick-Insert Templates</span>
                    <span className="px-2 py-0.5 bg-white border border-primary/20 text-primary text-xs rounded-full font-bold">{PRESCREEN_TEMPLATES.length} ready-made</span>
                  </div>
                  {showTemplates ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
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
                          className={`group flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${alreadyAdded
                            ? 'border-border bg-surface opacity-50 cursor-not-allowed'
                            : 'border-border bg-surface hover:border-primary/40 hover:shadow-md cursor-pointer'
                            }`}
                        >
                          <span className="text-base leading-none">{tpl.icon}</span>
                          <span className="text-xs font-bold text-text-primary">{tpl.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex font-semibold ${CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS['Other']}`}>{tpl.category}</span>
                          {alreadyAdded && <span className="text-[10px] font-bold text-success mt-1">✓ Added</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Question Cards ──────────────────────────────────────── */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-surface border border-border rounded-2xl p-5 space-y-4 relative group shadow-sm">
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary-light text-primary text-sm font-bold flex items-center justify-center border border-primary/20">{idx + 1}</span>
                        <select
                          value={q.category}
                          onChange={e => updateQuestion(q.id, 'category', e.target.value)}
                          className="text-xs font-bold bg-transparent border-none text-text-primary focus:outline-none cursor-pointer px-0 py-0"
                        >
                          {Object.keys(CATEGORY_COLORS).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex ${CATEGORY_COLORS[q.category] || CATEGORY_COLORS['Other']}`}>{q.category}</span>
                      </div>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(q.id)}
                          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-bg rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">Question Text *</label>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                        placeholder="e.g. What is your current CTC?"
                        className="w-full text-sm resize-none"
                      />
                    </div>

                    {/* Key Criteria */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1.5">
                        Expected Answer / Key Criteria
                        <span className="ml-1 font-normal text-text-muted">(optional — helps the AI evaluate the response)</span>
                      </label>
                      <textarea
                        rows={1}
                        value={q.key_criteria}
                        onChange={e => updateQuestion(q.id, 'key_criteria', e.target.value)}
                        placeholder="e.g. Should mention a specific amount in LPA"
                        className="w-full text-sm resize-none bg-surface-raised border-border"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              {questions.length < 15 && (
                <button type="button" onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-primary hover:text-primary hover:bg-primary-light transition-all text-sm font-bold bg-surface-raised">
                  <Plus className="w-4 h-4" /> Add Another Question
                </button>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-xs font-semibold text-text-muted">
                  {validQuestions.length} of {questions.length} question{questions.length !== 1 ? 's' : ''} ready
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="px-6 py-2 font-medium text-text-secondary hover:text-text-primary transition-colors">Back</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={validQuestions.length === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    Review & Launch <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW & LAUNCH ───────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-text-primary mb-4">Step 4: Review & Launch</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {[['Campaign Name', name, 'text-text-primary'],
                ['Target Location', location || 'Global Remote', 'text-text-primary'],
                ['Total Candidates', `${candidates.length} candidates`, 'text-success']
                ].map(([label, val, cls]) => (
                  <div key={label} className="p-4 bg-surface-raised border border-border rounded-xl">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{label}</p>
                    <p className={`text-lg font-extrabold mt-1 tracking-tight ${cls}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Questions Summary */}
              <div className="bg-surface-raised border border-border rounded-xl p-5">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> {validQuestions.length} Screening Questions
                </h4>
                <div className="space-y-3">
                  {validQuestions.map((q, i) => (
                    <div key={q.id} className="flex items-start gap-3 text-sm bg-surface p-3 rounded-lg border border-border shadow-sm">
                      <span className="w-6 h-6 rounded-full bg-primary-light text-primary text-[11px] font-bold flex items-center justify-center shrink-0 border border-primary/20">{i + 1}</span>
                      <div>
                        <p className="font-semibold text-text-primary">{q.text}</p>
                        {q.key_criteria && <p className="text-xs text-text-secondary mt-1 font-medium">Criteria: {q.key_criteria}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster Preview */}
              <div className="bg-surface-raised border border-border rounded-xl p-5">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Roster Summary</h4>
                <div className="flex flex-wrap gap-2">
                  {candidates.map(c => (
                    <span key={c.tempId} className="px-3 py-1.5 bg-surface border border-border text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm">
                      <span>{c.name}</span>
                      <span className="text-text-muted font-mono font-medium text-[10px]">({c.contact})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-success-bg border border-success/30 rounded-xl text-success text-sm font-medium flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Clicking launch will save the campaign, import {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}, save {validQuestions.length} screening question{validQuestions.length !== 1 ? 's' : ''}, and trigger the AntiTalk AI Voice Engine.</p>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <button onClick={() => setStep(3)} className="px-6 py-2 font-medium text-text-secondary hover:text-text-primary transition-colors">Back</button>
                <button onClick={handleLaunch} disabled={loading}
                  className="btn bg-success text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-base px-8 py-3">
                  {loading ? 'Launching Engine...' : 'Launch AntiTalk Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
