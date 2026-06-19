import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { getAllContent } from '@/lib/content';

export const metadata: Metadata = pageMeta({
  title: 'Documentation',
  description: `Learn how to set up, customize, and install ${BRAND.name} — from creating your assistant to embedding it on WordPress, Shopify, or any website.`,
  path: '/docs',
});

export default function DocsIndex() {
  const docs = getAllContent('docs');

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Docs', path: '/docs' },
        ])}
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">Documentation</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Everything you need to get {BRAND.name} live on your website and tuned to your business.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {docs.map((d, i) => (
          <Link
            key={d.slug}
            href={`/docs/${d.slug}`}
            className="card-moo card-moo-hover p-6"
          >
            <div className="text-xs font-semibold text-brand-700">Step {i + 1}</div>
            <h2 className="mt-1 font-semibold text-ink">{d.title}</h2>
            {d.description && <p className="mt-2 text-sm text-ink-soft">{d.description}</p>}
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        Can&apos;t find what you need?{' '}
        <Link href="/contact" className="font-medium text-brand-700 hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}
