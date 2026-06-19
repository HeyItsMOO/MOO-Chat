import { redirect } from 'next/navigation';
import { getCurrentContext } from '@/lib/auth';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect('/login');
  if (ctx.tenant) redirect('/dashboard');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Set up your assistant</h1>
        <p className="mt-1 text-sm text-ink-soft">Tell us about your business to get started.</p>
        <OnboardingForm />
      </div>
    </main>
  );
}
