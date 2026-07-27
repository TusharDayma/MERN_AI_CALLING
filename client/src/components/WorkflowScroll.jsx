import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target, Zap, Shield, BarChart3 } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Define Criteria',
    description: 'Set job role rubrics and hidden evaluation questions in seconds.',
    icon: Target,
    color: 'from-blue-500 to-cyan-400'
  },
  {
    id: 2,
    title: 'Instant Dispatch',
    description: 'Trigger automated outbound voice interviews with zero scheduling friction.',
    icon: Zap,
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 3,
    title: 'Local AI Interview',
    description: 'Multi-agent STT, LLM, and TTS orchestrate a natural technical conversation.',
    icon: Shield,
    color: 'from-primary to-accent'
  },
  {
    id: 4,
    title: 'Instant Scorecard',
    description: 'Receive objective 0–100 candidate intelligence reports directly in your private dashboard.',
    icon: BarChart3,
    color: 'from-emerald-400 to-teal-500'
  }
];

export default function WorkflowScroll() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);

  return (
    <section id="workflow" ref={targetRef} className="relative h-[400vh] bg-background">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The Autonomous Workflow
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A frictionless pipeline from job definition to objective intelligence.
          </p>
        </div>

        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="flex gap-8 w-[400%] md:w-[200%] lg:w-[150%]">
            <motion.div style={{ x }} className="flex gap-8 w-full">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={step.id}
                    className="w-full flex-[0_0_80vw] md:flex-[0_0_40vw] lg:flex-[0_0_25vw] relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl -z-10 blur-xl" />
                    <div className="h-full bg-surface/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                      <div className="text-8xl font-black text-white/5 absolute top-4 right-8 select-none">
                        0{step.id}
                      </div>
                      
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} p-0.5 mb-8 shadow-lg`}>
                        <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                      <p className="text-slate-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
