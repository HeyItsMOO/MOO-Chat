import Link from 'next/link';
import type { Metadata } from 'next';
import { PLAN_LIST } from '@/lib/plans';
import { pageMeta, softwareAppJsonld, faqJsonld, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'Pricing',
  description:
    'Simple monthly pricing for MOO Chat. Start free with 100 AI replies a month, then upgrade to Starter, Pro, or Business as you grow. No credit card required to begin.',
  path: '/pricing',
});

const PRICING_FAQ = [
  {
    q: 'Is there really a free plan?',
    a: 'Yes. The Free plan includes 100 AI replies per month with lead capture, no credit card required. Upgrade only when you need more volume or features.',
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
        title="Simple, monthly pricing."
        subtitle="Start free. Upgrade when you grow. No credit card required to begin."
      />

      {/* Plan cards */}
      <section className="container-x pb-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIST.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                p.highlight ? 'border-brand-600 shadow-lg ring-1 ring-brand-600' : 'border-slate-200'
              }`}
            >
              {p.highlight && (
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Most popular</div>
              )}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <div className="mt-2">
                <span className="text-4xl font-extrabold">${p.priceMonthly}</span>
                <span className="text-ink-mute">/mo</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
                <li>✓ {p.messagesPerMonth.toLocaleString()} AI replies / month</li>
                <li>{p.features.leadCapture ? '✓' : '·'} Lead capture form</li>
                <li>{p.features.liveChat ? '✓' : '·'} Live chat handoff</li>
                <li>{p.features.removeBranding ? '✓' : '·'} Remove branding</li>
                <li>
                  {p.features.extraDomains > 0 ? '✓' : '·'}{' '}
                  {p.features.extraDomains > 0 ? `${p.features.extraDomains} extra domain(s)` : 'Single domain'}
                </li>
                <li>✓ {p.models.length} AI model tier{p.models.length > 1 ? 's' : ''}</li>
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block rounded-xl px-4 py-2.5 text-center font-semibold ${
                  p.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.priceMonthly === 0 ? 'Start free' : `Choose ${p.name}`}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="container-x py-12">
        <h2 className="text-2xl font-bold">Compare plans</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-3 pr-4 font-semibold text-ink">Feature</th>
                {PLAN_LIST.map((p) => (
                  <th key={p.id} className="px-4 py-3 font-semibold text-ink">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-ink">{row.label}</td>
                  {PLAN_LIST.map((p) => (
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
            <div key={f.q} className="rounded-2xl border border-slate-100 p-6">
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

type PlanRow = { label: string; value: (p: (typeof PLAN_LIST)[number]) => string };
const yn = (b: boolean) => (b ? '✓' : '—');

const COMPARISON: PlanRow[] = [
  { label: 'AI replies / month', value: (p) => p.messagesPerMonth.toLocaleString() },
  { label: 'Lead capture', value: (p) => yn(p.features.leadCapture) },
  { label: 'Live chat handoff', value: (p) => yn(p.features.liveChat) },
  { label: 'Remove branding', value: (p) => yn(p.features.removeBranding) },
  { label: 'Extra domains', value: (p) => String(p.features.extraDomains) },
  { label: 'AI model tiers', value: (p) => String(p.models.length) },
];
