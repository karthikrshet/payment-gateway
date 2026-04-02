import { useState, useEffect, useCallback } from 'react';
import { webhooksAPI } from '../utils/api';
import { WebhookStatusBadge, TimeDisplay, Spinner, EmptyState } from '../components/dashboard/UIComponents';

function AddEndpointModal({ onClose, onAdded }) {
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState(['payment.created', 'payment.authorized', 'payment.captured', 'payment.refunded', 'payment.failed']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ALL_EVENTS = ['payment.created', 'payment.authorized', 'payment.captured', 'payment.refunded', 'payment.failed'];

  const toggleEvent = (e) => setEvents(ev => ev.includes(e) ? ev.filter(x => x !== e) : [...ev, e]);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await webhooksAPI.createEndpoint({ url, events });
      onAdded(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register endpoint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Register Webhook Endpoint</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Endpoint URL</label>
            <input className="input" type="url" placeholder="https://yourapp.com/webhooks"
              value={url} onChange={e => setUrl(e.target.value)} required />
            <p className="text-slate-600 text-xs mt-1">Must be publicly accessible HTTPS URL</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium">Events to Listen</label>
            <div className="space-y-2">
              {ALL_EVENTS.map(e => (
                <label key={e} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)}
                    className="accent-brand-500" />
                  <code className="text-sm text-slate-300 group-hover:text-white transition-colors">{e}</code>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading || events.length === 0} className="btn-primary flex-1">
              {loading ? <Spinner size="sm" /> : 'Register Endpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SecretReveal({ secret }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono text-slate-400 flex-1 truncate">
        {revealed ? secret : '•'.repeat(24)}
      </code>
      <button onClick={() => setRevealed(r => !r)} className="text-slate-600 hover:text-slate-400 transition-colors text-xs">
        {revealed ? 'Hide' : 'Show'}
      </button>
      <button onClick={copy} className="text-slate-600 hover:text-brand-400 transition-colors text-xs">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState('endpoints');
  const [retrying, setRetrying] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ep, ev] = await Promise.all([webhooksAPI.listEndpoints(), webhooksAPI.listEvents({ limit: 30 })]);
      setEndpoints(ep.data);
      setEvents(ev.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this webhook endpoint?')) return;
    await webhooksAPI.deleteEndpoint(id);
    setEndpoints(ep => ep.filter(e => e.id !== id));
  };

  const handleRetry = async (eventId) => {
    setRetrying(eventId);
    try { await webhooksAPI.retryEvent(eventId); await fetchAll(); }
    catch (err) { console.error(err); }
    finally { setRetrying(null); }
  };

  const handleAdded = (endpoint) => { setEndpoints(ep => [endpoint, ...ep]); setShowAdd(false); };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {showAdd && <AddEndpointModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Webhooks</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time event delivery with automatic retry logic</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Endpoint
        </button>
      </div>

      {/* Retry schedule info banner */}
      <div className="bg-blue-900 bg-opacity-20 border border-blue-800 border-opacity-40 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-blue-300 text-sm font-medium">Retry Schedule</p>
          <p className="text-blue-400 text-xs mt-0.5">
            Failed deliveries are retried at: <strong>5s → 30s → 5min → 30min → 1hr</strong>.
            Payloads are signed with HMAC-SHA256 (Stripe-style). Verify with <code className="font-mono">X-Webhook-Signature</code> header.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 border border-white border-opacity-5 rounded-xl p-1 mb-5 w-fit">
        {[['endpoints', `Endpoints (${endpoints.length})`], ['events', `Event Log (${events.length})`]].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-surface-900 text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : activeTab === 'endpoints' ? (
        <div className="space-y-4">
          {endpoints.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>}
                title="No webhook endpoints"
                description="Register an endpoint to start receiving real-time payment events"
                action={<button onClick={() => setShowAdd(true)} className="btn-primary">Add Endpoint</button>}
              />
            </div>
          ) : endpoints.map(ep => (
            <div key={ep.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ep.is_active ? 'bg-brand-400' : 'bg-slate-600'}`} />
                    <a href={ep.url} target="_blank" rel="noopener noreferrer"
                      className="text-white font-medium text-sm hover:text-brand-400 transition-colors truncate">
                      {ep.url}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ep.events.map(e => (
                      <span key={e} className="bg-surface-700 text-slate-400 text-xs px-2 py-0.5 rounded-full font-mono">{e}</span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="text-slate-600 text-xs mb-1 font-medium">Signing Secret</p>
                    <SecretReveal secret={ep.secret} />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <TimeDisplay date={ep.created_at} />
                  <button onClick={() => handleDelete(ep.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-900 hover:bg-opacity-20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {events.length === 0 ? (
            <EmptyState
              icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>}
              title="No webhook events yet"
              description="Events appear here once payments are created and webhook endpoints are registered"
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-white border-opacity-5">
                  {['Event', 'Endpoint', 'Status', 'Attempts', 'Sent'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-3 transition-colors">
                    <td className="px-5 py-3.5">
                      <code className="text-brand-400 text-xs font-mono">{ev.event_type}</code>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-400 text-xs truncate block max-w-48">{ev.endpoint_url}</span>
                    </td>
                    <td className="px-5 py-3.5"><WebhookStatusBadge status={ev.status} /></td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-400 text-sm">{ev.attempts} / {ev.max_attempts}</span>
                    </td>
                    <td className="px-5 py-3.5"><TimeDisplay date={ev.created_at} /></td>
                    <td className="px-5 py-3.5">
                      {ev.status === 'failed' && (
                        <button onClick={() => handleRetry(ev.id)} disabled={retrying === ev.id}
                          className="text-xs text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50">
                          {retrying === ev.id ? 'Retrying…' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
