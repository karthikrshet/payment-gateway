import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function KeyRow({ label, value, description }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = value ? `${value.slice(0, 8)}${'•'.repeat(24)}${value.slice(-4)}` : '';

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-white border-opacity-5 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium text-sm">{label}</span>
            <span className="bg-surface-600 text-slate-400 text-xs px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-slate-500 text-xs mb-3">{description}</p>
          <div className="bg-surface-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <code className="text-brand-400 text-sm font-mono flex-1 truncate">
              {revealed ? value : masked}
            </code>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setRevealed(r => !r)}
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white hover:bg-opacity-5">
                {revealed ? 'Hide' : 'Reveal'}
              </button>
              <button onClick={copy}
                className="text-slate-500 hover:text-brand-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-white hover:bg-opacity-5">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function APIKeysPage() {
  const { user } = useAuth();
  const jwtToken = localStorage.getItem('token');

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">API Keys</h1>
        <p className="text-slate-500 text-sm mt-1">Use these keys to authenticate API requests</p>
      </div>

      {/* Warning */}
      <div className="bg-amber-900 bg-opacity-20 border border-amber-700 border-opacity-40 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-amber-300 text-sm">
          Never expose your API keys in client-side code or public repositories. Treat them like passwords.
        </p>
      </div>

      <div className="card p-6 space-y-4 mb-6">
        <h2 className="text-white font-medium mb-2">Your Keys</h2>

        <KeyRow
          label="API Key"
          value={user?.api_key}
          description="Use this key in the X-Api-Key header for server-to-server API calls"
        />
        <KeyRow
          label="JWT Token (Session)"
          value={jwtToken}
          description="Short-lived session token used by the dashboard. Attach as Bearer token in Authorization header"
        />
      </div>

      {/* Usage examples */}
      <div className="card p-6">
        <h2 className="text-white font-medium mb-4">Usage Examples</h2>
        <div className="space-y-4">
          {[
            {
              title: 'Create a Payment Intent (cURL)',
              code: `curl -X POST http://localhost:5000/api/payments \\
  -H "X-Api-Key: ${user?.api_key?.slice(0, 16)}..." \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{"amount": 50000, "currency": "INR", "customer_name": "John Doe"}'`,
            },
            {
              title: 'Authorize a Payment',
              code: `curl -X POST http://localhost:5000/api/payments/{id}/authorize \\
  -H "X-Api-Key: ${user?.api_key?.slice(0, 16)}..."`,
            },
            {
              title: 'JavaScript / Node.js',
              code: `const res = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'X-Api-Key': '${user?.api_key?.slice(0, 16)}...',
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({ amount: 50000, currency: 'INR' }),
});`,
            },
          ].map(ex => (
            <div key={ex.title}>
              <p className="text-slate-400 text-xs font-medium mb-2">{ex.title}</p>
              <pre className="bg-surface-700 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto border border-white border-opacity-5 leading-relaxed">
                {ex.code}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
