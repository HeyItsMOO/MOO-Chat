import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { getPlan } from '@/lib/plans';
import { addMessage, setStatus } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!getPlan(ctx.tenant.plan).features.liveChat) {
    return NextResponse.json({ error: 'live_chat_not_on_plan' }, { status: 403 });
  }

  const { conversationId, action } = await req.json().catch(() => ({}));
  const conv = await prisma.conversation.findFirst({ where: { id: conversationId, tenantId: ctx.tenant.id } });
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const agentName = ctx.user.name || ctx.user.email.split('@')[0];

  switch (action) {
    case 'takeover':
      await setStatus(conv.id, 'live', agentName);
      await addMessage(conv.id, 'system', `${agentName} joined the chat.`);
      break;
    case 'handback':
      await setStatus(conv.id, 'bot', '');
      await addMessage(conv.id, 'system', 'Handed back to the assistant.');
      break;
    case 'close':
      await setStatus(conv.id, 'closed');
      await addMessage(conv.id, 'system', 'This chat has been closed.');
      break;
    default:
      return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
