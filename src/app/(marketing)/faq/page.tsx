import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, faqJsonld, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'FAQ',
  description: `Frequently asked questions about ${BRAND.name} — how the AI assistant works, what it can answer, installation, data and privacy, billing, and live human handoff.`,
  path: '/faq',
});

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is MOO Chat?',
    a: 'MOO Chat is an AI chat assistant you add to any website with one line of code. It answers visitor questions from your own content, captures leads, and can hand off to a human on your team.',
  },
  {
    q: 'How does it know about my business?',
    a: 'You give the assistant a knowledge base — products, policies, hours, and FAQs — plus a persona and guardrails. You can also paste your website URL to auto-fill the content, then edit it.',
  },
  {
    q: 'Will it make things up?',
    a: 'The assistant is instructed to answer only from the knowledge you provide and to defer or hand off when it does not know. Guardrails let you add your own rules to keep replies on-topic and compliant.',
  },
  {
    q: 'How do I install it on my site?',
    a: 'Paste a single <script> tag into your site. There are also dedicated integrations: a WordPress plugin and a Shopify theme app block. No developers required.',
  },
  {
    q: 'Does it work on WordPress and Shopify?',
    a: 'Yes. Use the script tag on any site, the WordPress plugin for WordPress, or the Shopify app block for Shopify themes.',
  },
  {
    q: 'Can a real person take over a conversation?',
    a: 'Yes, on Pro and Business plans. Visitors can request a human, your team is notified, and an agent takes over from the live console in the dashboard.',
  },
  {
    q: 'How is my data handled?',
    a: 'Conversations and leads are stored against your account so you can review and export them. The AI provider key is held centrally and never exposed to the browser. See our Privacy Policy for details.',
  },
  {
    q: 'What does it cost?',
    a: 'There is a free plan with 100 AI replies per month. Paid plans (Starter, Pro, Business) add more volume and features. See the pricing page for the full breakdown.',
  },
  {
    q: 'Which AI models power the assistant?',
    a: 'MOO Chat runs on Claude models. Higher plans unlock more capable model tiers for richer answers.',
  },
  {
    q: 'Can I match it to my brand?',
    a: 'Yes. Set your colors, header, welcome message, suggested questions, and widget position. Paid plans can also remove the "powered by" branding.',
  },
];

export default function FaqPage() {
  return (
    <main>
      <JsonLd
        data={[
          faqJsonld(FAQ),
          breadcrumbJsonld([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="FAQ"
        title="Frequently asked questions"
        subtitle="Everything you need to know about how MOO Chat works. Can't find an answer? Reach out anytime."
      />

      <section className="container-x pb-6">
        <div className="card-moo mx-auto max-w-3xl divide-y divide-cow-black/10">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-ink">
                {f.q}
                <span className="text-ink-mute transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-sm text-ink-soft">
          Still stuck? Read the <Link href="/docs" className="font-medium text-brand-700 hover:underline">docs</Link> or{' '}
          <Link href="/contact" className="font-medium text-brand-700 hover:underline">get in touch</Link>.
        </p>
      </section>

      <CTASection />
    </main>
  );
}
