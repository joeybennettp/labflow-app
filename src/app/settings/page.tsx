'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';

type LabSettings = {
  id: string;
  lab_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<LabSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [labName, setLabName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('lab_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        setSettings(data as LabSettings);
        setLabName(data.lab_name || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setZip(data.zip || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('lab_settings')
      .update({
        lab_name: labName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
        email: email.trim(),
      })
      .eq('id', settings.id);

    setSaving(false);

    if (error) {
      alert('Failed to save settings: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-lg hover:bg-slate-50 transition-colors"
            >
              ☰
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Settings
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading settings...
            </div>
          ) : (
            <div className="max-w-2xl">
              {/* Lab Information Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Lab Information
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  This info will appear on invoices and reports.
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                  {/* Lab Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Lab Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      placeholder="e.g. Pacific Dental Lab"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                    />
                  </div>

                  {/* City, State, Zip */}
                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Los Angeles"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="CA"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="90001"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      />
                    </div>
                  </div>

                  {/* Phone + Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@yourlab.com"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      />
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {saved && (
                      <span className="text-sm text-green-600 font-medium">
                        ✓ Saved successfully
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Account Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6">
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  Account
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Manage your account settings and team access.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Plan</div>
                      <div className="text-xs text-slate-500">Pro Plan · Active</div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 rounded-full">
                      Pro
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Team Members</div>
                      <div className="text-xs text-slate-500">Add users in the Supabase dashboard</div>
                    </div>
                    <span className="text-xs text-slate-400">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
