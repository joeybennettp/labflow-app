'use client';

import { useEffect, useState, useMemo } from 'react';
import { Menu, Truck, Package, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';

type TimeFilter = 'all' | '7days' | '30days';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ShippingPage() {
  const { loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function fetchShipped() {
      const { data } = await supabase
        .from('cases')
        .select('*, doctors(name)')
        .eq('status', 'shipped')
        .order('shipped_at', { ascending: false });

      setCases((data as Case[]) || []);
      setLoading(false);
    }

    fetchShipped();
  }, [authLoading]);

  const [now] = useState(() => Date.now());
  const filtered = useMemo(() => {
    if (filter === 'all') return cases;
    const days = filter === '7days' ? 7 : 30;
    const cutoff = new Date(now - days * 86400000).toISOString();
    return cases.filter((c) => c.shipped_at && c.shipped_at >= cutoff);
  }, [cases, filter, now]);

  const FILTERS: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'All Shipped' },
    { key: '7days', label: 'Last 7 Days' },
    { key: '30days', label: 'Last 30 Days' },
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="glass-topbar px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Shipping
            </h1>
          </div>
          <span className="text-sm text-slate-400 hidden md:block">{today}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading shipments...
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="card-interactive hover:card-interactive-hover p-4 md:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{cases.length}</div>
                    <div className="text-sm text-slate-500 mt-1">Total Shipped</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                    <Truck size={20} />
                  </div>
                </div>
                <div className="card-interactive hover:card-interactive-hover p-4 md:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {cases.filter((c) => c.tracking_number).length}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">With Tracking</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                    <ExternalLink size={20} />
                  </div>
                </div>
                <div className="card-interactive hover:card-interactive-hover p-4 md:p-5 flex items-start justify-between hidden sm:flex">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      {cases.filter((c) => c.shipping_carrier === 'Hand Delivery').length}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Hand Delivered</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                    <Package size={20} />
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 mb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      filter === f.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Shipped cases table */}
              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200/70 bg-slate-50/70">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Case #
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Patient
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                          Doctor
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Carrier
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                          Tracking #
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                          Shipped
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <Truck size={32} className="text-slate-300" />
                              <p className="text-sm font-medium">
                                {cases.length === 0
                                  ? 'No shipments yet'
                                  : 'No shipments match this filter'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {cases.length === 0
                                  ? 'Shipments will appear when you mark cases as shipped.'
                                  : 'Try a different time range.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c) => (
                          <tr
                            key={c.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono font-semibold text-brand-600">
                                {c.case_number}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {c.patient}
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                              {c.doctors?.name || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700">
                                <Truck size={13} />
                                {c.shipping_carrier || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 text-xs hidden sm:table-cell">
                              {c.tracking_number || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                              {c.shipped_at ? formatTimestamp(c.shipped_at) : formatDate(c.due)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
