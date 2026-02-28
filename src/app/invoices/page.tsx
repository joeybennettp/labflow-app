'use client';

import { Menu } from 'lucide-react';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Case, Doctor } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import StatusBadge from '@/components/StatusBadge';
import generateInvoicePDF from '@/lib/generateInvoicePDF';
import { logActivity } from '@/lib/activity';

type LabSettings = {
  id: string;
  lab_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
};

type InvoiceFilter = 'all' | 'pending' | 'invoiced';

export default function InvoicesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [labSettings, setLabSettings] = useState<LabSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoiceDoctor, setInvoiceDoctor] = useState('');

  // Redirect non-admins to dashboard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  const refreshCases = useCallback(async () => {
    const { data } = await supabase
      .from('cases')
      .select('*, doctors(name)')
      .order('due', { ascending: false });
    setCases((data as Case[]) || []);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [, doctorsRes, settingsRes] = await Promise.all([
        refreshCases(),
        supabase.from('doctors').select('*').order('name', { ascending: true }),
        supabase.from('lab_settings').select('*').limit(1).single(),
      ]);

      if (doctorsRes.data) setDoctors(doctorsRes.data as Doctor[]);
      if (settingsRes.data) setLabSettings(settingsRes.data as LabSettings);

      setLoading(false);
    }
    fetchData();
  }, [refreshCases]);

  async function toggleInvoiced(caseId: string, currentValue: boolean) {
    await supabase
      .from('cases')
      .update({ invoiced: !currentValue })
      .eq('id', caseId);
    logActivity(supabase, {
      caseId,
      action: currentValue ? 'unmarked as invoiced' : 'marked as invoiced',
    });
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

  // Doctors that have pending cases
  const pendingCases = cases.filter((c) => !c.invoiced);
  const doctorsWithPending = doctors.filter((d) =>
    pendingCases.some((c) => c.doctor_id === d.id)
  );

  function handleGeneratePDF() {
    if (!invoiceDoctor || !labSettings) return;
    const doctorCases = pendingCases.filter((c) => c.doctor_id === invoiceDoctor);
    if (doctorCases.length === 0) return;
    const doctor = doctors.find((d) => d.id === invoiceDoctor);
    generateInvoicePDF(doctorCases, labSettings, doctor ? [doctor] : []);
  }

  const FILTERS: { key: InvoiceFilter; label: string }[] = [
    { key: 'all', label: 'All Cases' },
    { key: 'pending', label: 'Pending' },
    { key: 'invoiced', label: 'Invoiced' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Invoices
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={invoiceDoctor}
              onChange={(e) => setInvoiceDoctor(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            >
              <option value="">Select Doctor...</option>
              {doctorsWithPending.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({pendingCases.filter((c) => c.doctor_id === d.id).length} pending)
                </option>
              ))}
            </select>
            <button
              onClick={handleGeneratePDF}
              disabled={!invoiceDoctor || !labSettings}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Generate PDF
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-7">
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
                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Doctor
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Restoration
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                          Status
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
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
                            <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                              {c.doctors?.name || '—'}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                              {c.type}
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 border-b border-slate-100">
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100 text-right font-semibold">
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
                                {c.invoiced ? 'Invoiced' : 'Mark Invoiced'}
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
