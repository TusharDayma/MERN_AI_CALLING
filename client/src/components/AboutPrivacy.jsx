import React from 'react';
import { Lock, Server, CheckCircle } from 'lucide-react';

export default function AboutPrivacy() {
  return (
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-300">Enterprise Security Architecture</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Zero Compromise on Candidate Privacy
            </h2>
            
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              We believe technical screening should be fair, instant, and completely secure. Unlike wrapper applications that send PII to public APIs, AntiTalk's infrastructure is built from the ground up for data sovereignty.
            </p>

            <ul className="space-y-4">
              {[
                'GDPR & SOC2 Type II Compliant',
                'Local Model Isolation (Air-gapped capable)',
                'End-to-End Audio & Transcript Encryption',
                'Zero-Data Retention Policies Available'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-xl" />
            <div className="relative bg-surface border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                    <Server className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Dedicated Infrastructure</div>
                    <div className="text-sm text-slate-400">Isolated Tenant</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                  Active
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Data Encryption (At Rest)</span>
                    <span className="text-white">AES-256-GCM</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Data Encryption (In Transit)</span>
                    <span className="text-white">TLS 1.3</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
