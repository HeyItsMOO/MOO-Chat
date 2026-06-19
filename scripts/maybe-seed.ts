/**
 * Build-time seed gate (used by `vercel-build`).
 *
 * Runs the database seed only when SEED_ON_DEPLOY=1, and NEVER fails the build —
 * seeding is best-effort, so a missing SEED_ADMIN_PASSWORD or a transient DB
 * issue logs a warning and the deploy continues.
 */
import { spawnSync } from 'node:child_process';

if (process.env.SEED_ON_DEPLOY !== '1') {
  console.log('[seed] skipped (set SEED_ON_DEPLOY=1 to seed on deploy)');
  process.exit(0);
}

console.log('[seed] running…');
const res = spawnSync('tsx prisma/seed.ts', { stdio: 'inherit', shell: true });
if (res.status !== 0) {
  console.log('[seed] FAILED — continuing build (check SEED_ADMIN_PASSWORD / DATABASE_URL)');
}

// Always succeed so seeding can never break the deployment.
process.exit(0);
