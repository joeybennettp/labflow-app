'use client';

import { useState } from 'react';
import { Material } from '@/lib/types';
import Modal from './Modal';

type Props = {
  material?: Material | null;
  onSave: (data: Partial<Material>) => void;
  onClose: () => void;
};

const CATEGORIES = ['Zirconia', 'PFM', 'Acrylic', 'E.max', 'Metal', 'Composite', 'Wax', 'Other'];
const UNITS = ['pcs', 'ml', 'g', 'kg', 'oz', 'discs', 'blocks', 'sheets'];

export default function MaterialFormModal({ material, onSave, onClose }: Props) {
  const [name, setName] = useState(material?.name || '');
  const [sku, setSku] = useState(material?.sku || '');
  const [category, setCategory] = useState(material?.category || '');
  const [quantity, setQuantity] = useState(material?.quantity?.toString() || '0');
  const [unit, setUnit] = useState(material?.unit || 'pcs');
  const [reorderLevel, setReorderLevel] = useState(material?.reorder_level?.toString() || '0');
  const [unitCost, setUnitCost] = useState(material?.unit_cost?.toString() || '0');
  const [supplier, setSupplier] = useState(material?.supplier || '');
  const [notes, setNotes] = useState(material?.notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      sku,
      category,
      quantity: parseFloat(quantity) || 0,
      unit,
      reorder_level: parseFloat(reorderLevel) || 0,
      unit_cost: parseFloat(unitCost) || 0,
      supplier,
      notes,
    });
    setSaving(false);
  }

  const isEdit = !!material;

  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving || !name.trim()}
        className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40"
      >
        {saving ? 'Saving...' : isEdit ? 'Update Material' : 'Add Material'}
      </button>
    </>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isEdit ? 'Edit Material' : 'Add Material'}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zirconia Disc 98mm"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. ZD-98-001"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Category + Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            >
              <option value="">Select...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity + Reorder Level + Unit Cost */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reorder Level</label>
            <input
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Cost ($)</label>
            <input
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Ivoclar Vivadent"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes about this material..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
