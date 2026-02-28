'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';

type TeamMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'tech';
  created_at: string;
};

export default function TeamPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'remove';
    member: TeamMember;
  } | null>(null);

  // Admin-only redirect
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  // Fetch all team members
  const fetchMembers = useCallback(async () => {
    setFetchError(null);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setFetchError(`${error.code}: ${error.message}`);
      console.error('fetchMembers error:', error);
    }

    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  }, []);

  // Wait for auth to be ready before fetching — otherwise RLS blocks the query
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMembers();
    }
  }, [fetchMembers, authLoading, isAdmin]);

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const isLastAdmin = (member: TeamMember) =>
    member.role === 'admin' && adminCount <= 1;
  const isSelf = (member: TeamMember) => member.id === user?.id;

  // Toggle role between admin and tech
  async function handleToggleRole(member: TeamMember) {
    const newRole = member.role === 'admin' ? 'tech' : 'admin';
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', member.id);

    if (error) {
      alert('Failed to update role: ' + error.message);
      return;
    }
    await fetchMembers();
    setConfirmAction(null);
  }

  // Remove team member
  async function handleRemoveMember(member: TeamMember) {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', member.id);

    if (error) {
      alert('Failed to remove member: ' + error.message);
      return;
    }
    await fetchMembers();
    setConfirmAction(null);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 md:px-7 h-14 md:h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-lg hover:bg-slate-50 transition-colors"
            >
              ☰
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Team Management
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-7">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Loading team...
            </div>
          ) : (
            <>
              {/* Error display */}
              {fetchError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  Error loading team: {fetchError}
                </div>
              )}

              {/* Summary */}
              <div className="mb-6 text-sm text-slate-500">
                {members.length} team member{members.length !== 1 ? 's' : ''} ·{' '}
                {adminCount} admin{adminCount !== 1 ? 's' : ''} ·{' '}
                {members.length - adminCount} tech{members.length - adminCount !== 1 ? 's' : ''}
              </div>

              {/* Member cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`bg-white border rounded-lg p-5 ${
                      isSelf(member)
                        ? 'border-brand-200 ring-1 ring-brand-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                          member.role === 'admin' ? 'bg-brand-600' : 'bg-slate-500'
                        }`}
                      >
                        {member.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {member.email || 'No email'}
                          {isSelf(member) && (
                            <span className="ml-1.5 text-xs font-medium text-brand-600">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Joined {formatDate(member.created_at)}
                        </div>
                      </div>
                      {/* Role badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          member.role === 'admin'
                            ? 'bg-brand-50 text-brand-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.role === 'admin' ? 'Admin' : 'Tech'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() =>
                          setConfirmAction({ type: 'role', member })
                        }
                        disabled={isSelf(member) || isLastAdmin(member)}
                        className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-slate-100 text-slate-700 hover:bg-slate-200"
                        title={
                          isSelf(member)
                            ? "You can't change your own role"
                            : isLastAdmin(member)
                              ? "Can't demote the last admin"
                              : undefined
                        }
                      >
                        {member.role === 'admin'
                          ? 'Demote to Tech'
                          : 'Promote to Admin'}
                      </button>
                      <button
                        onClick={() =>
                          setConfirmAction({ type: 'remove', member })
                        }
                        disabled={isSelf(member)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-red-600 bg-red-50 hover:bg-red-100"
                        title={
                          isSelf(member)
                            ? "You can't remove yourself"
                            : undefined
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info note */}
              <div className="mt-8 text-xs text-slate-400 max-w-lg">
                New team members are added when they sign up and log in.
                They default to the Technician role. Admins can see financial
                data (prices, invoices, revenue).
              </div>
            </>
          )}
        </main>
      </div>

      {/* Role change confirmation */}
      {confirmAction?.type === 'role' && (
        <Modal
          open={true}
          onClose={() => setConfirmAction(null)}
          title="Change Role"
          footer={
            <>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleRole(confirmAction.member)}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
              >
                {confirmAction.member.role === 'admin'
                  ? 'Demote to Tech'
                  : 'Promote to Admin'}
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Change{' '}
            <strong>{confirmAction.member.email || 'this user'}</strong> from{' '}
            <strong>
              {confirmAction.member.role === 'admin' ? 'Admin' : 'Tech'}
            </strong>{' '}
            to{' '}
            <strong>
              {confirmAction.member.role === 'admin' ? 'Tech' : 'Admin'}
            </strong>
            ?
          </p>
          {confirmAction.member.role !== 'admin' && (
            <p className="text-xs text-slate-400 mt-2">
              Admins can see all financial data including prices, invoices, and
              revenue.
            </p>
          )}
          {confirmAction.member.role === 'admin' && (
            <p className="text-xs text-slate-400 mt-2">
              Techs cannot see any financial data. This takes effect on their
              next page load.
            </p>
          )}
        </Modal>
      )}

      {/* Remove member confirmation */}
      {confirmAction?.type === 'remove' && (
        <Modal
          open={true}
          onClose={() => setConfirmAction(null)}
          title="Remove Team Member"
          footer={
            <>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveMember(confirmAction.member)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Member
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Are you sure you want to remove{' '}
            <strong>{confirmAction.member.email || 'this user'}</strong>? Their
            role settings will be deleted. They will default to Technician if
            they log in again.
          </p>
        </Modal>
      )}
    </div>
  );
}
