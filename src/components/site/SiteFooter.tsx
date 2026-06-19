import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { FOOTER_NAV } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t-[12px] border-pasture bg-cow-black text-white">
      {/* CTA strip */}
      <div className="border-b border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-5 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-heading text-2xl font-bold text-pasture">Give your website a front desk.</h2>
            <p className="mt-1 text-sm font-bold text-white/70">Live in five minutes. No credit card. No bull. 🐄</p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup" className="btn-moo">Start free 🚀</Link>
            <Link href="/contact" className="btn-ghost border-white bg-transparent text-white hover:bg-white/10">Talk to us</Link>
          </div>
        </div>
      </div>

      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2 font-heading text-2xl font-bold">
              <span>{BRAND.emoji}</span>
              {BRAND.name}
            </div>
            <p className="mt-3 max-w-xs font-bold text-white/70">
              The AI front desk for your website — answers questions, captures leads, and hands off to
              your team. A {BRAND.parent} product.
            </p>
            <p className="mt-4 font-heading text-lg font-bold italic text-accent">No bots gone rogue. Just fair dinkum answers.</p>
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-4 inline-block font-bold text-pasture hover:text-accent">
              {BRAND.supportEmail}
            </a>
          </div>

          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <h3 className="inline-block border-b-2 border-dashed border-white/30 pb-1 font-heading font-bold text-pasture">{col.heading}</h3>
              <ul className="mt-3 space-y-2.5 text-sm font-bold">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-white/80 transition hover:text-accent">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-dashed border-white/20 pt-6 text-xs font-bold sm:flex-row">
          <span>
            © {year} {BRAND.name} — a{' '}
            <a href={BRAND.parentUrl} target="_blank" rel="noopener" className="hover:text-accent">{BRAND.parent}</a> product.
          </span>
          <span className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-accent">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-accent">Terms</Link>
            <span className="text-white/50">Built on Claude</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
