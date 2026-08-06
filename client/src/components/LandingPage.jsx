import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, Bot, Zap, Shield, PhoneCall, BarChart3, Users } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import DemoModal from './DemoModal';

// --- Reusable UI Elements ---

const EnterpriseButton = ({ children, primary = true, onClick, href, className = '' }) => {
  const classes = `
    relative overflow-hidden inline-flex items-center justify-center gap-2 font-semibold rounded-xl px-6 py-3.5 transition-all
    ${primary 
      ? 'bg-primary text-white shadow-[0_1px_3px_rgba(37,99,235,0.3),0_1px_2px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)]' 
      : 'bg-surface text-primary border border-primary/30 hover:bg-primary-light hover:border-primary/60'
    }
    ${className}
  `;

  const content = (
    <>
      {primary && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={classes}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
    >
      {content}
    </motion.button>
  );
};

const BentoCard = ({ title, description, icon: Icon, className = '', children }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`relative rounded-3xl border border-border bg-surface p-8 overflow-hidden transition-colors ${className}`}
    >
      {/* Radial Hover Gradient */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(37,99,235,0.06), transparent 40%)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col h-full">
        {Icon && (
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary border border-primary/10">
            <Icon size={24} strokeWidth={1.5} />
          </div>
        )}
        <h3 className="mb-3 text-xl font-bold text-text-primary tracking-tight">{title}</h3>
        <p className="text-text-secondary leading-relaxed mb-6 flex-grow">{description}</p>
        {children}
      </div>
    </motion.div>
  );
};

// --- Page Sections ---

const ParallaxHero = ({ onBookDemo }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Abstract Background Accents matching existing brand colors */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />
      
      <motion.div 
        style={{ y: yText, opacity: opacityText }}
        className="container mx-auto px-6 relative z-10 text-center max-w-4xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border shadow-sm mb-8 text-sm font-medium text-text-secondary"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          </span>
          AntiGravity Engine 2.0 Now Live
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold text-text-primary tracking-tight leading-[1.1] mb-6"
        >
          Automated candidate screening at scale with <span className="text-primary relative inline-block">
            zero latency
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 10 Q 50 20 100 10" fill="transparent" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </span>.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Deploy autonomous AI voice agents to conduct initial HR phone screens. Unbiased, standardized, and immediately analyzed—so your team only talks to the best.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <EnterpriseButton onClick={onBookDemo} className="w-full sm:w-auto h-14 px-8 text-lg">
            Request Demo <ArrowRight size={20} />
          </EnterpriseButton>
          <EnterpriseButton primary={false} href="https://github.com" className="w-full sm:w-auto h-14 px-8 text-lg">
            Read Documentation
          </EnterpriseButton>
        </motion.div>
      </motion.div>


    </section>
  );
};


