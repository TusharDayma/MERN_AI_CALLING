import React from 'react';
import { Bot, Globe, Mail, MessageSquare } from 'lucide-react';

const NAV = {
  Product: ['Features', 'Workflow', 'Security', 'Pricing', 'Changelog'],
  Solutions: ['Enterprise', 'Staffing Agencies', 'Fast-Growth Startups', 'Integrations'],
  Resources: ['Documentation', 'API Reference', 'Blog', 'Case Studies', 'Webinars'],
  Company: ['About Us', 'Careers', 'Contact Sales', 'Partners'],
};

export default function Footer() {
  return (
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
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors duration-150">
                      {item}
                    </a>
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
  );
}
