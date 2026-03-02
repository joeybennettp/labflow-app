'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, X, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Material, CaseMaterial } from '@/lib/types';

type Props = {
  caseId: string;
};

export default function CaseMaterials({ caseId }: Props) {
  const [caseMaterials, setCaseMaterials] = useState<CaseMaterial[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [qtyUsed, setQtyUsed] = useState('1');

  const fetchCaseMaterials = useCallback(async () => {
    const { data } = await supabase
      .from('case_materials')
      .select('*, materials(name, unit)')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });
    setCaseMaterials((data as CaseMaterial[]) || []);
  }, [caseId]);

  useEffect(() => {
    async function init() {
      const [, materialsRes] = await Promise.all([
        fetchCaseMaterials(),
        supabase.from('materials').select('*').order('name', { ascending: true }),
      ]);
      if (materialsRes.data) setAllMaterials(materialsRes.data as Material[]);
      setLoading(false);
    }
    init();
  }, [fetchCaseMaterials]);

  async function handleAdd() {
    if (!selectedMaterialId) return;
    const qty = parseFloat(qtyUsed) || 1;

    await supabase.rpc('add_case_material', {
      p_case_id: caseId,
      p_material_id: selectedMaterialId,
      p_quantity_used: qty,
    });

    setSelectedMaterialId('');
    setQtyUsed('1');
    setShowAdd(false);
    await fetchCaseMaterials();
  }

  async function handleRemove(id: string) {
    await supabase.rpc('remove_case_material', {
      p_case_material_id: id,
    });

    await fetchCaseMaterials();
  }

  if (loading) {
    return (
      <div className="mt-5">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Materials
        </div>
        <p className="text-sm text-slate-400">Loading materials...</p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Package size={12} />
        Materials Used
      </div>

      {/* Linked materials */}
      {caseMaterials.length === 0 ? (
        <p className="text-sm text-slate-400 mb-2">No materials linked to this case.</p>
      ) : (
        <div className="space-y-1.5 mb-2">
          {caseMaterials.map((cm) => (
            <div
              key={cm.id}
              className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100/70 text-sm"
            >
              <div>
                <span className="font-medium text-slate-800">
                  {cm.materials?.name || 'Unknown'}
                </span>
                <span className="text-slate-400 ml-2">
                  {Number(cm.quantity_used)} {cm.materials?.unit || 'pcs'}
                </span>
              </div>
              <button
                onClick={() => handleRemove(cm.id)}
                className="w-7 h-7 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add material form */}
      {showAdd ? (
        <div className="flex items-end gap-2 bg-slate-50 rounded-lg border border-slate-200/70 p-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Material</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            >
              <option value="">Select material...</option>
              {allMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({Number(m.quantity)} {m.unit} in stock)
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
            <input
              type="number"
              value={qtyUsed}
              onChange={(e) => setQtyUsed(e.target.value)}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedMaterialId}
            className="px-3 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            Add
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <PlusCircle size={14} /> Add Material
        </button>
      )}
    </div>
  );
}
