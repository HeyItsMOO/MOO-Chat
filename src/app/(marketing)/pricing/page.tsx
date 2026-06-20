import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN_LIST, CUSTOM_PLAN } from '@/lib/plans';
import { pageMeta, softwareAppJsonld, faqJsonld, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';
import { PricingPlans } from './PricingPlans';

export const metadata: Metadata = pageMeta({
  title: 'Pricing',
  description:
    'Simple monthly pricing for ChatMOO (AUD). Start free with 50 AI replies a month, then upgrade to Starter, Growth, or Business as you grow. New accounts get a 5-day Growth trial — no credit card.',
  path: '/pricing',
});

const PRICING_FAQ = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes. The Free plan includes 50 AI replies per month with lead capture — no credit card. New accounts also get a 5-day trial of the Growth plan (more replies, live chat, no branding), so you can try the full thing first.',
  },
  {
    q: 'What counts as a "message"?',
    a: 'Each AI reply the assistant generates counts as one message against your monthly allowance. Visitor messages and your own agent replies are not metered.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Anytime. Upgrade or downgrade from your dashboard billing page; changes take effect immediately and billing is prorated by the payment provider.',
  },
  {
    q: 'What happens if I hit my monthly limit?',
    a: 'The widget keeps working but AI replies soft-block until the next cycle or an upgrade, so you are never hit with a surprise bill.',
  },
  {
    q: 'How is billing handled?',
    a: 'Paid plans are billed monthly through PayPal Subscriptions. You can cancel at any time from the dashboard.',
  },
];

export default function PricingPage() {
  return (
    <main>
      <JsonLd
        data={[
          softwareAppJsonld(),
          faqJsonld(PRICING_FAQ),
          breadcrumbJsonld([
            { name: 'Home', path: '/' },
            { name: 'Pricing', path: '/pricing' },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="Pricing"
        title="Simple pricing, monthly or yearly."
        subtitle="Prices in AUD. Start free, or take a 5-day trial of Growth — no credit card. Go yearly for 2 months free, or talk to us about a Custom plan."
      />

      {/* Plan cards + monthly/yearly toggle + Custom band */}
      <section className="container-x pb-6">
        <PricingPlans />
      </section>

      {/* Comparison table */}
      <section className="container-x py-12">
        <h2 className="text-2xl font-bold">Compare plans</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-ink">Feature</th>
                {COMPARE_PLANS.map((p) => (
                  <th key={p.id} className="px-4 py-3 font-semibold text-ink">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-ink">{row.label}</td>
                  {COMPARE_PLANS.map((p) => (
                    <td key={p.id} className="px-4 py-3">{row.value(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x py-12">
        <h2 className="text-2xl font-bold">Pricing questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PRICING_FAQ.map((f) => (
            <div key={f.q} className="card-moo p-6" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>
              <h3 className="font-semibold text-ink">{f.q}</h3>
              <p className="mt-2 text-sm text-ink-soft">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          More questions? Visit the <Link href="/faq" className="font-medium text-brand-700 hover:underline">full FAQ</Link> or{' '}
          <Link href="/contact" className="font-medium text-brand-700 hover:underline">contact us</Link>.
        </p>
      </section>

      <CTASection title="Try it free — no card required." subtitle="Spin up your assistant in minutes and upgrade only when you grow." />
    </main>
  );
}

const COMPARE_PLANS = [...PLAN_LIST, CUSTOM_PLAN];

type PlanRow = { label: string; value: (p: (typeof COMPARE_PLANS)[number]) => string };
const yn = (b: boolean) => (b ? '✓' : '—');

const COMPARISON: PlanRow[] = [
  { label: 'AI replies / month', value: (p) => p.messagesPerMonth.toLocaleString() },
  { label: 'Lead capture', value: (p) => yn(p.features.leadCapture) },
  { label: 'Live chat handoff', value: (p) => yn(p.features.liveChat) },
  { label: 'Remove branding', value: (p) => yn(p.features.removeBranding) },
  { label: 'Custom scripts', value: (p) => yn(p.features.customScripts) },
  { label: 'Extra domains', value: (p) => String(p.features.extraDomains) },
  { label: 'AI model tiers', value: (p) => String(p.models.length) },
];
