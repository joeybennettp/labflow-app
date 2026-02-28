'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Props = {
  onNewCase?: () => void;
  onMenuToggle?: () => void;
};

export default function Topbar({ onNewCase, onMenuToggle }: Props) {
  const { user, role, signOut } = useAuth();
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Get user initials from email
  const initials = user?.email
    ? user.email
        .split('@')[0]
        .split(/[._-]/)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() || '')
        .join('')
    : '?';

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-lg hover:bg-slate-50 transition-colors"
          >
            ☰
          </button>
        )}
        <h1 className="text-[1.0625rem] font-bold text-slate-900">
          Case Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-sm text-slate-400 hidden md:block">{today}</span>

        {/* New Case button */}
        {onNewCase && (
          <button
            onClick={onNewCase}
            className="px-3 md:px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1.5"
          >
            <span className="hidden sm:inline">+</span> New Case
          </button>
        )}

        {/* Notification bell */}
        <div className="relative hidden sm:block" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
            }}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-base hover:bg-slate-50 transition-colors"
          >
            🔔
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              </div>
              <div className="px-4 py-8 text-center">
                <div className="text-2xl mb-2">🔕</div>
                <p className="text-sm text-slate-500">No new notifications</p>
                <p className="text-xs text-slate-400 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <div className="relative hidden sm:block" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
            }}
            className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-brand-700 transition-colors"
          >
            {initials}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.email || 'Unknown'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => {
                    setShowProfile(false);
                    router.push('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2.5"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2.5"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
