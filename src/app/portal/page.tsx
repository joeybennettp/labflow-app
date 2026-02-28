'use client';

import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, ClipboardList, CalendarClock, CheckCircle } from 'lucide-react';
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

const STATUS_ORDER: Record<string, number> = {
  received: 1,
  in_progress: 2,
  quality_check: 3,
  ready: 4,
  shipped: 5,
};

type SortKey = 'case_number' | 'patient' | 'type' | 'status' | 'due';

const PORTAL_COLUMNS: { key: SortKey; label: string; hideOnMobile?: boolean }[] = [
  { key: 'case_number', label: 'Case #' },
  { key: 'patient', label: 'Patient' },
  { key: 'type', label: 'Restoration', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due Date', hideOnMobile: true },
];

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

  // Sorting
  const [sortBy, setSortBy] = useState<SortKey>('due');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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

  // Computed stats
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysOut = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const activeCases = cases.filter((c) => c.status !== 'shipped').length;
  const inProgressCount = cases.filter((c) => c.status === 'in_progress').length;
  const dueThisWeek = cases.filter(
    (c) => c.status !== 'shipped' && c.due >= today && c.due <= sevenDaysOut
  ).length;
  const overdueCount = cases.filter(
    (c) => c.status !== 'shipped' && c.due < today
  ).length;

  // Sort handler
  function handleSort(column: SortKey) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  // Filtered + sorted cases
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

    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      // Rush cases float to top
      if (a.rush && !b.rush) return -1;
      if (!a.rush && b.rush) return 1;

      switch (sortBy) {
        case 'case_number':
          return (parseInt(a.case_number.replace('C-', '')) - parseInt(b.case_number.replace('C-', ''))) * dir;
        case 'patient':
          return a.patient.localeCompare(b.patient) * dir;
        case 'type':
          return a.type.localeCompare(b.type) * dir;
        case 'status':
          return ((STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0)) * dir;
        case 'due':
          return (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [cases, statusFilter, search, sortBy, sortDir]);

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
            {/* Welcome greeting */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome back, Dr. {doctorName.split(' ').pop() || doctorName}
              </h1>
              {practiceName && (
                <p className="text-sm text-slate-500 mt-1">{practiceName}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              {/* Active Cases */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-slate-900">
                    {activeCases}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Active Cases</div>
                  <div className="text-xs font-semibold mt-2 text-blue-600">
                    {inProgressCount} in progress
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                  <ClipboardList size={20} />
                </div>
              </div>

              {/* Due This Week */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-slate-900">
                    {dueThisWeek}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Due This Week</div>
                  <div className="text-xs font-semibold mt-2 text-amber-600">
                    {dueThisWeek > 0 ? 'Upcoming deadlines' : 'Nothing due soon'}
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                  <CalendarClock size={20} />
                </div>
              </div>

              {/* Overdue */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 md:p-5 flex items-start justify-between">
                <div>
                  <div className={`text-2xl md:text-3xl font-extrabold tracking-tight leading-none ${
                    overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {overdueCount}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Overdue</div>
                  <div className={`text-xs font-semibold mt-2 ${
                    overdueCount > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {overdueCount > 0 ? 'Need attention' : 'All on track'}
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-red-100 text-red-600">
                  <AlertTriangle size={20} />
                </div>
              </div>

              {/* Total Cases */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 md:p-5 flex items-start justify-between">
                <div>
                  <div className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none text-slate-900">
                    {cases.length}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Total Cases</div>
                  <div className="text-xs font-semibold mt-2 text-slate-500">
                    {cases.filter((c) => c.status === 'shipped').length} completed
                  </div>
                </div>
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
                  <CheckCircle size={20} />
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
                className="flex-1 sm:max-w-md px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
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
                    <tr>
                      {PORTAL_COLUMNS.map((col) => {
                        const isActive = sortBy === col.key;
                        const arrow = isActive ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';
                        return (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide bg-slate-50 border-b border-slate-200 cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-slate-100 hover:text-slate-700 ${
                              isActive ? 'text-brand-600' : 'text-slate-500'
                            } ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                          >
                            {col.label}
                            <span className="text-[0.625rem] ml-0.5">{arrow}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={PORTAL_COLUMNS.length} className="text-center py-16 text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList size={32} className="text-slate-300" />
                            <p className="text-sm font-medium">
                              {cases.length === 0
                                ? 'No cases yet'
                                : 'No cases match your filters'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {cases.length === 0
                                ? 'Your lab will add cases as they come in.'
                                : 'Try adjusting your search or status filter.'}
                            </p>
                          </div>
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
