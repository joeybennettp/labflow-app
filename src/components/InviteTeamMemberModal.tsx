'use client';

import { useState } from 'react';
import Modal from './Modal';

type Props = {
  onSave: (data: { email: string; role: 'admin' | 'tech' }) => Promise<void>;
  onClose: () => void;
};

export default function InviteTeamMemberModal({ onSave, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'tech'>('tech');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await onSave({ email: email.trim().toLowerCase(), role });
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
        form="invite-form"
        disabled={saving}
        className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Sending...' : 'Send Invite'}
      </button>
    </>
  );

  return (
    <Modal open={true} onClose={onClose} title="Invite Team Member" footer={footer}>
      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newmember@yourlab.com"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">
            They&apos;ll use this email to create their account
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'tech')}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100 bg-white"
          >
            <option value="tech">Technician</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'admin'
              ? 'Admins can see financial data, manage team, and configure settings'
              : 'Technicians can manage cases but cannot see financial data'}
          </p>
        </div>
      </form>
    </Modal>
  );
}
