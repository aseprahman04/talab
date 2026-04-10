import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // ── Plans ──────────────────────────────────────────────────────────────────
  await prisma.plan.upsert({
    where: { code: 'free' },
    update: {
      monthlyMessageQuota: 500,
      hasAutoReply: false,
      hasWebhook: false,
      hasApi: false,
    },
    create: {
      code: 'free',
      name: 'Free',
      maxDevices: 1,
      monthlyMessageQuota: 500,
      maxMembers: 1,
      storageLimitMb: 100,
      price: 0,
      hasAutoReply: false,
      hasWebhook: false,
      hasApi: false,
    },
  });

  await prisma.plan.upsert({
    where: { code: 'bisnis' },
    update: {
      monthlyMessageQuota: 0,
      price: 99000,
      hasAutoReply: true,
      hasWebhook: true,
      hasApi: true,
      lemonSqueezyVariantId: '1469498',
      lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/74a09a0b-6f4c-44c0-aa07-237b09221d42',
    },
    create: {
      code: 'bisnis',
      name: 'Business',
      maxDevices: 5,
      monthlyMessageQuota: 0,
      maxMembers: 5,
      storageLimitMb: 1000,
      price: 99000,
      hasAutoReply: true,
      hasWebhook: true,
      hasApi: true,
      lemonSqueezyVariantId: '1469498',
      lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/74a09a0b-6f4c-44c0-aa07-237b09221d42',
    },
  });

  await prisma.plan.upsert({
    where: { code: 'tim' },
    update: {
      monthlyMessageQuota: 0,
      price: 249000,
      hasAutoReply: true,
      hasWebhook: true,
      hasApi: true,
      lemonSqueezyVariantId: '1469512',
      lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/88ef51c2-7c58-417f-b8bc-53b5886c4800',
    },
    create: {
      code: 'tim',
      name: 'Team',
      maxDevices: 20,
      monthlyMessageQuota: 0,
      maxMembers: 20,
      storageLimitMb: 5000,
      price: 249000,
      hasAutoReply: true,
      hasWebhook: true,
      hasApi: true,
      lemonSqueezyVariantId: '1469512',
      lemonSqueezyCheckoutUrl: 'https://badassdevs.lemonsqueezy.com/checkout/buy/88ef51c2-7c58-417f-b8bc-53b5886c4800',
    },
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

  // ── Subscription — Tim plan, active, no expiry ────────────────────────────
  const planTim = await prisma.plan.findUniqueOrThrow({ where: { code: 'tim' } });
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: { planId: planTim.id, status: 'ACTIVE', endedAt: null },
    create: {
      workspaceId: workspace.id,
      planId: planTim.id,
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
