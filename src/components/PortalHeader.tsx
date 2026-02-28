'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Props = {
  doctorName?: string;
  practiceName?: string;
};

const NAV_ITEMS = [
  { href: '/portal', label: 'Cases' },
  { href: '/portal/invoices', label: 'Invoices' },
];

export default function PortalHeader({ doctorName }: Props) {
  const { signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-sm font-black">
            LF
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[1.0625rem] font-bold text-slate-900">
              Doctor Portal
            </span>
            {doctorName && (
              <span className="hidden sm:inline text-sm text-slate-400">
                · Dr. {doctorName.split(' ').pop() || doctorName}
              </span>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-sm text-slate-400 hidden md:block">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={signOut}
          className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
