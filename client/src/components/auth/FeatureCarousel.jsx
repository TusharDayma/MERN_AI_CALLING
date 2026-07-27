import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Send } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Sub-100ms Latency',
    description: 'Experience real-time AI conversations with undetectable delay.'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Local AI processing ensures your candidate data never leaves your environment.'
  },
  {
    icon: Send,
    title: 'Automated Dispatch',
    description: 'Instantly dispatch interview campaigns to thousands of candidates with one click.'
  }
];

export default function FeatureCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full w-full bg-slate-900/50 backdrop-blur-sm border-r border-white/10 flex flex-col items-center justify-center p-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center relative z-10"
        >
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            {React.createElement(features[currentIndex].icon, { className: 'w-8 h-8 text-primary' })}
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">{features[currentIndex].title}</h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            {features[currentIndex].description}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-12 flex gap-3">
        {features.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-2 rounded-full transition-all duration-500 ${
              idx === currentIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'w-2 bg-white/20'
            }`} 
          />
        ))}
      </div>
    </div>
  );
}
