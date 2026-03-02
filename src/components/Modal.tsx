'use client';

import { useEffect, ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
};

export default function Modal({ open, onClose, title, children, footer, wide }: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-modal"
      style={{ animation: 'overlayIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl border border-slate-200/50 w-full flex flex-col overflow-hidden max-h-[calc(100vh-3rem)] ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
        style={{ animation: 'modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 flex items-center justify-between shrink-0">
          <h2 className="text-base md:text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-4 md:px-6 pb-3 md:pb-4 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 md:px-6 pb-4 md:pb-5 pt-2 flex flex-wrap justify-end gap-2 md:gap-3 shrink-0 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
