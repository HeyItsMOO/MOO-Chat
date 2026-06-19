/**
 * Site map & navigation — one source of truth for the marketing site.
 * The header, footer, and sitemap.xml all read from here, so adding a page
 * in one place keeps navigation and SEO in sync.
 */

export interface NavLink {
  href: string;
  label: string;
  /** Optional one-line description (used in the header mega-menu / footer). */
  desc?: string;
  external?: boolean;
}

/** Primary header navigation. */
export const PRIMARY_NAV: NavLink[] = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
];

/** Footer columns. */
export const FOOTER_NAV: { heading: string; links: NavLink[] }[] = [
  {
    heading: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/integrations', label: 'Integrations' },
      { href: '/#demo', label: 'Live demo' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/blog', label: 'Blog' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/legal/privacy', label: 'Privacy' },
      { href: '/legal/terms', label: 'Terms' },
    ],
  },
];

/**
 * Static public routes for sitemap.xml (blog/docs entries are appended
 * dynamically from the content folder in app/sitemap.ts).
 */
export const STATIC_ROUTES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/features', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/integrations', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/docs', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
];
