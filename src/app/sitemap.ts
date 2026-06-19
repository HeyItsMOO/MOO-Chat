import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/brand';
import { STATIC_ROUTES } from '@/lib/site';
import { getAllContent } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${APP_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = getAllContent('blog').map((p) => ({
    url: `${APP_URL}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const docsEntries: MetadataRoute.Sitemap = getAllContent('docs').map((d) => ({
    url: `${APP_URL}/docs/${d.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticEntries, ...blogEntries, ...docsEntries];
}
