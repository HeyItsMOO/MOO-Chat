import { getCurrentContext } from '@/lib/auth';
import { getPlan, effectivePlan, isTrialActive, trialDaysLeft } from '@/lib/plans';
import { getUsage } from '@/lib/usage';
import { PAYPAL_CONFIGURED } from '@/lib/paypal';
import { BillingPlans } from './BillingPlans';

const BANNERS: Record<string, { text: string; tone: 'ok' | 'warn' | 'err' }> = {
  upgraded: { text: '🎉 You’re upgraded! Your new plan is active.', tone: 'ok' },
  pending: { text: 'Payment approved — your plan will activate shortly.', tone: 'warn' },
  cancelled: { text: 'Checkout cancelled. No change was made.', tone: 'warn' },
  error: { text: 'Something went wrong confirming your payment. Please try again or contact us.', tone: 'err' },
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const ctx = await getCurrentContext();
  if (!ctx?.tenant) return null;
  const tenant = ctx.tenant;
  const plan = effectivePlan(tenant); // what they can use right now (trial = top plan)
  const actualPlan = getPlan(tenant.plan); // their actual subscription tier
  const onTrial = isTrialActive(tenant);
  const usage = await getUsage(tenant.id);
  const sp = await searchParams;
  const bannerKey = sp.upgraded ? 'upgraded' : sp.pending ? 'pending' : sp.cancelled ? 'cancelled' : sp.error ? 'error' : '';
  const banner = bannerKey ? BANNERS[bannerKey] : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing &amp; plan</h1>
        {onTrial ? (
          <p className="text-ink-soft">
            You&apos;re trialing the <strong>{plan.name}</strong> plan — {trialDaysLeft(tenant)} day(s) left
            {tenant.trialEndsAt ? ` (ends ${new Date(tenant.trialEndsAt).toLocaleDateString()})` : ''}. Pick a plan
            below to keep your features after the trial.
          </p>
        ) : (
          <p className="text-ink-soft">You&apos;re on the <strong>{actualPlan.name}</strong> plan.</p>
        )}
      </div>

      {banner && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            banner.tone === 'ok'
              ? 'bg-green-50 text-green-700'
              : banner.tone === 'err'
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
          }`}
        >
          {banner.text}
        </div>
      )}

      {tenant.status === 'past_due' && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ Your last payment failed. Please update your payment method in PayPal to avoid suspension.
        </div>
      )}
      {tenant.status === 'suspended' && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          ⛔ Your subscription is suspended and the assistant is paused. Resubscribe below to reactivate.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm text-ink-mute">This month&apos;s usage ({usage.period})</div>
            <div className="mt-1 text-2xl font-bold">
              {usage.messageCount.toLocaleString()} / {plan.messagesPerMonth.toLocaleString()} replies
            </div>
          </div>
          {tenant.planRenewsAt && (
            <div className="text-sm text-ink-mute">Renews {new Date(tenant.planRenewsAt).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {!PAYPAL_CONFIGURED && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-ink-soft">
          💳 <strong>PayPal isn&apos;t connected yet.</strong> Add <code>PAYPAL_CLIENT_ID</code> / <code>PAYPAL_SECRET</code> to
          <code> .env</code> and run <code>npm run paypal:setup</code> to create the plans. Until then, upgrade buttons are disabled.
        </div>
      )}

      <BillingPlans
        actualPlanId={actualPlan.id}
        paypalConfigured={PAYPAL_CONFIGURED}
        hasSubscription={!!tenant.paypalSubscriptionId}
      />
    </div>
  );
}
