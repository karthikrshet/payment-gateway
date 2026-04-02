import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { paymentsAPI } from '../utils/api';
import { StatusBadge, AmountDisplay, TimeDisplay, Spinner, EmptyState } from '../components/dashboard/UIComponents';

const STATUSES = ['', 'created', 'authorized', 'captured', 'refunded', 'failed'];

function CreatePaymentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    amount: '', currency: 'INR', description: '', customer_name: '', customer_email: '',
  });
  const [useIdempotency, setUseIdempotency] = useState(true);
  const [idempotencyKey] = useState(`idem_${uuidv4()}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) {
      return setError('Amount must be a positive number');
    }
    setLoading(true);
    try {
      const payload = { ...form, amount: Math.round(+form.amount * 100) }; // Convert to paise
      const res = await paymentsAPI.create(payload, useIdempotency ? idempotencyKey : null);
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Create Payment Intent</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Amount (₹)</label>
              <input className="input" type="number" step="0.01" min="1" placeholder="500.00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Currency</label>
              <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Customer Name</label>
            <input className="input" placeholder="John Doe" value={form.customer_name}
              onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Customer Email</label>
            <input className="input" type="email" placeholder="john@example.com" value={form.customer_email}
              onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
            <input className="input" placeholder="Order #1234" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Idempotency toggle */}
          <div className="flex items-start gap-3 bg-surface-700 rounded-xl p-3">
            <input type="checkbox" id="idem" checked={useIdempotency}
              onChange={e => setUseIdempotency(e.target.checked)}
              className="mt-0.5 accent-brand-500" />
            <div>
              <label htmlFor="idem" className="text-slate-300 text-sm font-medium cursor-pointer">
                Use Idempotency Key
              </label>
              <p className="text-slate-500 text-xs mt-0.5">Prevents duplicate transactions on retry</p>
              {useIdempotency && (
                <code className="text-brand-400 text-xs font-mono mt-1 block truncate">{idempotencyKey}</code>
              )}
            </div>
          </div>

          {error && <div className="bg-red-900 bg-opacity-30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner size="sm" /> : 'Create Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const limit = 15;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentsAPI.list({ status: statusFilter || undefined, limit, offset: page * limit });
      setPayments(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleCreated = (payment) => {
    setShowCreate(false);
    navigate(`/payments/${payment.id}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {showCreate && <CreatePaymentModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total payment intents</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Payment
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUSES.map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s
                ? 'bg-brand-500 text-white'
                : 'bg-surface-700 text-slate-400 hover:text-white border border-white border-opacity-5'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={<svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>}
            title="No payments found"
            description={statusFilter ? `No payments with status "${statusFilter}"` : "Create your first payment intent to get started"}
            action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Payment</button>}
          />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-white border-opacity-5">
                  {['ID', 'Customer', 'Description', 'Amount', 'Status', 'Created'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}
                    onClick={() => navigate(`/payments/${p.id}`)}
                    className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-3 cursor-pointer transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-slate-400 group-hover:text-brand-400 transition-colors">
                        {p.id.slice(0, 12)}…
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-white text-sm">{p.customer_name || <span className="text-slate-600">—</span>}</div>
                      <div className="text-slate-500 text-xs">{p.customer_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-400 text-sm truncate max-w-36 block">{p.description || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <AmountDisplay amount={p.amount} currency={p.currency} className="text-white text-sm font-medium" />
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5"><TimeDisplay date={p.created_at} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-white border-opacity-5">
                <span className="text-slate-500 text-xs">
                  Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-30">← Prev</button>
                  <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}
                    className="btn-ghost text-sm py-1.5 px-3 disabled:opacity-30">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
