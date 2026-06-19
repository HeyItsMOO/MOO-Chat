import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { messagesAfter } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('c') || '';
  const after = req.nextUrl.searchParams.get('after');

  const conv = await prisma.conversation.findFirst({ where: { id, tenantId: ctx.tenant.id } });
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const rows = await messagesAfter(conv.id, after || null);
  return NextResponse.json({
    status: conv.status,
    agent: conv.agent,
    visitorName: conv.visitorName,
    visitorEmail: conv.visitorEmail,
    pageUrl: conv.pageUrl,
    messages: rows.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
  });
}
