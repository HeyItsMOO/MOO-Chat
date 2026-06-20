/**
 * One-time PayPal setup: creates a Product and a billing Plan for each paid tier,
 * then prints the env lines to paste into .env.
 *
 * Usage:
 *   1. Put PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV in .env
 *   2. npm run paypal:setup
 *   3. Paste the printed PAYPAL_PLAN_* lines into .env
 */

// Load .env FIRST (before importing modules that read process.env at load time).
try {
  // @ts-ignore - Node 20.12+/24 runtime API
  process.loadEnvFile();
} catch {
  /* .env optional if vars already exported */
}

async function main() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    console.error('❌ Missing PAYPAL_CLIENT_ID / PAYPAL_SECRET in .env');
    process.exit(1);
  }

  const { createProduct, createPlan, paypalBase } = await import('../src/lib/paypal');
  const { PLANS, PAID_PLAN_IDS, CURRENCY, YEARLY_MONTHS_CHARGED, priceForInterval } = await import('../src/lib/plans');
  const { BRAND } = await import('../src/lib/brand');

  console.log(`Using PayPal: ${paypalBase()} (currency ${CURRENCY})\n`);

  const productId = await createProduct(`${BRAND.name}`, BRAND.tagline);
  console.log('✓ Created product:', productId);

  const lines: string[] = [];
  for (const id of PAID_PLAN_IDS) {
    const plan = PLANS[id];

    // Monthly
    const monthlyId = await createPlan({
      productId,
      name: `${BRAND.name} ${plan.name} (Monthly)`,
      price: plan.priceMonthly,
      currency: CURRENCY,
      intervalUnit: 'MONTH',
    });
    console.log(`✓ Created plan ${plan.name} (${CURRENCY} ${plan.priceMonthly}/mo):`, monthlyId);
    lines.push(`PAYPAL_PLAN_${id.toUpperCase()}="${monthlyId}"`);

    // Yearly — 10× the monthly price (2 months free).
    const yearlyPrice = priceForInterval(plan, 'yearly');
    const yearlyId = await createPlan({
      productId,
      name: `${BRAND.name} ${plan.name} (Yearly)`,
      price: yearlyPrice,
      currency: CURRENCY,
      intervalUnit: 'YEAR',
    });
    console.log(`✓ Created plan ${plan.name} (${CURRENCY} ${yearlyPrice}/yr = ${YEARLY_MONTHS_CHARGED}× monthly):`, yearlyId);
    lines.push(`PAYPAL_PLAN_${id.toUpperCase()}_YEARLY="${yearlyId}"`);
  }

  console.log('\n──────────── paste into .env ────────────');
  console.log(lines.join('\n'));
  console.log('─────────────────────────────────────────');
  console.log('\nNext: create a webhook in the PayPal dashboard pointing to');
  console.log('  <your-app-url>/api/webhooks/paypal');
  console.log('subscribe to BILLING.SUBSCRIPTION.* and PAYMENT.SALE.COMPLETED,');
  console.log('then set PAYPAL_WEBHOOK_ID in .env.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
