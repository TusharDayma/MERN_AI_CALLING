import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

export default function DemoModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = React.useState(false);

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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 w-full bg-primary" />

            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-16 h-16 bg-success-bg border border-success/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">Request Received!</h3>
                  <p className="text-text-secondary">Our team will be in touch shortly to schedule your demo.</p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-text-primary mb-1">Book a Live Demo</h2>
                    <p className="text-text-secondary">See how AntiTalk can accelerate your engineering hiring.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-1.5">Work Email</label>
                      <input
                        type="email"
                        required
                        className="w-full"
                        placeholder="name@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-1.5">Company Name</label>
                      <input
                        type="text"
                        required
                        className="w-full"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full mt-2">
                      Request Access
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
