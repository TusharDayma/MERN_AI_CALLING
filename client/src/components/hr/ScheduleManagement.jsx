import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  UserCheck, 
  Link as LinkIcon, 
  CheckCircle2, 
  Plus, 
  Copy, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

export default function ScheduleManagement() {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'slots', 'shortlisted'
  const [copiedId, setCopiedId] = useState(null);
  
  // Weekly slots state
  const [slots, setSlots] = useState([
    { id: 's1', day: 'Monday', time: '10:00 AM - 11:00 AM', status: 'Available' },
    { id: 's2', day: 'Monday', time: '02:00 PM - 03:00 PM', status: 'Booked' },
    { id: 's3', day: 'Tuesday', time: '11:00 AM - 12:00 PM', status: 'Available' },
    { id: 's4', day: 'Wednesday', time: '03:00 PM - 04:00 PM', status: 'Available' },
    { id: 's5', day: 'Thursday', time: '04:00 PM - 05:00 PM', status: 'Available' },
    { id: 's6', day: 'Friday', time: '10:00 AM - 11:00 AM', status: 'Available' },
  ]);

  // Shortlisted Candidates (AI Score >= 75)
  const [shortlisted, setShortlisted] = useState([
    { id: 'c1', name: 'Sarah Jenkins', role: 'Senior React Developer', score: 92, contact: '+14155552671', email: 'sarah.j@example.com', booked: true, bookedTime: 'Tomorrow at 02:00 PM' },
    { id: 'c2', name: 'Rahul Sharma', role: 'Backend Node.js Lead', score: 88, contact: '+919876543210', email: 'rahul.s@example.com', booked: false, bookedTime: null },
    { id: 'c3', name: 'Elena Rostova', role: 'Full Stack Engineer', score: 84, contact: '+442079460912', email: 'elena.r@example.com', booked: false, bookedTime: null },
    { id: 'c4', name: 'David Chen', role: 'Senior React Developer', score: 79, contact: '+14155559821', email: 'david.c@example.com', booked: true, bookedTime: 'Wed at 10:00 AM' },
  ]);

  // Upcoming Confirmed Interviews
  const [upcoming, setUpcoming] = useState([
    { id: 'i1', candidateName: 'Sarah Jenkins', role: 'Senior React Developer', date: 'Tomorrow, Aug 10', time: '02:00 PM - 03:00 PM', type: '1-on-1 Human Round', interviewer: 'HR Manager', status: 'CONFIRMED' },
    { id: 'i2', candidateName: 'David Chen', role: 'Senior React Developer', date: 'Wednesday, Aug 11', time: '10:00 AM - 11:00 AM', type: 'Technical Deep-Dive', interviewer: 'Lead Architect', status: 'CONFIRMED' },
  ]);

  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('09:00 AM - 10:00 AM');

  const handleAddSlot = (e) => {
    e.preventDefault();
    const newSlot = {
      id: `s_${Date.now()}`,
      day: newDay,
      time: newTime,
      status: 'Available'
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const handleCopyBookingLink = (candidateId) => {
    const link = `${window.location.origin}/schedule/book?candidate=${candidateId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(candidateId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout role="HR">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Automated Interview Scheduler
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Set availability slots & auto-book shortlisted candidates ($\ge 75$ AI Score) for human rounds.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-raised p-1.5 rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'upcoming' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Clock className="w-4 h-4" />
              Upcoming ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('shortlisted')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'shortlisted' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Auto-Book Hub ({shortlisted.length})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === 'slots' ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              My Slots ({slots.length})
            </button>
          </div>
        </div>

        {/* ── TAB 1: UPCOMING CONFIRMED INTERVIEWS ─────────────────────────────── */}
        {activeTab === 'upcoming' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((item) => (
                <div key={item.id} className="bg-surface border border-border rounded-2xl p-6 shadow-md hover:border-primary/40 transition-all space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge-success mb-2 inline-block">
                        <CheckCircle2 className="w-3 h-3" /> {item.status}
                      </span>
                      <h3 className="text-xl font-bold text-text-primary">{item.candidateName}</h3>
                      <p className="text-sm text-text-secondary font-medium">{item.role}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {item.candidateName.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="bg-surface-raised border border-border/60 rounded-xl p-4 space-y-2 text-xs text-text-secondary">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-text-primary font-semibold">
                        <CalendarIcon className="w-4 h-4 text-primary" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> {item.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span>Round Type: <strong className="text-text-primary">{item.type}</strong></span>
                      <span>Host: <strong className="text-text-primary">{item.interviewer}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 btn-primary py-2 text-xs">
                      Join Video Meeting
                    </button>
                    <button className="px-4 py-2 bg-surface-raised border border-border text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold">
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: SHORTLISTED AUTO-BOOKING HUB ──────────────────────────────── */}
        {activeTab === 'shortlisted' && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Shortlisted Candidates ($\ge 75$ AI Score)</h2>
                <p className="text-xs text-text-secondary mt-0.5">Send booking links to high-scoring candidates to book their human 1-on-1 round.</p>
              </div>
              <span className="badge-primary">
                <Sparkles className="w-3.5 h-3.5" /> AI Recommended Roster
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-raised text-xs text-text-muted">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Job Role</th>
                    <th className="p-4 font-semibold">AI Score</th>
                    <th className="p-4 font-semibold">Booking Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {shortlisted.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-text-primary">{c.name}</div>
                        <div className="text-xs text-text-muted">{c.email}</div>
                      </td>
                      <td className="p-4 text-xs font-medium text-text-secondary">{c.role}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                          {c.score}/100
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        {c.booked ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {c.bookedTime}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Awaiting Booking</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleCopyBookingLink(c.id)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedId === c.id ? 'Copied Link!' : 'Copy Invite Link'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: HR AVAILABILITY SLOTS ─────────────────────────────────────── */}
        {activeTab === 'slots' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
            {/* Left: Add Slot Form */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-md h-fit space-y-4">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add Availability Slot
              </h2>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Day of Week</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Time Range</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-text-primary"
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                    <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 text-xs font-bold">
                  Add Time Slot
                </button>
              </form>
            </div>

            {/* Right: Active Slots List */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Configured Availability Slots</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((s) => (
                  <div key={s.id} className="bg-surface-raised border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-text-primary">{s.day}</div>
                      <div className="text-xs text-text-secondary flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {s.time}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      s.status === 'Available' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
