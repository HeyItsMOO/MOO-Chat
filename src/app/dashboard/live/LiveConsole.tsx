'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ConvSummary {
  id: string;
  status: string;
  agent: string;
  visitorName: string;
  visitorEmail: string;
  pageUrl: string;
  msgCount: number;
  last: { role: string; content: string } | null;
}
interface ThreadMsg { id: string; role: string; content: string }
interface Thread {
  status: string;
  agent: string;
  visitorName: string;
  visitorEmail: string;
  pageUrl: string;
  messages: ThreadMsg[];
}

const PILL: Record<string, string> = {
  bot: 'bg-slate-100 text-slate-600',
  waiting: 'bg-amber-100 text-amber-700',
  live: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-400',
};

export default function LiveConsole({ agentName }: { agentName: string }) {
  const [list, setList] = useState<ConvSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/tenant/live', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setList(data.conversations || []);
        setSelected((cur) => cur ?? (data.conversations?.[0]?.id || null));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tenant/live/thread?c=${id}`, { cache: 'no-store' });
      if (res.ok) setThread(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  // Poll the list every 5s.
  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 5000);
    return () => clearInterval(t);
  }, [loadList]);

  // Poll the open thread every 3s.
  useEffect(() => {
    if (!selected) return;
    loadThread(selected);
    const t = setInterval(() => loadThread(selected), 3000);
    return () => clearInterval(t);
  }, [selected, loadThread]);

  // Autoscroll on new messages.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread?.messages.length]);

  async function send() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await fetch('/api/tenant/live/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected, content: reply }),
      });
      setReply('');
      await loadThread(selected);
      loadList();
    } finally {
      setSending(false);
    }
  }

  async function act(action: 'takeover' | 'handback' | 'close') {
    if (!selected) return;
    await fetch('/api/tenant/live/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selected, action }),
    });
    await loadThread(selected);
    loadList();
  }

  const waiting = list.filter((c) => c.status === 'waiting').length;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm">
          <span className="font-semibold">Active chats</span>
          {waiting > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{waiting} waiting</span>}
        </div>
        {list.length === 0 && <p className="p-5 text-sm text-ink-mute">No active chats right now.</p>}
        <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
          {list.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => { setSelected(c.id); setThread(null); }}
                className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${selected === c.id ? 'bg-brand-50' : ''} ${c.status === 'waiting' ? 'border-l-4 border-amber-400' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.visitorName || 'Anonymous'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PILL[c.status] || ''}`}>{c.status}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-soft">{c.last?.content || '—'}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Thread */}
      <div className="flex min-h-[60vh] flex-col rounded-2xl border border-slate-200 bg-white">
        {!thread ? (
          <div className="flex flex-1 items-center justify-center text-sm text-ink-mute">
            {selected ? 'Loading…' : 'Select a conversation.'}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <div>
                <div className="font-semibold">{thread.visitorName || 'Anonymous visitor'}</div>
                <div className="text-xs text-ink-mute">{thread.visitorEmail || thread.pageUrl || ''}</div>
              </div>
              <div className="flex gap-2">
                {thread.status !== 'live' && thread.status !== 'closed' && (
                  <button onClick={() => act('takeover')} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">Take over</button>
                )}
                {thread.status === 'live' && (
                  <button onClick={() => act('handback')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">Hand back to bot</button>
                )}
                {thread.status !== 'closed' && (
                  <button onClick={() => act('close')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-slate-50">Close</button>
                )}
              </div>
            </div>

            <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {thread.messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-slate-200 text-ink'
                        : m.role === 'agent'
                          ? 'bg-brand-600 text-white'
                          : m.role === 'system'
                            ? 'bg-transparent text-xs italic text-ink-mute'
                            : 'bg-green-50 text-green-900'
                    }`}
                  >
                    {m.role === 'assistant' && <div className="text-[10px] font-bold uppercase opacity-60">Assistant</div>}
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {thread.status === 'closed' ? (
              <div className="border-t border-slate-100 p-4 text-center text-sm text-ink-mute">This chat is closed.</div>
            ) : (
              <div className="flex gap-2 border-t border-slate-100 p-3">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  placeholder={`Reply as ${agentName}…`}
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
                />
                <button onClick={send} disabled={sending || !reply.trim()} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                  Send
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
