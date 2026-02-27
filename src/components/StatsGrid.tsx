import { Case } from '@/lib/types';

type Props = {
  cases: Case[];
};

export default function StatsGrid({ cases }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const activeCases = cases.filter((c) => c.status !== 'shipped').length;
  const overdue = cases.filter(
    (c) => c.status !== 'shipped' && c.due < today
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

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases,
      icon: '📋',
      iconBg: 'bg-blue-100',
      trend: `${cases.filter((c) => c.status === 'in_progress').length} in progress`,
      trendColor: 'text-blue-600',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: '⚠️',
      iconBg: 'bg-red-100',
      trend: overdue > 0 ? 'Need attention' : 'All on track',
      trendColor: overdue > 0 ? 'text-red-600' : 'text-green-600',
      valueColor: overdue > 0 ? 'text-red-600' : undefined,
    },
    {
      label: 'Ready / Shipped',
      value: readyShipped,
      icon: '✅',
      iconBg: 'bg-green-100',
      trend: `${cases.filter((c) => c.status === 'ready').length} awaiting pickup`,
      trendColor: 'text-green-600',
    },
    {
      label: 'Revenue',
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
      icon: '💰',
      iconBg: 'bg-amber-100',
      trend: `${pendingInvoices} pending invoice${pendingInvoices !== 1 ? 's' : ''}`,
      trendColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-slate-200 rounded-lg p-5 flex items-start justify-between"
        >
          <div>
            <div
              className={`text-3xl font-extrabold tracking-tight leading-none ${
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
            className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 ${stat.iconBg}`}
          >
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
