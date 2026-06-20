'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';

const inputClass =
  'mt-1 w-full rounded-xl border-2 border-cow-black px-3 py-2.5 text-sm font-semibold outline-none focus:border-pasture-deep focus:ring-2 focus:ring-pasture';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

  return (
    <div className="w-full max-w-md card-moo p-8">
      <h1 className="font-heading text-2xl font-bold text-cow-black">Welcome back 👋</h1>
      <p className="mt-1 text-sm font-bold text-ink-soft">Log in to your {BRAND.name} dashboard.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-ink-soft">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm font-bold text-ink-soft">
            Password
            <Link href="/forgot-password" className="text-xs font-semibold text-pasture-deep underline underline-offset-2 hover:text-cow-black">
              Forgot password?
            </Link>
          </span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-moo w-full disabled:opacity-50">
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-bold text-ink-soft">
        New here?{' '}
        <Link href="/signup" className="text-pasture-deep underline underline-offset-2 hover:text-cow-black">Create an account</Link>
      </p>
    </div>
  );
}
