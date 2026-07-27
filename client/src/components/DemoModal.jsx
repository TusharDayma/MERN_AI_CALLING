import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

export default function DemoModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-8"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Request Received</h3>
                <p className="text-slate-400">Our team will be in touch shortly to schedule your demo.</p>
              </motion.div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Book a Live Demo</h2>
                <p className="text-slate-400 mb-6">See how AntiTalk can accelerate your engineering hiring.</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Work Email</label>
                    <input 
                      type="email" 
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary-glow hover:to-accent text-white font-medium rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
                  >
                    Request Access
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
