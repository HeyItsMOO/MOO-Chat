import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import { PLANS, type PlanId } from '@/lib/plans';

export const runtime = 'nodejs';

const VALID_STATUS = ['trialing', 'active', 'past_due', 'suspended'];

/** Admin override of a tenant's plan and/or status. */
export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { tenantId, plan, status } = await req.json().catch(() => ({}));
  const tenant = await prisma.tenant.findUnique({ where: { id: String(tenantId || '') } });
  if (!tenant) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const data: { plan?: string; status?: string } = {};
  if (plan && (plan as PlanId) in PLANS) data.plan = plan;
  if (status && VALID_STATUS.includes(status)) data.status = status;
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });

  await prisma.tenant.update({ where: { id: tenant.id }, data });
  return NextResponse.json({ ok: true });
}
