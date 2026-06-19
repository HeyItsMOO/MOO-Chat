import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { Prose } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'Privacy Policy',
  description: `How ${BRAND.name} collects, uses, and protects personal data for account holders and website visitors who interact with the assistant.`,
  path: '/legal/privacy',
});

const LAST_UPDATED = 'June 1, 2026';

export default function PrivacyPage() {
  return (
    <main className="container-x py-16">
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Privacy Policy', path: '/legal/privacy' },
        ])}
      />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Privacy Policy</h1>
        <p className="mt-3 text-sm text-ink-mute">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This template policy is provided as a starting point and is not legal advice. Review it with a
          qualified professional before relying on it for your business.
        </div>

        <Prose>
          <h2>Overview</h2>
          <p>
            {BRAND.name} (&quot;{BRAND.name}&quot;, &quot;we&quot;, &quot;us&quot;) is a product of {BRAND.parent}. This
            policy explains what data we collect and how we use it, both for customers who hold an account
            and for visitors who interact with an assistant powered by {BRAND.name} on a customer&apos;s website.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Account data.</strong> Name, email, password hash, and the configuration of your
              assistant (persona, knowledge base, branding, domains).
            </li>
            <li>
              <strong>Conversation data.</strong> Messages exchanged with the assistant, lead-form
              submissions, and limited metadata (page URL, coarse timestamp, hashed IP, user agent) used
              for security, rate limiting, and analytics.
            </li>
            <li>
              <strong>Billing data.</strong> Subscription status and identifiers from our payment
              processor. We do not store full card details.
            </li>
            <li>
              <strong>Usage data.</strong> Aggregate counts of messages and tokens per account, used for
              metering and plan limits.
            </li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>To provide, operate, and improve the assistant and dashboard.</li>
            <li>To generate AI replies (your knowledge base is sent to our AI provider to answer questions).</li>
            <li>To capture and route leads to the account owner.</li>
            <li>To prevent abuse through rate limiting and domain allowlisting.</li>
            <li>To handle billing and account administration.</li>
          </ul>

          <h2>AI processing</h2>
          <p>
            Replies are generated using a leading third-party AI provider. The content you configure and the
            messages a visitor sends are processed to produce a response. We hold the AI provider key
            centrally; it is never exposed to the browser.
          </p>

          <h2>Sharing</h2>
          <p>
            We do not sell personal data. We share data only with service providers that help us run the
            product — for example our hosting, database, email, and AI providers — and only as needed to
            deliver the service or as required by law.
          </p>

          <h2>Data retention</h2>
          <p>
            Conversations, leads, and account data are retained for as long as your account is active. You
            can export or request deletion of your data by contacting us.
          </p>

          <h2>Cookies</h2>
          <p>
            We use essential cookies to keep you signed in and the site working, and we may use optional
            cookies to understand usage. You can manage optional cookies via the banner on the site.
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, export, or delete your
            personal data. To exercise these rights, contact us at{' '}
            <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? Email{' '}
            <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
          </p>
        </Prose>
      </div>
    </main>
  );
}
