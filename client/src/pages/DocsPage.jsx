import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DocsTeaser from '../components/DocsTeaser';

export default function DocsPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col text-text-primary selection:bg-primary/20 selection:text-primary">
      <Header />
      <main className="flex-grow pt-16">
        <div className="py-12 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">
              Documentation
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl">
              Everything you need to integrate, scale, and manage AntiTalk within your own systems.
            </p>
          </div>
        </div>
        <DocsTeaser />
      </main>
      <Footer />
    </div>
  );
}
