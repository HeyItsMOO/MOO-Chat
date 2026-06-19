import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { Prose } from '@/components/site/ui';
import { getAllContent, getContent, getContentSlugs } from '@/lib/content';

export function generateStaticParams() {
  return getContentSlugs('docs').map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getContent('docs', slug);
  if (!doc) return pageMeta({ title: 'Not found', description: '', path: `/docs/${slug}`, noindex: true });
  return pageMeta({ title: doc.title, description: doc.description, path: `/docs/${slug}` });
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getContent('docs', slug);
  if (!doc) notFound();

  // Previous/next navigation within the ordered docs set.
  const all = getAllContent('docs');
  const idx = all.findIndex((d) => d.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Docs', path: '/docs' },
          { name: doc.title, path: `/docs/${slug}` },
        ])}
      />
      <h1 className="text-3xl font-extrabold tracking-tight text-ink">{doc.title}</h1>
      {doc.description && <p className="mt-3 text-ink-soft">{doc.description}</p>}
      <hr className="my-6 border-slate-200" />
      <Prose html={doc.html} />

      <div className="mt-12 flex items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="text-brand-700 hover:underline">← {prev.title}</Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/docs/${next.slug}`} className="text-right text-brand-700 hover:underline">{next.title} →</Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
