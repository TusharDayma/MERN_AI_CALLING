import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Activity, Bot, Shield, Zap } from 'lucide-react';

const STATS = [
  { value: '<100ms', label: 'Voice latency' },
  { value: '100%', label: 'On-premise AI' },
  { value: '0', label: 'Data leakage' },
];

export default function Hero({ onBookDemo }) {
  return (
    <section className="relative min-h-screen flex items-center pt-16 bg-background overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#0F172A 1px,transparent 1px),linear-gradient(90deg,#0F172A 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Top blue accent glow */}
      <div className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-light border border-primary/20 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary text-[12px] font-semibold tracking-wide">Next-Gen Voice AI Technical Screening</span>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-text-primary leading-[1.1] mb-6 tracking-tight">
            Autonomous{' '}
            <span className="text-primary">AI Interviewing.</span>
            <br />
            Zero Latency.
          </h1>

          <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-lg">
            Screen hundreds of technical candidates simultaneously with natural, local voice AI.
            Accelerate time-to-hire without compromising candidate privacy or rubric consistency.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <button
              onClick={onBookDemo}
              className="btn-primary"
            >
              Book a Live Demo
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="btn btn-ghost border border-border text-text-secondary hover:text-text-primary hover:bg-surface">
              <Terminal className="w-4 h-4" />
              Explore Docs
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 pt-6 border-t border-border">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-extrabold text-text-primary tracking-tight">{value}</p>
                <p className="text-xs text-text-muted font-medium mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="relative"
        >
          <div className="card p-0 overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.08)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-raised">
              <div className="w-3 h-3 rounded-full bg-danger/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
              <div className="ml-4 flex items-center gap-2 text-text-muted">
                <Activity className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-medium text-text-secondary">Connection Secure</span>
                <span className="ml-auto text-[11px] font-mono text-text-muted">Latency: &lt;100ms</span>
              </div>
            </div>

            {/* Waveform visualization */}
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-end gap-0.5 h-10">
                  {[...Array(28)].map((_, j) => {
                    const pct = 20 + Math.sin((i + j) * 0.8) * 40 + Math.random() * 20;
                    return (
                      <div
                        key={j}
                        className="flex-1 bg-primary/20 rounded-sm"
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Status footer */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 p-4 bg-surface-raised border border-border rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Local AI Orchestrator</p>
                  <p className="text-xs text-text-muted">Processing audio stream...</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 badge-success">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  Live
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="absolute -bottom-4 -right-4 flex items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 shadow-lg">
            <Shield className="w-4 h-4 text-success" />
            <span className="text-xs font-semibold text-text-primary">100% On-Premise</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
