import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target, Zap, Cpu, BarChart3 } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Define Criteria',
    description: 'Set job role rubrics and hidden evaluation questions in seconds.',
    icon: Target,
    accent: '#2563EB',
    accentLight: '#EFF6FF',
  },
  {
    id: 2,
    title: 'Instant Dispatch',
    description: 'Trigger automated outbound voice interviews with zero scheduling friction.',
    icon: Zap,
    accent: '#F59E0B',
    accentLight: '#FFFBEB',
  },
  {
    id: 3,
    title: 'Local AI Interview',
    description: 'Multi-agent STT, LLM, and TTS orchestrate a natural technical conversation.',
    icon: Cpu,
    accent: '#8B5CF6',
    accentLight: '#F5F3FF',
  },
  {
    id: 4,
    title: 'Instant Scorecard',
    description: 'Receive objective 0–100 candidate intelligence reports directly in your dashboard.',
    icon: BarChart3,
    accent: '#10B981',
    accentLight: '#ECFDF5',
  },
];

export default function WorkflowScroll() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <section id="workflow" ref={targetRef} className="relative h-[400vh] bg-surface-raised">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Section header */}
        <div className="text-center mb-12 px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-4 tracking-tight">
            The Autonomous Workflow
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto">
            A frictionless pipeline from job definition to objective intelligence.
          </p>
        </div>

        {/* Scrolling cards */}
        <div className="w-full max-w-7xl mx-auto px-6 overflow-hidden">
          <div className="flex gap-6 w-[400%] md:w-[200%] lg:w-[150%]">
            <motion.div style={{ x }} className="flex gap-6 w-full">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="w-full flex-[0_0_80vw] md:flex-[0_0_40vw] lg:flex-[0_0_25vw] group"
                  >
                    <div
                      className="h-full card-hover p-8 relative overflow-hidden"
                    >
                      {/* Step number watermark */}
                      <div
                        className="absolute top-4 right-6 text-7xl font-black select-none leading-none"
                        style={{ color: step.accent, opacity: 0.06 }}
                      >
                        0{step.id}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-200 group-hover:scale-110"
                        style={{ backgroundColor: step.accentLight, color: step.accent }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Step indicator */}
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mb-4"
                        style={{ backgroundColor: step.accentLight, color: step.accent }}
                      >
                        Step {step.id}
                      </div>

                      <h3 className="text-xl font-bold text-text-primary mb-3">{step.title}</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>

                      {/* Bottom accent line */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"
                        style={{ backgroundColor: step.accent }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mt-8">
          {steps.map((s) => (
            <div key={s.id} className="w-1.5 h-1.5 rounded-full bg-border" />
          ))}
        </div>
      </div>
    </section>
  );
}
