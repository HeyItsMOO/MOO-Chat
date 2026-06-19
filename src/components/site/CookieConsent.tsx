'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'moo_cookie_consent';

/**
 * Lightweight cookie/consent notice. Stores the choice in localStorage so it's
 * shown once. Wire real analytics to fire only after `accepted`.
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
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="container-x">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            We use a few essential cookies to keep the site working, and optional ones to understand
            usage. See our{' '}
            <Link href="/legal/privacy" className="font-medium text-brand-700 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => choose('declined')}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => choose('accepted')}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
