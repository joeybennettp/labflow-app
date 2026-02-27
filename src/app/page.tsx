'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Case = {
  id: string;
  case_number: string;
  patient: string;
  type: string;
  status: string;
  rush: boolean;
  due: string;
  price: number;
  doctors: { name: string } | null;
};

export default function Home() {
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
        setCases(data || []);
      }
      setLoading(false);
    }
    fetchCases();
  }, []);

  const statusColors: Record<string, string> = {
    received: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    quality_check: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    shipped: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    received: 'Received',
    in_progress: 'In Progress',
    quality_check: 'Quality Check',
    ready: 'Ready',
    shipped: 'Shipped',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🦷 LabFlow</h1>
        <p className="text-gray-500 mb-8">Production database connection test</p>

        {loading && <p className="text-gray-500">Loading cases from Supabase...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            <strong>Connection error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-green-600 font-medium mb-4">
              ✅ Connected to Supabase — {cases.length} cases loaded
            </p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Case #</th>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Doctor</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Due</th>
                    <th className="px-4 py-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cases.map((c) => (
                    <tr key={c.id} className={c.rush ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3 font-mono font-medium">
                        {c.case_number}
                        {c.rush && <span className="ml-2 text-red-500 text-xs font-bold">RUSH</span>}
                      </td>
                      <td className="px-4 py-3">{c.patient}</td>
                      <td className="px-4 py-3">{c.doctors?.name || '—'}</td>
                      <td className="px-4 py-3">{c.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || ''}`}>
                          {statusLabels[c.status] || c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.due}</td>
                      <td className="px-4 py-3 text-right">${c.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
