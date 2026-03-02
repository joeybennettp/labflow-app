'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Case, Doctor, SortColumn, SortDirection } from '@/lib/types';
import StatusBadge from './StatusBadge';

type Props = {
  cases: Case[];
  doctors?: Doctor[];
  isAdmin?: boolean;
  onRowClick?: (c: Case) => void;
  typeFilter?: string;
  onClearTypeFilter?: () => void;
};

const FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'received', label: 'Received' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'quality_check', label: 'QC Check' },
  { key: 'ready', label: 'Ready' },
  { key: 'shipped', label: 'Shipped' },
];

const STATUS_ORDER: Record<string, number> = {
  received: 1,
  in_progress: 2,
  quality_check: 3,
  ready: 4,
  shipped: 5,
};

const COLUMNS: { key: SortColumn; label: string; hideOnMobile?: boolean }[] = [
  { key: 'case_number', label: 'Case #' },
  { key: 'patient', label: 'Patient' },
  { key: 'doctor', label: 'Doctor', hideOnMobile: true },
  { key: 'type', label: 'Restoration', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'due', label: 'Due Date' },
  { key: 'price', label: 'Price', hideOnMobile: true },
];

function isOverdue(due: string, status: string): boolean {
  if (status === 'shipped') return false;
  return due < new Date().toISOString().split('T')[0];
}

function isDueSoon(due: string, status: string): boolean {
  if (status === 'shipped') return false;
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return due >= today && due <= tomorrow;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CasesTable({ cases, doctors, isAdmin, onRowClick, typeFilter, onClearTypeFilter }: Props) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortColumn>('due');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when a type filter is applied from the chart
  useEffect(() => {
    if (typeFilter && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [typeFilter]);

  function handleSort(column: SortColumn) {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  const hasActiveFilters =
    search !== '' ||
    filter !== 'all' ||
    doctorFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    !!typeFilter;

  function clearFilters() {
    setSearch('');
    setFilter('all');
    setDoctorFilter('all');
    setDateFrom('');
    setDateTo('');
    onClearTypeFilter?.();
  }

  const visibleColumns = useMemo(
    () => COLUMNS.filter((col) => col.key !== 'price' || isAdmin),
    [isAdmin]
  );

  const filtered = useMemo(() => {
    let result = [...cases];

    // Status filter
    if (filter === 'overdue') {
      result = result.filter((c) => isOverdue(c.due, c.status));
    } else if (filter !== 'all') {
      result = result.filter((c) => c.status === filter);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.case_number.toLowerCase().includes(q) ||
          c.patient.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          (c.doctors?.name || '').toLowerCase().includes(q)
      );
    }

    // Restoration type filter (from chart click)
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      result = result.filter((c) => c.doctor_id === doctorFilter);
    }

    // Date range filter (by due date)
    if (dateFrom) {
      result = result.filter((c) => c.due >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((c) => c.due <= dateTo);
    }

    // Sort — rush cases always float to top
    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (a.rush && !b.rush) return -1;
      if (!a.rush && b.rush) return 1;

      let va: string | number;
      let vb: string | number;

      switch (sortBy) {
        case 'case_number':
          va = parseInt(a.case_number.replace('C-', ''));
          vb = parseInt(b.case_number.replace('C-', ''));
          return (va - vb) * dir;
        case 'patient':
          return a.patient.localeCompare(b.patient) * dir;
        case 'doctor':
          va = a.doctors?.name || '';
          vb = b.doctors?.name || '';
          return (va as string).localeCompare(vb as string) * dir;
        case 'type':
          return a.type.localeCompare(b.type) * dir;
        case 'status':
          va = STATUS_ORDER[a.status] || 0;
          vb = STATUS_ORDER[b.status] || 0;
          return ((va as number) - (vb as number)) * dir;
        case 'due':
          return (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) * dir;
        case 'price':
          return (Number(a.price) - Number(b.price)) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [cases, filter, search, doctorFilter, dateFrom, dateTo, sortBy, sortDir, typeFilter]);

  return (
    <div ref={tableRef} className="card-base overflow-hidden">
      {/* Header with filters and search */}
      <div className="p-3 md:p-4 border-b border-slate-200 space-y-3">
        {/* Active type filter chip */}
        {typeFilter && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Showing:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200">
              {typeFilter}
              <button
                onClick={onClearTypeFilter}
                className="hover:bg-brand-100 rounded p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
        {/* Row 1: Title, search, status tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 md:gap-4">
          <span className="text-[0.9375rem] font-bold text-slate-900">
            Case Tracker
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm w-full md:w-48 focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[0.75rem] md:text-[0.8125rem] font-medium border transition-colors ${
                  filter === f.key
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Doctor, date range, clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {doctors && doctors.length > 0 && (
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            >
              <option value="all">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {visibleColumns.map((col) => {
                const isActive = sortBy === col.key;
                const arrow = isActive
                  ? sortDir === 'asc'
                    ? ' ▲'
                    : ' ▼'
                  : '';
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 md:px-4 py-3 text-left text-xs font-bold uppercase tracking-wide bg-slate-50/70 border-b border-slate-200/70 cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-slate-100 hover:text-slate-700 ${
                      isActive ? 'text-blue-600' : 'text-slate-500'
                    } ${col.key === 'price' ? 'text-right' : ''} ${
                      col.hideOnMobile ? 'hidden md:table-cell' : ''
                    }`}
                  >
                    {col.label}
                    <span className="text-[0.625rem] ml-0.5">{arrow}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-12 text-center text-slate-400 text-sm"
                >
                  No cases match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const overdue = isOverdue(c.due, c.status);
                const dueSoon = !overdue && isDueSoon(c.due, c.status);
                return (
                  <tr
                    key={c.id}
                    onClick={() => onRowClick?.(c)}
                    className={`hover:bg-brand-50/40 transition-colors cursor-pointer ${
                      overdue
                        ? 'bg-red-50 hover:bg-red-100'
                        : c.rush
                          ? 'bg-red-50 hover:bg-red-100'
                          : ''
                    }`}
                  >
                    <td className="px-3 md:px-4 py-3 md:py-3.5 text-sm border-b border-slate-100">
                      <span className="font-mono font-semibold text-brand-600">
                        {c.case_number}
                      </span>
                      {c.rush && (
                        <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[0.625rem] font-bold rounded uppercase">
                          Rush
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-3.5 text-sm text-slate-700 border-b border-slate-100 font-medium">
                      {c.patient}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                      {c.doctors?.name || '—'}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100">
                      {c.type}
                      {c.shade && c.shade !== '-' && (
                        <span className="text-slate-400 ml-1 text-xs">
                          ({c.shade})
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-3.5 border-b border-slate-100">
                      <StatusBadge status={c.status} />
                    </td>
                    <td
                      className={`px-3 md:px-4 py-3 md:py-3.5 text-sm border-b border-slate-100 ${
                        overdue
                          ? 'text-red-600 font-semibold'
                          : dueSoon
                            ? 'text-amber-600 font-semibold'
                            : 'text-slate-700'
                      }`}
                    >
                      {overdue && <AlertTriangle size={14} className="inline -mt-0.5 mr-1" />}
                      {dueSoon && <Clock size={14} className="inline -mt-0.5 mr-1" />}
                      {formatDate(c.due)}
                    </td>
                    {isAdmin && (
                      <td className="hidden md:table-cell px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100 text-right font-semibold">
                        ${Number(c.price).toFixed(2)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
