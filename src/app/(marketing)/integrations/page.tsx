import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader, CTASection } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'Integrations',
  description: `Add ${BRAND.name} to any website with one script tag, the WordPress plugin, or the Shopify theme app block. No developers required.`,
  path: '/integrations',
});

export default function IntegrationsPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Integrations', path: '/integrations' },
        ])}
      />
      <PageHeader
        eyebrow="Integrations"
        title="Install anywhere in minutes."
        subtitle="One assistant, every platform. Use a single script tag, or a dedicated plugin for the tools you already run."
      />

      <section className="container-x pb-8">
        <div className="grid gap-6 md:grid-cols-3">
          {PLATFORMS.map((p) => (
            <div key={p.title} className="card-moo card-moo-hover flex flex-col p-7">
              <div className="text-3xl">{p.icon}</div>
              <h2 className="mt-3 text-xl font-bold text-ink">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{p.body}</p>
              <span className="mt-4 inline-block w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {p.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Snippet */}
      <section className="container-x py-10">
        <div className="card-moo p-7">
          <h2 className="text-xl font-bold">The one-line install</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Every plan generates a snippet like this. Paste it before <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.85em]">&lt;/body&gt;</code> on
            any site and the assistant goes live with your branding.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-relaxed text-slate-100">
{`<script src="${BRAND.parentUrl.replace('https://', 'https://app.')}/embed.js"
        data-key="moo_xxxxxxxx" async></script>`}
          </pre>
          <p className="mt-3 text-xs text-ink-mute">
            Your real snippet (with your public key) is shown in the dashboard under Install.
          </p>
        </div>
      </section>

      <section className="container-x pb-12">
        <div className="card-moo bg-pasture-light p-8 text-center">
          <h2 className="text-2xl font-bold">Don&apos;t see your platform?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-soft">
            If your site lets you add a script tag, ChatMOO works. Check the docs for platform-specific
            steps, or ask us.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/docs" className="btn-moo">
              Read the docs
            </Link>
            <Link href="/contact" className="btn-ghost">
              Ask a question
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}

const PLATFORMS = [
  {
    icon: '🌐',
    title: 'Any website',
    body: 'Paste one script tag into your HTML — before the closing body tag — and the widget appears with your branding. Works with static sites, builders, and custom apps.',
    badge: 'Script tag',
  },
  {
    icon: '📝',
    title: 'WordPress',
    body: 'Install the ChatMOO plugin, paste your public key, and publish. The assistant loads site-wide with no theme edits.',
    badge: 'Plugin',
  },
  {
    icon: '🛍️',
    title: 'Shopify',
    body: 'Add the ChatMOO theme app block from your Shopify theme editor, drop it in, and set your key. Live on your storefront instantly.',
    badge: 'Theme app block',
  },
];
