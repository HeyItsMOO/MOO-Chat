import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const ACTIONS = ['paid', 'void', 'earned'] as const;
type Action = (typeof ACTIONS)[number];

/** Admin: update a referral commission's payout status. */
export async function POST(req: NextRequest) {
  const admin = await requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { referralId, action } = await req.json().catch(() => ({}));
  if (!ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: 'bad_action' }, { status: 400 });
  }

  const referral = await prisma.referral.findUnique({ where: { id: String(referralId || '') } });
  if (!referral) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const data =
    action === 'paid'
      ? { status: 'paid', paidAt: new Date() }
      : action === 'void'
        ? { status: 'void' }
        : { status: 'earned', paidAt: null }; // revert a paid/void back to payable

  await prisma.referral.update({ where: { id: referral.id }, data });
  return NextResponse.json({ ok: true });
}
