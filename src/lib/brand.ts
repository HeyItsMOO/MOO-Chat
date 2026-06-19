/**
 * Product branding. ChatMOO is a HeyItsMOO product.
 * Change these to re-skin the whole platform from one place.
 */
export const BRAND = {
  name: 'ChatMOO',
  shortName: 'MOO',
  emoji: '🐄',
  parent: 'HeyItsMOO',
  parentUrl: 'https://heyitsmoo.com',
  tagline: "Your website's AI front desk — answers questions, captures leads, and hands off to your team. A HeyItsMOO product.",
  // Marketing accent (HeyItsMOO pasture green).
  color: '#16a34a',
  // "Powered by" credit shown in the widget (matches the original plugin).
  poweredByText: 'Powered by HeyItsMOO.com',
  poweredByUrl: 'https://heyitsmoo.com',
  supportEmail: 'Holler@HeyItsMOO.com',
  // ── SEO / marketing metadata (edit freely) ──
  // Longer, search-friendly description used as the default meta description.
  description:
    'ChatMOO is an AI chat assistant for any website. It answers customer questions from your own content, captures leads, and hands off to your team — installed with one line of code on WordPress, Shopify, or any site.',
  // Social handle for Twitter/X cards (leave as-is or update to your real handle).
  twitterHandle: '@heyitsmoo',
  foundedYear: 2024,
  keywords: [
    'AI chatbot',
    'website chat assistant',
    'AI customer support',
    'lead capture chatbot',
    'live chat software',
    'WordPress chatbot',
    'Shopify chatbot',
    'AI front desk',
    'customer service automation',
    'AI website assistant',
  ],
};

/** Normalize NEXT_PUBLIC_APP_URL into a valid absolute origin (tolerates a
 *  scheme-less value like "example.com" by assuming https, and trims trailing slashes). */
function normalizeAppUrl(raw: string | undefined): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:3000';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const APP_URL = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

/** Public key of ChatMOO's own always-on assistant (seeded; answers about ChatMOO). */
export const SITE_ASSISTANT_KEY = 'chatmoo_site';
