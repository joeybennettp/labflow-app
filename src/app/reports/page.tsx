'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const STATUS_COLORS: Record<Case['status'], string> = {
  received: '#64748b',
  in_progress: '#2563eb',
  quality_check: '#7c3aed',
  ready: '#16a34a',
  shipped: '#d97706',
};

const STATUS_LABELS: Record<Case['status'], string> = {
  received: 'Received',
  in_progress: 'In Progress',
  quality_check: 'QC Check',
  ready: 'Ready',
  shipped: 'Shipped',
};

export default function ReportsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    async function fetchData() {
      const { data } = await supabase
        .from('cases')
        .select('*, doctors(name)')
        .order('created_at', { ascending: true });
      setCases((data as Case[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [authLoading]);

  // Chart 1: Cases by Month (last 12 months)
  const casesByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
    }
    const counts: Record<string, number> = {};
    months.forEach((m) => (counts[m.key] = 0));
    cases.forEach((c) => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (counts[key] !== undefined) counts[key]++;
    });
    return months.map((m) => ({ month: m.label, cases: counts[m.key] }));
  }, [cases]);

  // Chart 2: Revenue Over Time (last 12 months, invoiced cases)
  const revenueOverTime = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
    }
    const revenue: Record<string, number> = {};
    months.forEach((m) => (revenue[m.key] = 0));
    cases
      .filter((c) => c.invoiced)
      .forEach((c) => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (revenue[key] !== undefined) revenue[key] += Number(c.price);
      });
    return months.map((m) => ({ month: m.label, revenue: revenue[m.key] }));
  }, [cases]);

  // Chart 3: Cases per Doctor (top 10)
  const casesPerDoctor = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      const name = c.doctors?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([doctor, count]) => ({ doctor, count }));
  }, [cases]);

  // Chart 4: Revenue by Doctor (top 10, admin only)
  const revenueByDoctor = useMemo(() => {
    const totals: Record<string, number> = {};
    cases
      .filter((c) => c.invoiced)
      .forEach((c) => {
        const name = c.doctors?.name || 'Unknown';
        totals[name] = (totals[name] || 0) + Number(c.price);
      });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([doctor, revenue]) => ({ doctor, revenue }));
  }, [cases]);

  // Chart 5: Average Turnaround (days from created to shipped, per month)
  const avgTurnaround = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
    }
    const sums: Record<string, { total: number; count: number }> = {};
    months.forEach((m) => (sums[m.key] = { total: 0, count: 0 }));
    cases
      .filter((c) => c.status === 'shipped' && c.shipped_at)
      .forEach((c) => {
        const created = new Date(c.created_at);
        const shipped = new Date(c.shipped_at!);
        const days = Math.max(0, (shipped.getTime() - created.getTime()) / 86400000);
        const key = `${shipped.getFullYear()}-${String(shipped.getMonth() + 1).padStart(2, '0')}`;
        if (sums[key]) {
          sums[key].total += days;
          sums[key].count++;
        }
      });
    return months.map((m) => ({
      month: m.label,
      days: sums[m.key].count > 0 ? Math.round((sums[m.key].total / sums[m.key].count) * 10) / 10 : 0,
    }));
  }, [cases]);

  // Chart 6: Status Distribution (pie)
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as Case['status']] || status,
      value: count,
      fill: STATUS_COLORS[status as Case['status']] || '#94a3b8',
    }));
  }, [cases]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid rgba(226,232,240,0.7)',
    fontSize: '13px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="glass-topbar px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Reports &amp; Analytics
            </h1>
          </div>
          <span className="text-sm text-slate-400 hidden md:block">{today}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading reports...
            </div>
          ) : cases.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              No case data to analyze yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              {/* 1. Cases by Month */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Cases by Month</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={casesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} cases`, 'Cases']} contentStyle={tooltipStyle} />
                    <Bar dataKey="cases" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 2. Revenue Over Time (admin) */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Over Time</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 3. Cases per Doctor */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Cases per Doctor</h3>
                <ResponsiveContainer width="100%" height={Math.max(240, casesPerDoctor.length * 36)}>
                  <BarChart data={casesPerDoctor} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="doctor" type="category" width={120} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value} cases`, '']} contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 4. Revenue by Doctor (admin) */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue by Doctor</h3>
                <ResponsiveContainer width="100%" height={Math.max(240, revenueByDoctor.length * 36)}>
                  <BarChart data={revenueByDoctor} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis dataKey="doctor" type="category" width={120} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']} contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 5. Average Turnaround */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Avg. Turnaround Time (Days)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={avgTurnaround}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value} days`, 'Avg. Turnaround']} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="days" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 6. Status Distribution */}
              <div className="card-base p-4 md:p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Status Distribution</h3>
                {statusDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusDist}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {statusDist.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} cases`, '']}
                        contentStyle={tooltipStyle}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span style={{ color: '#334155', fontSize: '12px', fontWeight: 500 }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-12">No data</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
