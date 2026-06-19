import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'About',
  description: `${BRAND.name} is a ${BRAND.parent} product that turns one AI chatbot into a front desk any business can install on its website in minutes.`,
  path: '/about',
});

export default function AboutPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <PageHeader
        eyebrow="About"
        title="We give every website a front desk."
        subtitle={`${BRAND.name} is a ${BRAND.parent} product, built on the belief that every business deserves an assistant that answers instantly and never misses a lead.`}
      />

      <section className="container-x pb-4">
        <div className="mx-auto max-w-3xl space-y-6 text-ink-soft">
          <p>
            Most small businesses lose customers in the gap between a question and an answer. Someone
            lands on your site at 9pm, can&apos;t find what they need, and quietly leaves. {BRAND.name}{' '}
            closes that gap with an assistant that knows your business and is always on.
          </p>
          <p>
            We started from a single insurance broker&apos;s website chatbot and asked a bigger question:
            what if any business could get the same thing in minutes, without wiring up AI keys or hiring
            developers? The answer became {BRAND.name} — one central, metered AI gateway that powers a
            branded assistant for each customer, installable with a single line of code.
          </p>
          <p>
            The product is intentionally simple to adopt and hard to outgrow: start free, capture leads
            from day one, add live human handoff as you scale, and keep every conversation on-brand and
            on-topic.
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="text-2xl">{v.icon}</div>
              <h2 className="mt-3 font-semibold text-ink">{v.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-12">
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <h2 className="text-2xl font-bold">Built by {BRAND.parent}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-soft">
            {BRAND.name} is made and operated by {BRAND.parent}. Have a question, a partnership idea, or
            press enquiry? We&apos;d love to hear from you.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">
              Contact us
            </Link>
            <a
              href={BRAND.parentUrl}
              target="_blank"
              rel="noopener"
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-ink hover:bg-white"
            >
              Visit {BRAND.parent} ↗
            </a>
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}

const VALUES = [
  { icon: '⚡', title: 'Fast to value', body: 'Live on your site in about five minutes. No developers, no AI keys, no setup tax.' },
  { icon: '🛡️', title: 'Trustworthy by default', body: 'Guardrails, domain allowlists, and metering keep the assistant safe, on-topic, and predictable.' },
  { icon: '🤝', title: 'Human when it counts', body: 'AI handles the routine; your team steps in for the moments that need a person.' },
];
