import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { cancelSubscription } from '@/lib/paypal';

export const runtime = 'nodejs';

export async function POST() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const subId = ctx.tenant.paypalSubscriptionId;
  if (subId) {
    try {
      await cancelSubscription(subId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PayPal error';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // Drop to the free tier immediately (keeps the assistant running, just limited).
  await prisma.tenant.update({
    where: { id: ctx.tenant.id },
    data: { plan: 'free', status: 'active', paypalSubscriptionId: null, paypalPlanId: null, planRenewsAt: null },
  });

  return NextResponse.json({ ok: true });
}
