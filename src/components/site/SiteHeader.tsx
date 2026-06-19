'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { PRIMARY_NAV } from '@/lib/site';
import { Stars } from './Stars';

function SocialIcons({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <a href={BRAND.parentUrl} target="_blank" rel="noopener" aria-label="Website" className="hover:opacity-100 opacity-80">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
        </svg>
      </a>
      <a href={`https://twitter.com/${BRAND.twitterHandle.replace('@', '')}`} target="_blank" rel="noopener" aria-label="X / Twitter" className="hover:opacity-100 opacity-80">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      </a>
    </span>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => href !== '/' && pathname?.startsWith(href.replace(/#.*$/, ''));

  return (
    <div>
      {/* Top utility bar */}
      <div className="hidden bg-ink text-slate-300 md:block">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-white">{BRAND.supportEmail}</a>
            <span className="text-slate-500">·</span>
            <span>Set up in 5 minutes</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Stars className="text-amber-400" />
              <span className="text-slate-400">Loved by teams</span>
            </span>
            <span className="text-slate-500">·</span>
            <SocialIcons />
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold" onClick={() => setOpen(false)}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
              {BRAND.emoji}
            </span>
            {BRAND.name}
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-soft lg:flex">
            {PRIMARY_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition hover:text-ink ${isActive(l.href) ? 'font-medium text-ink' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 text-sm lg:flex">
            <Link href="/login" className="font-medium text-ink-soft hover:text-ink">Log in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Get started free
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white lg:hidden">
            <nav className="container-x flex flex-col py-3">
              {PRIMARY_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm text-ink-soft hover:bg-slate-50 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3 border-t border-slate-100 pt-3">
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-ink">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white">
                  Start free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  );
}