const HorizontalScrollWorkflow = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-75%"]);
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const progressWidth = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  const steps = [
    {
      step: "01",
      title: "Upload Candidate List",
      desc: "Import hundreds of candidates instantly via CSV. Map roles, expected salaries, and required skills.",
      icon: Users
    },
    {
      step: "02",
      title: "One-Click Dispatch",
      desc: "Trigger campaigns manually or automatically. The AntiGravity engine routes secure WebSockets directly to the Exotel telephony gateway.",
      icon: Zap
    },
    {
      step: "03",
      title: "Real-Time AI Interview",
      desc: "Groq-powered Llama 3 interacts dynamically with candidates, assessing both technical depth and communication fluency with sub-300ms latency.",
      icon: Bot
    },
    {
      step: "04",
      title: "Instant Dossier Analysis",
      desc: "Receive a scored JSON dossier (0-100) immediately upon call termination, detailing strengths, weaknesses, and a full structured transcript.",
      icon: BarChart3
    }
  ];

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-background">
      <div className="sticky top-0 h-screen flex flex-col justify-center items-start overflow-hidden pt-20">
        
        <div className="container mx-auto px-6 mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            The intelligent screening pipeline.
          </h2>
          <p className="text-xl text-text-secondary mt-4 max-w-2xl">
            From bulk upload to definitive hiring signal in minutes, not weeks.
          </p>
        </div>

        <div className="relative w-full">
          {/* Progress Bar Background */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-border z-0">
            <motion.div style={{ width: progressWidth }} className="h-full bg-primary" />
          </div>

          <motion.div style={{ x }} className="flex w-[400vw] h-full pt-16">
            {steps.map((item, idx) => (
              <div key={idx} className="w-[100vw] flex-shrink-0 px-6 sm:px-12 md:px-24">
                <div className="max-w-xl">
                  <div className="text-primary font-mono text-6xl font-bold mb-6 opacity-20">{item.step}</div>
                  <div className="h-16 w-16 rounded-2xl bg-surface border border-border shadow-sm flex items-center justify-center mb-6 text-primary">
                    <item.icon size={32} />
                  </div>
                  <h3 className="text-3xl font-bold text-text-primary mb-4">{item.title}</h3>
                  <p className="text-xl text-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const AdvancedBentoFeatures = () => {
  return (
    <section className="py-32 bg-surface-raised relative border-y border-border">
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-6">
            Built for enterprise scale.
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Under the hood, AntiTalk leverages state-of-the-art LLMs, deterministic state machines, and bare-metal optimized voice synthesis to achieve natural conversation dynamics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BentoCard 
            title="Sub-300ms Latency" 
            description="Our custom WebSocket proxy architecture ensures conversational turns happen faster than human perception limits."
            icon={Zap}
            className="md:col-span-2"
          >
            <div className="mt-4 rounded-xl bg-background border border-border p-6 flex items-center justify-between overflow-hidden">
               <div className="space-y-3">
                 <div className="h-2 w-32 bg-primary/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: '100%' }} 
                      transition={{ duration: 1, ease: "easeOut" }} 
                      className="h-full bg-primary"
                    />
                 </div>
                 <div className="text-sm font-mono text-text-muted">WebSocket Latency: <span className="text-success font-bold">12ms</span></div>
               </div>
               <div className="space-y-3">
                 <div className="h-2 w-48 bg-primary/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: '100%' }} 
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} 
                      className="h-full bg-primary"
                    />
                 </div>
                 <div className="text-sm font-mono text-text-muted">Total TTFB: <span className="text-success font-bold">290ms</span></div>
               </div>
            </div>
          </BentoCard>

          <BentoCard 
            title="8kHz µ-law Telephony" 
            description="Native compatibility with global carrier networks. We transcode and stream raw audio payloads directly to SIP trunks."
            icon={PhoneCall}
          />

          <BentoCard 
            title="Groq Llama-3 Brain" 
            description="Harnessing the fastest inference engine on the planet. The AI evaluator dynamically adjusts follow-up questions based on real-time candidate answers."
            icon={Bot}
          />

          <BentoCard 
            title="Bank-Grade Security" 
            description="HMAC payload signatures, strict prompt-injection defenses, XSS sanitization, and PII redaction built into the core router."
            icon={Shield}
            className="md:col-span-2"
          >
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
               {['HMAC Auth', 'Zod Parsing', 'DOMPurify', 'Rate Limited'].map(item => (
                 <div key={item} className="bg-success-bg border border-success/20 text-success text-xs font-semibold px-3 py-2 rounded-lg text-center flex flex-col items-center gap-1">
                   <Shield size={14} />
                   {item}
                 </div>
               ))}
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ onBookDemo }) => {
  return (
    <section className="py-32 relative overflow-hidden bg-background">
      <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-surface border border-border rounded-3xl p-12 md:p-20 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle background glow inside card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-6 relative z-10">
            Ready to scale your hiring?
          </h2>
          <p className="text-xl text-text-secondary mb-10 max-w-xl mx-auto relative z-10">
            Stop losing engineering hours to initial phone screens. Deploy autonomous agents today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <EnterpriseButton onClick={onBookDemo} className="h-14 px-8 text-lg w-full sm:w-auto">
              Request Demo
            </EnterpriseButton>
            <EnterpriseButton primary={false} href="mailto:sales@antitalk.com" className="h-14 px-8 text-lg w-full sm:w-auto">
              Contact Sales
            </EnterpriseButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const openDemoModal = () => setIsDemoModalOpen(true);
  const closeDemoModal = () => setIsDemoModalOpen(false);

  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="bg-background min-h-screen text-text-primary selection:bg-primary/20 selection:text-primary">
      <Header onBookDemo={openDemoModal} />
      <main>
        <ParallaxHero onBookDemo={openDemoModal} />

        <HorizontalScrollWorkflow />
        <AdvancedBentoFeatures />
        <CTASection onBookDemo={openDemoModal} />
      </main>
      <Footer />
      <DemoModal isOpen={isDemoModalOpen} onClose={closeDemoModal} />
    </div>
  );
}
