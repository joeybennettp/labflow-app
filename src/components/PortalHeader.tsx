'use client';

import { useAuth } from '@/lib/auth-context';

type Props = {
  doctorName?: string;
  practiceName?: string;
};

export default function PortalHeader({ doctorName, practiceName }: Props) {
  const { signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
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
              · {doctorName}
              {practiceName ? `, ${practiceName}` : ''}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={signOut}
        className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        Sign Out
      </button>
    </header>
  );
}
