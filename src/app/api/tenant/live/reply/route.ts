import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { effectivePlan } from '@/lib/plans';
import { addMessage, setStatus } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!effectivePlan(ctx.tenant).features.liveChat) {
    return NextResponse.json({ error: 'live_chat_not_on_plan' }, { status: 403 });
  }

  const { conversationId, content } = await req.json().catch(() => ({}));
  const text = typeof content === 'string' ? content.trim().slice(0, 4000) : '';
  if (!conversationId || !text) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, tenantId: ctx.tenant.id } });
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const agentName = ctx.user.name || ctx.user.email.split('@')[0];
  // Sending a reply takes over the chat (pauses the AI).
  if (conv.status !== 'live') await setStatus(conv.id, 'live', agentName);
  else if (!conv.agent) await setStatus(conv.id, 'live', agentName);

  const msg = await addMessage(conv.id, 'agent', text);
  return NextResponse.json({ ok: true, id: msg.id });
}
