'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TeamSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // Step 1: Check if a pending invite exists for this email
    const { data: hasInvite, error: checkError } = await supabase.rpc(
      'check_team_invite',
      { check_email: email }
    );

    if (checkError) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    if (!hasInvite) {
      setError(
        'No pending invite found for this email. Ask your lab administrator to send you an invite.'
      );
      setLoading(false);
      return;
    }

    // Step 2: Create auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!signUpData.user) {
      setError('Failed to create account. Please try again.');
      setLoading(false);
      return;
    }

    // Step 3: Claim the invite (creates user_profiles with invited role)
    const { data: assignedRole, error: claimError } = await supabase.rpc(
      'claim_team_invite',
      { p_user_id: signUpData.user.id, p_email: email }
    );

    if (claimError) {
      setError(
        'Account created but failed to set up your role. Please contact your lab administrator.'
      );
      setLoading(false);
      return;
    }

    // Pre-cache role so AuthProvider picks it up instantly
    localStorage.setItem('labflow-role', assignedRole || 'tech');

    // Success — redirect to dashboard
    router.push('/');
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
            Set up your team account
          </p>
        </div>

        {/* Signup card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

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
              <p className="text-xs text-slate-400 mt-1">
                Use the email your admin invited you with
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6">
          <span className="text-slate-400">Already have an account? </span>
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
