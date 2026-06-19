import { redirect } from 'next/navigation';
import { getCurrentContext } from '@/lib/auth';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect('/login');
  if (ctx.tenant) redirect('/dashboard');

  return (
    <div className="w-full max-w-md card-moo p-8">
      <h1 className="font-heading text-2xl font-bold text-cow-black">Set up your assistant</h1>
      <p className="mt-1 text-sm font-bold text-ink-soft">Tell us about your business to get started.</p>
      <OnboardingForm />
    </div>
  );
}
