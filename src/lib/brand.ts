/**
 * Product branding. MOO Chat is a HeyItsMOO product.
 * Change these to re-skin the whole platform from one place.
 */
export const BRAND = {
  name: 'MOO Chat',
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
  supportEmail: 'hello@heyitsmoo.com',
  // ── SEO / marketing metadata (edit freely) ──
  // Longer, search-friendly description used as the default meta description.
  description:
    'MOO Chat is an AI chat assistant for any website. It answers customer questions from your own content, captures leads, and hands off to your team — installed with one line of code on WordPress, Shopify, or any site.',
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
    'Claude AI assistant',
  ],
};

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
