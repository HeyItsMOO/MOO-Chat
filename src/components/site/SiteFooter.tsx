import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { FOOTER_NAV } from '@/lib/site';
import { Stars } from './Stars';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-slate-400">
      {/* Top CTA strip */}
      <div className="border-b border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-5 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-bold text-white">Ready to give your website a front desk?</h2>
            <p className="mt-1 text-sm text-slate-400">Live in five minutes. No credit card required.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup" className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-500">
              Start free
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10">
              Talk to us
            </Link>
          </div>
        </div>
      </div>

      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
                {BRAND.emoji}
              </span>
              {BRAND.name}
            </div>
            <p className="mt-3 max-w-xs text-sm">
              The AI front desk for your website — answers questions, captures leads, and hands off
              to your team.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Stars />
              <span className="text-slate-400">Loved by teams worldwide</span>
            </div>
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-4 inline-block text-sm font-medium text-brand-400 hover:text-brand-200">
              {BRAND.supportEmail}
            </a>
          </div>

          {/* Link columns */}
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-white">{col.heading}</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <span>
            © {year} {BRAND.name} — a{' '}
            <a href={BRAND.parentUrl} target="_blank" rel="noopener" className="hover:text-white">{BRAND.parent}</a> product.
          </span>
          <span className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <span>Built on Claude</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
