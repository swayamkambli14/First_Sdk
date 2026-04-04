import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Badge Definitions ────────────────────────────────────────────────────
  const badges = [
    {
      badgeId: 'first_purchase',
      name: 'First Purchase',
      description: 'Awarded on your very first purchase',
      imageUrl: '/badges/first-purchase.png',
      rarity: 'common',
    },
    {
      badgeId: 'power_buyer',
      name: 'Power Buyer',
      description: 'Spent over $500 in total purchases',
      imageUrl: '/badges/power-buyer.png',
      rarity: 'rare',
    },
    {
      badgeId: 'top_referrer',
      name: 'Top Referrer',
      description: 'Successfully referred 5 or more users',
      imageUrl: '/badges/top-referrer.png',
      rarity: 'epic',
    },
    {
      badgeId: 'gold_tier',
      name: 'Gold Tier',
      description: 'Reached Gold tier status',
      imageUrl: '/badges/gold-tier.png',
      rarity: 'rare',
    },
    {
      badgeId: 'lucky_subscriber',
      name: 'Lucky Subscriber',
      description: 'Won a spin wheel reward on subscription',
      imageUrl: '/badges/lucky-subscriber.png',
      rarity: 'uncommon',
    },
    {
      badgeId: 'tier_silver',
      name: 'Silver Tier',
      description: 'Reached Silver tier status',
      imageUrl: '/badges/silver-tier.png',
      rarity: 'common',
    },
    {
      badgeId: 'tier_gold',
      name: 'Gold Tier Upgrade',
      description: 'Promoted to Gold tier',
      imageUrl: '/badges/gold-tier.png',
      rarity: 'rare',
    },
    {
      badgeId: 'tier_platinum',
      name: 'Platinum Tier',
      description: 'Reached the highest tier — Platinum',
      imageUrl: '/badges/platinum-tier.png',
      rarity: 'legendary',
    },
  ];

  for (const badge of badges) {
    await prisma.badgeDefinition.upsert({
      where: { badgeId: badge.badgeId },
      update: badge,
      create: badge,
    });
  }
  console.log(`✅ Seeded ${badges.length} badge definitions`);

  // ── Demo App ─────────────────────────────────────────────────────────────
  // The raw key is only shown here during seeding — in production it's shown once at creation
  const rawApiKey = 'sk_demo_chainloyalty_development_key_12345';
  const apiKeyHash = await bcrypt.hash(rawApiKey, 10);
  const apiKeyPrefix = rawApiKey.substring(0, 6);

  const demoApp = await prisma.app.upsert({
    where: { apiKeyHash },
    update: {},
    create: {
      name: 'TaskForge Demo',
      apiKeyHash,
      apiKeyPrefix,
      webhookUrl: 'http://localhost:3001/webhook', // local mock endpoint
      isActive: true,
    },
  });

  console.log(`✅ Seeded demo app: ${demoApp.name} (id: ${demoApp.id})`);
  console.log(`   API Key (shown once): ${rawApiKey}`);
  console.log(`   App ID: ${demoApp.id}`);

  console.log('🌱 Seeding complete');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
