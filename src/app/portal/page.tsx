'use client';

import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { PortalCase } from '@/lib/types';
import PortalHeader from '@/components/PortalHeader';
import StatusBadge from '@/components/StatusBadge';
import PortalCaseDetail from '@/components/PortalCaseDetail';

const STATUS_TABS = ['all', 'received', 'in_progress', 'quality_check', 'ready', 'shipped'] as const;
const TAB_LABELS: Record<string, string> = {
  all: 'All',
  received: 'Received',
  in_progress: 'In Progress',
  quality_check: 'QC Check',
  ready: 'Ready',
  shipped: 'Shipped',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PortalPage() {
  const { doctorId, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<PortalCase[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<PortalCase | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

      // Fetch cases — RLS auto-filters to this doctor's cases only
      // Explicitly exclude financial columns
      const { data } = await supabase
        .from('cases')
        .select('id, case_number, patient, type, shade, status, rush, due, notes, created_at, updated_at')
        .order('due', { ascending: true });

      setCases((data as PortalCase[]) || []);
      setLoading(false);
    }

    fetchData();
  }, [doctorId, authLoading]);

  const activeCases = cases.filter((c) => c.status !== 'shipped').length;

  // Filtered cases
  const filteredCases = useMemo(() => {
    let result = cases;

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.case_number.toLowerCase().includes(q) ||
          c.patient.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cases, statusFilter, search]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <PortalHeader doctorName={doctorName} practiceName={practiceName} />

      <main className="flex-1 overflow-y-auto p-4 md:p-7">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Loading your cases...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-slate-900">{activeCases}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                  Active Cases
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                  Total Cases
                </div>
              </div>
            </div>

            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-sm px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
              />
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === tab
                      ? 'bg-brand-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {TAB_LABELS[tab]}
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
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400">
                          {cases.length === 0
                            ? 'No cases yet. Your lab will add cases as they come in.'
                            : 'No cases match your filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map((c) => {
                        const isOverdue = c.status !== 'shipped' && c.due < today;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedCase(c)}
                            className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                              c.rush ? 'bg-red-50/50' : ''
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono font-semibold text-brand-600">
                                {c.case_number}
                              </span>
                              {c.rush && (
                                <span className="ml-1.5 text-[0.625rem] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                  RUSH
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {c.patient}
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                              {c.type}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={c.status} />
                            </td>
                            <td
                              className={`px-4 py-3 hidden sm:table-cell ${
                                isOverdue ? 'text-red-600 font-semibold' : 'text-slate-600'
                              }`}
                            >
                              {isOverdue && <AlertTriangle size={14} className="inline -mt-0.5 mr-1" />}
                              {formatDate(c.due)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Case detail modal */}
      {selectedCase && (
        <PortalCaseDetail
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
