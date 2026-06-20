'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const inputClass =
  'mt-1 w-full rounded-xl border-2 border-cow-black px-3 py-2.5 text-sm font-semibold outline-none focus:border-pasture-deep focus:ring-2 focus:ring-pasture';

export default function ResetPasswordPage() {
  const router = useRouter();
  // null = still reading the token from the URL; '' = no token present.
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read ?token= from the URL (avoids needing a useSearchParams Suspense boundary).
  useEffect(() => {
    try {
      setToken(new URLSearchParams(window.location.search).get('token') || '');
    } catch {
      setToken('');
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (token === null) return null; // brief: reading the token

  if (token === '') {
    return (
      <div className="w-full max-w-md card-moo p-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-cow-black">Reset link incomplete</h1>
        <p className="mt-3 text-sm font-bold text-ink-soft">
          This link is missing its reset token. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-moo mt-6 inline-block">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md card-moo p-8">
      <h1 className="font-heading text-2xl font-bold text-cow-black">Set a new password 🔒</h1>
      <p className="mt-1 text-sm font-bold text-ink-soft">Choose a new password for your account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-ink-soft">New password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink-soft">Confirm new password</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className={inputClass}
          />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-moo w-full disabled:opacity-50">
          {loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-bold text-ink-soft">
        <Link href="/login" className="text-pasture-deep underline underline-offset-2 hover:text-cow-black">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
