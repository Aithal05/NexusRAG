import React, { useState } from 'react';
import { Sparkles, Globe, Database, Plus, LogOut, User, KeyRound, ShieldCheck } from 'lucide-react';

export default function Header({ onNewSession, backendOnline, isSearching, user, onLogout, onOpenAuth }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="glass-panel" style={{
      borderRadius: '0',
      borderLeft: 'none',
      borderRight: 'none',
      borderTop: 'none',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10
    }}>
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <Globe size={22} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NexusSearch <span style={{ color: '#818cf8', WebkitTextFillColor: '#818cf8' }}>AI</span>
            </h1>
            <span className="glass-pill" style={{ padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={10} /> LangChain RAG
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Google Search-Grounded Web RAG Engine • SQLite Persistence
          </p>
        </div>
      </div>

      {/* Action Controls & User Account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Database size={14} color="#10b981" />
          <span>SQLite Store:</span>
          <span style={{ color: backendOnline ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {backendOnline ? 'Active' : 'Connecting...'}
          </span>
        </div>

        <button 
          onClick={onNewSession}
          disabled={isSearching}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            color: '#fff',
            padding: '9px 16px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: isSearching ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
            opacity: isSearching ? 0.6 : 1
          }}
        >
          <Plus size={16} /> New Session
        </button>

        {/* User Account / Auth Widget */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px 6px 6px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`}
                alt={user.name}
                style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: user.isGuest ? '#22d3ee' : 'var(--text-muted)' }}>
                  {user.isGuest ? `${user.guestQueriesRemaining ?? 5} guest searches left` : user.email}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '200px',
                  padding: '8px',
                  borderRadius: '12px',
                  zIndex: 100,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                  Signed in as <strong style={{ color: '#fff' }}>{user.name}</strong>
                </div>
                <button
                  onClick={() => { setShowDropdown(false); onLogout(); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '9px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <User size={16} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
