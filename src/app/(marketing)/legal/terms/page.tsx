import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { Prose } from '@/components/site/ui';

export const metadata: Metadata = pageMeta({
  title: 'Terms of Service',
  description: `The terms governing your use of ${BRAND.name}, including acceptable use, subscriptions and billing, content ownership, and liability.`,
  path: '/legal/terms',
});

const LAST_UPDATED = 'June 1, 2026';

export default function TermsPage() {
  return (
    <main className="container-x py-16">
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Terms of Service', path: '/legal/terms' },
        ])}
      />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Terms of Service</h1>
        <p className="mt-3 text-sm text-ink-mute">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This template is provided as a starting point and is not legal advice. Have a qualified
          professional review it before relying on it for your business.
        </div>

        <Prose>
          <h2>1. Agreement</h2>
          <p>
            These Terms govern your access to and use of {BRAND.name} (the &quot;Service&quot;), a product of{' '}
            {BRAND.parent}. By creating an account or using the Service, you agree to these Terms.
          </p>

          <h2>2. The Service</h2>
          <p>
            {BRAND.name} provides an AI assistant that you embed on your website to answer questions,
            capture leads, and optionally hand off to a human. You are responsible for the content and
            configuration you provide.
          </p>

          <h2>3. Accounts</h2>
          <p>
            You must provide accurate information and keep your credentials secure. You are responsible for
            all activity under your account.
          </p>

          <h2>4. Acceptable use</h2>
          <ul>
            <li>Do not use the Service for unlawful, harmful, deceptive, or abusive purposes.</li>
            <li>Do not attempt to bypass usage limits, security, or domain restrictions.</li>
            <li>Do not upload content you do not have the right to use.</li>
            <li>Do not use the Service to provide regulated advice without appropriate authorization.</li>
          </ul>

          <h2>5. Subscriptions and billing</h2>
          <p>
            Paid plans are billed monthly through our payment processor. Plans include usage limits;
            exceeding them may pause AI replies until the next cycle or an upgrade. You can change or cancel
            your plan at any time, effective per the processor&apos;s proration rules. Fees are
            non-refundable except where required by law.
          </p>

          <h2>6. Your content</h2>
          <p>
            You retain ownership of the content and data you provide. You grant us a limited license to
            process it solely to operate the Service, including sending it to our AI provider to generate
            replies.
          </p>

          <h2>7. AI output</h2>
          <p>
            AI-generated responses may be inaccurate or incomplete. You are responsible for the guardrails
            and knowledge you configure and for how the assistant represents your business. The Service is
            not a substitute for professional, legal, financial, or medical advice.
          </p>

          <h2>8. Availability</h2>
          <p>
            We aim for high availability but do not guarantee uninterrupted service. We may modify or
            discontinue features with reasonable notice.
          </p>

          <h2>9. Termination</h2>
          <p>
            You may stop using the Service at any time. We may suspend or terminate accounts that violate
            these Terms or create risk for the Service or others.
          </p>

          <h2>10. Disclaimers and liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. To the maximum extent
            permitted by law, {BRAND.parent} is not liable for indirect, incidental, or consequential
            damages, and our total liability is limited to the amounts you paid for the Service in the
            twelve months preceding the claim.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use after changes take effect
            constitutes acceptance.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about these Terms? Email{' '}
            <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.
          </p>
        </Prose>
      </div>
    </main>
  );
}
