import React from 'react';
import { Terminal as TerminalIcon, FileJson, Book, PhoneCall, Code2 } from 'lucide-react';

export default function DocsTeaser() {
  return (
    <section id="docs" className="py-24 bg-background border-t border-white/5 relative overflow-hidden">
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Developer-First Integration
          </h2>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Integrate our voice AI directly into your existing pipelines. Use standard webhooks and REST APIs to orchestrate interviews effortlessly.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Book, title: 'Quickstart Guide' },
              { icon: FileJson, title: 'Webhook Specifications' },
              { icon: Code2, title: 'REST API Reference' },
              { icon: PhoneCall, title: 'Twilio Integration' },
            ].map((link, i) => (
              <a 
                key={i} 
                href="#" 
                className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-white/5 hover:border-primary/40 hover:bg-white/5 transition-all group"
              >
                <link.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{link.title}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d1117]">
          <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex gap-2 mr-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <TerminalIcon className="w-3 h-3" />
              bash
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-slate-300 leading-relaxed">
              <code>
                <span className="text-primary">curl</span> -X POST https://api.antitalk.ai/v1/campaigns/launch \
                <br />
                {"  "}-H <span className="text-emerald-400">"Authorization: Bearer atk_sk_prod_..."</span> \
                <br />
                {"  "}-H <span className="text-emerald-400">"Content-Type: application/json"</span> \
                <br />
                {"  "}-d <span className="text-amber-300">{"'{"}</span>
                <br />
                <span className="text-amber-300">{"    \"role_id\": \"swe-backend-l4\","}</span>
                <br />
                <span className="text-amber-300">{"    \"candidates\": ["}</span>
                <br />
                <span className="text-amber-300">{"      { \"phone\": \"+1234567890\", \"id\": \"cnd_98765\" }"}</span>
                <br />
                <span className="text-amber-300">{"    ],"}</span>
                <br />
                <span className="text-amber-300">{"    \"rubric_overrides\": {"}</span>
                <br />
                <span className="text-amber-300">{"      \"focus_areas\": [\"system_design\", \"concurrency\"]"}</span>
                <br />
                <span className="text-amber-300">{"    }"}</span>
                <br />
                <span className="text-amber-300">{"  }'"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
