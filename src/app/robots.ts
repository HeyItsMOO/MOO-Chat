import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/brand';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep the app (authed) and API surfaces out of the index.
        disallow: ['/dashboard', '/admin', '/api/', '/onboarding'],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
