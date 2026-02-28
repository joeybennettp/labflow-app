import { ReactNode } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { Case } from '@/lib/types';

type Props = {
  cases: Case[];
  isAdmin?: boolean;
};

export default function StatsGrid({ cases, isAdmin }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const activeCases = cases.filter((c) => c.status !== 'shipped').length;
  const overdue = cases.filter(
    (c) => c.status !== 'shipped' && c.due < today
  ).length;
  const dueSoon = cases.filter(
    (c) => c.status !== 'shipped' && c.due >= today && c.due <= tomorrow
  ).length;
  const readyShipped = cases.filter(
    (c) => c.status === 'ready' || c.status === 'shipped'
  ).length;
  const revenue = cases
    .filter((c) => c.invoiced)
    .reduce((sum, c) => sum + Number(c.price), 0);
  const pendingInvoices = cases.filter(
    (c) => !c.invoiced && c.status === 'shipped'
  ).length;

  const allStats: {
    label: string;
    value: string | number;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    trend: string;
    trendColor: string;
    valueColor?: string;
    adminOnly?: boolean;
  }[] = [
    {
      label: 'Active Cases',
      value: activeCases,
      icon: <ClipboardList size={20} />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      trend: `${cases.filter((c) => c.status === 'in_progress').length} in progress`,
      trendColor: 'text-blue-600',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <AlertTriangle size={20} />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      trend: overdue > 0 ? 'Need attention' : dueSoon > 0 ? `${dueSoon} due soon` : 'All on track',
      trendColor: overdue > 0 ? 'text-red-600' : dueSoon > 0 ? 'text-amber-600' : 'text-green-600',
      valueColor: overdue > 0 ? 'text-red-600' : undefined,
    },
    {
      label: 'Ready / Shipped',
      value: readyShipped,
      icon: <CheckCircle size={20} />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      trend: `${cases.filter((c) => c.status === 'ready').length} awaiting pickup`,
      trendColor: 'text-green-600',
    },
    {
      label: 'Revenue',
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
      icon: <DollarSign size={20} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      trend: `${pendingInvoices} pending invoice${pendingInvoices !== 1 ? 's' : ''}`,
      trendColor: 'text-amber-600',
      adminOnly: true,
    },
  ];

  const stats = allStats.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 ${stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3 md:gap-4 mb-6`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-slate-200 rounded-lg p-3 md:p-5 flex items-start justify-between"
        >
          <div>
            <div
              className={`text-2xl md:text-3xl font-extrabold tracking-tight leading-none ${
                stat.valueColor || 'text-slate-900'
              }`}
            >
              {stat.value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            <div className={`text-xs font-semibold mt-2 ${stat.trendColor}`}>
              {stat.trend}
            </div>
          </div>
          <div
            className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg} ${stat.iconColor}`}
          >
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
