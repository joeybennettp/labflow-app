'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { icon: '📋', label: 'Case Dashboard', href: '/' },
  { icon: '👨‍⚕️', label: 'Doctors', href: '/doctors' },
  { icon: '💰', label: 'Invoices', href: '/invoices' },
];

const ACCOUNT_ITEMS = [
  { icon: '⚙️', label: 'Settings', href: '/settings', disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-60 h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-sm font-black">
            LF
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">
            LabFlow
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
          Main
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div className="px-3 py-2 mt-4 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
          Account
        </div>
        {ACCOUNT_ITEMS.map((item) =>
          item.disabled ? (
            <span
              key={item.label}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 opacity-60 cursor-not-allowed mb-0.5"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                pathname === item.href
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Footer - User Info + Sign Out */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-sm font-semibold truncate">
              {user?.email || 'User'}
            </div>
            <div className="text-slate-500 text-xs">
              Pro Plan · Active
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 transition-colors"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
