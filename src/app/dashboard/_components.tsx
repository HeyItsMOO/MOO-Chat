'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  return (
    <button onClick={logout} className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-ink-mute hover:bg-slate-100 hover:text-ink">
      Log out
    </button>
  );
}

export function ExitImpersonation() {
  const router = useRouter();
  async function exit() {
    await fetch('/api/admin/impersonate/stop', { method: 'POST' });
    router.push('/admin');
  }
  return (
    <button onClick={exit} className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-50 hover:bg-amber-900">
      Exit
    </button>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      onClick={copy}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
