import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function UpgradeModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Mock stripe transaction via our backend endpoint
      const res = await api.post('/auth/upgrade');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess(res.data.user);
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-info" />

            <div className="p-8">
              {!loading && !success && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <div className="w-16 h-16 bg-success-bg border border-success/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">Payment Successful!</h3>
                  <p className="text-text-secondary">500 Credits have been added to your account.</p>
                </motion.div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-text-primary mb-2">Upgrade to Pro</h2>
                  <p className="text-text-secondary mb-6">
                    You've run out of free credits. Upgrade to continue running AI campaigns.
                  </p>

                  <div className="bg-background border border-border rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-text-primary">Pro Team Tier</span>
                      <span className="text-xl font-bold text-text-primary">$299</span>
                    </div>
                    <ul className="text-sm text-text-secondary space-y-1.5 mt-3">
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> 500 Interview Credits</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Premium Voice Models</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Advanced Analytics</li>
                    </ul>
                  </div>

                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {errorMsg}
                    </div>
                  )}

                  <button 
                    onClick={handleUpgrade} 
                    disabled={loading}
                    className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-glow transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay with Stripe (Mock)
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-text-muted mt-4">
                    Secure payment processing powered by Stripe.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
