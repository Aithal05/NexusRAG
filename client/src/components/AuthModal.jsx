import React, { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, Globe2, KeyRound, Lock, Mail, ShieldCheck, Sparkles, User, Zap, X, AlertCircle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

const Field = ({ icon: Icon, label, children }) => (
  <label className="auth-field">
    <span>{label}</span>
    <div className="auth-input-wrap">
      <Icon size={17} className="auth-field-icon" />
      {children}
    </div>
  </label>
);

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculate password strength for signup
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: '#f87171' };
    if (score === 2 || score === 3) return { score: 60, label: 'Good', color: '#facc15' };
    if (score === 4) return { score: 85, label: 'Strong', color: '#34d399' };
    return { score: 100, label: 'Ultra Secure', color: '#38bdf8' };
  };

  const strength = getPasswordStrength(password);

  const saveSession = (data) => {
    localStorage.setItem('nexus_token', data.token);
    localStorage.setItem('nexus_user', JSON.stringify(data.user));
    onAuthSuccess(data.user, data.token);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter your password.');
    }
    if (mode === 'signup' && password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup' ? { name, email, password } : { email, password })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Authentication failed');
      saveSession(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setEmail('demo@nexus.ai');
    setPassword('password123');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@nexus.ai', password: 'password123' })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Demo login failed');
      saveSession(data);
    } catch (err) {
      setError(err.message || 'Demo login server error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/guest', { method: 'POST' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Guest access is unavailable');
      saveSession(data);
    } catch (err) {
      setError(err.message || 'Unable to start guest session.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const actionText = mode === 'login' ? 'Sign in to Workspace' : 'Create Secure Account';

  return (
    <main className="auth-page">
      {/* Background Animated Gradient Orbs */}
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      {/* Left Showcase Banner */}
      <section className="auth-showcase">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Globe2 size={26} />
          </div>
          <span>Nexus<span>RAG</span></span>
        </div>

        <div className="auth-showcase-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> LIVE RETRIEVAL-AUGMENTED GENERATION
          </div>
          <h1>Every Answer,<br /><em>Verified & Grounded.</em></h1>
          <p>
            NexusRAG fetches real-time Google web documents, chunking & indexing text via LangChain, and producing grounded answers with verifiable inline URL citations.
          </p>
        </div>

        <div className="auth-feature-list">
          {['🌐 Live Web Retrieval', '⚡ LangChain Context RAG', '🔒 Secure File Logging', '📊 Source Verification'].map((item) => (
            <div key={item}>
              <Check size={16} />
              {item}
            </div>
          ))}
        </div>

        {/* Dynamic Metric Stats Showcase */}
        <div className="auth-stats-grid">
          <div className="auth-stat-card">
            <div className="stat-value">5</div>
            <div className="stat-label">Web Sources / Query</div>
          </div>
          <div className="auth-stat-card">
            <div className="stat-value">100%</div>
            <div className="stat-label">Grounded Citations</div>
          </div>
          <div className="auth-stat-card">
            <div className="stat-value">&lt; 1.2s</div>
            <div className="stat-label">Synthesis Speed</div>
          </div>
        </div>

        <div className="auth-grid" />
      </section>

      {/* Right Login/Signup Form Panel */}
      <section className="auth-panel">
        {onClose && (
          <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        )}

        <div className="auth-card">
          <div className="auth-mobile-brand">
            <div className="auth-brand-mark">
              <Globe2 size={22} />
            </div>
            Nexus<span>RAG</span>
          </div>

          <div className="auth-heading">
            <div className="auth-heading-icon">
              <KeyRound size={22} />
            </div>
            <h2>{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h2>
            <p>{mode === 'login' ? 'Sign in to access your saved search sessions and RAG history.' : 'Create a secure account to save your queries and web citations.'}</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="auth-tabs">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
              type="button"
            >
              Sign In
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
              type="button"
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Main Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <Field icon={User} label="Full Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  required
                />
              </Field>
            )}

            <Field icon={Mail} label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field icon={Lock} label="Password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            {/* Password Strength Meter for Signup */}
            {mode === 'signup' && password.length > 0 && (
              <div className="password-strength-bar">
                <div className="strength-header">
                  <span>Password strength:</span>
                  <strong style={{ color: strength.color }}>{strength.label}</strong>
                </div>
                <div className="strength-track">
                  <div
                    className="strength-fill"
                    style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <Field icon={Lock} label="Confirm Password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
            )}

            <button className="auth-primary" type="submit" disabled={loading}>
              {loading ? (
                'Processing...'
              ) : (
                <>
                  {actionText}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Option */}
          {mode === 'login' && (
            <button
              className="demo-account-btn"
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              <Cpu size={17} color="#a855f7" />
              <span>One-Click Demo Account Auto-Fill</span>
              <small>demo@nexus.ai</small>
            </button>
          )}

          <div className="auth-divider">
            <span>OR EXPLORE FIRST</span>
          </div>

          <button className="guest-button" type="button" onClick={handleGuest} disabled={loading}>
            <Zap size={18} />
            <span>Continue as Guest</span>
            <small>5 Free Searches</small>
          </button>

          <p className="auth-footnote">
            <ShieldCheck size={14} />
            Authentication details are encrypted & logged safely on the server.
          </p>
        </div>
      </section>
    </main>
  );
}
