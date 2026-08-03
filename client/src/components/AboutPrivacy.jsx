import React from 'react';
import { Lock, Server, CheckCircle } from 'lucide-react';

const CHECKS = [
  'GDPR & SOC2 Type II Compliant',
  'Local Model Isolation (Air-gapped capable)',
  'End-to-End Audio & Transcript Encryption',
  'Zero-Data Retention Policies Available',
];

export default function AboutPrivacy() {
  return (
    <section id="about" className="py-24 bg-surface-raised">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-success-bg border border-success/20 rounded-full mb-8">
              <Lock className="w-3.5 h-3.5 text-success" />
              <span className="text-success text-[12px] font-semibold">Enterprise Security Architecture</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-6 tracking-tight leading-tight">
              Zero Compromise on Candidate Privacy
            </h2>

            <p className="text-lg text-text-secondary mb-8 leading-relaxed">
              We believe technical screening should be fair, instant, and completely secure. Unlike wrapper
              applications that send PII to public APIs, AntiTalk's infrastructure is built from the ground up
              for data sovereignty.
            </p>

            <ul className="space-y-3.5">
              {CHECKS.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  <span className="text-text-primary font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Security card */}
          <div>
            <div className="card p-0 overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
              {/* Card header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-surface-raised">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center">
                    <Server className="w-5 h-5 text-text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Dedicated Infrastructure</p>
                    <p className="text-xs text-text-muted">Isolated Tenant</p>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>

              {/* Encryption bars */}
              <div className="p-6 space-y-6">
                {[
                  { label: 'Data Encryption (At Rest)', value: 'AES-256-GCM', pct: 100 },
                  { label: 'Data Encryption (In Transit)', value: 'TLS 1.3', pct: 100 },
                  { label: 'Authentication Layer', value: 'JWT + RBAC', pct: 100 },
                ].map(({ label, value, pct }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-text-secondary font-medium">{label}</span>
                      <span className="text-text-primary font-semibold">{value}</span>
                    </div>
                    <div className="w-full bg-surface-raised rounded-full h-1.5 border border-border">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer trust badge */}
              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 p-3 bg-success-bg border border-success/20 rounded-xl">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <p className="text-sm font-medium text-success">All security checks passed · Last audit 14 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
