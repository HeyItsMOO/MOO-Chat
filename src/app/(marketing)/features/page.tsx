import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'Features',
  description:
    'Everything MOO Chat does: an AI assistant trained on your content, lead capture, live human handoff, on-brand theming, guardrails, usage analytics, and one-line install.',
  path: '/features',
});

export default function FeaturesPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Features', path: '/features' },
        ])}
      />
      <PageHeader
        eyebrow="Features"
        title="More than a chatbot — a front desk."
        subtitle="MOO Chat greets visitors, answers from your own knowledge, turns conversations into leads, and pulls in a human when it matters."
      />

      <section className="container-x pb-8">
        <div className="grid gap-6 md:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-slate-100 p-7 shadow-sm">
              <div className="text-2xl">{g.icon}</div>
              <h2 className="mt-3 text-xl font-bold text-ink">{g.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{g.body}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {g.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-brand-600">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-12">
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <h2 className="text-2xl font-bold">Works everywhere your customers are</h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-soft">
            Install with a single script tag, or use the dedicated WordPress plugin and Shopify app
            block. No developers required.
          </p>
          <Link href="/integrations" className="mt-5 inline-block font-semibold text-brand-700 hover:underline">
            See all integrations →
          </Link>
        </div>
      </section>

      <CTASection />
    </main>
  );
}

const GROUPS = [
  {
    icon: '🧠',
    title: 'Answers that are actually right',
    body: 'The assistant replies only from the knowledge you give it — your products, policies, hours, and FAQs.',
    points: [
      'Custom persona, tone, and knowledge base',
      'Paste your URL to auto-fill content',
      'Guardrails keep replies on-topic and compliant',
      'Suggested questions guide visitors',
    ],
  },
  {
    icon: '🎯',
    title: 'Turn chats into pipeline',
    body: 'A built-in, fully customizable enquiry form captures qualified leads right inside the conversation.',
    points: [
      'Configurable lead-capture fields',
      'Email notifications to your team',
      'Lead inbox + CSV export',
      'Every conversation stored and searchable',
    ],
  },
  {
    icon: '🙋',
    title: 'Real humans, when needed',
    body: 'Visitors can ask for a person. Your team gets notified and takes over from a live console.',
    points: [
      'One-click human handoff (Pro+)',
      'Live agent console with takeover',
      'Conversation history and context',
      'Status: bot, waiting, live, closed',
    ],
  },
  {
    icon: '🎨',
    title: 'Looks like part of your site',
    body: 'Match your colors, copy, and placement so the widget feels native — not bolted on.',
    points: [
      'Brand colors, header, and welcome message',
      'Left or right placement',
      'Optional "remove branding" on paid plans',
      'Mobile-friendly, accessible widget',
    ],
  },
  {
    icon: '📊',
    title: 'Usage you can see and control',
    body: 'Per-tenant metering keeps costs predictable, with plan limits and rate limiting built in.',
    points: [
      'Monthly message metering per plan',
      'Per-hour rate limits to stop abuse',
      'Domain allowlist for each site',
      'Multiple AI model tiers by plan',
    ],
  },
  {
    icon: '⚡',
    title: 'Set up in minutes',
    body: 'From sign-up to live on your site in about five minutes — no code beyond one script tag.',
    points: [
      'Guided onboarding',
      'Instant live preview',
      'One-line embed snippet',
      'WordPress plugin & Shopify block',
    ],
  },
];
