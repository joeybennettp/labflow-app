'use client';

import { Menu, Pencil, Trash2, Mail, Phone } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Doctor, Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import DoctorFormModal, { DoctorFormData } from '@/components/DoctorFormModal';

type DoctorWithStats = Doctor & {
  activeCases: number;
  totalCases: number;
  totalRevenue: number;
};

export default function DoctorsPage() {
  const { isAdmin } = useAuth();
  const [doctors, setDoctors] = useState<DoctorWithStats[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Sidebar state (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state
  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [showEditDoctor, setShowEditDoctor] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithStats | null>(null);

  const fetchData = useCallback(async () => {
    const [doctorsRes, casesRes] = await Promise.all([
      supabase.from('doctors').select('*').order('name'),
      supabase.from('cases').select('*, doctors(name)').order('due'),
    ]);

    const doctorsList = (doctorsRes.data as Doctor[]) || [];
    const casesList = (casesRes.data as Case[]) || [];
    setCases(casesList);

    // Compute stats per doctor
    const enriched = doctorsList.map((doc) => {
      const docCases = casesList.filter((c) => c.doctor_id === doc.id);
      return {
        ...doc,
        activeCases: docCases.filter((c) => c.status !== 'shipped').length,
        totalCases: docCases.length,
        totalRevenue: docCases.reduce((sum, c) => sum + Number(c.price), 0),
      };
    });

    setDoctors(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  // --- Mutations ---

  async function handleCreateDoctor(formData: DoctorFormData) {
    const { error } = await supabase.from('doctors').insert({
      name: formData.name,
      practice: formData.practice,
      email: formData.email || null,
      phone: formData.phone || null,
    });
    if (error) throw new Error(error.message);
    await fetchData();
    setShowNewDoctor(false);
  }

  async function handleUpdateDoctor(formData: DoctorFormData) {
    if (!selectedDoctor) return;
    const { error } = await supabase
      .from('doctors')
      .update({
        name: formData.name,
        practice: formData.practice,
        email: formData.email || null,
        phone: formData.phone || null,
      })
      .eq('id', selectedDoctor.id);
    if (error) throw new Error(error.message);
    await fetchData();
    setShowEditDoctor(false);
    setSelectedDoctor(null);
  }

  async function handleDeleteDoctor(doc: DoctorWithStats) {
    if (doc.totalCases > 0) {
      alert(
        `Cannot delete ${doc.name} — they have ${doc.totalCases} case${doc.totalCases === 1 ? '' : 's'} linked. Remove or reassign their cases first.`
      );
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete ${doc.name}? This cannot be undone.`
    );
    if (!confirmed) return;

    const { error } = await supabase.from('doctors').delete().eq('id', doc.id);
    if (error) {
      alert('Failed to delete doctor: ' + error.message);
      return;
    }
    await fetchData();
  }

  function openEdit(doc: DoctorWithStats) {
    setSelectedDoctor(doc);
    setShowEditDoctor(true);
  }

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
              Doctors
            </h1>
          </div>
          <button
            onClick={() => setShowNewDoctor(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1.5"
          >
            + Add Doctor
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading doctors...
            </div>
          ) : (
            <>
              {/* Summary stat */}
              <div className="mb-6 text-sm text-slate-500">
                {doctors.length} referring doctors · {cases.length} total cases
              </div>

              {/* Doctor cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="card-interactive hover:card-interactive-hover p-5"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-11 h-11 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {doc.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {doc.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 truncate">
                            {doc.practice}
                          </span>
                          {doc.auth_user_id ? (
                            <span className="px-2 py-0.5 text-[0.625rem] font-bold bg-green-100 text-green-700 rounded-full shrink-0">
                              Portal Active
                            </span>
                          ) : doc.email ? (
                            <span className="px-2 py-0.5 text-[0.625rem] font-bold bg-slate-100 text-slate-500 rounded-full shrink-0">
                              Not Registered
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[0.625rem] font-bold bg-amber-100 text-amber-600 rounded-full shrink-0">
                              No Email
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Edit / Delete buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(doc)}
                          title="Edit doctor"
                          className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center text-sm transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc)}
                          title="Delete doctor"
                          className="w-8 h-8 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-sm transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-3 mb-4`}>
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {doc.activeCases}
                        </div>
                        <div className="text-[0.6875rem] text-slate-500">
                          Active
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          {doc.totalCases}
                        </div>
                        <div className="text-[0.6875rem] text-slate-500">
                          Total
                        </div>
                      </div>
                      {isAdmin && (
                        <div>
                          <div className="text-lg font-extrabold text-slate-900">
                            ${doc.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-[0.6875rem] text-slate-500">
                            Revenue
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      {doc.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{doc.email}</span>
                        </div>
                      )}
                      {doc.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>{doc.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* New Doctor Modal */}
      {showNewDoctor && (
        <DoctorFormModal
          mode="create"
          onSave={handleCreateDoctor}
          onClose={() => setShowNewDoctor(false)}
        />
      )}

      {/* Edit Doctor Modal */}
      {showEditDoctor && selectedDoctor && (
        <DoctorFormModal
          mode="edit"
          doctorData={selectedDoctor}
          onSave={handleUpdateDoctor}
          onClose={() => {
            setShowEditDoctor(false);
            setSelectedDoctor(null);
          }}
        />
      )}
    </div>
  );
}
