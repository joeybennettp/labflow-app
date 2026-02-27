'use client';

type Props = {
  onNewCase?: () => void;
  onMenuToggle?: () => void;
};

export default function Topbar({ onNewCase, onMenuToggle }: Props) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
        <button className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-base hover:bg-slate-50 transition-colors relative hidden sm:flex">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white" />
        </button>

        {/* Avatar — hidden on mobile since user info is in sidebar */}
        <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold hidden sm:flex">
          PD
        </div>
      </div>
    </header>
  );
}
