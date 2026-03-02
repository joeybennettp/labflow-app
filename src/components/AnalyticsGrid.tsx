'use client';

import { useMemo } from 'react';
import { Case } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  cases: Case[];
  isAdmin?: boolean;
  onTypeClick?: (type: string) => void;
};

type TickProps = {
  x: string | number;
  y: string | number;
  payload: { value: string };
};

const STATUS_COLORS: Record<Case['status'], string> = {
  received: '#64748b',
  in_progress: '#2563eb',
  quality_check: '#7c3aed',
  ready: '#16a34a',
  shipped: '#d97706',
};

const STATUS_LABELS: Record<Case['status'], string> = {
  received: 'Received',
  in_progress: 'In Progress',
  quality_check: 'QC Check',
  ready: 'Ready',
  shipped: 'Shipped',
};

export default function AnalyticsGrid({ cases, isAdmin, onTypeClick }: Props) {
  // Chart 1: Cases by status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status as Case['status']] || status,
      value: count,
      fill: STATUS_COLORS[status as Case['status']] || '#94a3b8',
    }));
  }, [cases]);

  // Chart 2: Revenue by month (last 6 months)
  const revenueData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      });
    }

    const revenueByMonth: Record<string, number> = {};
    months.forEach((m) => (revenueByMonth[m.key] = 0));

    cases
      .filter((c) => c.invoiced)
      .forEach((c) => {
        const created = new Date(c.created_at);
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        if (revenueByMonth[key] !== undefined) {
          revenueByMonth[key] += Number(c.price);
        }
      });

    return months.map((m) => ({
      month: m.label,
      revenue: revenueByMonth[m.key],
    }));
  }, [cases]);

  // Chart 3: Cases by restoration type (top 8)
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([type, count]) => ({ type, count }));
  }, [cases]);

  if (cases.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-6">
      {/* Cases by Status — Donut */}
      <div className="card-base p-4 md:p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Cases by Status
        </h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value} cases`, '']}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid rgba(226,232,240,0.7)',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: '#334155', fontSize: '12px', fontWeight: 500 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Revenue by Month — Bar (admin only) */}
      {isAdmin && (
        <div className="card-base p-4 md:p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            Revenue by Month
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid rgba(226,232,240,0.7)',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cases by Restoration Type — Horizontal Bar */}
      <div className="card-base p-4 md:p-5 lg:col-span-2">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Cases by Restoration Type
        </h3>
        {typeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(240, typeData.length * 36)}>
            <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="type"
                type="category"
                width={140}
                tick={onTypeClick ? (props: TickProps) => (
                  <text
                    x={props.x}
                    y={props.y}
                    textAnchor="end"
                    fill="#2563eb"
                    fontSize={12}
                    fontWeight={500}
                    cursor="pointer"
                    onClick={() => onTypeClick(props.payload.value)}
                    dominantBaseline="central"
                  >
                    {props.payload.value}
                  </text>
                ) : { fontSize: 12, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [`${value} cases`, '']}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid rgba(226,232,240,0.7)',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              />
              <Bar
                dataKey="count"
                fill="#2563eb"
                radius={[0, 4, 4, 0]}
                barSize={24}
                cursor={onTypeClick ? 'pointer' : undefined}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(data: any) => {
                  if (onTypeClick && data?.type) onTypeClick(data.type);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-slate-400 text-sm text-center py-12">
      No data to display
    </p>
  );
}
