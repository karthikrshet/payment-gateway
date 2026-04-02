import { format } from 'date-fns';

export function StatusBadge({ status }) {
  const dots = {
    created: 'bg-slate-400', authorized: 'bg-blue-400',
    captured: 'bg-emerald-400', refunded: 'bg-amber-400',
    failed: 'bg-red-400', cancelled: 'bg-slate-600',
  };
  return (
    <span className={`status-badge status-${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

export function WebhookStatusBadge({ status }) {
  return <span className={`status-badge webhook-${status}`}>{status}</span>;
}

export function AmountDisplay({ amount, currency = 'INR', className = '' }) {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount / 100);
  return <span className={`font-mono ${className}`}>{formatted}</span>;
}

export function TimeDisplay({ date, className = '' }) {
  if (!date) return <span className="text-slate-600">—</span>;
  return (
    <span className={`text-slate-400 text-xs ${className}`} title={new Date(date).toISOString()}>
      {format(new Date(date), 'dd MMM yy, HH:mm')}
    </span>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="text-xs text-slate-500 hover:text-brand-400 transition-colors flex items-center gap-1">
      {copied ? (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg> Copied!</>
      ) : (
        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg> {label}</>
      )}
    </button>
  );
}

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  return (
    <svg className={`animate-spin ${s} text-brand-400`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center mb-4 text-slate-600">
        {icon}
      </div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

// Re-export useState for CopyButton
import { useState } from 'react';
