import { NextRequest, NextResponse } from 'next/server';
import { getCurrentContext } from '@/lib/auth';
import { APP_URL, BRAND } from '@/lib/brand';
import { PAID_PLAN_IDS, paypalPlanIdFor, type PlanId, type BillingInterval } from '@/lib/plans';
import { PAYPAL_CONFIGURED, createSubscription } from '@/lib/paypal';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { plan, interval: rawInterval } = await req.json().catch(() => ({ plan: '' }));
  if (!PAID_PLAN_IDS.includes(plan as PlanId)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }
  const interval: BillingInterval = rawInterval === 'yearly' ? 'yearly' : 'monthly';

  if (!PAYPAL_CONFIGURED) {
    return NextResponse.json(
      { error: 'Billing is not configured yet. Add your PayPal credentials to .env.' },
      { status: 503 },
    );
  }

  const ppPlanId = paypalPlanIdFor(plan as PlanId, interval);
  if (!ppPlanId) {
    return NextResponse.json(
      {
        error:
          interval === 'yearly'
            ? `No yearly PayPal plan id configured for ${plan}. Run scripts/paypal-setup.ts to create the yearly plans.`
            : `No PayPal plan id configured for ${plan}. Run scripts/paypal-setup.ts.`,
      },
      { status: 503 },
    );
  }

  try {
    const sub = await createSubscription({
      planId: ppPlanId,
      tenantId: ctx.tenant.id,
      brandName: BRAND.name,
      subscriberEmail: ctx.user.email,
      returnUrl: `${APP_URL}/api/billing/return`,
      cancelUrl: `${APP_URL}/dashboard/billing?cancelled=1`,
    });
    return NextResponse.json({ approveUrl: sub.approveUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PayPal error';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
