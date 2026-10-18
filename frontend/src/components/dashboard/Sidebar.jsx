import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  {
    to: '/', label: 'Dashboard', exact: true,
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    to: '/payments', label: 'Payments',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  },
  {
    to: '/webhooks', label: 'Webhooks',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    to: '/api-keys', label: 'API Keys',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
  },
];

function Icon({ d }) {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {d}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r border-white border-opacity-5"
        style={{ background: 'var(--surface-800)' }}>
        <div className="p-6 border-b border-white border-opacity-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 bg-opacity-20 border border-brand-500 border-opacity-30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">PayGateway</div>
              <div className="text-slate-500 text-xs">Payment Infrastructure</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? 'bg-brand-500 bg-opacity-15 text-brand-400 border border-brand-500 border-opacity-20'
                  : 'text-slate-400 hover:text-white hover:bg-white hover:bg-opacity-5'}`
              }>
              <Icon d={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white border-opacity-5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-500 bg-opacity-30 flex items-center justify-center text-brand-400 text-sm font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-slate-500 text-xs truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-600 hover:text-red-400 transition-colors p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ──────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: 'var(--surface-800)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 bg-opacity-20 border border-brand-500 border-opacity-30 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">PayGateway</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-brand-500 bg-opacity-30 flex items-center justify-center text-brand-400 text-xs font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <button onClick={() => setOpen(!open)} className="text-slate-400 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ───────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div className="absolute top-14 left-0 right-0 p-4 space-y-1"
            style={{ background: 'var(--surface-800)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            onClick={e => e.stopPropagation()}>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-brand-500 bg-opacity-15 text-brand-400 border border-brand-500 border-opacity-20'
                    : 'text-slate-400'}`
                }>
                <Icon d={item.icon} />
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-white border-opacity-5 pt-3 mt-3 flex items-center justify-between px-4 py-2">
              <div>
                <div className="text-white text-sm font-medium">{user?.name}</div>
                <div className="text-slate-500 text-xs">{user?.email}</div>
              </div>
              <button onClick={handleLogout} className="text-red-400 text-sm">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Nav ───────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: 'var(--surface-800)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs transition-all ${isActive ? 'text-brand-400' : 'text-slate-600'}`
            }>
            <Icon d={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}