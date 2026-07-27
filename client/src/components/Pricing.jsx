import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function Pricing({ onBookDemo }) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-surface-lighter">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Transparent Enterprise Pricing
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Scale your engineering hiring without hidden costs.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-white/10 rounded-full transition-colors hover:bg-white/20"
            >
              <div 
                className={`absolute top-1 left-1 w-5 h-5 bg-primary rounded-full transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Annual
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-surface border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Starter / Pay-Per-Use</h3>
            <p className="text-slate-400 text-sm mb-6">Ideal for boutique agencies.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-slate-400">/mo base</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['$2 per completed interview call', 'Standard voice models', 'Email support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/10">
              Get Started
            </button>
          </div>

          {/* Pro */}
          <div className="bg-surface border border-primary/50 rounded-3xl p-8 relative scale-105 shadow-2xl">
            <div className="absolute -top-4 inset-x-0 flex justify-center">
              <div className="px-4 py-1 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Pro Team</h3>
            <p className="text-slate-400 text-sm mb-6">For growing engineering teams.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">${isAnnual ? '239' : '299'}</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['200 interview credits included', 'Custom ATS export', 'Advanced rubric builder', 'Priority support'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 px-4 bg-primary hover:bg-primary-glow text-white font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              Start Free Trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-surface border border-white/5 rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Enterprise Custom</h3>
            <p className="text-slate-400 text-sm mb-6">For massive scale and compliance.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Dedicated local model deployment', 'Custom voice cloning', 'SLA guarantees', 'Unlimited seats'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button onClick={onBookDemo} className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors border border-white/10">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
