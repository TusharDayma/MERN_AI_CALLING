import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function Header({ onBookDemo }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Status */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 text-text-primary font-bold text-lg tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <Bot className="w-4.5 h-4.5" />
            </span>
            AntiTalk
          </Link>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-success-bg border border-success/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-success text-[11px] font-semibold tracking-wide">AI Engine Online</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {['About', 'Features', 'Workflow', 'Pricing'].map((item) => (
            <a
              key={item}
              href={`/#${item.toLowerCase()}`}
              className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-all duration-150"
            >
              {item}
            </a>
          ))}
          <Link
            to="/docs"
            className="px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-raised rounded-lg transition-all duration-150"
          >
            Docs
          </Link>
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="hidden md:block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="hidden md:block text-sm font-semibold text-primary border border-primary/30 bg-primary-light hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition-all duration-150"
          >
            Sign Up
          </Link>
          <button
            onClick={onBookDemo}
            className="btn-primary btn-sm text-[13px]"
          >
            Book Demo
          </button>
        </div>
      </div>
    </header>
  );
}
