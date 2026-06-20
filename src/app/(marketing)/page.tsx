import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, softwareAppJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { CTASection } from '@/components/site/ui';
import { Reveal } from '@/components/site/Reveal';
import { Stars } from '@/components/site/Stars';
import { ChatMockup } from '@/components/site/ChatMockup';

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
      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="badge-moo">🐄 AI chat for any website — live in 5 minutes</span>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-cow-black sm:text-6xl">
            Your website&apos;s{' '}
            <span className="highlight-green inline-block" style={{ transform: 'rotate(-2deg)' }}>AI front desk.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-bold text-ink-soft">
            {BRAND.name} answers customer questions from your own content, captures leads, and hands off
            to your team when needed. Paste one line of code — works on WordPress, Shopify, or any site.
            No bull. 🐄
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn-moo text-lg">Get started free 🚀</Link>
            <a href="#demo" className="btn-ghost text-lg">See a live demo ↘</a>
          </div>
          <div className="mt-5 flex items-center gap-3 text-sm font-bold text-ink-soft">
            <Stars />
            <span>No credit card · 5-day Growth trial + free plan</span>
          </div>
        </div>

        <Reveal className="lg:pl-6">
          <ChatMockup />
        </Reveal>
      </section>

      {/* ── Stats / trust bar ────────────────────────────────── */}
      <section className="container-x pb-8">
        <div
          className="organic-border flex flex-wrap items-center justify-around gap-6 border-4 border-cow-black bg-cow-black px-6 py-7 text-center"
          style={{ boxShadow: '8px 8px 0 #4ade80' }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-3xl font-bold text-pasture">{s.value}</div>
              <div className="mt-1 text-sm font-bold text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo prompt ──────────────────────────────────────── */}
      <section id="demo" className="container-x scroll-mt-24 py-8">
        <Reveal>
          <div className="card-moo p-8 text-center">
            <h2 className="font-heading text-2xl font-bold text-cow-black">Try it right now 👉</h2>
            <p className="mt-2 font-bold text-ink-soft">
              Our own {BRAND.name} assistant is running in the corner of this page. Click the chat bubble
              and ask it anything about {BRAND.name} — pricing, install, features. That&apos;s the product.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Platform strip ───────────────────────────────────── */}
      <section className="border-y-4 border-dashed border-pasture/60 py-8">
        <p className="container-x text-center font-heading text-sm font-bold uppercase tracking-wide text-ink-mute">
          Works on every platform — one line of code
        </p>
        <div className="relative mt-5 overflow-hidden">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap px-6 font-heading text-xl font-bold text-cow-black/70">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span key={i} className="shrink-0">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it does ─────────────────────────────────────── */}
      <section id="features" className="container-x scroll-mt-24 py-12">
        <Reveal>
          <SectionHeading
            eyebrow="What it does"
            title="More than a chatbot — a front desk."
            subtitle="Everything your website needs to greet visitors, answer accurately, and turn conversations into customers."
          />
        </Reveal>
        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="card-moo card-moo-hover h-full p-6">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-cow-black bg-accent text-2xl"
                  style={{ boxShadow: '3px 3px 0 #1a1a1a' }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-cow-black">{f.title}</h3>
                <p className="mt-2 text-sm font-semibold text-ink-soft">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/features" className="font-heading font-bold text-pasture-deep hover:underline">Explore all features →</Link>
        </div>
      </section>

      {/* ── Without / With ───────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <SectionHeading
            eyebrow="The difference"
            title="From silent bounces to booked leads."
            subtitle="Every unanswered question is a customer slipping away. Here's what changes when your site has a front desk."
          />
        </Reveal>
        <div className="mt-12 grid gap-7 md:grid-cols-2">
          <Reveal>
            <div className="card-moo h-full p-7" style={{ boxShadow: '8px 8px 0 #d1d5db' }}>
              <h3 className="font-heading text-lg font-bold text-cow-black">Without {BRAND.name} 😴</h3>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-ink-soft">
                {WITHOUT.map((x) => (
                  <li key={x} className="flex gap-3"><span className="mt-0.5 font-bold text-red-500">✕</span><span>{x}</span></li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="card-moo h-full bg-pasture-light p-7">
              <h3 className="font-heading text-lg font-bold text-cow-black">With {BRAND.name} 🚀</h3>
              <ul className="mt-4 space-y-3 text-sm font-semibold text-ink-soft">
                {WITH.map((x) => (
                  <li key={x} className="flex gap-3"><span className="mt-0.5 font-bold text-pasture-deep">✓</span><span>{x}</span></li>
                ))}
              </ul>
              <Link href="/signup" className="btn-moo mt-6 text-sm">Start free</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Why choose ───────────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <SectionHeading eyebrow="Why teams choose us" title="Set up in minutes. Hard to outgrow." />
        </Reveal>
        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 60}>
              <div className="card-moo card-moo-hover h-full p-6 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-cow-black bg-pasture text-2xl"
                  style={{ boxShadow: '3px 3px 0 #1a1a1a' }}
                >
                  {w.icon}
                </div>
                <h3 className="mt-4 font-heading font-bold text-cow-black">{w.title}</h3>
                <p className="mt-2 text-sm font-semibold text-ink-soft">{w.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Live in three steps." />
        </Reveal>
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <div className="card-moo h-full p-7">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-cow-black bg-accent font-heading text-lg font-bold text-cow-black"
                  style={{ boxShadow: '3px 3px 0 #1a1a1a' }}
                >
                  {i + 1}
                </div>
                <h3 className="mt-4 font-heading font-bold text-cow-black">{s.title}</h3>
                <p className="mt-2 text-sm font-semibold text-ink-soft">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/docs/getting-started" className="font-heading font-bold text-pasture-deep hover:underline">Read the setup guide →</Link>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <SectionHeading eyebrow="Loved by teams" title="What people say." />
        </Reveal>
        {/* NOTE: sample testimonials — replace with your real customer quotes. */}
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 70}>
              <figure className="card-moo flex h-full flex-col p-7">
                <Stars />
                <blockquote className="mt-3 flex-1 text-sm font-semibold text-ink-soft">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-cow-black bg-pasture font-heading font-bold text-cow-black">
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-cow-black">{t.name}</span>
                    <span className="block text-xs font-semibold text-ink-mute">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Offer banner ─────────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <div
            className="flex flex-col items-center justify-between gap-6 rounded-3xl border-4 border-cow-black bg-accent px-8 py-10 text-center sm:flex-row sm:text-left"
            style={{ boxShadow: '8px 8px 0 #1a1a1a' }}
          >
            <div>
              <div className="font-heading text-xs font-bold uppercase tracking-widest text-cow-black">Launch offer</div>
              <h2 className="mt-1 font-heading text-2xl font-bold text-cow-black">Try Growth free for 5 days.</h2>
              <p className="mt-1 font-bold text-cow-black/80">No credit card. Then 50 free replies/month, or upgrade anytime.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/signup" className="btn-dark">Get started</Link>
              <Link href="/pricing" className="btn-ghost">See pricing</Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="container-x py-12">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Quick answers. No bull." />
        </Reveal>
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {FAQ.map((f) => (
            <details key={f.q} className="card-moo group p-6 [&_summary::-webkit-details-marker]:hidden" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-lg font-bold text-cow-black">
                {f.q}
                <span className="font-bold text-pasture-deep transition group-open:rotate-45 group-open:text-accent-dark">＋</span>
              </summary>
              <p className="mt-3 text-sm font-semibold text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/faq" className="font-heading font-bold text-pasture-deep hover:underline">See all FAQs →</Link>
        </div>
      </section>

      <CTASection />
    </main>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="badge-moo uppercase tracking-wide">{eyebrow}</span>
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-cow-black sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 font-bold text-ink-soft">{subtitle}</p>}
    </div>
  );
}

const STATS = [
  { value: '5 min', label: 'to go live' },
  { value: '1 line', label: 'of code to install' },
  { value: '24/7', label: 'instant answers' },
  { value: '5-day', label: 'free Growth trial' },
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
  { q: 'Is there a free plan?', a: 'Yes — 50 free replies a month, no credit card. New accounts also get a 5-day trial of the Growth plan so you can try the full thing first.' },
];
