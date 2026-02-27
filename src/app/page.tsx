'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Case } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatsGrid from '@/components/StatsGrid';
import CasesTable from '@/components/CasesTable';

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      const { data, error } = await supabase
        .from('cases')
        .select('*, doctors(name)')
        .order('due', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setCases((data as Case[]) || []);
      }
      setLoading(false);
    }
    fetchCases();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <Topbar />
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
              <CasesTable cases={cases} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
