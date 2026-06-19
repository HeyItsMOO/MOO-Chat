import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonWithCors, preflight } from '@/lib/cors';
import {
  loadTenantByPublicKey,
  hostFromOriginOrReferer,
  isOriginAllowed,
  clientIp,
  hashIp,
} from '@/lib/tenant';
import { getPlan } from '@/lib/plans';
import { getOrCreateConversation, addMessage, setStatus, setVisitor, messagesAfter } from '@/lib/store';
import { sendEmail } from '@/lib/email';
import { APP_URL } from '@/lib/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return preflight(req.headers.get('origin'));
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors({ ok: false }, origin, 400);
  }

  const tenant = await loadTenantByPublicKey(String(body.key || ''));
  if (!tenant || !tenant.assistant) return jsonWithCors({ ok: false, error: 'unknown_tenant' }, origin, 404);

  const plan = getPlan(tenant.plan);
  if (!plan.features.liveChat || tenant.status === 'suspended') {
    return jsonWithCors({ ok: false, message: 'Live chat is currently unavailable.' }, origin, 200);
  }

  const reqHost = hostFromOriginOrReferer(origin, referer);
  if (!isOriginAllowed(reqHost, tenant.websiteUrl, tenant.allowedDomains)) {
    return jsonWithCors({ ok: false, error: 'origin_not_allowed' }, origin, 403);
  }

  const conv = await getOrCreateConversation(tenant.id, String(body.sessionId || ''), {
    ipHash: hashIp(clientIp(req.headers)),
    pageUrl: referer || '',
    userAgent: req.headers.get('user-agent') || '',
  });

  const name = typeof body.name === 'string' ? body.name : '';
  const email = typeof body.email === 'string' ? body.email : '';
  if (name || email) await setVisitor(conv.id, name, email);

  if (conv.status !== 'live') await setStatus(conv.id, 'waiting');
  await addMessage(conv.id, 'system', 'Visitor requested to chat with a person.');

  // Email the team.
  await notifyTeam(tenant.id, tenant.assistant.leadNotifyEmail, conv.id, conv.pageUrl);

  const all = await messagesAfter(conv.id, null);
  const lastId = all.length ? all[all.length - 1].id : null;
  return jsonWithCors({ ok: true, status: 'waiting', lastId }, origin, 200);
}

async function notifyTeam(tenantId: string, notifyEmail: string, convId: string, pageUrl: string) {
  let to = notifyEmail;
  if (!to) {
    const owner = await prisma.membership.findFirst({ where: { tenantId, role: 'owner' }, include: { user: true } });
    to = owner?.user.email || '';
  }
  if (!to) return;
  await sendEmail({
    to,
    subject: 'A visitor wants to chat',
    text: [
      'A visitor has asked to speak with a person.',
      pageUrl ? `Page: ${pageUrl}` : '',
      '',
      `Join the chat: ${APP_URL}/dashboard/live?c=${convId}`,
    ]
      .filter(Boolean)
      .join('\n'),
  });
}
