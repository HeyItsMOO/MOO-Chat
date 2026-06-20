'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { PRIMARY_NAV } from '@/lib/site';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => href !== '/' && pathname?.startsWith(href.replace(/#.*$/, ''));

  return (
    <>
      {/* Announcement / offer bar — scrolls away with the page (not sticky, so
          it never collapses under the nav and shifts the page as you scroll). */}
      <div className="border-b-2 border-cow-black bg-accent py-2 text-center text-xs font-extrabold text-cow-black">
        <span className="px-3">🚀 LAUNCH OFFER — start free with 100 AI replies / month. No credit card, no bull. 🐄</span>
      </div>

      {/* Top utility bar — also scrolls away. */}
      <div className="bg-cow-black text-white">
        <div className="container-x flex h-9 items-center justify-between text-[11px] font-bold sm:text-xs">
          <a href={`mailto:${BRAND.supportEmail}`} className="hover:text-accent">✉️ {BRAND.supportEmail}</a>
          <span className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-pasture sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-pasture" /> Live in 5 minutes
            </span>
            <span className="hidden text-gray-600 sm:inline">|</span>
            <Link href="/login" className="font-extrabold hover:text-accent">🔒 Client Login</Link>
          </span>
        </div>
      </div>

      {/* Main nav — the only sticky layer, so the page never lurches mid-scroll. */}
      <header className="sticky top-0 z-50 border-b-4 border-pasture bg-white">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading text-2xl font-bold text-cow-black" onClick={() => setOpen(false)}>
            <span>{BRAND.emoji}</span>
            {BRAND.name}
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {PRIMARY_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-heading text-sm font-semibold transition hover:text-cow-black ${
                  isActive(l.href) ? 'text-cow-black' : 'text-gray-500'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="font-heading text-sm font-semibold text-gray-600 hover:text-cow-black">Log in</Link>
            <Link href="/signup" className="btn-moo text-sm">Start free 🚀</Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-[3px] border-cow-black text-cow-black lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t-2 border-dashed border-pasture bg-white lg:hidden">
            <div className="container-x flex flex-col py-3">
              {PRIMARY_NAV.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-2.5 font-heading text-sm font-semibold text-gray-600 hover:bg-paper hover:text-cow-black"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-3 border-t-2 border-dashed border-pasture pt-3">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn-moo flex-1 text-sm">Start free</Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
