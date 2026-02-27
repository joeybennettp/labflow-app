import { Case } from '@/lib/types';

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  received:      { label: 'Received',      classes: 'bg-slate-100 text-slate-600' },
  in_progress:   { label: 'In Progress',   classes: 'bg-blue-100 text-blue-700' },
  quality_check: { label: 'QC Check',      classes: 'bg-violet-100 text-violet-600' },
  ready:         { label: 'Ready',         classes: 'bg-green-100 text-green-700' },
  shipped:       { label: 'Shipped',       classes: 'bg-amber-100 text-amber-700' },
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
