import React from 'react';
import { ShieldCheck, Zap, Scale, Workflow } from 'lucide-react';

const features = [
  {
    title: '100% On-Prem & Local AI',
    description: 'Privacy-first design ensures zero data leakage to public LLM APIs. Complete model isolation.',
    icon: ShieldCheck,
    accent: '#10B981',
    accentBg: '#ECFDF5',
  },
  {
    title: 'Sub-100ms Latency',
    description: 'Natural back-and-forth speech synthesis engineered specifically for high-concurrency voice calls.',
    icon: Zap,
    accent: '#F59E0B',
    accentBg: '#FFFBEB',
  },
  {
    title: 'Objective Bias Elimination',
    description: 'Every candidate receives identical evaluation criteria without interviewer fatigue or bias.',
    icon: Scale,
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
  },
  {
    title: 'Enterprise ATS Integration',
    description: 'Seamlessly push results into Workday, Lever, and Greenhouse via standard Webhooks.',
    icon: Workflow,
    accent: '#2563EB',
    accentBg: '#EFF6FF',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Platform Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight">
            Engineered for the Enterprise
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Industrial-grade architecture built to handle high-volume recruitment without compromising speed or security.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="card-hover p-8 group"
              >
                <div className="flex gap-5">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: feature.accentBg, color: feature.accent }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
