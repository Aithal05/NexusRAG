import React from 'react';
import { MessageSquare, Trash2, Clock, Layers, ChevronRight, Search } from 'lucide-react';

export default function Sidebar({ sessions, activeSessionId, onSelectSession, onDeleteSession, isSearching }) {
  return (
    <aside className="sidebar">
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="#818cf8" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f3f4f6' }}>Search History</h2>
        </div>
        <span className="glass-pill" style={{ padding: '2px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {sessions.length} Saved
        </span>
      </div>

      {/* Sessions List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {sessions.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <Layers size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
            <p>No previous search sessions stored in SQLite yet.</p>
          </div>
        ) : (
          sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => !isSearching && onSelectSession(sess.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  group: 'true'
                }}
                className="session-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <MessageSquare size={16} color={isActive ? '#818cf8' : '#6b7280'} style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#f3f4f6' : '#d1d5db',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {sess.title}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(sess.updated_at).toLocaleDateString()} • {sess.query_count || 0} queries
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSearching) onDeleteSession(sess.id);
                  }}
                  title="Delete Session from SQLite"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    padding: '4px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer System Meta */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', fontSize: '0.74rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        Engine: <span style={{ color: '#a5b4fc' }}>LangChain RAG</span> • Store: <span style={{ color: '#10b981' }}>SQLite WAL</span>
      </div>
    </aside>
  );
}
