'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState(false);

  // Listen for the PASSWORD_RECOVERY event from the magic link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
      }
    );

    // Also check if there's already a session (user clicked link and page loaded)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    // If no session after 3 seconds, the link is invalid/expired
    const timeout = setTimeout(() => {
      setReady((current) => {
        if (!current) {
          setError('This reset link has expired or is invalid. Please request a new one.');
        }
        return current;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Sign out so they can log in fresh with new password
    await supabase.auth.signOut();

    // Redirect to login after a moment
    setTimeout(() => router.push('/login'), 2000);
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
            Set a new password
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-2">
                Password updated
              </h2>
              <p className="text-sm text-slate-500">
                Redirecting you to sign in...
              </p>
            </div>
          ) : !ready && !error ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Verifying reset link...
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {ready && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}
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
