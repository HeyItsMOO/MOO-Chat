import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { BRAND, APP_URL } from '@/lib/brand';
import { pageMeta, softwareAppJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { CTASection } from '@/components/site/ui';
import { Reveal } from '@/components/site/Reveal';
import { Stars } from '@/components/site/Stars';
import { ChatMockup } from '@/components/site/ChatMockup';

// Public key of the demo tenant created by the seed (fixed, see prisma/seed.ts).
const DEMO_KEY = 'moo_demo_insuregroup';

export const metadata: Metadata = pageMeta({
  title: `${BRAND.name} — AI chat for your website that captures leads`,
  titleAbsolute: true,
  description: BRAND.description,
  path: '/',
});

export default function Landing() {
  return (
    <main>
      <JsonLd data={softwareAppJsonld()} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero text-white">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> AI chat for any website — live in 5 minutes
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
              Your website&apos;s <span className="text-brand-400">AI front desk.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              {BRAND.name} answers customer questions from your own content, captures leads, and hands off
              to your team when needed. Paste one line of code — works on WordPress, Shopify, or any site.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:bg-brand-500">
                Get started free
              </Link>
              <a href="#demo" className="rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
                See a live demo ↘
              </a>
            </div>
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-400">
              <Stars />
              <span>No credit card · 100 free messages / month</span>
            </div>
          </div>

          <Reveal className="lg:pl-6">
            <ChatMockup />
          </Reveal>
        </div>

        {/* Trust badges */}
        <div className="relative border-t border-white/10">
          <div className="container-x grid grid-cols-2 gap-px sm:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.label} className="px-4 py-5 text-center">
                <div className="text-xl font-extrabold text-white">{t.value}</div>
                <div className="mt-1 text-xs text-slate-400">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform strip ───────────────────────────────────── */}
      <section className="border-b border-slate-100 py-10">
        <p className="container-x text-center text-sm font-medium text-ink-mute">
          Works on every platform — one line of code
        </p>
        <div className="relative mt-6 overflow-hidden">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap px-6 text-lg font-bold text-slate-300">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span key={i} className="shrink-0">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it does ─────────────────────────────────────── */}
      <section id="features" className="container-x scroll-mt-20 py-20">
        <Reveal>
          <SectionHeading
            eyebrow="What it does"
            title="More than a chatbot — a front desk."
            subtitle="Everything your website needs to greet visitors, answer accurately, and turn conversations into customers."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-slate-100 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-2xl">{f.icon}</div>
                <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/features" className="font-semibold text-brand-700 hover:underline">Explore all features →</Link>
        </div>
      </section>

      {/* ── Without / With ───────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="The difference"
              title="From silent bounces to booked leads."
              subtitle="Every unanswered question is a customer slipping away. Here's what changes when your site has a front desk."
            />
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-7">
                <h3 className="text-lg font-bold text-ink">Without {BRAND.name}</h3>
                <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                  {WITHOUT.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="mt-0.5 text-red-400">✕</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="h-full rounded-2xl border border-brand-200 bg-white p-7 shadow-md ring-1 ring-brand-100">
                <h3 className="text-lg font-bold text-ink">With {BRAND.name}</h3>
                <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                  {WITH.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span className="mt-0.5 text-brand-600">✓</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  Start free
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Why choose ───────────────────────────────────────── */}
      <section className="container-x py-20">
        <Reveal>
          <SectionHeading eyebrow="Why teams choose us" title="Set up in minutes. Hard to outgrow." />
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 60}>
              <div className="h-full rounded-2xl border border-slate-100 p-6 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-2xl text-white">{w.icon}</div>
                <h3 className="mt-4 font-semibold text-ink">{w.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{w.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Stats band ───────────────────────────────────────── */}
      <section className="bg-hero text-white">
        <div className="container-x grid grid-cols-2 gap-8 py-16 text-center lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-brand-400">{s.value}</div>
              <div className="mt-2 text-sm text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container-x py-20">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Live in three steps." />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="relative h-full rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</div>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/docs/getting-started" className="font-semibold text-brand-700 hover:underline">Read the setup guide →</Link>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading eyebrow="Loved by teams" title="What people say." />
          </Reveal>
          {/* NOTE: sample testimonials — replace with your real customer quotes. */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 70}>
                <figure className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                  <Stars />
                  <blockquote className="mt-3 flex-1 text-sm text-ink-soft">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                      {t.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{t.name}</span>
                      <span className="block text-xs text-ink-mute">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Offer banner ─────────────────────────────────────── */}
      <section className="container-x py-16">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-brand-200 bg-brand-50 px-8 py-10 text-center sm:flex-row sm:text-left">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-brand-700">Start free</div>
              <h2 className="mt-1 text-2xl font-bold text-ink">100 AI replies a month — on us.</h2>
              <p className="mt-1 text-ink-soft">No credit card. Upgrade only when you grow.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/signup" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">Get started</Link>
              <Link href="/pricing" className="rounded-xl border border-brand-300 px-6 py-3 font-semibold text-brand-700 hover:bg-white">See pricing</Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="container-x py-16">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Quick answers." />
        </Reveal>
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-slate-100 rounded-2xl border border-slate-100">
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
        <div className="mt-6 text-center">
          <Link href="/faq" className="font-semibold text-brand-700 hover:underline">See all FAQs →</Link>
        </div>
      </section>

      <CTASection />

      {/* Live demo widget */}
      <Script src={`${APP_URL}/embed.js`} data-key={DEMO_KEY} strategy="afterInteractive" />
    </main>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-bold uppercase tracking-wide text-brand-700">{eyebrow}</span>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-ink-soft">{subtitle}</p>}
    </div>
  );
}

