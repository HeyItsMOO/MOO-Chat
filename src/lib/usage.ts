import { prisma } from './db';
import { getPlan } from './plans';

export function currentPeriod(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Has this tenant hit its monthly message allowance? (read-only check) */
export async function isOverQuota(tenantId: string, plan: string): Promise<boolean> {
  const limit = getPlan(plan).messagesPerMonth;
  const counter = await prisma.usageCounter.findUnique({
    where: { tenantId_period: { tenantId, period: currentPeriod() } },
  });
  return (counter?.messageCount ?? 0) >= limit;
}

/**
 * Atomically reserve one message slot if under the monthly limit. Returns true if
 * reserved (caller may proceed), false if over quota. The conditional updateMany
 * closes the check-then-increment race so concurrent requests can't overshoot.
 */
export async function tryReserve(tenantId: string, plan: string): Promise<boolean> {
  const limit = getPlan(plan).messagesPerMonth;
  const period = currentPeriod();
  await prisma.usageCounter.upsert({
    where: { tenantId_period: { tenantId, period } },
    create: { tenantId, period, messageCount: 0 },
    update: {},
  });
  const res = await prisma.usageCounter.updateMany({
    where: { tenantId, period, messageCount: { lt: limit } },
    data: { messageCount: { increment: 1 } },
  });
  return res.count > 0;
}

/** Give back a reserved slot when the model call fails (don't bill failed calls). */
export async function refundReservation(tenantId: string) {
  const period = currentPeriod();
  await prisma.usageCounter.updateMany({
    where: { tenantId, period, messageCount: { gt: 0 } },
    data: { messageCount: { decrement: 1 } },
  });
}

/** Record token usage for a successful reply (messageCount was already reserved). */
export async function recordTokens(tenantId: string, tokensIn: number, tokensOut: number) {
  const period = currentPeriod();
  await prisma.usageCounter.updateMany({
    where: { tenantId, period },
    data: { tokensIn: { increment: tokensIn }, tokensOut: { increment: tokensOut } },
  });
}

export async function getUsage(tenantId: string) {
  const counter = await prisma.usageCounter.findUnique({
    where: { tenantId_period: { tenantId, period: currentPeriod() } },
  });
  return {
    period: currentPeriod(),
    messageCount: counter?.messageCount ?? 0,
    tokensIn: counter?.tokensIn ?? 0,
    tokensOut: counter?.tokensOut ?? 0,
  };
}
