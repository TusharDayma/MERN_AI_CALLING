import React from 'react';
import { Terminal as TerminalIcon, FileJson, Book, PhoneCall, Code2 } from 'lucide-react';

const DOC_LINKS = [
  { icon: Book, title: 'Quickstart Guide' },
  { icon: FileJson, title: 'Webhook Specifications' },
  { icon: Code2, title: 'REST API Reference' },
  { icon: PhoneCall, title: 'Twilio Integration' },
];

export default function DocsTeaser() {
  return (
    <section id="docs" className="py-24 bg-surface-raised border-t border-border">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Developer Docs</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mb-5 tracking-tight">
            Developer-First Integration
          </h2>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed">
            Integrate our voice AI directly into your existing pipelines. Use standard webhooks and REST APIs
            to orchestrate interviews effortlessly.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {DOC_LINKS.map(({ icon: Icon, title }) => (
              <a
                key={title}
                href="#"
                className="card-hover flex items-center gap-3 p-4 group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center group-hover:bg-primary transition-colors duration-150">
                  <Icon className="w-4 h-4 text-primary group-hover:text-white transition-colors duration-150" />
                </div>
                <span className="text-sm font-semibold text-text-primary">{title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Right: Code block */}
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-lg bg-[#0F172A]">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 bg-[#1E293B] border-b border-white/10">
            <div className="flex gap-1.5 mr-3">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <TerminalIcon className="w-3.5 h-3.5" />
              bash
            </div>
          </div>

          {/* Code */}
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed text-slate-300">
              <code>
                <span className="text-[#79C0FF]">curl</span>
                {' '}-X POST https://api.antitalk.ai/v1/campaigns/launch \{'\n'}
                {'  '}-H <span className="text-[#A5F3B5]">"Authorization: Bearer atk_sk_prod_..."</span> \{'\n'}
                {'  '}-H <span className="text-[#A5F3B5]">"Content-Type: application/json"</span> \{'\n'}
                {'  '}-d <span className="text-[#FFA657]">{'\'{'}</span>{'\n'}
                <span className="text-[#FFA657]">{'    "role_id": "swe-backend-l4",'}</span>{'\n'}
                <span className="text-[#FFA657]">{'    "candidates": ['}</span>{'\n'}
                <span className="text-[#FFA657]">{'      { "phone": "+1234567890", "id": "cnd_98765" }'}</span>{'\n'}
                <span className="text-[#FFA657]">{'    ],'}</span>{'\n'}
                <span className="text-[#FFA657]">{'    "rubric_overrides": {'}</span>{'\n'}
                <span className="text-[#FFA657]">{'      "focus_areas": ["system_design", "concurrency"]'}</span>{'\n'}
                <span className="text-[#FFA657]">{'    }'}</span>{'\n'}
                <span className="text-[#FFA657]">{"  }'"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
