'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';

type InvoiceFilter = 'all' | 'pending' | 'invoiced';

export default function InvoicesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceFilter>('all');

  const refreshCases = useCallback(async () => {
    const { data } = await supabase
      .from('cases')
      .select('*, doctors(name)')
      .order('due', { ascending: false });
    setCases((data as Case[]) || []);
  }, []);

  useEffect(() => {
    async function fetchData() {
      await refreshCases();
      setLoading(false);
    }
    fetchData();
  }, [refreshCases]);

  async function toggleInvoiced(caseId: string, currentValue: boolean) {
    await supabase
      .from('cases')
      .update({ invoiced: !currentValue })
      .eq('id', caseId);
    await refreshCases();
  }

  // Filter cases
  const filtered = cases.filter((c) => {
    if (filter === 'pending') return !c.invoiced;
    if (filter === 'invoiced') return c.invoiced;
    return true;
  });

  const totalPending = cases
    .filter((c) => !c.invoiced)
    .reduce((sum, c) => sum + Number(c.price), 0);
  const totalInvoiced = cases
    .filter((c) => c.invoiced)
    .reduce((sum, c) => sum + Number(c.price), 0);

  const FILTERS: { key: InvoiceFilter; label: string }[] = [
    { key: 'all', label: 'All Cases' },
    { key: 'pending', label: 'Pending' },
    { key: 'invoiced', label: 'Invoiced' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-7 h-16 flex items-center shrink-0">
          <h1 className="text-[1.0625rem] font-bold text-slate-900">
            Invoices
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading invoices...
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="text-sm text-slate-500 mb-1">
                    Pending Invoices
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600">
                    ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {cases.filter((c) => !c.invoiced).length} cases
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="text-sm text-slate-500 mb-1">
                    Invoiced
                  </div>
                  <div className="text-2xl font-extrabold text-green-600">
                    ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {cases.filter((c) => c.invoiced).length} cases
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="text-sm text-slate-500 mb-1">
                    Total Revenue
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${(totalPending + totalInvoiced).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {cases.length} cases
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[0.9375rem] font-bold text-slate-900">
                    Invoice Tracker
                  </span>
                  <div className="flex items-center gap-2">
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-medium border transition-colors ${
                          filter === f.key
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Case #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Patient
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Doctor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Restoration
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Price
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Invoiced
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-12 text-center text-slate-400 text-sm"
                          >
                            No cases match this filter.
                          </td>
                        </tr>
                      ) : (
                        filtered.map((c) => (
                          <tr
                            key={c.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3.5 text-sm border-b border-slate-100">
                              <span className="font-mono font-semibold text-brand-600">
                                {c.case_number}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100 font-medium">
                              {c.patient}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                              {c.doctors?.name || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                              {c.type}
                            </td>
                            <td className="px-4 py-3.5 border-b border-slate-100">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100 text-right font-semibold">
                              ${Number(c.price).toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5 border-b border-slate-100 text-center">
                              <button
                                onClick={() => toggleInvoiced(c.id, c.invoiced)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                  c.invoiced
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {c.invoiced ? '✅ Invoiced' : 'Mark Invoiced'}
                              </button>
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
