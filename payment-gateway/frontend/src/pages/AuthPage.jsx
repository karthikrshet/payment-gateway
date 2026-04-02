import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--surface-900)' }}>

      {/* Navbar */}
<nav style={{
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(8,12,16,0.85)",
  backdropFilter: "blur(12px)",
  padding: "0 40px",
  display: "flex", alignItems: "center", justifyContent: "space-between",
  height: 56,
}}>
  <a href="/landing" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: "linear-gradient(135deg, #4ade80, #22d3ee)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700, color: "#080c10",
    }}>P</div>
    <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>
      PayGateway
    </span>
    <span style={{
      fontSize: 11, fontFamily: "monospace",
      background: "#4ade8018", color: "#4ade80",
      border: "1px solid #4ade8030", borderRadius: 4,
      padding: "2px 8px",
    }}>v1.0.0</span>
  </a>
  <div style={{ display: "flex", gap: 32 }}>
    {["Features", "Architecture", "API", "Stack"].map(l => (
      <a key={l} href={`/landing#${l.toLowerCase()}`} style={{
        fontSize: 13, color: "#64748b", textDecoration: "none",
      }}
        onMouseEnter={e => e.target.style.color = "#4ade80"}
        onMouseLeave={e => e.target.style.color = "#64748b"}
      >{l}</a>
    ))}
  </div>
  <a href="/landing" style={{
    fontSize: 13, fontFamily: "monospace",
    background: "transparent", color: "#4ade80",
    border: "1px solid #4ade8040", borderRadius: 6, padding: "7px 16px",
    textDecoration: "none", fontWeight: 600,
  }}>← Home</a>
</nav>
<div className="min-h-screen flex items-center justify-center px-4" 
  style={{ background: 'var(--surface-900)', paddingTop: 56 }}></div>

      {/* Background grid */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(var(--brand-500) 1px, transparent 1px), linear-gradient(90deg, var(--brand-500) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-4">
  <a href="/landing" style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 13, color: "#4ade80", textDecoration: "none",
    fontFamily: "monospace", opacity: 0.8,
  }}>
    {/* ← Back to Home */}
  </a>
</div>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500 bg-opacity-20 border border-brand-500 border-opacity-30 mb-4">
            <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">PayGateway</h1>
          <p className="text-slate-500 text-sm mt-1">Stripe-inspired payment infrastructure</p>
        </div>

        <div className="card p-8">
          {/* Tab switcher */}
          <div className="flex bg-surface-700 rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-surface-900 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Full Name</label>
                <input className="input" placeholder="Karthik Shet" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Built by Karthik Rajesh Shet · Stripe-Inspired Payment Gateway
        </p>
      </div>
    </div>
  );
}
