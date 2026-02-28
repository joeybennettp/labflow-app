'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  History,
  ArrowRightLeft,
  Upload,
  Trash2,
  MessageSquare,
  PlusCircle,
  Pencil,
  Receipt,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ActivityLogEntry } from '@/lib/types';
import Sidebar from '@/components/Sidebar';

type ActivityFilter = 'all' | 'status' | 'files' | 'messages' | 'other';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <PlusCircle size={14} />,
  status: <ArrowRightLeft size={14} />,
  edited: <Pencil size={14} />,
  deleted: <Trash2 size={14} />,
  uploaded: <Upload size={14} />,
  removed: <Trash2 size={14} />,
  message: <MessageSquare size={14} />,
  invoiced: <Receipt size={14} />,
};

function getIcon(action: string) {
  const lower = action.toLowerCase();
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <History size={14} />;
}

function getColor(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('created')) return 'bg-green-100 text-green-600';
  if (lower.includes('status') || lower.includes('moved') || lower.includes('changed')) return 'bg-blue-100 text-blue-600';
  if (lower.includes('deleted') || lower.includes('removed')) return 'bg-red-100 text-red-600';
  if (lower.includes('uploaded') || lower.includes('file')) return 'bg-purple-100 text-purple-600';
  if (lower.includes('message') || lower.includes('sent')) return 'bg-amber-100 text-amber-600';
  if (lower.includes('invoiced')) return 'bg-green-100 text-green-600';
  if (lower.includes('edited')) return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-600';
}

function matchesFilter(action: string, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  const lower = action.toLowerCase();
  if (filter === 'status') return lower.includes('status') || lower.includes('moved') || lower.includes('changed') || lower.includes('shipped');
  if (filter === 'files') return lower.includes('upload') || lower.includes('file') || lower.includes('removed file');
  if (filter === 'messages') return lower.includes('message') || lower.includes('sent');
  // 'other' = everything else
  return !matchesFilter(action, 'status') && !matchesFilter(action, 'files') && !matchesFilter(action, 'messages');
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ActivityPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (authLoading) return;
    async function fetchActivity() {
      const { data } = await supabase
        .from('activity_log')
        .select('*, cases(case_number)')
        .order('created_at', { ascending: false })
        .limit(limit);
      setEntries((data as ActivityLogEntry[]) || []);
      setLoading(false);
    }
    fetchActivity();
  }, [authLoading, limit]);

  const filtered = useMemo(() => {
    return entries.filter((e) => matchesFilter(e.action, filter));
  }, [entries, filter]);

  const FILTERS: { key: ActivityFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'status', label: 'Status Changes' },
    { key: 'files', label: 'Files' },
    { key: 'messages', label: 'Messages' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Activity Log
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading activity...
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      filter === f.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Activity feed */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="px-4 py-16 text-center">
                    <History size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-400">No activity yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Activity will appear as you and your team work on cases.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filtered.map((entry) => (
                      <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${getColor(entry.action)}`}>
                          {getIcon(entry.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-800">
                            <span className="font-semibold">{entry.user_name}</span>
                            {' '}
                            <span className="text-slate-600">{entry.action}</span>
                            {entry.cases?.case_number && (
                              <span className="ml-1 font-mono text-brand-600 font-semibold">
                                {entry.cases.case_number}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatTimestamp(entry.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Load more */}
                {entries.length >= limit && (
                  <div className="px-4 py-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setLimit((prev) => prev + 50)}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Load more activity
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
