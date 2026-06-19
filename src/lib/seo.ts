/**
 * SEO helpers. `pageMeta()` builds a complete Next.js Metadata object
 * (canonical + Open Graph + Twitter) from a short title/description, and the
 * `*Jsonld()` builders produce schema.org structured data for rich results.
 *
 * Absolute URLs resolve against `metadataBase` (set in app/layout.tsx) so we
 * only ever pass root-relative paths here.
 */
import type { Metadata } from 'next';
import { BRAND, APP_URL } from './brand';
import { PLAN_LIST } from './plans';

export const SITE_NAME = BRAND.name;

/** Build canonical + OG + Twitter metadata for a page. */
export function pageMeta(opts: {
  title: string;
  description: string;
  /** Root-relative path, e.g. "/pricing". */
  path: string;
  /** Use the exact title without the "· MOO Chat" suffix (for the home page). */
  titleAbsolute?: boolean;
  /** Override the social card image (defaults to the generated OG image). */
  image?: string;
  /** "website" (default) or "article" for blog posts. */
  type?: 'website' | 'article';
  /** Article metadata for blog posts. */
  publishedTime?: string;
  authors?: string[];
  /** Set true to keep a page out of search results. */
  noindex?: boolean;
}): Metadata {
  const fullTitle = opts.titleAbsolute ? opts.title : `${opts.title} · ${BRAND.name}`;
  return {
    title: opts.titleAbsolute ? { absolute: opts.title } : opts.title,
    description: opts.description,
    keywords: BRAND.keywords,
    alternates: { canonical: opts.path },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: fullTitle,
      description: opts.description,
      url: opts.path,
      siteName: BRAND.name,
      type: opts.type ?? 'website',
      locale: 'en_US',
      ...(opts.image ? { images: [{ url: opts.image }] } : {}),
      ...(opts.type === 'article'
        ? { publishedTime: opts.publishedTime, authors: opts.authors }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: opts.description,
      site: BRAND.twitterHandle,
      creator: BRAND.twitterHandle,
      ...(opts.image ? { images: [opts.image] } : {}),
    },
  };
}

function abs(path: string): string {
  return path.startsWith('http') ? path : `${APP_URL}${path}`;
}

/** schema.org Organization — published site-wide. */
export function organizationJsonld() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: APP_URL,
    logo: abs('/icon'),
    email: BRAND.supportEmail,
    sameAs: [BRAND.parentUrl],
    parentOrganization: { '@type': 'Organization', name: BRAND.parent, url: BRAND.parentUrl },
  };
}

/** schema.org WebSite with a sitelinks search box. */
export function websiteJsonld() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: APP_URL,
    publisher: { '@type': 'Organization', name: BRAND.name },
  };
}

/** schema.org SoftwareApplication with pricing offers (home / pricing). */
export function softwareAppJsonld() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: BRAND.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: BRAND.description,
    url: APP_URL,
    offers: PLAN_LIST.map((p) => ({
      '@type': 'Offer',
      name: `${p.name} plan`,
      price: String(p.priceMonthly),
      priceCurrency: 'USD',
      category: p.priceMonthly === 0 ? 'free' : 'subscription',
      url: abs('/pricing'),
    })),
  };
}

/** schema.org FAQPage from a list of Q&As. */
export function faqJsonld(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

/** schema.org BreadcrumbList. Pass [{name, path}] from home to current page. */
export function breadcrumbJsonld(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

/** schema.org BlogPosting for an individual article. */
export function blogPostingJsonld(post: {
  title: string;
  description: string;
  path: string;
  date?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: abs(post.path),
    ...(post.date ? { datePublished: post.date, dateModified: post.date } : {}),
    author: { '@type': 'Organization', name: post.author || BRAND.name },
    publisher: {
      '@type': 'Organization',
      name: BRAND.name,
      logo: { '@type': 'ImageObject', url: abs('/icon') },
    },
    ...(post.image ? { image: abs(post.image) } : {}),
  };
}
