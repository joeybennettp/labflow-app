'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, CheckCircle, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { PortalInvoiceCase } from '@/lib/types';
import PortalHeader from '@/components/PortalHeader';
import StatusBadge from '@/components/StatusBadge';

type InvoiceFilter = 'all' | 'pending' | 'invoiced';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PortalInvoicesPage() {
  const { doctorId, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<PortalInvoiceCase[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceFilter>('all');

  useEffect(() => {
    if (authLoading) return;

    async function fetchData() {
      // Fetch doctor info
      if (doctorId) {
        const { data: doc } = await supabase
          .from('doctors')
          .select('name, practice')
          .eq('id', doctorId)
          .single();
        if (doc) {
          setDoctorName(doc.name);
          setPracticeName(doc.practice);
        }
      }

      // Fetch cases with financial data — RLS auto-filters to this doctor
      const { data } = await supabase
        .from('cases')
        .select('id, case_number, patient, type, status, due, price, invoiced')
        .order('created_at', { ascending: false });

      setCases((data as PortalInvoiceCase[]) || []);
      setLoading(false);
    }

    fetchData();
  }, [doctorId, authLoading]);

  const filtered = useMemo(() => {
    if (filter === 'pending') return cases.filter((c) => !c.invoiced);
    if (filter === 'invoiced') return cases.filter((c) => c.invoiced);
    return cases;
  }, [cases, filter]);

  const totalPending = cases
    .filter((c) => !c.invoiced)
    .reduce((sum, c) => sum + Number(c.price), 0);
  const totalInvoiced = cases
    .filter((c) => c.invoiced)
    .reduce((sum, c) => sum + Number(c.price), 0);
  const pendingCount = cases.filter((c) => !c.invoiced).length;
  const invoicedCount = cases.filter((c) => c.invoiced).length;

  const FILTERS: { key: InvoiceFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: `Pending (${pendingCount})` },
    { key: 'invoiced', label: `Invoiced (${invoicedCount})` },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <PortalHeader doctorName={doctorName} practiceName={practiceName} />

      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Loading invoices...
          </div>
        ) : (
          <>
            {/* Page heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
              {practiceName && (
                <p className="text-sm text-slate-500 mt-1">{practiceName}</p>
              )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
              {/* Outstanding */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Outstanding</div>
                  <div className="text-2xl font-extrabold text-amber-600">
                    ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {pendingCount} {pendingCount === 1 ? 'case' : 'cases'}
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                  <Clock size={20} />
                </div>
              </div>

              {/* Invoiced */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Invoiced</div>
                  <div className="text-2xl font-extrabold text-green-600">
                    ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {invoicedCount} {invoicedCount === 1 ? 'case' : 'cases'}
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                  <CheckCircle size={20} />
                </div>
              </div>

              {/* Total */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Total</div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    ${(totalPending + totalInvoiced).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {cases.length} {cases.length === 1 ? 'case' : 'cases'}
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
                  <DollarSign size={20} />
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

            {/* Cases table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Case #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Patient
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                        Restoration
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                        Due Date
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Invoiced
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <DollarSign size={32} className="text-slate-300" />
                            <p className="text-sm font-medium">
                              {cases.length === 0
                                ? 'No billing data yet'
                                : 'No cases match this filter'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {cases.length === 0
                                ? 'Invoice data will appear as your lab processes cases.'
                                : 'Try a different filter.'}
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
                          <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                            {c.type}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                            {formatDate(c.due)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">
                            ${Number(c.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                c.invoiced
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {c.invoiced ? 'Invoiced' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Totals row */}
                  {filtered.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-sm font-bold text-slate-700 text-right hidden md:table-cell"
                        >
                          Total
                        </td>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-sm font-bold text-slate-700 text-right md:hidden"
                        >
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-lg text-slate-900 hidden md:table-cell">
                          ${filtered.reduce((sum, c) => sum + Number(c.price), 0).toFixed(2)}
                        </td>
                        <td className="hidden md:table-cell" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Info note */}
            <p className="mt-4 text-xs text-slate-400 text-center">
              Contact your lab if you have questions about billing. Invoices are marked by the lab once generated.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
