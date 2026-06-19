'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { PRIMARY_NAV } from '@/lib/site';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href !== '/' && pathname?.startsWith(href.replace(/#.*$/, ''));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold" onClick={() => setOpen(false)}>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            {BRAND.emoji}
          </span>
          {BRAND.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          {PRIMARY_NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition hover:text-ink ${isActive(l.href) ? 'text-ink font-medium' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm md:flex">
          <Link href="/login" className="font-medium text-ink-soft hover:text-ink">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700"
          >
            Start free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden">
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
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Start free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
