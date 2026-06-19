import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { pageMeta, breadcrumbJsonld } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PageHeader } from '@/components/site/ui';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = pageMeta({
  title: 'Contact',
  description: `Get in touch with the ${BRAND.name} team — questions, demos, partnerships, or support. We reply by email.`,
  path: '/contact',
});

export default function ContactPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonld([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      <PageHeader
        eyebrow="Contact"
        title="Let's talk."
        subtitle="Questions, a demo, a partnership, or support — drop us a line and we'll get back to you."
      />

      <section className="container-x pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Info */}
          <div className="space-y-6">
            <div className="card-moo p-6" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>
              <h2 className="font-semibold text-ink">Email us</h2>
              <a href={`mailto:${BRAND.supportEmail}`} className="mt-1 inline-block font-medium text-brand-700 hover:underline">
                {BRAND.supportEmail}
              </a>
            </div>
            <div className="card-moo p-6" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>
              <h2 className="font-semibold text-ink">Looking for setup help?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                The <Link href="/docs" className="font-medium text-brand-700 hover:underline">docs</Link> cover
                installation and configuration, and the{' '}
                <Link href="/faq" className="font-medium text-brand-700 hover:underline">FAQ</Link> answers the
                common questions.
              </p>
            </div>
            <div className="card-moo p-6" style={{ boxShadow: '4px 4px 0 #1a1a1a' }}>
              <h2 className="font-semibold text-ink">Ready to start?</h2>
              <p className="mt-1 text-sm text-ink-soft">
                You can create an assistant for free in a few minutes.
              </p>
              <Link href="/signup" className="btn-moo mt-3 text-sm">
                Start free
              </Link>
            </div>
          </div>

          {/* Form */}
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
