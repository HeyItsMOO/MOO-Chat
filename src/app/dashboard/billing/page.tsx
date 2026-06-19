import { getCurrentContext } from '@/lib/auth';
import { getPlan, PLAN_LIST } from '@/lib/plans';
import { getUsage } from '@/lib/usage';
import { PAYPAL_CONFIGURED } from '@/lib/paypal';
import { BillingActions } from './BillingActions';

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
  const plan = getPlan(tenant.plan);
  const usage = await getUsage(tenant.id);
  const sp = await searchParams;
  const bannerKey = sp.upgraded ? 'upgraded' : sp.pending ? 'pending' : sp.cancelled ? 'cancelled' : sp.error ? 'error' : '';
  const banner = bannerKey ? BANNERS[bannerKey] : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing &amp; plan</h1>
        <p className="text-ink-soft">You&apos;re on the <strong>{plan.name}</strong> plan.</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAN_LIST.map((p) => (
          <div key={p.id} className={`rounded-2xl border p-5 ${p.id === plan.id ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{p.name}</h3>
              {p.id === plan.id && <span className="text-xs font-semibold text-brand-700">Current</span>}
            </div>
            <div className="mt-1 text-2xl font-extrabold">${p.priceMonthly}<span className="text-sm font-normal text-ink-mute">/mo</span></div>
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              <li>✓ {p.messagesPerMonth.toLocaleString()} replies / month</li>
              <li>{p.features.liveChat ? '✓' : '·'} Live chat handoff</li>
              <li>{p.features.removeBranding ? '✓' : '·'} Remove branding</li>
              <li>✓ {1 + p.features.extraDomains} domain(s)</li>
            </ul>
            <div className="mt-4">
              <BillingActions
                planId={p.id}
                isCurrent={p.id === plan.id}
                paypalConfigured={PAYPAL_CONFIGURED}
                hasSubscription={!!tenant.paypalSubscriptionId}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
