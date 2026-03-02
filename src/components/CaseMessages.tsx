'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CaseMessage } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { logActivity } from '@/lib/activity';

type Props = {
  caseId: string;
  role: 'lab' | 'doctor';
};

function formatMessageTime(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CaseMessages({ caseId, role }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch messages:', error.message);
    } else {
      setMessages((data as CaseMessage[]) || []);
    }
    setLoading(false);
  }, [caseId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function handleSend() {
    const text = newMessage.trim();
    if (!text || !user) return;

    setError(null);
    setSending(true);

    try {
      // Get sender name based on role
      let senderName = 'Lab Staff';

      if (role === 'doctor') {
        const { data: doc } = await supabase
          .from('doctors')
          .select('name')
          .eq('auth_user_id', user.id)
          .single();
        senderName = doc?.name || 'Doctor';
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();
        senderName = profile?.display_name || user.email?.split('@')[0] || 'Lab Staff';
      }

      const { error: insertError } = await supabase
        .from('case_messages')
        .insert({
          case_id: caseId,
          sender_id: user.id,
          sender_role: role,
          sender_name: senderName,
          message: text,
        });

      if (insertError) throw new Error(insertError.message);

      logActivity(supabase, { caseId, action: `sent a message` });

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="mt-5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <MessageSquare size={12} />
        Messages
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Messages thread */}
      <div className="bg-slate-50 rounded-lg border border-slate-200/70 overflow-hidden">
        <div className="max-h-64 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-4">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const isLab = msg.sender_role === 'lab';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender name + time */}
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[0.65rem] font-bold ${
                      isLab ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {msg.sender_name}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[0.55rem] font-bold ${
                      isLab
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {isLab ? 'Lab' : 'Doctor'}
                    </span>
                    <span className="text-[0.6rem] text-slate-400">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      isOwn
                        ? isLab
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-purple-600 text-white rounded-br-md'
                        : isLab
                          ? 'bg-white border border-blue-200 text-slate-800 rounded-bl-md'
                          : 'bg-white border border-purple-200 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200/70 p-2 flex items-end gap-2 bg-white">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
