import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMeta, blogPostingJsonld, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { Prose, CTASection } from '@/components/site/ui';
import { getContent, getContentSlugs, formatDate } from '@/lib/content';

export function generateStaticParams() {
  return getContentSlugs('blog').map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getContent('blog', slug);
  if (!post) return pageMeta({ title: 'Post not found', description: '', path: `/blog/${slug}`, noindex: true });
  return pageMeta({
    title: post.title,
    description: post.description,
    path: `/blog/${slug}`,
    type: 'article',
    publishedTime: post.date,
    authors: post.author ? [post.author] : undefined,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getContent('blog', slug);
  if (!post) notFound();

  return (
    <main>
      <JsonLd
        data={[
          blogPostingJsonld({
            title: post.title,
            description: post.description,
            path: `/blog/${slug}`,
            date: post.date,
            author: post.author,
            image: `/blog/${slug}/opengraph-image`,
          }),
          breadcrumbJsonld([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${slug}` },
          ]),
        ]}
      />

      <article className="container-x py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="text-sm text-ink-mute hover:text-ink">← All posts</Link>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-mute">
            {post.date && <span>{formatDate(post.date)}</span>}
            {post.date && <span>·</span>}
            <span>{post.readingMinutes} min read</span>
            {post.author && <span>· {post.author}</span>}
          </div>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">{post.title}</h1>
          <p className="mt-4 text-lg text-ink-soft">{post.description}</p>
          <hr className="my-8 border-slate-200" />
          <Prose html={post.html} />
        </div>
      </article>

      <CTASection />
    </main>
  );
}
