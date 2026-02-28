'use client';

import { PortalCase } from '@/lib/types';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

type Props = {
  caseData: PortalCase;
  onClose: () => void;
};

const STATUS_FLOW: PortalCase['status'][] = [
  'received',
  'in_progress',
  'quality_check',
  'ready',
  'shipped',
];

const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  in_progress: 'In Progress',
  quality_check: 'QC Check',
  ready: 'Ready',
  shipped: 'Shipped',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PortalCaseDetail({ caseData, onClose }: Props) {
  const currentIndex = STATUS_FLOW.indexOf(caseData.status);
  const isOverdue =
    caseData.status !== 'shipped' &&
    caseData.due < new Date().toISOString().split('T')[0];

  const footer = (
    <button
      onClick={onClose}
      className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
    >
      Close
    </button>
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Case ${caseData.case_number}`}
      footer={footer}
      wide
    >
      {/* Rush banner */}
      {caseData.rush && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold">
          ⚡ Rush Case
        </div>
      )}

      {/* Progress tracker */}
      <div className="flex items-center gap-0 mb-6">
        {STATUS_FLOW.map((status, i) => {
          const isDone = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div key={status} className="flex-1 flex flex-col items-center relative">
              {i > 0 && (
                <div
                  className={`absolute top-4 right-1/2 left-[-50%] h-0.5 ${
                    i <= currentIndex ? 'bg-brand-600' : 'bg-slate-200'
                  }`}
                  style={{ width: '100%', left: '-50%' }}
                />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 border-2 ${
                  isDone
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[0.6875rem] font-semibold mt-1.5 text-center ${
                  isDone ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-3 md:gap-y-4">
        <DetailField label="Patient" value={caseData.patient} />
        <DetailField label="Status">
          <StatusBadge status={caseData.status} />
        </DetailField>
        <DetailField label="Restoration" value={caseData.type} />
        <DetailField label="Shade" value={caseData.shade || '—'} />
        <DetailField
          label="Due Date"
          value={formatDate(caseData.due)}
          className={isOverdue ? 'text-red-600 font-semibold' : undefined}
        />
        <DetailField
          label="Rush"
          value={caseData.rush ? '⚡ Yes' : 'No'}
        />
      </div>

      {/* Notes */}
      {caseData.notes && (
        <div className="mt-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Notes
          </div>
          <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
            {caseData.notes}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-400">
        <span>Created: {formatTimestamp(caseData.created_at)}</span>
        <span>Updated: {formatTimestamp(caseData.updated_at)}</span>
      </div>
    </Modal>
  );
}

function DetailField({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
        {label}
      </div>
      {children ? (
        children
      ) : (
        <div className={`text-sm text-slate-800 font-medium ${className || ''}`}>
          {value}
        </div>
      )}
    </div>
  );
}
