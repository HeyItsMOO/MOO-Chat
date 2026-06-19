import { prisma } from './db';

/** Find or create a conversation for a (tenant, session). Ported from IGCB_Store. */
export async function getOrCreateConversation(
  tenantId: string,
  sessionId: string,
  meta: { ipHash?: string; pageUrl?: string; userAgent?: string },
) {
  const sid = (sessionId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const safeSid = sid || `sess_${Math.random().toString(36).slice(2)}`;

  const existing = await prisma.conversation.findUnique({
    where: { tenantId_sessionId: { tenantId, sessionId: safeSid } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      tenantId,
      sessionId: safeSid,
      status: 'bot',
      ipHash: (meta.ipHash || '').slice(0, 32),
      pageUrl: (meta.pageUrl || '').slice(0, 255),
      userAgent: (meta.userAgent || '').slice(0, 255),
    },
  });
}

export async function addMessage(conversationId: string, role: string, content: string) {
  const safeRole = ['user', 'assistant', 'agent', 'system'].includes(role) ? role : 'user';
  const msg = await prisma.message.create({
    data: { conversationId, role: safeRole, content: content.slice(0, 6000) },
  });
  // msgCount tracks real conversational turns; 'system' notices don't inflate it.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { ...(safeRole === 'system' ? {} : { msgCount: { increment: 1 } }), updatedAt: new Date() },
  });
  return msg;
}

/**
 * Messages after a cursor id, using a deterministic compound order (createdAt, id)
 * and a keyset query so same-timestamp ties can't skip/duplicate, and we don't
 * reload the whole history on every poll.
 */
export async function messagesAfter(conversationId: string, afterId: string | null) {
  const orderBy = [{ createdAt: 'asc' as const }, { id: 'asc' as const }];
  if (!afterId) {
    return prisma.message.findMany({ where: { conversationId }, orderBy });
  }
  const cursor = await prisma.message.findUnique({ where: { id: afterId } });
  if (!cursor) {
    return prisma.message.findMany({ where: { conversationId }, orderBy });
  }
  return prisma.message.findMany({
    where: {
      conversationId,
      OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: afterId } }],
    },
    orderBy,
  });
}

const VALID_STATUSES = ['bot', 'waiting', 'live', 'closed'];

export async function setStatus(conversationId: string, status: string, agent?: string) {
  const safe = VALID_STATUSES.includes(status) ? status : 'bot';
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: safe, ...(agent !== undefined ? { agent: agent.slice(0, 100) } : {}) },
  });
}

export async function setVisitor(conversationId: string, name: string, email: string) {
  const data: { visitorName?: string; visitorEmail?: string } = {};
  if (name) data.visitorName = name.slice(0, 160);
  if (email) data.visitorEmail = email.slice(0, 160);
  if (Object.keys(data).length === 0) return;
  return prisma.conversation.update({ where: { id: conversationId }, data });
}

/** Active (non-closed) conversations for the live console, newest first. */
export async function listActive(tenantId: string, limit = 60) {
  const rows = await prisma.conversation.findMany({
    // Include waiting/live chats even if they only have a system notice so far
    // (e.g. a visitor who clicked "talk to a person" before chatting).
    where: {
      tenantId,
      status: { not: 'closed' },
      OR: [{ msgCount: { gt: 0 } }, { status: { in: ['waiting', 'live'] } }],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return rows.map((c) => ({
    id: c.id,
    status: c.status,
    agent: c.agent,
    visitorName: c.visitorName,
    visitorEmail: c.visitorEmail,
    pageUrl: c.pageUrl,
    updatedAt: c.updatedAt,
    msgCount: c.msgCount,
    last: c.messages[0] ? { role: c.messages[0].role, content: c.messages[0].content } : null,
  }));
}
