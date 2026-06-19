import { NextRequest } from 'next/server';
import { jsonWithCors, preflight } from '@/lib/cors';
import {
  loadTenantByPublicKey,
  hostFromOriginOrReferer,
  isOriginAllowed,
  clientIp,
  hashIp,
  rateLimit,
} from '@/lib/tenant';
import { buildSystemPrompt, prepareMessages } from '@/lib/prompt';
import { chat, ANTHROPIC_CONFIGURED } from '@/lib/anthropic';
import { tryReserve, refundReservation, recordTokens } from '@/lib/usage';
import { getOrCreateConversation, addMessage } from '@/lib/store';
import { getPlan, effectivePlanId } from '@/lib/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return preflight(req.headers.get('origin'));
}

function fallback(origin: string | null, message: string, phone: string, status = 200) {
  const reply = phone ? `${message.trim()} ${phone}.` : message.trim();
  return jsonWithCors({ reply, status: 'bot' }, origin, status);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonWithCors({ error: 'bad_request' }, origin, 400);
  }

  const tenant = await loadTenantByPublicKey(String(body.key || ''));
  if (!tenant || !tenant.assistant) {
    return jsonWithCors({ error: 'unknown_tenant' }, origin, 404);
  }
  const a = tenant.assistant;

  if (!a.enabled || tenant.status === 'suspended') {
    return jsonWithCors({ reply: 'The assistant is currently turned off.', status: 'bot' }, origin, 200);
  }

  // Per-tenant domain allowlist.
  const reqHost = hostFromOriginOrReferer(origin, referer);
  if (!isOriginAllowed(reqHost, tenant.websiteUrl, tenant.allowedDomains)) {
    return jsonWithCors({ error: 'origin_not_allowed' }, origin, 403);
  }

  const phone = a.phone || '';

  // Rate limit by IP.
  const ip = clientIp(req.headers);
  if (!rateLimit(`${tenant.id}:${hashIp(ip)}`, a.rateLimitPerHour)) {
    return fallback(
      origin,
      "You've reached the message limit for now. Please try again later, or call us on",
      phone,
      429,
    );
  }

  const messages = prepareMessages(body.messages);
  if (messages.length === 0) {
    return fallback(origin, 'Please type a question. You can also call us on', phone, 400);
  }

  // Store the inbound visitor message.
  const conv = await getOrCreateConversation(tenant.id, String(body.sessionId || ''), {
    ipHash: hashIp(ip),
    pageUrl: referer || '',
    userAgent: req.headers.get('user-agent') || '',
  });
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  let lastUserMsgId: string | null = null;
  if (lastUser) {
    const m = await addMessage(conv.id, 'user', lastUser.content);
    lastUserMsgId = m.id;
  }

  // A human has taken over — stay silent; the widget polls for agent replies.
  // Return lastId so the widget seeds its poll cursor and doesn't replay history.
  if (conv.status === 'live') {
    return jsonWithCors({ reply: null, live: true, status: 'live', agent: conv.agent, lastId: lastUserMsgId }, origin, 200);
  }

  if (!ANTHROPIC_CONFIGURED) {
    return fallback(
      origin,
      'The assistant is not fully set up yet (no AI key configured). Please reach out',
      phone,
      200,
    );
  }

  // Payment-failed tenants drop to free (grace); trialing tenants get the trial plan.
  const planId = tenant.status === 'past_due' ? 'free' : effectivePlanId(tenant);

  // Atomically reserve a monthly message slot (closes the quota race).
  if (!(await tryReserve(tenant.id, planId))) {
    return fallback(origin, 'The assistant has reached its monthly limit. Please reach out directly', phone, 200);
  }

  // Build prompt and call the model (validated against the plan's allowed tiers).
  let system = buildSystemPrompt(a);
  const context = typeof body.context === 'string' ? body.context.slice(0, 600) : '';
  if (context) system += `\n\n=== CURRENT CONTEXT (advisory) ===\n${context}`;

  const plan = getPlan(planId);
  const model = plan.models.includes(a.model) ? a.model : plan.models[0];

  const result = await chat({ model, system, messages, maxTokens: a.maxTokens });

  if (!result.ok || !result.text) {
    await refundReservation(tenant.id); // don't bill a failed call against quota
    return fallback(origin, "Sorry, I'm having trouble right now. Please call us on", phone, 200);
  }

  await recordTokens(tenant.id, result.tokensIn, result.tokensOut);
  await addMessage(conv.id, 'assistant', result.text);

  return jsonWithCors({ reply: result.text, status: conv.status }, origin, 200);
}
