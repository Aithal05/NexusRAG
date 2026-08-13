import React, { useState } from 'react';
import {
  Send, Sparkles, Globe, Clock, ShieldCheck, ArrowRight,
  RefreshCw, Zap, BarChart2, ExternalLink, ChevronDown, ChevronUp,
  BookOpen, Hash, MessageSquare, Brain, Search, CheckCircle2
} from 'lucide-react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import RagTimeline from './components/RagTimeline.jsx';
import SourceModal from './components/SourceModal.jsx';
import AuthModal from './components/AuthModal.jsx';

/* ── tiny markdown → HTML renderer (no dependency needed) ───────────── */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // horizontal rule
    .replace(/^---$/gm, '<hr />')
    // citation refs [1] [2]
    .replace(/\[(\d+)\]/g, '<sup class="cite-ref">[$1]</sup>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // newlines
    .replace(/\n/g, '<br />');
  return html;
}

/* ── Source Card ────────────────────────────────────────────────────── */
function SourceCard({ src, idx, onClick }) {
  const domain = (() => { try { return new URL(src.url).hostname.replace('www.', ''); } catch { return src.url; } })();
  const score = src.relevanceScore ? Math.round(src.relevanceScore * 100) : null;
  return (
    <button className="result-source-card" onClick={() => onClick(src)}>
      <div className="result-source-num">[{idx + 1}]</div>
      <div className="result-source-body">
        <div className="result-source-title">{src.title}</div>
        <div className="result-source-meta">
          <span className="result-source-domain"><Globe size={11} />{domain}</span>
          {score && <span className="result-source-score"><BarChart2 size={11} />{score}% match</span>}
          {src.publishedDate && <span><Clock size={11} />{src.publishedDate}</span>}
        </div>
      </div>
      <ExternalLink size={13} className="result-source-ext" />
    </button>
  );
}

