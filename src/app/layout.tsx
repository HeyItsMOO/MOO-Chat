import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND, APP_URL } from '@/lib/brand';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: BRAND.keywords,
  authors: [{ name: BRAND.parent, url: BRAND.parentUrl }],
  creator: BRAND.parent,
  publisher: BRAND.parent,
  alternates: { canonical: '/' },
  category: 'technology',
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    url: APP_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: BRAND.twitterHandle,
    creator: BRAND.twitterHandle,
    title: `${BRAND.name} — AI chat for your website`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: BRAND.color,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
