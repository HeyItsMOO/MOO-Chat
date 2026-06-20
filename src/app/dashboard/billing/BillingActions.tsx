'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BillingActions({
  planId,
  interval = 'monthly',
  isCurrent,
  paypalConfigured,
  hasSubscription,
}: {
  planId: string;
  interval?: 'monthly' | 'yearly';
  isCurrent: boolean;
  paypalConfigured: boolean;
  hasSubscription: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isFree = planId === 'free';

  async function subscribe() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start checkout.');
        setBusy(false);
        return;
      }
      window.location.href = data.approveUrl; // → PayPal approval
    } catch {
      setError('Network error.');
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel your subscription and move to the Free plan?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not cancel.');
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
      setBusy(false);
    }
  }

  if (isCurrent) {
    // Offer cancel only if currently on a paid plan with a subscription.
    if (!isFree && hasSubscription) {
      return (
        <div>
          <button onClick={cancel} disabled={busy} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-slate-50 disabled:opacity-50">
            {busy ? 'Working…' : 'Cancel subscription'}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      );
    }
    return <div className="rounded-xl bg-slate-100 px-4 py-2 text-center text-sm text-ink-mute">Current plan</div>;
  }

  if (isFree) {
    // Downgrading to free = cancel the current sub.
    return hasSubscription ? (
      <div>
        <button onClick={cancel} disabled={busy} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-slate-50 disabled:opacity-50">
          {busy ? 'Working…' : 'Downgrade to Free'}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    ) : (
      <div className="rounded-xl bg-slate-100 px-4 py-2 text-center text-sm text-ink-mute">Default plan</div>
    );
  }

  return (
    <div>
      <button
        onClick={subscribe}
        disabled={busy || !paypalConfigured}
        title={paypalConfigured ? '' : 'PayPal not configured'}
        className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? 'Starting…' : hasSubscription ? `Switch to this plan` : `Subscribe with PayPal`}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