const TRUST = [
  { value: '5 min', label: 'to go live' },
  { value: '1 line', label: 'of code to install' },
  { value: '24/7', label: 'instant answers' },
  { value: '100% ', label: 'on-brand' },
];

const PLATFORMS = ['WordPress', 'Shopify', 'Webflow', 'Wix', 'Squarespace', 'Framer', 'Custom HTML'];

const FEATURES = [
  { icon: '🧠', title: 'Knows your business', body: 'Answers from your own knowledge base — products, policies, FAQs, hours. Never makes up facts.' },
  { icon: '🎯', title: 'Captures leads', body: 'Turns conversations into qualified leads with a built-in, customizable enquiry form.' },
  { icon: '🙋', title: 'Human handoff', body: 'Visitors can ask for a person; your team jumps in from the dashboard and takes over.' },
  { icon: '🎨', title: 'On-brand', body: 'Match your colors, copy, and position. It looks like part of your site, not a bolt-on.' },
  { icon: '🛡️', title: 'Safe by default', body: 'Built-in guardrails keep answers on-topic and compliant. Set your own rules too.' },
  { icon: '⚡', title: 'One line to install', body: 'Paste a single script tag, or use the WordPress / Shopify install. No developers needed.' },
];

const WITHOUT = [
  'Visitors leave when they can’t find an answer fast.',
  'After-hours questions go unanswered until morning.',
  'Leads slip away with no way to capture them.',
  'Your team repeats the same answers all day.',
];

const WITH = [
  'Instant, accurate answers from your own content — 24/7.',
  'Every visitor greeted and guided to the next step.',
  'Qualified leads captured right inside the chat.',
  'Humans step in only when it actually matters.',
];

const WHY = [
  { icon: '⚡', title: 'Fast to value', body: 'From sign-up to live on your site in about five minutes.' },
  { icon: '🔒', title: 'Safe & metered', body: 'Guardrails, domain allowlists, and usage limits keep it predictable.' },
  { icon: '🎛️', title: 'Fully yours', body: 'Persona, knowledge, branding, and behaviour — all editable.' },
  { icon: '📈', title: 'Grows with you', body: 'Start free; add live chat and more volume as you scale.' },
];

const STATS = [
  { value: '5 min', label: 'Average time to go live' },
  { value: '1 line', label: 'Of code to install' },
  { value: '24/7', label: 'Always answering' },
  { value: '100', label: 'Free messages / month' },
];

const STEPS = [
  { title: 'Describe your business', body: 'Tell the assistant about your products and add your FAQs — or paste your website to auto-fill it.' },
  { title: 'Make it yours', body: 'Set the colors, welcome message, and suggested questions. Preview it instantly.' },
  { title: 'Paste & go live', body: 'Drop one script tag on your site. The assistant is live and answering customers.' },
];

// Sample testimonials — replace with real customer quotes before launch.
const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Salon owner', quote: 'It answers booking and pricing questions while we’re with clients. We stopped losing after-hours enquiries overnight.' },
  { name: 'Daniel K.', role: 'Agency founder', quote: 'Set up in an afternoon across three client sites. The lead capture alone paid for it in the first week.' },
  { name: 'Priya R.', role: 'E-commerce manager', quote: 'On-brand, accurate, and it knows when to hand off to a human. Our support inbox is noticeably quieter.' },
];

const FAQ = [
  { q: 'How long does setup take?', a: 'About five minutes. Create an assistant, add your knowledge (or auto-fill from your URL), and paste one script tag.' },
  { q: 'Will it make things up?', a: 'It answers only from the knowledge you provide and defers or hands off when unsure. You set guardrails to keep it on-topic.' },
  { q: 'Does it work on my platform?', a: 'If your site supports a script tag, yes. There are also dedicated WordPress and Shopify installs.' },
  { q: 'Is there a free plan?', a: 'Yes — 100 AI replies a month, no credit card required. Upgrade only when you need more.' },
];
