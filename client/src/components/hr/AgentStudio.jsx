import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import {
  Bot,
  Play,
  Square,
  Sparkles,
  CheckCircle2,
  Volume2,
  Sliders,
  MessageSquare,
  Save,
  Globe,
  UserCheck,
  Info
} from 'lucide-react';

const VOICES = [
  { id: 'en-US-AvaNeural', name: 'Ava', gender: 'Female', country: 'United States', flag: '🇺🇸', lang: 'en-US', previewText: 'Hello! I am Ava, your AI voice interviewer. How are you doing today?' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'Male', country: 'United States', flag: '🇺🇸', lang: 'en-US', previewText: 'Hi there, I am Guy from the Talent Acquisition team. Ready to get started?' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja', gender: 'Female', country: 'India', flag: '🇮🇳', lang: 'en-IN', previewText: 'Namaste! I am Neerja, excited to conduct your screening call today. Shall we begin?' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat', gender: 'Male', country: 'India', flag: '🇮🇳', lang: 'en-IN', previewText: 'Hello! I am Prabhat, conducting your initial technical round. Welcome aboard!' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia', gender: 'Female', country: 'United Kingdom', flag: '🇬🇧', lang: 'en-GB', previewText: 'Good day! I am Sonia, calling on behalf of AntiTalk engineering. Lovely to meet you!' },
];

const PERSONAS = [
  { id: 'strict', name: 'Strict Technical Lead', icon: '💼', description: 'Direct, in-depth technical probe questions. Focuses strictly on architecture, code quality, and problem solving.' },
  { id: 'warm', name: 'Warm Talent Partner', icon: '😊', description: 'Conversational, encouraging style. Evaluates communication clarity, career goals, and cultural fit.' },
  { id: 'fast', name: 'Fast-Paced Screener', icon: '⚡', description: 'Rapid, concise screening. Quickly validates CTC, notice period, location preference, and availability.' },
];

const STORAGE_KEY = 'antitalk_agent_studio_config';

export default function AgentStudio() {
  const [selectedVoice, setSelectedVoice] = useState('en-US-AvaNeural');
  const [selectedPersona, setSelectedPersona] = useState('warm');
  const [speed, setSpeed] = useState(1.0);
  const [greeting, setGreeting] = useState("Hello {candidate_name},\nI'm calling from Harbinger Group. I'd like to confirm your consent to proceed with the pre-screening process at Harbinger. Would you be willing to participate in the pre-screening to move forward to the next round?");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [browserVoices, setBrowserVoices] = useState([]);

  // Load saved config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        if (config.selectedVoice) setSelectedVoice(config.selectedVoice);
        if (config.selectedPersona) setSelectedPersona(config.selectedPersona);
        if (config.speed) setSpeed(config.speed);
        if (config.greeting) setGreeting(config.greeting);
      }
    } catch (_) {}
  }, []);

  // Load browser speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      setBrowserVoices(voices);
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleTestAudio = () => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    const voiceObj = VOICES.find(v => v.id === selectedVoice);
    const textToSay = voiceObj ? voiceObj.previewText : 'Hello! This is a voice sample.';
    const utterance = new SpeechSynthesisUtterance(textToSay);
    utterance.rate = speed;
    utterance.lang = voiceObj?.lang || 'en-US';

    // Try to find the best matching browser voice by language and gender
    if (browserVoices.length > 0 && voiceObj) {
      const langPrefix = voiceObj.lang.split('-')[0]; // e.g. 'en'
      const isFemale = voiceObj.gender === 'Female';
      const isIndian = voiceObj.lang.includes('IN');
      const isBritish = voiceObj.lang.includes('GB');

      // Priority order: exact lang match + gender hint, then lang only, then English
      let matched =
        browserVoices.find(v =>
          v.lang.startsWith(voiceObj.lang) &&
          (isFemale ? /female|zira|aria|ava|neerja|sonia/i.test(v.name) : /male|guy|david|prabhat|james/i.test(v.name))
        ) ||
        browserVoices.find(v => v.lang.startsWith(isIndian ? 'en-IN' : isBritish ? 'en-GB' : 'en-US')) ||
        browserVoices.find(v => v.lang.startsWith(langPrefix)) ||
        browserVoices[0];

      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Persist config to localStorage so calls can read the selected voice
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedVoice,
        selectedPersona,
        speed,
        greeting
      }));
    } catch (_) {}
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout role="HR">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              AI Voice Persona & Accent Studio
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Customize the AI Voice Screener’s voice, accent, tone, speech pace, and brand greeting.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Settings Saved!' : 'Save Voice Studio Config'}
          </button>
        </div>

        {/* ── INFO BANNER ────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-text-secondary leading-relaxed">
            <span className="font-semibold text-primary">Your saved voice config is applied to live calls.</span>{' '}
            The selected voice is used by the AI telephony engine (Edge TTS) for every outbound interview call. 
            Save your settings and they will take effect on the next campaign launch.
          </p>
        </div>

        {/* ── SECTION 1: VOICE & ACCENT SELECTION ─────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Select Voice & Accent
            </h2>
            <span className="badge-primary">
              <Sparkles className="w-3.5 h-3.5" /> High-Fidelity TTS Engines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VOICES.map((v) => {
              const isSelected = selectedVoice === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all space-y-3 relative ${isSelected
                      ? 'bg-primary/10 border-primary shadow-md'
                      : 'bg-surface-raised border-border hover:border-border/80'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{v.flag}</span>
                    {isSelected && (
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Active
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-base">{v.name}</h3>
                    <p className="text-xs text-text-secondary">{v.gender} • {v.country}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: INTERVIEWER PERSONA STYLE ─────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Interviewer Personality & Tone
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONAS.map((p) => {
              const isSelected = selectedPersona === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all space-y-2 ${isSelected
                      ? 'bg-primary/10 border-primary shadow-md'
                      : 'bg-surface-raised border-border hover:border-border/80'
                    }`}
                >
                  <div className="text-3xl">{p.icon}</div>
                  <h3 className="font-bold text-text-primary text-sm">{p.name}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3: SPEECH SPEED & AUDIO TEST ─────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Pace & Audio Tester
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Speed Slider */}
            <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary">Speech Pace</span>
                <span className="text-primary font-bold">{speed.toFixed(1)}x Speed</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Audio Preview Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleTestAudio}
                className={`px-8 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-3 transition-all ${isPlaying
                    ? 'bg-red-500 text-white shadow-lg animate-pulse'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                  }`}
              >
                {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                {isPlaying ? 'Stop Sample Audio' : 'Preview Voice Sample'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: BRAND GREETING TEMPLATE ───────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Custom Brand Greeting Intro
          </h2>
          <p className="text-xs text-text-secondary">
            Use variables like <code className="text-primary">{'{candidate_name}'}</code> and <code className="text-primary">{'{job_title}'}</code> to personalize initial greetings.
          </p>

          <textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows="3"
            className="w-full bg-surface-raised border border-border rounded-xl p-4 text-sm text-text-primary font-medium focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
