import React from 'react';
import { X, ExternalLink, ShieldCheck, Calendar, Hash, FileText } from 'lucide-react';

export default function SourceModal({ source, onClose }) {
  if (!source) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '600px',
        width: '100%',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(99, 102, 241, 0.4)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span className="glass-pill" style={{ padding: '3px 10px', fontSize: '0.72rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
              <ShieldCheck size={12} /> Grounded Web Source ({Math.round(source.relevanceScore * 100)}% Match)
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f3f4f6', lineHeight: 1.3 }}>
              {source.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#9ca3af',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Source Link */}
        <div style={{ marginBottom: '16px' }}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#818cf8',
              fontSize: '0.82rem',
              wordBreak: 'break-all',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ExternalLink size={14} /> {source.url}
          </a>
        </div>

        {/* Snippet Context */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} color="#818cf8" /> Raw Google Search Snippet Text
          </div>
          <p style={{ fontSize: '0.88rem', color: '#d1d5db', lineHeight: 1.5, fontStyle: 'italic' }}>
            "{source.snippet}"
          </p>
        </div>

        {/* Meta Stats */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> Published: {source.publishedDate || 'N/A'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hash size={14} /> Relevance Score: {source.relevanceScore}
          </div>
        </div>
      </div>
    </div>
  );
}
