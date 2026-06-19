import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { FOOTER_NAV } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
                {BRAND.emoji}
              </span>
              {BRAND.name}
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              The AI front desk for your website — answers questions, captures leads, and hands off
              to your team.
            </p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              {BRAND.supportEmail}
            </a>
          </div>

          {/* Link columns */}
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-ink">{col.heading}</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-ink-soft transition hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-ink-mute sm:flex-row">
          <span>
            © {year} {BRAND.name} — a{' '}
            <a href={BRAND.parentUrl} target="_blank" rel="noopener" className="hover:text-ink">
              {BRAND.parent}
            </a>{' '}
            product.
          </span>
          <span className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-ink">Terms</Link>
            <span>Built on Claude</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
