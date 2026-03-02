'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Eye, MessageSquare, FileText } from 'lucide-react';

export default function DoctorRegisterPage() {
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

    // Step 1: Check if email matches an unlinked doctor record
    const { data: emailMatch, error: checkError } = await supabase.rpc(
      'check_doctor_email',
      { check_email: email }
    );

    if (checkError) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    if (!emailMatch) {
      setError(
        'No doctor record found for this email. Please contact your lab to ensure your email is on file.'
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

    // Step 3: Link the auth account to the doctor record
    const { error: linkError } = await supabase.rpc('link_doctor_account', {
      p_user_id: signUpData.user.id,
      p_email: email,
    });

    if (linkError) {
      setError('Account created but failed to link to your doctor record. Please contact your lab.');
      setLoading(false);
      return;
    }

    // Pre-cache doctor role so AuthProvider picks it up instantly
    localStorage.setItem('labflow-role', 'doctor');

    // Success — redirect to portal
    router.push('/portal');
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* ── Left Panel: Dark Brand ── */}
      <div className="relative overflow-hidden flex flex-col justify-center items-center px-8 py-10 md:py-0 h-[160px] md:h-auto"
        style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #111936 50%, #0d1529 100%)' }}
      >
        {/* Hex grid pattern */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-grid" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
              <path d="M28 2L54 18V50L28 66L2 50V18Z" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.08" />
              <path d="M28 34L54 50V82L28 98L2 82V50Z" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-grid)" />
        </svg>

        {/* Floating accent hexagons */}
        <svg className="absolute top-[15%] left-[10%] w-16 h-16 md:w-24 md:h-24" viewBox="0 0 100 100" style={{ animation: 'float 20s ease-in-out infinite' }}>
          <path d="M50 5L93 27.5V72.5L50 95L7 72.5V27.5Z" fill="none" stroke="#2563eb" strokeWidth="1.5" opacity="0.15" />
        </svg>
        <svg className="absolute bottom-[20%] right-[8%] w-12 h-12 md:w-20 md:h-20" viewBox="0 0 100 100" style={{ animation: 'drift 25s ease-in-out infinite' }}>
          <path d="M50 5L93 27.5V72.5L50 95L7 72.5V27.5Z" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.12" />
        </svg>
        <svg className="hidden md:block absolute top-[55%] left-[60%] w-14 h-14" viewBox="0 0 100 100" style={{ animation: 'float 18s ease-in-out infinite 3s' }}>
          <path d="M50 5L93 27.5V72.5L50 95L7 72.5V27.5Z" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.10" />
        </svg>
        <svg className="hidden md:block absolute top-[30%] right-[25%] w-10 h-10" viewBox="0 0 100 100" style={{ animation: 'drift 22s ease-in-out infinite 5s' }}>
          <path d="M50 5L93 27.5V72.5L50 95L7 72.5V27.5Z" fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.08" />
        </svg>

        {/* Crosshair elements */}
        <svg className="hidden md:block absolute top-[20%] right-[15%] w-10 h-10" viewBox="0 0 40 40" style={{ animation: 'crosshair-pulse 4s ease-in-out infinite' }}>
          <line x1="20" y1="4" x2="20" y2="36" stroke="#2563eb" strokeWidth="0.5" opacity="0.3" />
          <line x1="4" y1="20" x2="36" y2="20" stroke="#2563eb" strokeWidth="0.5" opacity="0.3" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.3" />
        </svg>
        <svg className="hidden md:block absolute bottom-[30%] left-[20%] w-8 h-8" viewBox="0 0 40 40" style={{ animation: 'crosshair-pulse 5s ease-in-out infinite 2s' }}>
          <line x1="20" y1="4" x2="20" y2="36" stroke="#2563eb" strokeWidth="0.5" opacity="0.25" />
          <line x1="4" y1="20" x2="36" y2="20" stroke="#2563eb" strokeWidth="0.5" opacity="0.25" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.25" />
        </svg>

        {/* Radial glow orb */}
        <div
          className="hidden md:block absolute w-[500px] h-[500px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
            animation: 'pulse-soft 8s ease-in-out infinite',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center md:items-start md:max-w-sm">
          <div className="inline-flex items-center gap-2.5 mb-4 md:mb-8 px-4 py-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-sm md:text-lg">
              LF
            </div>
            <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              LabFlow
            </span>
          </div>

          <h1
            className="hidden md:block text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Doctor<br />Portal
          </h1>
          <p className="hidden md:block text-blue-200/70 text-sm mb-8 leading-relaxed">
            Track your cases in real time, message your lab directly, and view your complete invoice history — all in one place.
          </p>

          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center gap-3 text-blue-200/60 text-sm">
              <Eye className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Real-time case status visibility</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200/60 text-sm">
              <MessageSquare className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Direct messaging with your lab</span>
            </div>
            <div className="flex items-center gap-3 text-blue-200/60 text-sm">
              <FileText className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Complete invoice history</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Registration Form ── */}
      <div className="flex items-center justify-center px-6 py-10 md:px-12 bg-white" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-lg">
                LF
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                LabFlow
              </span>
            </div>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
            <p className="text-sm text-slate-500">Use the email your lab has on file for you</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
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
                placeholder="you@yourpractice.com"
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100"
                autoComplete="email"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1 md:hidden">
                Must match the email your lab has on file
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
    </div>
  );
}
