import React from 'react';
import { Search, Database, Cpu, CheckCircle2, Loader2 } from 'lucide-react';

export default function RagTimeline({ step = 1 }) {
  const steps = [
    { id: 1, label: 'Google Search Fetch', icon: Search, desc: 'Scraping web results' },
    { id: 2, label: 'Vector Indexing', icon: Database, desc: 'Chunking & scoring context' },
    { id: 3, label: 'LangChain RAG Synthesis', icon: Cpu, desc: 'Generating grounded answer' },
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', margin: '16px 0', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Loader2 size={14} className="pulse-active" /> LangChain Pipeline Execution
        </h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Step {step} of 3</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative' }}>
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = s.id < step;
          const isCurrent = s.id === step;

          return (
            <div
              key={s.id}
              style={{
                background: isCurrent ? 'rgba(99, 102, 241, 0.2)' : isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: isCurrent ? '1px solid #818cf8' : isDone ? '1px solid #10b981' : '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isCurrent ? '#6366f1' : isDone ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                {isDone ? <CheckCircle2 size={18} /> : isCurrent ? <Loader2 size={18} className="pulse-active" /> : <Icon size={16} />}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isCurrent ? '#f3f4f6' : isDone ? '#10b981' : 'var(--text-muted)' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
