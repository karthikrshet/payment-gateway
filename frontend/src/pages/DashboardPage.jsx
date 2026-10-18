import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { paymentsAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { AmountDisplay, StatusBadge, Spinner, TimeDisplay } from '../components/dashboard/UIComponents';

const STAT_COLORS = {
  captured: '#10b981', authorized: '#3b82f6',
  refunded: '#f59e0b', failed: '#ef4444', created: '#6b7280',
};

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-slate-500 text-sm">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-white mb-1" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([paymentsAPI.stats(), paymentsAPI.list({ limit: 8 })])
      .then(([s, p]) => { setStats(s.data); setPayments(p.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build chart data from recent payments grouped by day
  const chartData = (() => {
    const map = {};
    payments.forEach(p => {
      const day = new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!map[day]) map[day] = { day, amount: 0, count: 0 };
      if (p.status === 'captured') map[day].amount += p.amount / 100;
      map[day].count++;
    });
    return Object.values(map).slice(-7);
  })();

  const pieData = stats ? [
    { name: 'Captured', value: +stats.captured },
    { name: 'Authorized', value: +stats.authorized },
    { name: 'Refunded', value: +stats.refunded },
    { name: 'Failed', value: +stats.failed },
  ].filter(d => d.value > 0) : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );

  return (
  <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's your payment activity overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Payments" value={stats?.total || 0} icon="💳"
          color="#e2e8f0" sub={`All time`} />
        <StatCard label="Revenue Captured" value={<AmountDisplay amount={+(stats?.total_captured_amount || 0)} />}
          icon="✅" color={STAT_COLORS.captured} sub={`${stats?.captured} transactions`} />
        <StatCard label="Total Refunded" value={<AmountDisplay amount={+(stats?.total_refunded_amount || 0)} />}
          icon="↩️" color={STAT_COLORS.refunded} sub={`${stats?.refunded} refunds`} />
        <StatCard label="Failed Payments" value={stats?.failed || 0} icon="❌"
          color={STAT_COLORS.failed} sub="Requires attention" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Area chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-white font-medium mb-6">Revenue (Last 7 days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: '#111915', border: '1px solid #1e2e28', borderRadius: 12, color: '#e2e8f0' }}
                  formatter={(v) => [`₹${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">
              No captured payments yet. Create your first payment →
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card p-6">
          <h2 className="text-white font-medium mb-4">Status Breakdown</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={STAT_COLORS[entry.name.toLowerCase()] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111915', border: '1px solid #1e2e28', borderRadius: 12, color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: STAT_COLORS[d.name.toLowerCase()] }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white border-opacity-5">
          <h2 className="text-white font-medium">Recent Payments</h2>
          <button onClick={() => navigate('/payments')} className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
            View all →
          </button>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-600 text-sm">
            No payments yet. Go to Payments to create your first one.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-white border-opacity-5">
                {['ID', 'Customer', 'Amount', 'Status', 'Created'].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id}
                  onClick={() => navigate(`/payments/${p.id}`)}
                  className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-3 cursor-pointer transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs text-slate-400">{p.id.slice(0, 8)}…</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-white text-sm">{p.customer_name || '—'}</div>
                    <div className="text-slate-500 text-xs">{p.customer_email || ''}</div>
                  </td>
                  <td className="px-6 py-3">
                    <AmountDisplay amount={p.amount} currency={p.currency} className="text-white text-sm" />
                  </td>
                  <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-3"><TimeDisplay date={p.created_at} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
