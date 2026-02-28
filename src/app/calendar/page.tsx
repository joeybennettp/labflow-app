'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Case, Doctor } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import CaseDetailModal from '@/components/CaseDetailModal';
import CaseFormModal, { CaseFormData } from '@/components/CaseFormModal';
import StatusBadge from '@/components/StatusBadge';

const STATUS_COLORS: Record<Case['status'], string> = {
  received: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  quality_check: 'bg-purple-500',
  ready: 'bg-green-500',
  shipped: 'bg-amber-500',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Modal state
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);

  const refreshCases = useCallback(async () => {
    const { data } = await supabase
      .from('cases')
      .select('*, doctors(name)')
      .order('due', { ascending: true });
    setCases((data as Case[]) || []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    async function fetchData() {
      const [, doctorsRes] = await Promise.all([
        refreshCases(),
        supabase.from('doctors').select('*').order('name', { ascending: true }),
      ]);
      if (doctorsRes.data) setDoctors(doctorsRes.data as Doctor[]);
      setLoading(false);
    }
    fetchData();
  }, [authLoading, refreshCases]);

  // Group cases by due date
  const casesByDate = useMemo(() => {
    const map: Record<string, Case[]> = {};
    cases.forEach((c) => {
      if (!map[c.due]) map[c.due] = [];
      map[c.due].push(c);
    });
    return map;
  }, [cases]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: { day: number | null; dateStr: string }[] = [];

    // Padding for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: '' });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr });
    }

    return days;
  }, [currentYear, currentMonth]);

  const todayStr = new Date().toISOString().split('T')[0];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDay(todayStr);
  }

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDayCases = selectedDay ? (casesByDate[selectedDay] || []) : [];

  // Modal handlers
  function handleCaseClick(c: Case) {
    setSelectedCase(c);
    setShowDetail(true);
  }

  function closeAllModals() {
    setShowDetail(false);
    setShowEditCase(false);
    setSelectedCase(null);
  }

  async function handleStatusChange(id: string, newStatus: Case['status'], shippingData?: { shipping_carrier: string; tracking_number: string }) {
    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'shipped' && shippingData) {
      updatePayload.shipping_carrier = shippingData.shipping_carrier;
      updatePayload.tracking_number = shippingData.tracking_number;
      updatePayload.shipped_at = new Date().toISOString();
    }
    await supabase.from('cases').update(updatePayload).eq('id', id);
    await refreshCases();
    setSelectedCase((prev) => (prev && prev.id === id ? { ...prev, status: newStatus } : prev));
  }

  async function handleDeleteCase(id: string) {
    const caseToDelete = cases.find((c) => c.id === id);
    const confirmed = window.confirm(`Delete case ${caseToDelete?.case_number || ''}?`);
    if (!confirmed) return;
    await supabase.from('cases').delete().eq('id', id);
    await refreshCases();
    closeAllModals();
  }

  async function handleUpdateCase(formData: CaseFormData) {
    if (!selectedCase) return;
    await supabase.from('cases').update({
      patient: formData.patient,
      doctor_id: formData.doctor_id,
      type: formData.type,
      shade: formData.shade,
      due: formData.due,
      price: formData.price,
      rush: formData.rush,
      notes: formData.notes || null,
      status: formData.status,
    }).eq('id', selectedCase.id);
    await refreshCases();
    closeAllModals();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">Calendar</h1>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
          >
            Today
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading calendar...
            </div>
          ) : (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <h2 className="text-lg font-bold text-slate-900">{monthLabel}</h2>
                <button
                  onClick={nextMonth}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              </div>

              {/* Calendar grid */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-5">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {DAYS.map((d) => (
                    <div key={d} className="px-1 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((cell, idx) => {
                    if (cell.day === null) {
                      return <div key={`empty-${idx}`} className="min-h-[5rem] md:min-h-[6rem] border-b border-r border-slate-100 bg-slate-50/50" />;
                    }

                    const dayCases = casesByDate[cell.dateStr] || [];
                    const isToday = cell.dateStr === todayStr;
                    const isSelected = cell.dateStr === selectedDay;

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => setSelectedDay(cell.dateStr === selectedDay ? null : cell.dateStr)}
                        className={`min-h-[5rem] md:min-h-[6rem] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? 'bg-brand-600 text-white'
                            : isSelected
                            ? 'text-brand-600'
                            : 'text-slate-700'
                        }`}>
                          {cell.day}
                        </div>
                        {/* Case dots */}
                        <div className="flex flex-wrap gap-0.5">
                          {dayCases.slice(0, 6).map((c) => (
                            <div
                              key={c.id}
                              className={`w-2 h-2 rounded-full ${STATUS_COLORS[c.status]} ${c.rush ? 'ring-1 ring-red-400' : ''}`}
                              title={`${c.case_number} - ${c.patient}`}
                            />
                          ))}
                          {dayCases.length > 6 && (
                            <span className="text-[0.5625rem] font-bold text-slate-400">+{dayCases.length - 6}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-5">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </div>
                ))}
              </div>

              {/* Selected day cases */}
              {selectedDay && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-900">
                      Cases due{' '}
                      {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {selectedDayCases.length > 0 && (
                        <span className="ml-2 text-slate-400 font-normal">({selectedDayCases.length})</span>
                      )}
                    </h3>
                  </div>
                  {selectedDayCases.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      No cases due on this day.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {selectedDayCases.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleCaseClick(c)}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                            c.rush ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-semibold text-brand-600 text-sm">
                              {c.case_number}
                            </span>
                            {c.rush && (
                              <span className="text-[0.625rem] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                RUSH
                              </span>
                            )}
                            <span className="text-sm font-medium text-slate-800">{c.patient}</span>
                            <span className="text-sm text-slate-500 hidden sm:inline">{c.type}</span>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Case detail modal */}
      {showDetail && selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          isAdmin={isAdmin}
          onClose={closeAllModals}
          onEdit={() => { setShowDetail(false); setShowEditCase(true); }}
          onDelete={handleDeleteCase}
          onStatusChange={handleStatusChange}
        />
      )}

      {showEditCase && selectedCase && (
        <CaseFormModal
          mode="edit"
          caseData={selectedCase}
          doctors={doctors}
          isAdmin={isAdmin}
          onSave={handleUpdateCase}
          onClose={closeAllModals}
        />
      )}
    </div>
  );
}
