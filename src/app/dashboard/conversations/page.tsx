import Link from 'next/link';
import { getCurrentContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  bot: 'bg-slate-100 text-slate-600',
  waiting: 'bg-amber-100 text-amber-700',
  live: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-400',
};

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  const { c } = await searchParams;

  const conversations = await prisma.conversation.findMany({
    where: { tenantId: ctx.tenant.id, msgCount: { gt: 0 } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { messages: { where: { role: 'user' }, orderBy: { createdAt: 'asc' }, take: 1 } },
  });

  const active = c
    ? await prisma.conversation.findFirst({
        where: { id: c, tenantId: ctx.tenant.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Conversations</h1>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          {conversations.length === 0 && <p className="p-5 text-sm text-ink-mute">No conversations yet. Once visitors start chatting, they&apos;ll appear here.</p>}
          <ul className="divide-y divide-slate-100">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <Link
                  href={`/dashboard/conversations?c=${conv.id}`}
                  className={`block px-4 py-3 hover:bg-slate-50 ${c === conv.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{conv.visitorName || 'Anonymous visitor'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[conv.status] || ''}`}>{conv.status}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-soft">{conv.messages[0]?.content || '—'}</p>
                  <p className="mt-1 text-[11px] text-ink-mute">{timeAgo(conv.updatedAt)} · {conv.msgCount} msgs</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {!active && <p className="text-sm text-ink-mute">Select a conversation to read the full thread.</p>}
          {active && (
            <>
              <div className="mb-4 border-b border-slate-100 pb-3">
                <div className="font-semibold">{active.visitorName || 'Anonymous visitor'}</div>
                <div className="text-xs text-ink-mute">
                  {active.visitorEmail && <>{active.visitorEmail} · </>}
                  {active.pageUrl || 'unknown page'}
                </div>
              </div>
              <div className="space-y-3">
                {active.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.role === 'user'
                          ? 'bg-brand-600 text-white'
                          : m.role === 'system'
                            ? 'bg-amber-50 text-amber-700 text-xs italic'
                            : 'bg-slate-100 text-ink'
                      }`}
                    >
                      {m.role === 'agent' && <div className="text-[10px] font-bold uppercase opacity-70">Agent</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
