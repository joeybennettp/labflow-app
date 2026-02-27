const NAV_ITEMS = [
  { icon: '📋', label: 'Case Dashboard', active: true },
  { icon: '👨‍⚕️', label: 'Doctors', active: false },
  { icon: '💰', label: 'Invoices', active: false },
];

const ACCOUNT_ITEMS = [
  { icon: '⚙️', label: 'Settings', active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-screen bg-slate-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700/50">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-sm font-black">
            LF
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">
            LabFlow
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="px-3 py-2 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
          Main
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
              item.active
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 cursor-not-allowed opacity-60'
            }`}
            disabled={!item.active}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="px-3 py-2 mt-4 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
          Account
        </div>
        {ACCOUNT_ITEMS.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 cursor-not-allowed opacity-60 mb-0.5"
            disabled
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer - Lab Info */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0">
            PD
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-sm font-semibold truncate">
              Pacific Dental Lab
            </div>
            <div className="text-slate-500 text-xs">
              Pro Plan · Active
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
