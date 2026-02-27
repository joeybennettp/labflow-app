'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Doctor, Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

type DoctorWithStats = Doctor & {
  activeCases: number;
  totalCases: number;
  totalRevenue: number;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorWithStats[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-7 h-16 flex items-center shrink-0">
          <h1 className="text-[1.0625rem] font-bold text-slate-900">
            Doctors
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-7">
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
                    className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow"
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
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {doc.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {doc.practice}
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
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
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          ${doc.totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-[0.6875rem] text-slate-500">
                          Revenue
                        </div>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      {doc.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>📧</span>
                          <span className="truncate">{doc.email}</span>
                        </div>
                      )}
                      {doc.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>📞</span>
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
    </div>
  );
}
