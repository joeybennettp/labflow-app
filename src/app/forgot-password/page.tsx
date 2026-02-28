'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
              LF
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              LabFlow
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Reset your password
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                We sent a password reset link to{' '}
                <strong className="text-slate-700">{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="text-xs text-slate-400">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-brand-600 hover:text-brand-700 font-semibold"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <p className="text-sm text-slate-500 mb-4">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourlab.com"
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6">
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
