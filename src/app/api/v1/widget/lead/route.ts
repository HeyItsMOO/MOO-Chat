import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { jsonWithCors, preflight } from '@/lib/cors';
import {
  loadTenantByPublicKey,
  hostFromOriginOrReferer,
  isOriginAllowed,
  clientIp,
  hashIp,
  rateLimit,
} from '@/lib/tenant';
import { getPlan } from '@/lib/plans';
import { parseFields, validateSubmission, extractContact } from '@/lib/leadform';
import { sendEmail } from '@/lib/email';

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
    return jsonWithCors({ ok: false, error: 'bad_request' }, origin, 400);
  }

  const tenant = await loadTenantByPublicKey(String(body.key || ''));
  if (!tenant || !tenant.assistant) return jsonWithCors({ ok: false, error: 'unknown_tenant' }, origin, 404);
  const a = tenant.assistant;

  // Honeypot — real users never fill this hidden field. Pretend success for bots.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return jsonWithCors({ ok: true, message: a.leadFormSuccess }, origin, 200);
  }

  const plan = getPlan(tenant.plan);
  if (!plan.features.leadCapture || !a.leadFormEnabled || tenant.status === 'suspended') {
    return jsonWithCors({ ok: false, error: 'lead_form_disabled' }, origin, 403);
  }

  const reqHost = hostFromOriginOrReferer(origin, referer);
  if (!isOriginAllowed(reqHost, tenant.websiteUrl, tenant.allowedDomains, req.headers.get('host'))) {
    return jsonWithCors({ ok: false, error: 'origin_not_allowed' }, origin, 403);
  }

  // Rate limit lead submissions per IP (stricter than chat).
  const ip = clientIp(req.headers);
  if (!rateLimit(`lead:${tenant.id}:${hashIp(ip)}`, 8)) {
    return jsonWithCors(
      { ok: false, message: "You've sent a few requests already. Please contact us directly." },
      origin,
      200,
    );
  }

  const fields = parseFields(a.leadFormFields);
  const values = body.values && typeof body.values === 'object' ? body.values : {};
  const { errors, clean } = validateSubmission(fields, values);
  if (Object.keys(errors).length > 0) {
    return jsonWithCors({ ok: false, errors, message: 'Please check the highlighted fields.' }, origin, 200);
  }

  const contact = extractContact(fields, clean);
  const pageUrl = referer || '';

  // Store the lead.
  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      name: contact.name.slice(0, 160),
      email: contact.email.slice(0, 160),
      phone: contact.phone.slice(0, 60),
      pageUrl: pageUrl.slice(0, 255),
      payload: JSON.stringify({ fields, values: clean }),
    },
  });

  // Attach contact details to the live conversation, if any.
  if (body.sessionId) {
    const conv = await prisma.conversation.findUnique({
      where: { tenantId_sessionId: { tenantId: tenant.id, sessionId: String(body.sessionId).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64) } },
    });
    if (conv && (contact.name || contact.email)) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { visitorName: contact.name || conv.visitorName, visitorEmail: contact.email || conv.visitorEmail },
      });
    }
  }

  // Notify the team.
  await notify(tenant.id, a, fields, clean, contact, pageUrl);

  return jsonWithCors({ ok: true, message: a.leadFormSuccess }, origin, 200);
}

async function notify(
  tenantId: string,
  a: { leadNotifyEmail: string; companyName: string; leadFormTitle: string },
  fields: { key: string; label: string }[],
  clean: Record<string, string>,
  contact: { name: string; email: string },
  pageUrl: string,
) {
  let to = a.leadNotifyEmail;
  if (!to) {
    const owner = await prisma.membership.findFirst({
      where: { tenantId, role: 'owner' },
      include: { user: true },
    });
    to = owner?.user.email || '';
  }
  if (!to) return;

  const lines = [
    `New ${a.leadFormTitle.toLowerCase()} from your website assistant.`,
    '',
    ...fields.map((f) => `${f.label}: ${clean[f.key] || '—'}`),
    '',
    pageUrl ? `Submitted from: ${pageUrl}` : '',
  ].filter(Boolean);

  await sendEmail({
    to,
    subject: `New lead${contact.name ? `: ${contact.name}` : ''} — ${a.companyName || 'website'}`,
    text: lines.join('\n'),
    replyTo: contact.email || undefined,
  });
}
