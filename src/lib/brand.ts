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
};

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'http://localhost:3000';
