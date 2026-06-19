import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { normalizeHost } from '@/lib/tenant';
import { getPlan } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { domain } = await req.json().catch(() => ({ domain: '' }));
  const host = normalizeHost(String(domain || ''));
  if (!host || !host.includes('.')) {
    return NextResponse.json({ error: 'Enter a valid domain, e.g. example.com' }, { status: 400 });
  }

  const plan = getPlan(ctx.tenant.plan);
  const count = await prisma.allowedDomain.count({ where: { tenantId: ctx.tenant.id } });
  // The primary website host doesn't count against the extra-domain allowance.
  const allowance = 1 + plan.features.extraDomains;
  if (count >= allowance) {
    return NextResponse.json(
      { error: `Your ${plan.name} plan allows ${allowance} domain(s). Upgrade to add more.` },
      { status: 403 },
    );
  }

  await prisma.allowedDomain.upsert({
    where: { tenantId_domain: { tenantId: ctx.tenant.id, domain: host } },
    create: { tenantId: ctx.tenant.id, domain: host },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await req.json().catch(() => ({ id: '' }));
  await prisma.allowedDomain.deleteMany({ where: { id: String(id), tenantId: ctx.tenant.id } });
  return NextResponse.json({ ok: true });
}
