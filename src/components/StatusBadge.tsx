import { Case } from '@/lib/types';

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  received:      { label: 'Received',      classes: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-600/10' },
  in_progress:   { label: 'In Progress',   classes: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10' },
  quality_check: { label: 'QC Check',      classes: 'bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-600/10' },
  ready:         { label: 'Ready',         classes: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10' },
  shipped:       { label: 'Shipped',       classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-700/10' },
};

type Props = {
  status: Case['status'];
};

export default function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] || { label: status, classes: 'bg-slate-100 text-slate-600' };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.classes}`}
    >
      {style.label}
    </span>
  );
}
