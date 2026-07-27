import React from 'react';
import { ShieldCheck, Zap, Scale, Workflow } from 'lucide-react';

const features = [
  {
    title: '100% On-Prem & Local AI',
    description: 'Privacy-first design ensures zero data leakage to public LLM APIs. Complete model isolation.',
    icon: ShieldCheck,
  },
  {
    title: 'Sub-100ms Latency',
    description: 'Natural back-and-forth speech synthesis engineered specifically for high-concurrency voice calls.',
    icon: Zap,
  },
  {
    title: 'Objective Bias Elimination',
    description: 'Every candidate receives identical evaluation criteria without interviewer fatigue or bias.',
    icon: Scale,
  },
  {
    title: 'Enterprise ATS Integration',
    description: 'Seamlessly push results into Workday, Lever, and Greenhouse via standard Webhooks.',
    icon: Workflow,
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-surface-lighter relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Engineered for the Enterprise
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Industrial-grade architecture built to handle high-volume recruitment without compromising speed or security.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className="group relative p-8 bg-surface rounded-2xl border border-white/5 hover:border-primary/50 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10 flex gap-6">
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
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
