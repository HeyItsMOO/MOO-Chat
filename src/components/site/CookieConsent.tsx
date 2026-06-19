'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'moo_cookie_consent';

/**
 * Lightweight cookie/consent notice. Stores the choice in localStorage so it's
 * shown once. Sits above the mobile sticky CTA bar.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* localStorage unavailable — don't block the page */
    }
  }, []);

  function choose(value: 'accepted' | 'declined') {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 px-4 lg:bottom-4">
      <div className="container-x">
        <div
          className="flex flex-col gap-4 rounded-2xl border-4 border-cow-black bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{ boxShadow: '6px 6px 0 #1a1a1a' }}
        >
          <p className="text-sm font-bold text-ink-soft">
            We use essential cookies to keep the site working, and optional ones to understand usage.
            See our{' '}
            <Link href="/legal/privacy" className="font-bold text-pasture-deep underline">Privacy Policy</Link>.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => choose('declined')} className="btn-ghost px-4 py-2 text-sm">Decline</button>
            <button type="button" onClick={() => choose('accepted')} className="btn-moo px-4 py-2 text-sm">Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
