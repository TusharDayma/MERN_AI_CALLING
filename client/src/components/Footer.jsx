import React from 'react';
import { Bot, Globe, Mail, MessageSquare } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight mb-6">
              <Bot className="w-6 h-6 text-primary" />
              <span>AntiTalk</span>
            </div>
            <p className="text-sm text-slate-400 mb-8 max-w-xs">
              Autonomous AI Interviewing. Zero Latency. 100% Privacy-First. Accelerating technical hiring for enterprise teams.
            </p>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-white/10 rounded-lg inline-flex">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-slate-300 text-xs font-medium">All Systems Operational</span>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {['Features', 'Workflow', 'Security', 'Pricing', 'Changelog'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Solutions</h4>
            <ul className="space-y-3">
              {['Enterprise', 'Staffing Agencies', 'Fast-Growth Startups', 'Integrations'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {['Documentation', 'API Reference', 'Blog', 'Case Studies', 'Webinars'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Contact Sales', 'Partners'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>&copy; {new Date().getFullYear()} AntiTalk Inc. All rights reserved.</span>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <MessageSquare className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
