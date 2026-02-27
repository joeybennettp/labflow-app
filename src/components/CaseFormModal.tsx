'use client';

import { useState } from 'react';
import { Case, Doctor } from '@/lib/types';
import Modal from './Modal';

type Props = {
  mode: 'create' | 'edit';
  caseData?: Case;
  doctors: Doctor[];
  isAdmin?: boolean;
  onSave: (data: CaseFormData) => Promise<void>;
  onClose: () => void;
};

export type CaseFormData = {
  patient: string;
  doctor_id: string;
  type: string;
  shade: string;
  due: string;
  price: number;
  rush: boolean;
  notes: string;
  status?: Case['status'];
};

const RESTORATION_GROUPS: Record<string, string[]> = {
  'Crowns': [
    'PFM Crown', 'Zirconia Crown', 'E.max Crown',
    'Full-Cast Gold Crown', 'Porcelain Crown', 'Provisional/Temporary Crown',
  ],
  'Bridges': [
    'PFM Bridge', 'Zirconia Bridge', 'E.max Bridge',
    'Maryland Bridge', 'Provisional/Temporary Bridge',
  ],
  'Implants': [
    'Implant Crown', 'Custom Abutment', 'Screw-Retained Crown',
    'Implant Bridge', 'All-on-4 Final', 'All-on-6 Final',
    'Implant Overdenture', 'Hybrid Denture',
  ],
  'Veneers & Inlays/Onlays': [
    'E.max Veneer', 'E.max Veneer Set', 'Zirconia Veneer',
    'Porcelain Inlay', 'Porcelain Onlay', 'Gold Inlay', 'Gold Onlay',
  ],
  'Removables': [
    'Full Denture', 'Partial Denture', 'Immediate Denture',
    'Flipper', 'Overdenture',
  ],
  'Appliances': [
    'Night Guard', 'Occlusal Splint', 'Surgical Guide',
    'Bleaching Tray', 'Orthodontic Retainer', 'Sports Mouthguard',
    'Sleep Apnea Appliance',
  ],
  'Other': [
    'Wax Try-In', 'Diagnostic Wax-Up', 'Post and Core', 'Other',
  ],
};

const STATUS_OPTIONS: { value: Case['status']; label: string }[] = [
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'quality_check', label: 'QC Check' },
  { value: 'ready', label: 'Ready' },
  { value: 'shipped', label: 'Shipped' },
];

export default function CaseFormModal({ mode, caseData, doctors, isAdmin, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patient, setPatient] = useState(caseData?.patient || '');
  const [doctorId, setDoctorId] = useState(caseData?.doctor_id || doctors[0]?.id || '');
  const [type, setType] = useState(caseData?.type || 'Zirconia Crown');
  const [shade, setShade] = useState(caseData?.shade || 'A2');
  const [due, setDue] = useState(caseData?.due || '');
  const [price, setPrice] = useState(caseData?.price?.toString() || '');
  const [rush, setRush] = useState(caseData?.rush || false);
  const [notes, setNotes] = useState(caseData?.notes || '');
  const [status, setStatus] = useState<Case['status']>(caseData?.status || 'received');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const formData: CaseFormData = {
        patient: patient.trim(),
        doctor_id: doctorId,
        type,
        shade: shade.trim() || 'A2',
        due,
        price: parseFloat(price) || 0,
        rush,
        notes: notes.trim(),
      };
      if (mode === 'edit') {
        formData.status = status;
      }
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="case-form"
        disabled={saving}
        className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : mode === 'create' ? 'Create Case' : 'Save Changes'}
      </button>
    </>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode === 'create' ? 'New Case' : `Edit Case ${caseData?.case_number || ''}`}
      footer={footer}
      wide
    >
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form id="case-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Patient + Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 bg-white"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.practice}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Restoration + Shade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Restoration Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 bg-white"
            >
              {Object.entries(RESTORATION_GROUPS).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Shade
            </label>
            <input
              type="text"
              value={shade}
              onChange={(e) => setShade(e.target.value)}
              placeholder="e.g. A2, BL2, -"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Row 3: Due Date + Price */}
        <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2' : ''} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
              />
            </div>
          )}
        </div>

        {/* Row 4: Status (edit only) + Rush */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Case['status'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={`flex items-end ${mode === 'create' ? 'sm:col-span-2' : ''}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rush}
                onChange={(e) => setRush(e.target.checked)}
                className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-600"
              />
              <span className="text-sm font-medium text-slate-700">
                ⚡ Mark as Rush
              </span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional case details, instructions, etc."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 resize-vertical"
          />
        </div>
      </form>
    </Modal>
  );
}
