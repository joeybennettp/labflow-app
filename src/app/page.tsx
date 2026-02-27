'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Case, Doctor } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatsGrid from '@/components/StatsGrid';
import CasesTable from '@/components/CasesTable';
import CaseDetailModal from '@/components/CaseDetailModal';
import CaseFormModal, { CaseFormData } from '@/components/CaseFormModal';

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewCase, setShowNewCase] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);

  // Fetch cases from Supabase
  const refreshCases = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*, doctors(name)')
      .order('due', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setCases((data as Case[]) || []);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    async function fetchAll() {
      const [casesRes, doctorsRes] = await Promise.all([
        supabase
          .from('cases')
          .select('*, doctors(name)')
          .order('due', { ascending: true }),
        supabase
          .from('doctors')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (casesRes.error) {
        setError(casesRes.error.message);
      } else {
        setCases((casesRes.data as Case[]) || []);
      }

      if (doctorsRes.error) {
        console.error('Failed to load doctors:', doctorsRes.error.message);
      } else {
        setDoctors((doctorsRes.data as Doctor[]) || []);
      }

      setLoading(false);
    }
    fetchAll();
  }, []);

  // ---- Modal handlers ----

  function handleRowClick(c: Case) {
    setSelectedCase(c);
    setShowDetail(true);
  }

  function handleNewCase() {
    setShowNewCase(true);
  }

  function handleEditFromDetail() {
    setShowDetail(false);
    setShowEditCase(true);
  }

  function closeAllModals() {
    setShowDetail(false);
    setShowNewCase(false);
    setShowEditCase(false);
    setSelectedCase(null);
  }

  // ---- Database mutations ----

  async function handleCreateCase(formData: CaseFormData) {
    const { error } = await supabase.from('cases').insert({
      patient: formData.patient,
      doctor_id: formData.doctor_id,
      type: formData.type,
      shade: formData.shade,
      due: formData.due,
      price: formData.price,
      rush: formData.rush,
      notes: formData.notes || null,
      case_number: '', // triggers auto-generation via DB trigger
    });

    if (error) throw new Error(error.message);

    await refreshCases();
    closeAllModals();
  }

  async function handleUpdateCase(formData: CaseFormData) {
    if (!selectedCase) return;

    const { error } = await supabase
      .from('cases')
      .update({
        patient: formData.patient,
        doctor_id: formData.doctor_id,
        type: formData.type,
        shade: formData.shade,
        due: formData.due,
        price: formData.price,
        rush: formData.rush,
        notes: formData.notes || null,
        status: formData.status,
      })
      .eq('id', selectedCase.id);

    if (error) throw new Error(error.message);

    await refreshCases();
    closeAllModals();
  }

  async function handleStatusChange(id: string, newStatus: Case['status']) {
    const { error } = await supabase
      .from('cases')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Status update failed:', error.message);
      return;
    }

    await refreshCases();

    // Update the detail modal to reflect the change
    setSelectedCase((prev) =>
      prev && prev.id === id ? { ...prev, status: newStatus } : prev
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <Topbar onNewCase={handleNewCase} />
        <main className="flex-1 overflow-y-auto p-7">
          {loading && (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading cases...
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <strong>Connection error:</strong> {error}
            </div>
          )}
          {!loading && !error && (
            <>
              <StatsGrid cases={cases} />
              <CasesTable cases={cases} onRowClick={handleRowClick} />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {showDetail && selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={closeAllModals}
          onEdit={handleEditFromDetail}
          onStatusChange={handleStatusChange}
        />
      )}

      {showNewCase && (
        <CaseFormModal
          mode="create"
          doctors={doctors}
          onSave={handleCreateCase}
          onClose={closeAllModals}
        />
      )}

      {showEditCase && selectedCase && (
        <CaseFormModal
          mode="edit"
          caseData={selectedCase}
          doctors={doctors}
          onSave={handleUpdateCase}
          onClose={closeAllModals}
        />
      )}
    </div>
  );
}
