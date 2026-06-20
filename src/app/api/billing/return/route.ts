import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentContext } from '@/lib/auth';
import { APP_URL } from '@/lib/brand';
import { getSubscription } from '@/lib/paypal';
import { planFromPaypalPlanId } from '@/lib/plans';
import { markReferralEarned } from '@/lib/referral';

export const runtime = 'nodejs';

/**
 * PayPal redirects the subscriber here after they approve. We confirm the
 * subscription server-side (don't trust the redirect alone) and activate the plan.
 * The webhook is the source of truth for ongoing lifecycle; this just gives the
 * user instant feedback.
 */
export async function GET(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.redirect(`${APP_URL}/login`);

  const subId = req.nextUrl.searchParams.get('subscription_id');
  if (!subId) return NextResponse.redirect(`${APP_URL}/dashboard/billing?error=missing`);

  try {
    const sub = await getSubscription(subId);
    // Must belong to this tenant.
    if (sub.custom_id !== ctx.tenant.id) {
      return NextResponse.redirect(`${APP_URL}/dashboard/billing?error=mismatch`);
    }
    const plan = planFromPaypalPlanId(sub.plan_id);
    // Only grant the plan once PayPal reports ACTIVE (the first payment cleared).
    // APPROVED means the buyer agreed but billing hasn't started — defer to the webhook.
    const active = sub.status === 'ACTIVE';

    if (plan && active) {
      await prisma.tenant.update({
        where: { id: ctx.tenant.id },
        data: {
          plan,
          status: 'active',
          paypalSubscriptionId: subId,
          paypalPlanId: sub.plan_id,
          planRenewsAt: sub.billing_info?.next_billing_time ? new Date(sub.billing_info.next_billing_time) : null,
        },
      });
      // First paid activation → any referral commission for this tenant is earned.
      await markReferralEarned(ctx.tenant.id);
      return NextResponse.redirect(`${APP_URL}/dashboard/billing?upgraded=1`);
    }
    // Approved but not yet active — webhook will finish it.
    return NextResponse.redirect(`${APP_URL}/dashboard/billing?pending=1`);
  } catch {
    return NextResponse.redirect(`${APP_URL}/dashboard/billing?error=confirm`);
  }
}
