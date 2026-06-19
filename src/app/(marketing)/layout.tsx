import Script from 'next/script';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { CookieConsent } from '@/components/site/CookieConsent';
import { StickyCTA } from '@/components/site/StickyCTA';
import { JsonLd } from '@/components/site/JsonLd';
import { organizationJsonld, websiteJsonld } from '@/lib/seo';
import { APP_URL, SITE_ASSISTANT_KEY } from '@/lib/brand';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Site-wide structured data */}
      <JsonLd data={[organizationJsonld(), websiteJsonld()]} />
      <div className="flex min-h-screen flex-col pb-[60px] lg:pb-0">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
      <CookieConsent />
      <StickyCTA />

      {/* ChatMOO's own always-on assistant (answers questions about ChatMOO). */}
      <Script src={`${APP_URL}/embed.js`} data-key={SITE_ASSISTANT_KEY} strategy="afterInteractive" />
    </>
  );
}
