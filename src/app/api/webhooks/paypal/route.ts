import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature, getSubscription } from '@/lib/paypal';
import { planFromPaypalPlanId } from '@/lib/plans';

export const runtime = 'nodejs';

/**
 * PayPal subscription webhooks. Configure the webhook in the PayPal dashboard to
 * POST here and subscribe to the BILLING.SUBSCRIPTION.* and PAYMENT.SALE.COMPLETED events.
 *
 * SECURITY: we ALWAYS require a valid PayPal signature (fail closed). The only
 * way to skip it is the explicit local-dev opt-in PAYPAL_WEBHOOK_INSECURE=1,
 * which must never be set in any real environment.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  // Fail closed: a webhook is only trusted if PayPal's signature verifies.
  const verified = await verifyWebhookSignature(req.headers, event).catch(() => false);
  if (!verified) {
    if (process.env.PAYPAL_WEBHOOK_INSECURE === '1') {
      console.warn('[paypal webhook] PAYPAL_WEBHOOK_INSECURE=1 — processing UNVERIFIED event (dev only)');
    } else {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  const type: string = event.event_type || '';
  const resource = event.resource || {};

  async function findTenant() {
    if (resource.custom_id) {
      const t = await prisma.tenant.findUnique({ where: { id: resource.custom_id } });
      if (t) return t;
    }
    const subId = resource.id || resource.billing_agreement_id;
    if (subId) return prisma.tenant.findUnique({ where: { paypalSubscriptionId: subId } });
    return null;
  }

  const tenant = await findTenant();
  if (!tenant) return NextResponse.json({ ok: true, note: 'no matching tenant' });

  switch (type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'BILLING.SUBSCRIPTION.UPDATED': {
      // Re-fetch the authoritative subscription from PayPal rather than trusting
      // the (potentially stale/forged) event body for plan + status.
      const subId = resource.id || tenant.paypalSubscriptionId;
      let sub: any = resource;
      if (subId) {
        try {
          sub = await getSubscription(subId);
        } catch {
          sub = resource; // fall back to the verified event body
        }
      }
      // The subscription must belong to this tenant.
      if (sub.custom_id && sub.custom_id !== tenant.id) break;

      const ppStatus = sub.status;

      // Terminal/suspend statuses are handled FIRST, independent of plan
      // resolution, so a downgrade/suspension still applies even if plan_id is
      // missing or unrecognized.
      if (ppStatus === 'SUSPENDED') {
        await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'suspended' } });
        break;
      }
      if (ppStatus === 'CANCELLED' || ppStatus === 'EXPIRED') {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { plan: 'free', status: 'active', paypalSubscriptionId: null, paypalPlanId: null, planRenewsAt: null },
        });
        break;
      }

      // The upgrade path requires a recognized plan.
      const plan = planFromPaypalPlanId(sub.plan_id);
      if (!plan) break;

      if (ppStatus === 'ACTIVE' || (type === 'BILLING.SUBSCRIPTION.ACTIVATED' && !ppStatus)) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan,
            status: 'active',
            paypalSubscriptionId: subId || tenant.paypalSubscriptionId,
            paypalPlanId: sub.plan_id,
            planRenewsAt: sub.billing_info?.next_billing_time ? new Date(sub.billing_info.next_billing_time) : tenant.planRenewsAt,
          },
        });
      } else {
        // Intermediate state (e.g. APPROVAL_PENDING) — update plan metadata only.
        await prisma.tenant.update({ where: { id: tenant.id }, data: { paypalPlanId: sub.plan_id } });
      }
      break;
    }
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'suspended' } });
      break;
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'past_due' } });
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { plan: 'free', status: 'active', paypalSubscriptionId: null, paypalPlanId: null, planRenewsAt: null },
      });
      break;
    case 'PAYMENT.SALE.COMPLETED':
      if (tenant.status === 'past_due') {
        await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'active' } });
      }
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
