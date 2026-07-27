import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Activity, Bot } from 'lucide-react';

export default function Hero({ onBookDemo }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6">
            <span className="text-xl">✨</span>
            <span className="text-sm font-medium text-slate-300">Next-Gen Voice AI Technical Screening</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            Autonomous <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI Interviewing.</span><br />
            Zero Latency.
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Screen hundreds of technical candidates simultaneously with natural, local voice AI. Accelerate time-to-hire without compromising candidate privacy or rubric consistency.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={onBookDemo}
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-glow text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Book a Live Demo
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg border border-white/10 transition-all flex items-center justify-center gap-2">
              <Terminal className="w-5 h-5 text-slate-400" />
              Explore Docs
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:h-[600px] flex items-center justify-center"
        >
          {/* Mock Interactive Graphic */}
          <div className="relative w-full max-w-md aspect-square bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Connection Secure</span>
              </div>
              <span className="text-xs font-mono text-slate-400">Latency: &lt;100ms</span>
            </div>

            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-end gap-1 h-12">
                  {[...Array(20)].map((_, j) => (
                    <motion.div
                      key={j}
                      animate={{
                        height: ["20%", "100%", "20%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: (i * 0.1) + (j * 0.05),
                        ease: "easeInOut"
                      }}
                      className="w-full bg-primary/40 rounded-t-sm"
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-black/40 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Local AI Orchestrator</div>
                  <div className="text-xs text-slate-400">Processing audio stream...</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Need to import Bot at the top since I used it inside Hero
