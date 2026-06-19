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
    <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
      <div className={`container-x pt-14 pb-12 sm:pt-20 ${center ? 'text-center' : ''}`}>
        <div className={center ? 'mx-auto max-w-3xl' : 'max-w-3xl'}>
          {eyebrow && (
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-5 text-lg text-ink-soft">{subtitle}</p>}
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
      <div className="rounded-3xl bg-brand-600 px-8 py-14 text-center text-white">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-100">{subtitle}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Get started free
          </Link>
          <Link
            href="/contact"
            className="inline-block rounded-xl border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Talk to us
          </Link>
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
