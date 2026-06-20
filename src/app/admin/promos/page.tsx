import Link from 'next/link';
import { prisma } from '@/lib/db';
import { describePromo } from '@/lib/promo';
import { PromoManager, type PromoRow } from './PromoManager';

export const dynamic = 'force-dynamic';

export default async function AdminPromosPage() {
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });

  const rows: PromoRow[] = codes.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    benefit: c.benefit,
    summary: describePromo(c),
    redemptionCount: c.redemptionCount,
    maxRedemptions: c.maxRedemptions,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    active: c.active,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo codes</h1>
        <Link href="/admin" className="text-sm font-semibold text-brand-700 hover:underline">← Back to overview</Link>
      </div>
      <p className="text-sm text-ink-soft">
        Create codes that grant free time (extended trial or a comped plan), a percentage discount, or account credit.
        Customers redeem them at signup or on their billing page; each tenant can use a given code once.
      </p>
      <PromoManager codes={rows} />
    </div>
  );
}
