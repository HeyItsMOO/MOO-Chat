'use client';

import Link from 'next/link';

/** Persistent mobile conversion bar — high-intent CTA for ad/landing traffic. */
export function StickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-cow-black bg-white px-3 py-2.5 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex-1 text-xs font-extrabold leading-tight text-cow-black">
          Start free — 100 replies/mo.
          <span className="block text-ink-mute">No credit card. 🐄</span>
        </div>
        <Link href="/signup" className="btn-moo px-5 py-2.5 text-sm">Start free 🚀</Link>
      </div>
    </div>
  );
}
