import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAffiliates() {
  console.log('🌱 Seeding affiliate data...');

  try {
    // Créer quelques utilisateurs de test avec le rôle AFFILIATE
    const affiliateUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'streamer1@example.com' },
        update: {},
        create: {
          email: 'streamer1@example.com',
          name: 'StreamerPro',
          steamId: '76561198000000001',
          steamUsername: 'StreamerPro',
          steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
          role: 'AFFILIATE',
          kycStatus: 'VERIFIED',
          acceptedTermsAt: new Date(),
          level: 10,
          xp: 5000,
          tickets: 50
        }
      }),
      prisma.user.upsert({
        where: { email: 'youtuber1@example.com' },
        update: {},
        create: {
          email: 'youtuber1@example.com',
          name: 'CS2YouTuber',
          steamId: '76561198000000002',
          steamUsername: 'CS2YouTuber',
          steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
          role: 'AFFILIATE',
          kycStatus: 'VERIFIED',
          acceptedTermsAt: new Date(),
          level: 15,
          xp: 8000,
          tickets: 80
        }
      }),
      prisma.user.upsert({
        where: { email: 'twitcher1@example.com' },
        update: {},
        create: {
          email: 'twitcher1@example.com',
          name: 'TwitchGamer',
          steamId: '76561198000000003',
          steamUsername: 'TwitchGamer',
          steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
          role: 'AFFILIATE',
          kycStatus: 'VERIFIED',
          acceptedTermsAt: new Date(),
          level: 8,
          xp: 3500,
          tickets: 35
        }
      })
    ]);

    // Créer les comptes d'affiliation
    const affiliateStats = await Promise.all([
      prisma.affiliateStats.upsert({
        where: { userId: affiliateUsers[0].id },
        update: {},
        create: {
          userId: affiliateUsers[0].id,
          code: 'streamerpro',
          totalReferrals: 15,
          totalVolumeCents: 125000, // 1250€
          totalCommissionCents: 2500, // 25€
          commissionRate: 0.02,
          isActive: true
        }
      }),
      prisma.affiliateStats.upsert({
        where: { userId: affiliateUsers[1].id },
        update: {},
        create: {
          userId: affiliateUsers[1].id,
          code: 'cs2youtuber',
          totalReferrals: 32,
          totalVolumeCents: 280000, // 2800€
          totalCommissionCents: 5600, // 56€
          commissionRate: 0.025, // Taux préférentiel
          isActive: true
        }
      }),
      prisma.affiliateStats.upsert({
        where: { userId: affiliateUsers[2].id },
        update: {},
        create: {
          userId: affiliateUsers[2].id,
          code: 'twitchgamer',
          totalReferrals: 8,
          totalVolumeCents: 65000, // 650€
          totalCommissionCents: 1300, // 13€
          commissionRate: 0.02,
          isActive: true
        }
      })
    ]);

    // Créer quelques utilisateurs référés
    const referredUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'user1@example.com' },
        update: {},
        create: {
          email: 'user1@example.com',
          name: 'User1',
          steamId: '76561198000000101',
          steamUsername: 'User1',
          steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
          role: 'USER',
          kycStatus: 'VERIFIED',
          acceptedTermsAt: new Date(),
          referredByAffiliateId: affiliateStats[0].id,
          level: 3,
          xp: 500,
          tickets: 5,
          totalVolumeCents: 15000
        }
      }),
      prisma.user.upsert({
        where: { email: 'user2@example.com' },
        update: {},
        create: {
          email: 'user2@example.com',
          name: 'User2',
          steamId: '76561198000000102',
          steamUsername: 'User2',
          steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
          role: 'USER',
          kycStatus: 'VERIFIED',
          acceptedTermsAt: new Date(),
          referredByAffiliateId: affiliateStats[1].id,
          level: 5,
          xp: 1200,
          tickets: 12,
          totalVolumeCents: 32000
        }
      })
    ]);

    // Créer quelques référrals
    const referrals = await Promise.all([
      prisma.affiliateReferral.create({
        data: {
          affiliateId: affiliateStats[0].id,
          referredUserId: referredUsers[0].id,
          volumeCents: 15000,
          commissionCents: 300
        }
      }),
      prisma.affiliateReferral.create({
        data: {
          affiliateId: affiliateStats[1].id,
          referredUserId: referredUsers[1].id,
          volumeCents: 32000,
          commissionCents: 800
        }
      })
    ]);

    // Créer quelques commissions de test
    await Promise.all([
      prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliateStats[0].id,
          referralId: referrals[0].id,
          amountCents: 300,
          status: 'PENDING'
        }
      }),
      prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliateStats[1].id,
          referralId: referrals[1].id,
          amountCents: 800,
          status: 'APPROVED'
        }
      }),
      prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliateStats[1].id,
          amountCents: 1200,
          status: 'PAID',
          paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Il y a 7 jours
        }
      })
    ]);

    console.log('✅ Affiliate data seeded successfully!');
    console.log(`Created ${affiliateUsers.length} affiliate users`);
    console.log(`Created ${affiliateStats.length} affiliate accounts`);
    console.log(`Created ${referredUsers.length} referred users`);
    console.log(`Created ${referrals.length} referrals`);
    console.log('Created 3 test commissions');

    console.log('\n📋 Test affiliate codes:');
    affiliateStats.forEach((affiliate, index) => {
      console.log(`- ${affiliate.code} (${affiliateUsers[index].name})`);
    });

    console.log('\n🔗 Test affiliate links:');
    affiliateStats.forEach((affiliate) => {
      console.log(`- https://cashtrade.fr?ref=${affiliate.code}`);
    });

  } catch (error) {
    console.error('❌ Error seeding affiliate data:', error);
    throw error;
  }
}

// Exécuter le seed si appelé directement
if (require.main === module) {
  seedAffiliates()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedAffiliates };