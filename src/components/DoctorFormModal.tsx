'use client';

import { useState } from 'react';
import { Doctor } from '@/lib/types';
import Modal from './Modal';

type Props = {
  mode: 'create' | 'edit';
  doctorData?: Doctor;
  onSave: (data: DoctorFormData) => Promise<void>;
  onClose: () => void;
};

export type DoctorFormData = {
  name: string;
  practice: string;
  email: string;
  phone: string;
};

export default function DoctorFormModal({ mode, doctorData, onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(doctorData?.name || '');
  const [practice, setPractice] = useState(doctorData?.practice || '');
  const [email, setEmail] = useState(doctorData?.email || '');
  const [phone, setPhone] = useState(doctorData?.phone || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        practice: practice.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
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
        form="doctor-form"
        disabled={saving}
        className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : mode === 'create' ? 'Add Doctor' : 'Save Changes'}
      </button>
    </>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode === 'create' ? 'New Doctor' : `Edit ${doctorData?.name || 'Doctor'}`}
      footer={footer}
    >
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form id="doctor-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name + Practice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Doctor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Sarah Chen"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Practice <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={practice}
              onChange={(e) => setPractice(e.target.value)}
              placeholder="e.g. Bright Smile Dental"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Row 2: Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@practice.com"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-colors duration-200"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
