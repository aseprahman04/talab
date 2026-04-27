import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // ── Plans ──────────────────────────────────────────────────────────────────
  await prisma.plan.upsert({
    where: { code: 'free' },
    update: { name: 'Free', maxDevices: 2, monthlyMessageQuota: 500, dailyDeviceLimit: 50, maxMembers: 1, storageLimitMb: 100, price: 0, hasAutoReply: false, hasWebhook: false, hasApi: false },
    create: { code: 'free', name: 'Free', maxDevices: 2, monthlyMessageQuota: 500, dailyDeviceLimit: 50, maxMembers: 1, storageLimitMb: 100, price: 0, hasAutoReply: false, hasWebhook: false, hasApi: false },
  });

  // Early Bird — $29/mo. Set lemonSqueezyVariantId + lemonSqueezyCheckoutUrl after creating in LS dashboard.
  await prisma.plan.upsert({
    where: { code: 'early' },
    update: { name: 'Early', maxDevices: 3, monthlyMessageQuota: 0, dailyDeviceLimit: 200, maxMembers: 3, storageLimitMb: 500, price: 29, hasAutoReply: true, hasWebhook: false, hasApi: false },
    create: { code: 'early', name: 'Early', maxDevices: 3, monthlyMessageQuota: 0, dailyDeviceLimit: 200, maxMembers: 3, storageLimitMb: 500, price: 29, hasAutoReply: true, hasWebhook: false, hasApi: false },
  });

  // Standard — $49/mo.
  await prisma.plan.upsert({
    where: { code: 'standard' },
    update: { name: 'Standard', maxDevices: 5, monthlyMessageQuota: 0, dailyDeviceLimit: 500, maxMembers: 5, storageLimitMb: 1000, price: 49, hasAutoReply: true, hasWebhook: true, hasApi: false },
    create: { code: 'standard', name: 'Standard', maxDevices: 5, monthlyMessageQuota: 0, dailyDeviceLimit: 500, maxMembers: 5, storageLimitMb: 1000, price: 49, hasAutoReply: true, hasWebhook: true, hasApi: false },
  });

  // Pro — $79/mo, all features. lemonSqueezyVariantId '1580719' from existing LS product.
  await prisma.plan.upsert({
    where: { code: 'pro' },
    update: { name: 'Pro', maxDevices: 10, monthlyMessageQuota: 0, dailyDeviceLimit: 1000, maxMembers: 10, storageLimitMb: 2000, price: 79, hasAutoReply: true, hasWebhook: true, hasApi: true, lemonSqueezyVariantId: '1580719', lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/90a92f63-5197-46fb-8005-45c3fa220ecf' },
    create: { code: 'pro', name: 'Pro', maxDevices: 10, monthlyMessageQuota: 0, dailyDeviceLimit: 1000, maxMembers: 10, storageLimitMb: 2000, price: 79, hasAutoReply: true, hasWebhook: true, hasApi: true, lemonSqueezyVariantId: '1580719', lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/90a92f63-5197-46fb-8005-45c3fa220ecf' },
  });

  // ── Super admin user ───────────────────────────────────────────────────────
  const devUser = await prisma.user.upsert({
    where: { email: 'aseprahmanurhakim04@gmail.com' },
    update: { isSuperAdmin: true },
    create: {
      email: 'aseprahmanurhakim04@gmail.com',
      name: 'Asep Rahmanurhakim',
      isSuperAdmin: true,
    },
  });

  // ── Workspace ──────────────────────────────────────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'dev-workspace' },
    update: {},
    create: {
      ownerId: devUser.id,
      name: 'Dev Workspace',
      slug: 'dev-workspace',
      status: 'TRIAL',
    },
  });

  // Owner membership
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: devUser.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: devUser.id,
      role: 'OWNER',
    },
  });

  // ── Subscription — Pro plan, active, no expiry ───────────────────────────
  const planPro = await prisma.plan.findUniqueOrThrow({ where: { code: 'pro' } });
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: { planId: planPro.id, status: 'ACTIVE', endedAt: null },
    create: {
      workspaceId: workspace.id,
      planId: planPro.id,
      status: 'ACTIVE',
      startedAt: new Date(),
      endedAt: null,
    },
  });

  // ── Test devices ───────────────────────────────────────────────────────────
  await prisma.device.upsert({
    where: { id: 'seed-device-01' },
    update: {},
    create: {
      id: 'seed-device-01',
      workspaceId: workspace.id,
      name: 'Test Device 1',
      phoneNumber: '+6285795950115',
      status: 'DISCONNECTED',
      healthScore: 100,
    },
  });

  await prisma.device.upsert({
    where: { id: 'seed-device-02' },
    update: {},
    create: {
      id: 'seed-device-02',
      workspaceId: workspace.id,
      name: 'Test Device 2',
      phoneNumber: '+628579590115',
      status: 'DISCONNECTED',
      healthScore: 100,
    },
  });

  // ── Seed API token for device 1 ───────────────────────────────────────────
  const seedToken = 'wt_seeddemo000000000000000000000000000000000000000001';
  const tokenHash = createHash('sha256').update(seedToken).digest('hex');
  await prisma.deviceToken.upsert({
    where: { id: 'seed-token-01' },
    update: {},
    create: {
      id: 'seed-token-01',
      deviceId: 'seed-device-01',
      name: 'Seed test token',
      tokenHash,
    },
  });

  console.log('Seed complete.');
  console.log('  Login: aseprahmanurhakim04@gmail.com (via Google)');
  console.log(`  Workspace: ${workspace.slug}`);
  console.log('  Device 1: +6285795950115');
  console.log('  Device 2: +628579590115');
  console.log(`  API Token (device 1): ${seedToken}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
