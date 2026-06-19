import Link from 'next/link';

/** Consistent page hero used at the top of marketing sub-pages. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <section className="border-b-4 border-dashed border-pasture/70">
      <div className={`container-x pt-14 pb-12 sm:pt-16 ${center ? 'text-center' : ''}`}>
        <div className={center ? 'mx-auto max-w-3xl' : 'max-w-3xl'}>
          {eyebrow && (
            <div className="mb-4">
              <span className="badge-moo uppercase tracking-wide">{eyebrow}</span>
            </div>
          )}
          <h1 className="font-heading text-4xl font-bold tracking-tight text-cow-black sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-5 text-lg font-bold text-ink-soft">{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

/** Shared closing call-to-action band. */
export function CTASection({
  title = 'Give your website a brain.',
  subtitle = 'Set up your AI assistant in minutes and never miss a customer question again.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="container-x py-16">
      <div
        className="organic-border border-4 border-cow-black bg-cow-black px-8 py-14 text-center text-white"
        style={{ boxShadow: '12px 12px 0 #4ade80' }}
      >
        <h2 className="font-heading text-3xl font-bold text-pasture sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl font-bold text-white/80">{subtitle}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-moo">Get started free 🚀</Link>
          <Link href="/contact" className="btn-ghost border-white bg-transparent text-white hover:bg-white/10">Talk to us</Link>
        </div>
      </div>
    </section>
  );
}

/** Renders trusted HTML (our own markdown / legal copy) with article styling. */
export function Prose({ html, children }: { html?: string; children?: React.ReactNode }) {
  if (html !== undefined) {
    return <div className="prose-moo" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <div className="prose-moo">{children}</div>;
}
