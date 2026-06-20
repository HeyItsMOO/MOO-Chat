import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import { PROMO_BENEFITS, normalizeCode } from '@/lib/promo';
import { PLANS, type PlanId } from '@/lib/plans';

export const runtime = 'nodejs';

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  description: z.string().max(200).optional().default(''),
  benefit: z.enum(PROMO_BENEFITS),
  planId: z.string().max(20).optional().default(''),
  days: z.number().int().min(0).max(3650).optional().default(0),
  percentOff: z.number().int().min(0).max(100).optional().default(0),
  durationMonths: z.number().int().min(1).max(60).optional().default(1),
  // Dollar amount for credit codes (converted to cents).
  amount: z.number().min(0).max(100000).optional().default(0),
  maxRedemptions: z.number().int().min(0).max(1000000).optional().default(0),
  expiresAt: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
});

/** Create a promo code. */
export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let data;
  try {
    data = schema.parse(await req.json());
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.errors[0]?.message : 'Invalid input';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const code = normalizeCode(data.code);
  if (!code) return NextResponse.json({ error: 'Enter a code.' }, { status: 400 });

  // Benefit-specific sanity checks.
  if (data.benefit === 'free_days' && data.days <= 0) {
    return NextResponse.json({ error: 'Set the number of days for a free-time code.' }, { status: 400 });
  }
  if (data.benefit === 'free_days' && data.planId && data.planId !== 'free' && !((data.planId as PlanId) in PLANS)) {
    return NextResponse.json({ error: `Unknown plan "${data.planId}".` }, { status: 400 });
  }
  if (data.benefit === 'percent_off' && (data.percentOff <= 0 || data.percentOff > 100)) {
    return NextResponse.json({ error: 'Percent off must be 1–100.' }, { status: 400 });
  }
  if (data.benefit === 'credit' && data.amount <= 0) {
    return NextResponse.json({ error: 'Set the credit amount.' }, { status: 400 });
  }

  let expiresAt: Date | null = null;
  if (data.expiresAt) {
    const d = new Date(data.expiresAt);
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid expiry date.' }, { status: 400 });
    expiresAt = d;
  }

  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: 'A code with that name already exists.' }, { status: 409 });

  await prisma.promoCode.create({
    data: {
      code,
      description: data.description,
      benefit: data.benefit,
      planId: data.benefit === 'free_days' ? data.planId : '',
      days: data.benefit === 'free_days' ? data.days : 0,
      percentOff: data.benefit === 'percent_off' ? data.percentOff : 0,
      durationMonths: data.benefit === 'percent_off' ? data.durationMonths : 1,
      amountCents: data.benefit === 'credit' ? Math.round(data.amount * 100) : 0,
      maxRedemptions: data.maxRedemptions,
      expiresAt,
      active: data.active,
    },
  });

  return NextResponse.json({ ok: true });
}

/** Toggle a code active/inactive. */
export async function PATCH(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, active } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  await prisma.promoCode.update({ where: { id: String(id) }, data: { active: !!active } });
  return NextResponse.json({ ok: true });
}

/** Delete a code (and its redemptions). */
export async function DELETE(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
  await prisma.promoCode.delete({ where: { id: String(id) } });
  return NextResponse.json({ ok: true });
}
