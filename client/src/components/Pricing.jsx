import React, { useState } from 'react';
import { Check } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter / Pay-Per-Use',
    tagline: 'Ideal for boutique agencies.',
    price: { monthly: '$0', annual: '$0' },
    suffix: '/mo base',
    features: ['$2 per completed interview call', 'Standard voice models', 'Email support'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro Team',
    tagline: 'For growing engineering teams.',
    price: { monthly: '$299', annual: '$239' },
    suffix: '/mo',
    features: ['200 interview credits included', 'Custom ATS export', 'Advanced rubric builder', 'Priority support'],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise Custom',
    tagline: 'For massive scale and compliance.',
    price: { monthly: 'Custom', annual: 'Custom' },
    suffix: '',
    features: ['Dedicated local model deployment', 'Custom voice cloning', 'SLA guarantees', 'Unlimited seats'],
    cta: 'Contact Sales',
    featured: false,
    isEnterprise: true,
  },
];

export default function Pricing({ onBookDemo }) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight">
            Transparent Enterprise Pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
            Scale your engineering hiring without hidden costs.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 bg-surface border border-border rounded-xl shadow-sm">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                !isAnnual
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-150 flex items-center gap-2 ${
                isAnnual
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Annual
              <span className="badge-success text-[11px] px-2 py-0.5">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col transition-all duration-200 ${
                plan.featured
                  ? 'bg-primary text-white shadow-2xl scale-[1.02]'
                  : 'card-hover'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className="bg-warning text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-lg font-bold mb-1 ${plan.featured ? 'text-white' : 'text-text-primary'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.featured ? 'text-blue-100' : 'text-text-secondary'}`}>
                  {plan.tagline}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.featured ? 'text-white' : 'text-text-primary'}`}>
                    {isAnnual ? plan.price.annual : plan.price.monthly}
                  </span>
                  {plan.suffix && (
                    <span className={`text-sm ${plan.featured ? 'text-blue-200' : 'text-text-muted'}`}>
                      {plan.suffix}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`w-4 h-4 shrink-0 mt-0.5 ${plan.featured ? 'text-blue-200' : 'text-success'}`}
                    />
                    <span className={plan.featured ? 'text-blue-50' : 'text-text-secondary'}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={plan.isEnterprise ? onBookDemo : undefined}
                className={`w-full py-3 text-sm font-semibold rounded-xl transition-all duration-150 ${
                  plan.featured
                    ? 'bg-white text-primary hover:bg-blue-50 shadow-sm'
                    : 'btn-primary'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