/* ── AI Answer Card ─────────────────────────────────────────────────── */
function AnswerCard({ qItem, onSourceClick }) {
  const [showSources, setShowSources] = useState(false);
  const totalMs = (qItem.retrievalLatencyMs || 0) + (qItem.generationLatencyMs || 0);

  return (
    <div className="result-card fade-in-up">
      {/* User question bubble */}
      <div className="result-question-bubble">
        <MessageSquare size={15} />
        <span>{qItem.userQuery}</span>
      </div>

      {/* Answer panel */}
      <div className="result-answer-panel glass-panel">
        {/* Header bar */}
        <div className="result-answer-header">
          <div className="result-answer-badge">
            <Brain size={14} />
            <span>NexusRAG Synthesis</span>
          </div>
          <div className="result-answer-meta">
            {totalMs > 0 && (
              <span className="result-meta-chip green">
                <Zap size={11} />{(totalMs / 1000).toFixed(2)}s
              </span>
            )}
            {qItem.sources?.length > 0 && (
              <span className="result-meta-chip blue">
                <Globe size={11} />{qItem.sources.length} sources
              </span>
            )}
            <span className="result-meta-chip purple">
              <ShieldCheck size={11} />Grounded
            </span>
          </div>
        </div>

        {/* Markdown answer body */}
        <div
          className="result-answer-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(qItem.aiResponse) }}
        />

        {/* Sources toggle */}
        {qItem.sources?.length > 0 && (
          <div className="result-sources-section">
            <button
              className="result-sources-toggle"
              onClick={() => setShowSources(v => !v)}
            >
              <BookOpen size={14} />
              <span>Web Sources ({qItem.sources.length})</span>
              {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showSources && (
              <div className="result-sources-grid fade-in-up">
                {qItem.sources.map((src, idx) => (
                  <SourceCard key={src.id || idx} src={src} idx={idx} onClick={onSourceClick} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Suggested Prompt Button ────────────────────────────────────────── */
function PromptButton({ text, onClick }) {
  return (
    <button className="suggestion-pill" onClick={() => onClick(text)}>
      <Search size={13} />
      <span>{text}</span>
      <ArrowRight size={13} className="suggestion-arrow" />
    </button>
  );
}

/* ── Welcome Screen ─────────────────────────────────────────────────── */
const SUGGESTIONS = [
  'What are the new features in React 19 and Server Actions?',
  'Explain Retrieval-Augmented Generation with LangChain',
  'How does SQLite WAL mode improve performance?',
  'What are modern web Core Web Vitals metrics in 2026?',
  'Compare OpenAI GPT-4o vs Google Gemini 1.5 Pro',
  'Best practices for building RAG pipelines at scale',
];

function WelcomeScreen({ onSearch }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-glow" />
      <div className="welcome-icon-wrap">
        <Globe size={34} color="#fff" />
      </div>
      <h2 className="welcome-title">Ask Anything with Live Web Grounding</h2>
      <p className="welcome-subtitle">
        NexusSearch AI fetches real-time web data, indexes context via LangChain RAG,
        and produces grounded answers with inspectable citations.
      </p>
      <div className="welcome-features">
        {['Real-Time Web Search', 'Source-Linked Answers', 'LangChain RAG Pipeline', 'SQLite History'].map(f => (
          <span key={f} className="welcome-feature-chip">
            <CheckCircle2 size={12} />{f}
          </span>
        ))}
      </div>
      <div className="suggestions-grid">
        {SUGGESTIONS.map((s, i) => (
          <PromptButton key={i} text={s} onClick={onSearch} />
        ))}
      </div>
    </div>
  );
}

/* ── Main App ───────────────────────────────────────────────────────── */
export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [queries, setQueries] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ragStep, setRagStep] = useState(1);
  const [backendOnline, setBackendOnline] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const chatEndRef = React.useRef(null);

  React.useEffect(() => { initAuthAndSessions(); }, []);
  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [queries, isSearching]);

  const initAuthAndSessions = async () => {
    try { const r = await fetch('/api/health'); if (r.ok) setBackendOnline(true); } catch { setBackendOnline(false); }
    const storedToken = localStorage.getItem('nexus_token');
    const storedUser = localStorage.getItem('nexus_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken); setUser(JSON.parse(storedUser));
        const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } });
        const d = await r.json();
        if (d.success) setUser(d.user);
      } catch {}
    } else {
      setIsAuthOpen(true);
    }
    fetchSessions();
  };

  const fetchSessions = async (authToken = token || localStorage.getItem('nexus_token')) => {
    try {
      const r = await fetch('/api/sessions', { headers: { Authorization: `Bearer ${authToken}` } });
      const d = await r.json();
      if (d.success) {
        setSessions(d.sessions);
        if (d.sessions.length > 0 && !activeSessionId) loadSessionQueries(d.sessions[0].id);
      }
    } catch {}
  };

  const loadSessionQueries = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const r = await fetch(`/api/sessions/${sessionId}/queries`, { headers: { Authorization: `Bearer ${token || localStorage.getItem('nexus_token')}` } });
      const d = await r.json();
      if (d.success) setQueries(d.queries);
    } catch {}
  };

  const handleAuthSuccess = (authUser, authToken) => {
    setUser(authUser); setToken(authToken); setIsAuthOpen(false); fetchSessions(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token'); localStorage.removeItem('nexus_user');
    setUser(null); setToken(null); setIsAuthOpen(true);
  };

  const handleNewSession = async () => {
    if (!user) { setIsAuthOpen(true); return; }
    try {
      const r = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'New Search Session' })
      });
      const d = await r.json();
      if (d.success) { setSessions([d.session, ...sessions]); setActiveSessionId(d.session.id); setQueries([]); }
    } catch {}
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      const r = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) loadSessionQueries(remaining[0].id);
          else { setActiveSessionId(null); setQueries([]); }
        }
      }
    } catch {}
  };

  const handleExecuteSearch = async (queryToRun) => {
    const q = queryToRun || inputQuery;
    if (!q?.trim() || isSearching) return;
    if (!user) { setIsAuthOpen(true); return; }
    setInputQuery(''); setIsSearching(true); setRagStep(1);
    const t1 = setTimeout(() => setRagStep(2), 700);
    const t2 = setTimeout(() => setRagStep(3), 1400);
    try {
      const r = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: q, sessionId: activeSessionId })
      });
      const d = await r.json();
      clearTimeout(t1); clearTimeout(t2);
      if (d.success) {
        setActiveSessionId(d.sessionId);
        setQueries(prev => [...prev, d.data]);
        if (user?.isGuest && typeof d.guestQueriesRemaining === 'number') {
          const updatedUser = { ...user, guestQueriesRemaining: d.guestQueriesRemaining };
          setUser(updatedUser); localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
        }
        fetchSessions();
      } else if (r.status === 403 && d.code === 'GUEST_LIMIT_REACHED') {
        setIsAuthOpen(true);
      }
    } catch {}
    finally { setIsSearching(false); setRagStep(1); }
  };

  return (
    <div className="app-container">
      <AuthModal isOpen={isAuthOpen} onClose={user ? () => setIsAuthOpen(false) : undefined} onAuthSuccess={handleAuthSuccess} />

      <Sidebar sessions={sessions} activeSessionId={activeSessionId} onSelectSession={loadSessionQueries} onDeleteSession={handleDeleteSession} isSearching={isSearching} />

      <div className="main-viewport">
        <Header onNewSession={handleNewSession} backendOnline={backendOnline} isSearching={isSearching} user={user} onLogout={handleLogout} onOpenAuth={() => setIsAuthOpen(true)} />

        {/* Results Feed */}
        <div className="chat-history-container">
          {queries.length === 0 && !isSearching && (
            <WelcomeScreen onSearch={handleExecuteSearch} />
          )}

          {queries.map((qItem) => (
            <AnswerCard key={qItem.id || qItem.queryId} qItem={qItem} onSourceClick={setSelectedSource} />
          ))}

          {isSearching && (
            <div className="result-card fade-in-up">
              <div className="result-question-bubble">
                <RefreshCw size={14} className="spin-animation" />
                <span>Searching the live web…</span>
              </div>
              <div className="result-answer-panel glass-panel" style={{ border: '1px solid rgba(99,102,241,0.4)' }}>
                <div className="result-answer-header">
                  <div className="result-answer-badge pulse-active">
                    <RefreshCw size={14} className="spin-animation" />
                    <span>Executing RAG Pipeline</span>
                  </div>
                </div>
                <RagTimeline step={ragStep} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Search Input */}
        <div className="search-input-bar">
          <form className="search-form" onSubmit={e => { e.preventDefault(); handleExecuteSearch(); }}>
            <div className="search-input-wrap">
              <Search size={18} className="search-input-icon" />
              <input
                className="search-input"
                type="text"
                placeholder={user ? 'Ask anything — NexusRAG fetches live results and synthesizes grounded answers…' : 'Sign in to start searching…'}
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                disabled={isSearching}
              />
              <button
                type="submit"
                className={`search-submit-btn ${inputQuery.trim() ? 'active' : ''}`}
                disabled={isSearching || !inputQuery.trim()}
              >
                {isSearching ? <RefreshCw size={18} className="spin-animation" /> : <Send size={18} />}
              </button>
            </div>
            <div className="search-footer-row">
              <span>Powered by LangChain · OpenRouter · SQLite</span>
              <span>Press <kbd>Enter</kbd> to search</span>
            </div>
          </form>
        </div>
      </div>

      {selectedSource && <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />}
    </div>
  );
}
