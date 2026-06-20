'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  PLAN_LIST,
  CUSTOM_PLAN,
  planPriceLabel,
  type BillingInterval,
} from '@/lib/plans';

export function PricingPlans() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <div>
      {/* Monthly / Yearly toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold ${interval === 'monthly' ? 'text-ink' : 'text-ink-mute'}`}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={interval === 'yearly'}
          aria-label="Toggle yearly billing"
          onClick={() => setInterval((i) => (i === 'monthly' ? 'yearly' : 'monthly'))}
          className={`relative h-7 w-12 flex-none rounded-full border-2 border-ink transition ${
            interval === 'yearly' ? 'bg-pasture' : 'bg-white'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink transition ${
              interval === 'yearly' ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
        <span className={`text-sm font-semibold ${interval === 'yearly' ? 'text-ink' : 'text-ink-mute'}`}>
          Yearly <span className="badge-moo ml-1 text-[10px] uppercase tracking-wide">2 months free</span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_LIST.map((p) => {
          const label = planPriceLabel(p, interval);
          return (
            <div
              key={p.id}
              className={`card-moo flex flex-col p-6 ${p.highlight ? 'bg-pasture-light' : ''}`}
              style={p.highlight ? { boxShadow: '8px 8px 0 #1a1a1a' } : undefined}
            >
              {p.highlight && (
                <div className="mb-2"><span className="badge-moo text-[11px] uppercase tracking-wide">Most popular</span></div>
              )}
              <h2 className="font-heading text-lg font-bold">{p.name}</h2>
              <div className="mt-2">
                <span className="font-heading text-4xl font-extrabold">{label.price}</span>
                {label.period && <span className="text-ink-mute">{label.period}</span>}
              </div>
              <div className="mt-1 min-h-[18px] text-xs font-semibold text-ink-mute">{label.sub}</div>
              <ul className="mt-4 flex-1 space-y-2 text-sm font-semibold text-ink-soft">
                <li>✓ {p.messagesPerMonth.toLocaleString()} AI replies / month</li>
                <li>{p.features.leadCapture ? '✓' : '·'} Lead capture form</li>
                <li>{p.features.liveChat ? '✓' : '·'} Live chat handoff</li>
                <li>{p.features.removeBranding ? '✓' : '·'} Remove branding</li>
                <li>{p.features.customScripts ? '✓' : '·'} Custom scripts</li>
                <li>
                  {p.features.extraDomains > 0 ? '✓' : '·'}{' '}
                  {p.features.extraDomains > 0 ? `${p.features.extraDomains} extra domain(s)` : 'Single domain'}
                </li>
              </ul>
              <Link
                href={p.priceMonthly === 0 ? '/signup' : `/signup?plan=${p.id}&interval=${interval}`}
                className={`mt-6 w-full text-center ${p.highlight ? 'btn-moo' : 'btn-ghost'}`}
              >
                {p.priceMonthly === 0 ? 'Start free' : `Choose ${p.name}`}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Custom / enterprise band */}
      <div
        className="card-moo mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{ boxShadow: '8px 8px 0 #1a1a1a' }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold">{CUSTOM_PLAN.name}</h2>
            <span className="badge-moo text-[10px] uppercase tracking-wide">Enterprise</span>
          </div>
          <p className="mt-1 max-w-xl text-sm font-semibold text-ink-soft">
            High-volume usage, custom limits, multiple domains, white-glove onboarding and a price tailored to you.
            Everything in Business, dialled up — {CUSTOM_PLAN.messagesPerMonth.toLocaleString()}+ replies/month and up
            to {CUSTOM_PLAN.features.extraDomains}+ domains.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="font-heading text-3xl font-extrabold">Let&apos;s talk</span>
          <Link href="/contact?topic=custom" className="btn-moo whitespace-nowrap">Contact sales</Link>
        </div>
      </div>
    </div>
  );
}
