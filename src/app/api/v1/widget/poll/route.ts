import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonWithCors, preflight } from '@/lib/cors';
import { loadTenantByPublicKey, hostFromOriginOrReferer, isOriginAllowed } from '@/lib/tenant';
import { messagesAfter } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return preflight(req.headers.get('origin'));
}

/**
 * Visitor poll: returns any messages newer than `after`, plus chat status/agent.
 * Lightweight; called every few seconds by the widget while waiting/live.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors({ status: 'bot', messages: [] }, origin, 400);
  }

  const tenant = await loadTenantByPublicKey(String(body.key || ''));
  if (!tenant) return jsonWithCors({ status: 'bot', messages: [] }, origin, 200);

  // Same per-tenant domain allowlist the other widget endpoints enforce, so a
  // scraped public key can't be used to read transcripts from another site.
  const reqHost = hostFromOriginOrReferer(origin, req.headers.get('referer'));
  if (!isOriginAllowed(reqHost, tenant.websiteUrl, tenant.allowedDomains, req.headers.get('host'))) {
    return jsonWithCors({ status: 'bot', agent: '', messages: [] }, origin, 403);
  }

  const sessionId = String(body.sessionId || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  const conv = await prisma.conversation.findUnique({
    where: { tenantId_sessionId: { tenantId: tenant.id, sessionId } },
  });
  if (!conv) return jsonWithCors({ status: 'bot', agent: '', messages: [] }, origin, 200);

  const rows = await messagesAfter(conv.id, body.after ? String(body.after) : null);
  // Deliver only agent + system messages over the poll channel. Bot (assistant)
  // replies reach the visitor via the /message response, and their own (user)
  // messages are already shown — so the widget renders exactly what it receives
  // here and its poll cursor never advances past an unrendered message.
  const messages = rows
    .filter((m) => m.role === 'agent' || m.role === 'system')
    .map((m) => ({ id: m.id, role: m.role, content: m.content }));

  return jsonWithCors({ status: conv.status, agent: conv.agent, messages }, origin, 200);
}
