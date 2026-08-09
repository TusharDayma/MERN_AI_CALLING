import React, { useState } from 'react';
import { X, Award, FileText, CheckCircle2, AlertTriangle, MessageSquare, Edit2, Check, User, Bot } from 'lucide-react';
import api from '../../services/api';

export default function DossierViewer({ candidate, onClose, onScoreUpdate }) {
  const [isEditingScore, setIsEditingScore] = useState(false);
  const [newScore, setNewScore] = useState(candidate.ai_score || 0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Safely parse dossier
  let dossier = null;
  if (candidate.dossier_json) {
    try {
      dossier = typeof candidate.dossier_json === 'string' ? JSON.parse(candidate.dossier_json) : candidate.dossier_json;
    } catch (e) {
      console.error('Failed to parse dossier', e);
    }
  }

  const scoreColor = (score) => {
    if (!score && score !== 0) return 'text-text-muted';
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-danger';
  };

  const scoreBg = (score) => {
    if (!score && score !== 0) return 'bg-border';
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  const handleUpdateScore = async () => {
    if (newScore < 0 || newScore > 100) {
      alert('Score must be between 0 and 100');
      return;
    }
    setIsUpdating(true);
    try {
      await api.patch(`/hr/candidates/${candidate.id}/score`, { score: parseInt(newScore, 10) });
      setIsEditingScore(false);
      if (onScoreUpdate) onScoreUpdate();
    } catch (err) {
      console.error(err);
      alert('Failed to update score');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              {candidate.name}'s AI Dossier
            </h2>
            <p className="text-sm text-text-muted mt-0.5">
              {candidate.email} · {candidate.contact}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          {!dossier ? (
            <div className="flex h-full flex-col items-center justify-center text-text-muted space-y-4 py-20">
              <FileText className="w-12 h-12 text-primary/30 animate-pulse" />
              <p>Waiting for AI Engine to complete the interview analysis...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Summary & Scores */}
              <div className="lg:col-span-1 space-y-6">
                {/* Score Card */}
                <div className="bg-surface border border-border rounded-xl p-6 text-center shadow-sm relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wider">
                      <Award className="w-4 h-4" />
                      Overall AI Score
                    </div>
                    {!isEditingScore && (
                      <button 
                        onClick={() => setIsEditingScore(true)}
                        className="text-text-muted hover:text-primary transition-colors p-1 rounded hover:bg-primary-light"
                        title="Override AI Score"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {isEditingScore ? (
                    <div className="flex flex-col items-center gap-3 my-4">
                      <input 
                        type="number" 
                        min="0" max="100" 
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value)}
                        className="w-24 text-center text-3xl font-extrabold bg-surface-raised border border-border rounded-lg py-2 focus:border-primary focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditingScore(false)}
                          className="btn btn-sm bg-surface-raised text-text-secondary border border-border hover:bg-border"
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleUpdateScore}
                          className="btn-primary btn-sm"
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`text-6xl font-extrabold ${scoreColor(candidate.ai_score)}`}>
                        {candidate.ai_score !== null ? candidate.ai_score : '—'}
                      </p>
                      {candidate.ai_score !== null && (
                        <div className="mt-4 w-full bg-surface-raised rounded-full h-2 border border-border overflow-hidden">
                          <div
                            className={`h-full ${scoreBg(candidate.ai_score)} rounded-full`}
                            style={{ width: `${candidate.ai_score}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Summary */}
                {dossier.summary && (
                  <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Executive Summary</h4>
                    <p className="text-sm text-text-secondary leading-relaxed">{dossier.summary}</p>
                  </div>
                )}

                {/* Fluency */}
                {dossier.avg_fluency_score !== undefined && dossier.avg_fluency_score !== null && (
                  <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">English Fluency</h4>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-text-primary">{dossier.avg_fluency_score}</span>
                      <span className="text-sm text-text-muted mb-1">/ 5.0</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Strengths, Weaknesses, Transcript */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Strengths & Weaknesses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" /> Key Strengths
                    </h4>
                    <ul className="space-y-3">
                      {(dossier.strengths || []).map((strength, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0 mt-1.5" />
                          <span className="leading-snug">{strength}</span>
                        </li>
                      ))}
                      {(!dossier.strengths || dossier.strengths.length === 0) && (
                        <li className="text-sm text-text-muted italic">No specific strengths identified.</li>
                      )}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" /> Areas for Concern
                    </h4>
                    <ul className="space-y-3">
                      {(dossier.weaknesses || []).map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1.5" />
                          <span className="leading-snug">{weakness}</span>
                        </li>
                      ))}
                      {(!dossier.weaknesses || dossier.weaknesses.length === 0) && (
                        <li className="text-sm text-text-muted italic">No major concerns identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Audio Placeholder */}
                <div className="bg-surface-raised border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Call Recording</p>
                      <p className="text-xs text-text-muted">Audio sync is currently disabled for this instance.</p>
                    </div>
                  </div>
                  <button className="btn btn-sm bg-border text-text-muted cursor-not-allowed" disabled>
                    Play Recording
                  </button>
                </div>

                {/* Transcript */}
                {dossier.transcript && Array.isArray(dossier.transcript) && (
                  <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="p-4 border-b border-border bg-surface-raised shrink-0">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" /> Interview Transcript
                      </h4>
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-background">
                      {dossier.transcript.map((msg, idx) => {
                        if (msg.role === 'system') return null;
                        const isAI = msg.role !== 'user';
                        return (
                          <div key={idx} className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-primary text-white' : 'bg-surface-raised border border-border text-text-secondary'}`}>
                              {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isAI ? 'bg-surface border border-border text-text-primary rounded-tl-none' : 'bg-primary text-white rounded-tr-none'}`}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
