import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function Header({ onBookDemo }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
            <Bot className="w-6 h-6 text-primary" />
            <span>AntiTalk</span>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">AI Engine Online</span>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          {['About', 'Features', 'Workflow', 'Pricing', 'Docs'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/signin" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="hidden md:block px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors">
            Sign Up
          </Link>
          <button 
            onClick={onBookDemo}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-glow rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all"
          >
            Book Demo
          </button>
        </div>
      </div>
    </header>
  );
}
