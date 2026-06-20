'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

const inputClass =
  'mt-1 w-full rounded-xl border-2 border-cow-black px-3 py-2.5 text-sm font-semibold outline-none focus:border-pasture-deep focus:ring-2 focus:ring-pasture';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md card-moo p-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-cow-black">Check your email 📬</h1>
        <p className="mt-3 text-sm font-bold text-ink-soft">
          If an account exists for <span className="font-mono">{email}</span>, we&apos;ve sent a link to reset your
          password. It expires in 60 minutes.
        </p>
        <p className="mt-2 text-xs font-semibold text-ink-mute">
          Don&apos;t see it? Check your spam folder, or try again in a minute.
        </p>
        <Link href="/login" className="btn-moo mt-6 inline-block">Back to log in</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md card-moo p-8">
      <h1 className="font-heading text-2xl font-bold text-cow-black">Forgot your password? 🔑</h1>
      <p className="mt-1 text-sm font-bold text-ink-soft">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className={inputClass}
          />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-moo w-full disabled:opacity-50">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-bold text-ink-soft">
        Remembered it?{' '}
        <Link href="/login" className="text-pasture-deep underline underline-offset-2 hover:text-cow-black">
          Back to log in
        </Link>
      </p>
      <p className="mt-1 text-center text-xs font-semibold text-ink-mute">
        New to {BRAND.name}?{' '}
        <Link href="/signup" className="text-pasture-deep underline underline-offset-2 hover:text-cow-black">
          Create an account
        </Link>
      </p>
    </div>
  );
}
