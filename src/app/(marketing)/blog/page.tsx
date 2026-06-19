import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader } from '@/components/site/ui';
import { getAllContent, formatDate } from '@/lib/content';

export const metadata: Metadata = pageMeta({
  title: 'Blog',
  description: `Guides, product news, and ideas on AI chat, customer support, and lead generation from the ${BRAND.name} team.`,
  path: '/blog',
});

export default function BlogIndex() {
  const posts = getAllContent('blog');

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ])}
      />
      <PageHeader
        eyebrow="Blog"
        title="Ideas for a smarter front desk."
        subtitle="Practical guides on AI chat, support, and turning website visitors into customers."
      />

      <section className="container-x pb-20">
        {posts.length === 0 ? (
          <p className="text-center text-ink-soft">No posts yet — check back soon.</p>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-6">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="card-moo card-moo-hover block p-7"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
                  {p.date && <span>{formatDate(p.date)}</span>}
                  {p.date && <span>·</span>}
                  <span>{p.readingMinutes} min read</span>
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-xl font-bold text-ink">{p.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{p.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-brand-700">Read more →</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
