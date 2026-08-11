import React, { useState } from 'react';
import { Bot, Globe, Mail, MessageSquare, X, ArrowRight } from 'lucide-react';

const NAV = {
  Product: ['Features', 'Workflow', 'Security', 'Pricing', 'Changelog'],
  Solutions: ['Enterprise', 'Staffing Agencies', 'Fast-Growth Startups', 'Integrations'],
  Resources: ['Documentation', 'API Reference', 'Blog', 'Case Studies', 'Webinars'],
  Company: ['About Us', 'Careers', 'Contact Sales', 'Partners'],
};

export default function Footer() {
  const [activeLink, setActiveLink] = useState(null);

  return (
    <>
      <footer className="bg-sidebar pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg tracking-tight mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Bot className="w-4 h-4" />
                </span>
                AntiTalk
              </div>
              <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">
                Autonomous AI Interviewing. Zero Latency. 100% Privacy-First. Accelerating technical hiring for enterprise teams.
              </p>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg w-fit">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-slate-300 text-xs font-medium">All Systems Operational</span>
              </div>
            </div>

            {/* Nav columns */}
            {Object.entries(NAV).map(([section, links]) => (
              <div key={section}>
                <h4 className="text-white text-sm font-semibold mb-4">{section}</h4>
                <ul className="space-y-2.5">
                  {links.map((item) => (
                    <li key={item}>
                      <button
                        onClick={(e) => { e.preventDefault(); setActiveLink({ section, item }); }}
                        className="text-sm text-slate-400 hover:text-white transition-colors duration-150 p-0 text-left"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-4">
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span>&copy; {new Date().getFullYear()} AntiTalk Inc. All rights reserved.</span>
              <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-150">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors duration-150">Security</a>
            </div>

            <div className="flex items-center gap-4">
              {[MessageSquare, Globe, Mail].map((Icon, i) => (
                <a key={i} href="#" className="text-slate-500 hover:text-white transition-colors duration-150 p-2 hover:bg-white/5 rounded-lg">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      {activeLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border shadow-2xl rounded-2xl p-8 w-full max-w-md relative animate-slide-up-sm">
            <button
              onClick={() => setActiveLink(null)}
              className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              {activeLink.item}
            </h2>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Detailed information regarding AntiTalk's <span className="font-semibold text-text-primary">{activeLink.item}</span> under the <span className="font-semibold text-text-primary">{activeLink.section}</span> category is currently tailored for our enterprise partners.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveLink(null)}
                className="btn-primary flex-1 flex items-center justify-center gap-2 group"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setActiveLink(null)}
                className="px-4 py-2 rounded-lg font-semibold border border-border text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
