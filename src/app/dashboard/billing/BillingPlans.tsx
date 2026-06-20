'use client';

import { useState } from 'react';
import { PLAN_LIST, planPriceLabel, type BillingInterval } from '@/lib/plans';
import { BillingActions } from './BillingActions';

export function BillingPlans({
  actualPlanId,
  paypalConfigured,
  hasSubscription,
}: {
  actualPlanId: string;
  paypalConfigured: boolean;
  hasSubscription: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className={`text-sm font-semibold ${interval === 'monthly' ? 'text-ink' : 'text-ink-mute'}`}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === 'yearly'}
          aria-label="Toggle yearly billing"
          onClick={() => setInterval((i) => (i === 'monthly' ? 'yearly' : 'monthly'))}
          className={`relative h-6 w-11 flex-none rounded-full transition ${interval === 'yearly' ? 'bg-brand-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${interval === 'yearly' ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
        <span className={`text-sm font-semibold ${interval === 'yearly' ? 'text-ink' : 'text-ink-mute'}`}>
          Yearly <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-700">2 months free</span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAN_LIST.map((p) => {
          const isCurrent = p.id === actualPlanId;
          const label = planPriceLabel(p, interval);
          return (
            <div key={p.id} className={`rounded-2xl border p-5 ${isCurrent ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{p.name}</h3>
                {isCurrent && <span className="text-xs font-semibold text-brand-700">Current</span>}
              </div>
              <div className="mt-1 text-2xl font-extrabold">
                {label.price}
                {label.period && <span className="text-sm font-normal text-ink-mute">{label.period}</span>}
              </div>
              <div className="min-h-[16px] text-xs text-ink-mute">{label.sub}</div>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                <li>✓ {p.messagesPerMonth.toLocaleString()} replies / month</li>
                <li>{p.features.liveChat ? '✓' : '·'} Live chat handoff</li>
                <li>{p.features.removeBranding ? '✓' : '·'} Remove branding</li>
                <li>{p.features.customScripts ? '✓' : '·'} Custom scripts</li>
                <li>✓ {1 + p.features.extraDomains} domain(s)</li>
              </ul>
              <div className="mt-4">
                <BillingActions
                  planId={p.id}
                  interval={interval}
                  isCurrent={isCurrent}
                  paypalConfigured={paypalConfigured}
                  hasSubscription={hasSubscription}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        Need more than Business? <a href="/contact?topic=custom" className="font-semibold text-brand-700 hover:underline">Talk to us about a Custom plan</a>.
      </p>
    </div>
  );
}
