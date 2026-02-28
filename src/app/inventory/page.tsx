'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Package, AlertTriangle, DollarSign, PlusCircle, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Material } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import MaterialFormModal from '@/components/MaterialFormModal';

export default function InventoryPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  const refreshMaterials = useCallback(async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('name', { ascending: true });
    setMaterials((data as Material[]) || []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    async function fetchData() {
      await refreshMaterials();
      setLoading(false);
    }
    fetchData();
  }, [authLoading, refreshMaterials]);

  const filtered = useMemo(() => {
    if (!search.trim()) return materials;
    const q = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q)
    );
  }, [materials, search]);

  const totalItems = materials.length;
  const lowStock = materials.filter((m) => Number(m.quantity) <= Number(m.reorder_level) && Number(m.reorder_level) > 0).length;
  const totalValue = materials.reduce((sum, m) => sum + Number(m.quantity) * Number(m.unit_cost), 0);

  async function handleDelete(id: string) {
    const mat = materials.find((m) => m.id === id);
    const confirmed = window.confirm(`Delete "${mat?.name}"? This cannot be undone.`);
    if (!confirmed) return;
    await supabase.from('materials').delete().eq('id', id);
    await refreshMaterials();
  }

  async function handleSave(data: Partial<Material>) {
    if (editMaterial) {
      await supabase.from('materials').update(data).eq('id', editMaterial.id);
    } else {
      await supabase.from('materials').insert(data);
    }
    await refreshMaterials();
    setShowForm(false);
    setEditMaterial(null);
  }

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
            <h1 className="text-[1.0625rem] font-bold text-slate-900">Inventory</h1>
          </div>
          <button
            onClick={() => { setEditMaterial(null); setShowForm(true); }}
            className="px-3 md:px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1.5"
          >
            <PlusCircle size={15} /> Add Material
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading inventory...
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{totalItems}</div>
                    <div className="text-sm text-slate-500 mt-1">Total Items</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
                    <Package size={20} />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                  <div>
                    <div className={`text-2xl font-extrabold ${lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {lowStock}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Low Stock</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:p-5 flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">
                      ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">Total Value</div>
                  </div>
                  <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative sm:max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                  />
                </div>
              </div>

              {/* Materials table */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                          SKU
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                          Category
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                          Unit Cost
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                          Supplier
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <Package size={32} className="text-slate-300" />
                              <p className="text-sm font-medium">
                                {materials.length === 0
                                  ? 'No materials yet'
                                  : 'No materials match your search'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {materials.length === 0
                                  ? 'Add your first material to get started.'
                                  : 'Try a different search term.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((m) => {
                          const isLow = Number(m.quantity) <= Number(m.reorder_level) && Number(m.reorder_level) > 0;
                          return (
                            <tr
                              key={m.id}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                isLow ? 'bg-amber-50/50' : ''
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium text-slate-800">{m.name}</div>
                                {isLow && (
                                  <span className="text-[0.625rem] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                    LOW STOCK
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">
                                {m.sku || '—'}
                              </td>
                              <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                                {m.category || '—'}
                              </td>
                              <td className={`px-4 py-3 text-right font-semibold ${
                                isLow ? 'text-amber-600' : 'text-slate-800'
                              }`}>
                                {Number(m.quantity)} {m.unit}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">
                                ${Number(m.unit_cost).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                                {m.supplier || '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => { setEditMaterial(m); setShowForm(true); }}
                                    className="w-8 h-8 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 flex items-center justify-center transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(m.id)}
                                    className="w-8 h-8 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
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
      </div>

      {/* Material form modal */}
      {showForm && (
        <MaterialFormModal
          material={editMaterial}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditMaterial(null); }}
        />
      )}
    </div>
  );
}
