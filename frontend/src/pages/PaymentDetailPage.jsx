import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentsAPI } from '../utils/api';
import { StatusBadge, AmountDisplay, TimeDisplay, Spinner } from '../components/dashboard/UIComponents';

const LIFECYCLE_STEPS = ['created', 'authorized', 'captured', 'refunded'];

function LifecycleTrack({ status }) {
  const isFailed = status === 'failed' || status === 'cancelled';
  const currentIdx = LIFECYCLE_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 mb-8">
      {LIFECYCLE_STEPS.map((step, i) => {
        const done = isFailed ? false : currentIdx >= i;
        const active = !isFailed && currentIdx === i;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                isFailed && i === 0 ? 'border-red-500 bg-red-900 bg-opacity-30 text-red-400' :
                done ? 'border-brand-500 bg-brand-500 text-white' :
                'border-surface-600 bg-surface-700 text-slate-600'
              }`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-xs capitalize whitespace-nowrap ${
                active ? 'text-brand-400 font-medium' : done ? 'text-slate-300' : 'text-slate-600'
              }`}>{step}</span>
            </div>
            {i < LIFECYCLE_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${
                !isFailed && currentIdx > i ? 'bg-brand-500' : 'bg-surface-600'
              }`} />
            )}
          </div>
        );
      })}
      {isFailed && (
        <div className="ml-4 flex items-center gap-1.5 mb-5">
          <span className="text-red-400 text-sm">→ {status}</span>
        </div>
      )}
    </div>
  );
}

function ActionButton({ label, color, onClick, disabled, loading }) {
  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500',
    green: 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500',
    amber: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500',
    red: 'bg-red-700 hover:bg-red-600 focus:ring-red-500',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={`${colors[color]} text-white text-sm font-medium px-4 py-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2`}>
      {loading && <Spinner size="sm" />}
      {label}
    </button>
  );
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [showRefund, setShowRefund] = useState(false);

  const fetch = async () => {
    try {
      const res = await paymentsAPI.get(id);
      setPayment(res.data);
    } catch (err) {
      setError('Payment not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);

  const doAction = async (action, extraData) => {
    setActionLoading(action);
    setError('');
    try {
      if (action === 'authorize') await paymentsAPI.authorize(id);
      else if (action === 'capture') await paymentsAPI.capture(id);
      else if (action === 'refund') await paymentsAPI.refund(id, {
        amount: extraData.amount ? Math.round(+extraData.amount * 100) : undefined,
        reason: extraData.reason,
      });
      await fetch();
      setShowRefund(false);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} payment`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!payment) return <div className="p-8 text-red-400">{error}</div>;

  const canAuthorize = payment.status === 'created';
  const canCapture = payment.status === 'authorized';
  const canRefund = payment.status === 'captured';

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/payments')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Payments
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-white">Payment Intent</h1>
            <StatusBadge status={payment.status} />
          </div>
          <code className="text-slate-500 text-xs font-mono">{payment.id}</code>
        </div>
        <AmountDisplay amount={payment.amount} currency={payment.currency}
          className="text-2xl font-semibold text-white" />
      </div>

      {/* Lifecycle Track */}
      <div className="card p-6 mb-5">
        <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-5">Payment Lifecycle</h2>
        <LifecycleTrack status={payment.status} />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canAuthorize && (
            <ActionButton label="Authorize Payment" color="blue"
              onClick={() => doAction('authorize')} loading={actionLoading === 'authorize'} />
          )}
          {canCapture && (
            <ActionButton label="Capture Payment" color="green"
              onClick={() => doAction('capture')} loading={actionLoading === 'capture'} />
          )}
          {canRefund && !showRefund && (
            <ActionButton label="Issue Refund" color="amber" onClick={() => setShowRefund(true)} />
          )}
          {payment.status === 'failed' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {payment.failure_reason}
            </div>
          )}
        </div>

        {/* Refund form */}
        {showRefund && (
          <div className="mt-4 p-4 bg-surface-700 rounded-xl border border-amber-900 border-opacity-40">
            <h3 className="text-amber-400 text-sm font-medium mb-3">Issue Refund</h3>
            <div className="flex gap-3">
              <input className="input flex-1" type="number" step="0.01"
                placeholder={`Full amount (₹${payment.amount / 100})`}
                value={refundForm.amount} onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))} />
              <input className="input flex-1" placeholder="Reason (optional)"
                value={refundForm.reason} onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))} />
              <button onClick={() => doAction('refund', refundForm)}
                disabled={actionLoading === 'refund'}
                className="btn-primary bg-amber-600 hover:bg-amber-500 whitespace-nowrap">
                {actionLoading === 'refund' ? <Spinner size="sm" /> : 'Confirm Refund'}
              </button>
              <button onClick={() => setShowRefund(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-900 bg-opacity-30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">Payment Details</h2>
          <dl className="space-y-3">
            {[
              ['Amount', <AmountDisplay amount={payment.amount} currency={payment.currency} />],
              ['Currency', payment.currency],
              ['Description', payment.description || '—'],
              ['Idempotency Key', payment.idempotency_key
                ? <code className="text-brand-400 text-xs font-mono break-all">{payment.idempotency_key}</code>
                : <span className="text-slate-600">None</span>],
              ['Created', <TimeDisplay date={payment.created_at} />],
              ['Authorized', <TimeDisplay date={payment.authorized_at} />],
              ['Captured', <TimeDisplay date={payment.captured_at} />],
              ['Refunded', <TimeDisplay date={payment.refunded_at} />],
            ].map(([label, val]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 text-sm flex-shrink-0">{label}</dt>
                <dd className="text-white text-sm text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5">
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">Customer</h2>
          <dl className="space-y-3">
            {[
              ['Name', payment.customer_name || '—'],
              ['Email', payment.customer_email || '—'],
            ].map(([label, val]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-slate-500 text-sm">{label}</dt>
                <dd className="text-white text-sm">{val}</dd>
              </div>
            ))}
          </dl>

          {payment.refunds?.length > 0 && (
            <>
              <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mt-6 mb-4">Refunds</h2>
              {payment.refunds.map(r => (
                <div key={r.id} className="bg-surface-700 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <AmountDisplay amount={r.amount} className="text-amber-400" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reason</span>
                    <span className="text-white">{r.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-400">{r.status}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Audit Trail */}
      {payment.audit_trail?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">Audit Trail</h2>
          <div className="space-y-3">
            {payment.audit_trail.map((log, i) => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  {i < payment.audit_trail.length - 1 && <div className="w-px flex-1 bg-surface-600 mt-1 min-h-6" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{log.event}</span>
                    <TimeDisplay date={log.created_at} />
                  </div>
                  {(log.from_status || log.to_status) && (
                    <div className="text-slate-500 text-xs mt-0.5">
                      {log.from_status && <span>{log.from_status}</span>}
                      {log.from_status && log.to_status && <span> → </span>}
                      {log.to_status && <span className="text-brand-400">{log.to_status}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
