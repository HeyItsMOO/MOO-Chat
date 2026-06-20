'use client';

import { useState } from 'react';

/** Read-only link field with a one-click copy button. */
export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the field is selectable as a fallback */
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-xl border-2 border-cow-black bg-white px-3 py-2.5 text-sm font-semibold text-cow-black outline-none"
      />
      <button type="button" onClick={copy} className="btn-moo shrink-0 text-sm">
        {copied ? 'Copied! ✅' : 'Copy link'}
      </button>
    </div>
  );
}
