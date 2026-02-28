'use client';

import { Menu } from 'lucide-react';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import InviteTeamMemberModal from '@/components/InviteTeamMemberModal';

type TeamMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'admin' | 'tech';
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: 'admin' | 'tech';
  created_at: string;
};

export default function TeamPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'remove' | 'revoke';
    member?: TeamMember;
    invite?: PendingInvite;
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
      .in('role', ['admin', 'tech'])
      .order('created_at', { ascending: true });

    if (error) {
      setFetchError(`${error.code}: ${error.message}`);
      console.error('fetchMembers error:', error);
    }

    setMembers((data as TeamMember[]) || []);
    setLoading(false);
  }, []);

  // Fetch pending invites
  const fetchInvites = useCallback(async () => {
    const { data } = await supabase
      .from('team_invites')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingInvites((data as PendingInvite[]) || []);
  }, []);

  // Wait for auth to be ready before fetching — otherwise RLS blocks the query
  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchMembers();
      fetchInvites();
    }
  }, [fetchMembers, fetchInvites, authLoading, isAdmin]);

  const adminCount = members.filter((m) => m.role === 'admin').length;
  const isLastAdmin = (member: TeamMember) =>
    member.role === 'admin' && adminCount <= 1;
  const isSelf = (member: TeamMember) => member.id === user?.id;

  // Send invite via RPC
  async function handleInvite(data: { email: string; role: 'admin' | 'tech' }) {
    const { error } = await supabase.rpc('create_team_invite', {
      p_email: data.email,
      p_role: data.role,
    });
    if (error) throw new Error(error.message);
    setShowInviteModal(false);
    await fetchInvites();
  }

  // Revoke a pending invite
  async function handleRevokeInvite(invite: PendingInvite) {
    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id);

    if (error) {
      alert('Failed to revoke invite: ' + error.message);
      return;
    }
    await fetchInvites();
    setConfirmAction(null);
  }

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
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-[1.0625rem] font-bold text-slate-900">
              Team Management
            </h1>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            + Invite Member
          </button>
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
                {pendingInvites.length > 0 && (
                  <> · {pendingInvites.length} pending invite{pendingInvites.length !== 1 ? 's' : ''}</>
                )}
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-slate-700 mb-3">Pending Invites</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="bg-white border border-dashed border-slate-300 rounded-lg p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-700 truncate">
                            {invite.email}
                          </div>
                          <div className="text-xs text-slate-400">
                            {invite.role === 'admin' ? 'Admin' : 'Tech'} · Invited {formatDate(invite.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmAction({ type: 'revoke', invite })}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shrink-0"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Member cards */}
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Team Members</h2>
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
                Invite new team members using the button above. They&apos;ll
                receive a link to set up their account. Admins can see financial
                data (prices, invoices, revenue).
              </div>
            </>
          )}
        </main>
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <InviteTeamMemberModal
          onSave={handleInvite}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Role change confirmation */}
      {confirmAction?.type === 'role' && confirmAction.member && (
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
                onClick={() => handleToggleRole(confirmAction.member!)}
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
      {confirmAction?.type === 'remove' && confirmAction.member && (
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
                onClick={() => handleRemoveMember(confirmAction.member!)}
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

      {/* Revoke invite confirmation */}
      {confirmAction?.type === 'revoke' && confirmAction.invite && (
        <Modal
          open={true}
          onClose={() => setConfirmAction(null)}
          title="Revoke Invite"
          footer={
            <>
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeInvite(confirmAction.invite!)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Revoke Invite
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Revoke the invite for{' '}
            <strong>{confirmAction.invite.email}</strong>? They will no longer
            be able to sign up with this invite.
          </p>
        </Modal>
      )}
    </div>
  );
}
