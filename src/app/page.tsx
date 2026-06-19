import Link from 'next/link';
import Script from 'next/script';
import { BRAND, APP_URL } from '@/lib/brand';
import { PLAN_LIST } from '@/lib/plans';

// Public key of the demo tenant created by the seed (fixed, see prisma/seed.ts).
const DEMO_KEY = 'moo_demo_insuregroup';

export default function Landing() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="container-x flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white text-sm">{BRAND.emoji}</span>
            {BRAND.name}
          </div>
          <nav className="flex items-center gap-6 text-sm text-ink-soft">
            <a href="#features" className="hidden sm:inline hover:text-ink">Features</a>
            <a href="#pricing" className="hidden sm:inline hover:text-ink">Pricing</a>
            <Link href="/login" className="hover:text-ink">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-x py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            AI chat for any website — live in 5 minutes
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Your website&apos;s AI front desk.
          </h1>
          <p className="mt-5 text-lg text-ink-soft">
            {BRAND.name} answers customer questions from your own content, captures leads, and hands off
            to your team when needed. Paste one line of code — works on WordPress, Shopify, or any site.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
              Build your assistant free
            </Link>
            <a href="#demo" className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-ink hover:bg-slate-50">
              See a live demo ↘
            </a>
          </div>
          <p className="mt-3 text-xs text-ink-mute">No credit card required · 100 free messages / month</p>
        </div>
      </section>

      {/* Demo prompt */}
      <section id="demo" className="container-x pb-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h2 className="text-xl font-bold">Try it right now 👉</h2>
          <p className="mt-2 text-ink-soft">
            A real assistant is running in the corner of this page (seeded with a sample insurance business).
            Click the chat bubble and ask it something.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-x py-16">
        <h2 className="text-center text-3xl font-bold">Everything a store needs</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="container-x">
          <h2 className="text-center text-3xl font-bold">Live in three steps</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{i + 1}</div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-x py-16">
        <h2 className="text-center text-3xl font-bold">Simple, monthly pricing</h2>
        <p className="mt-2 text-center text-ink-soft">Start free. Upgrade when you grow.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-4 sm:grid-cols-2">
          {PLAN_LIST.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border p-6 ${p.highlight ? 'border-brand-600 shadow-lg ring-1 ring-brand-600' : 'border-slate-200'}`}
            >
              {p.highlight && <div className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Most popular</div>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-extrabold">${p.priceMonthly}</span>
                <span className="text-ink-mute">/mo</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                <li>✓ {p.messagesPerMonth.toLocaleString()} AI replies / month</li>
                <li>{p.features.leadCapture ? '✓' : '·'} Lead capture</li>
                <li>{p.features.liveChat ? '✓' : '·'} Live chat handoff</li>
                <li>{p.features.removeBranding ? '✓' : '·'} Remove branding</li>
              </ul>
              <Link
                href="/signup"
                className={`mt-6 block rounded-xl px-4 py-2.5 text-center font-semibold ${
                  p.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.priceMonthly === 0 ? 'Start free' : 'Choose ' + p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-20">
        <div className="rounded-3xl bg-brand-600 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">Give your website a brain.</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Set up your AI assistant in minutes and never miss a customer question again.
          </p>
          <Link href="/signup" className="mt-7 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="container-x flex flex-col items-center justify-between gap-3 text-sm text-ink-mute sm:flex-row">
          <span>© {new Date().getFullYear()} {BRAND.name} — a {BRAND.parent} product</span>
          <span>
            Built on Claude ·{' '}
            <a href={BRAND.parentUrl} className="hover:text-ink" target="_blank" rel="noopener">{BRAND.parent}</a>
          </span>
        </div>
      </footer>

      {/* Live demo widget */}
      <Script src={`${APP_URL}/embed.js`} data-key={DEMO_KEY} strategy="afterInteractive" />
    </main>
  );
}

const FEATURES = [
  { icon: '🧠', title: 'Knows your business', body: 'Answers from your own knowledge base — products, policies, FAQs, hours. Never makes up facts.' },
  { icon: '🎯', title: 'Captures leads', body: 'Turns conversations into qualified leads with a built-in, customizable enquiry form.' },
  { icon: '🙋', title: 'Human handoff', body: 'Visitors can ask for a person; your team jumps in from the dashboard and takes over.' },
  { icon: '🎨', title: 'On-brand', body: 'Match your colors, copy, and position. It looks like part of your site, not a bolt-on.' },
  { icon: '🛡️', title: 'Safe by default', body: 'Built-in guardrails keep answers on-topic and compliant. Set your own rules too.' },
  { icon: '⚡', title: 'One line to install', body: 'Paste a single script tag, or use the WordPress / Shopify install. No developers needed.' },
];

const STEPS = [
  { title: 'Describe your business', body: 'Tell the assistant about your products and add your FAQs — or paste your website to auto-fill it.' },
  { title: 'Make it yours', body: 'Set the colors, welcome message, and suggested questions. Preview it instantly.' },
  { title: 'Paste & go live', body: 'Drop one script tag on your site. The assistant is live and answering customers.' },
];
