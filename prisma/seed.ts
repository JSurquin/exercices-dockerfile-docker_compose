import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Créer des utilisateurs de test
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@cashtrade.com' },
      update: {},
      create: {
        email: 'admin@cashtrade.com',
        name: 'Admin CashTrade',
        emailVerified: true,
        steamId: '76561198000000000',
        steamUsername: 'Admin_CTF',
        steamAvatar: 'https://avatars.steamstatic.com/avatar.jpg',
        level: 20,
        xp: 50000,
        tickets: 100,
        totalVolume: 10000000, // 100,000 €
        kycStatus: 'verified',
        acceptedTermsAt: new Date('2024-01-01T00:00:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'user1@test.com' },
      update: {},
      create: {
        email: 'user1@test.com',
        name: 'ProTrader_CS2',
        emailVerified: true,
        steamId: '76561198000000001',
        steamUsername: 'ProTrader_CS2',
        steamAvatar: 'https://avatars.steamstatic.com/avatar.jpg',
        level: 15,
        xp: 12500,
        tickets: 45,
        totalVolume: 2500000, // 25,000 €
        kycStatus: 'verified',
        acceptedTermsAt: new Date('2024-01-15T00:00:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@test.com' },
      update: {},
      create: {
        email: 'user2@test.com',
        name: 'SkinMaster',
        emailVerified: true,
        steamId: '76561198000000002',
        steamUsername: 'SkinMaster',
        steamAvatar: 'https://avatars.steamstatic.com/avatar.jpg',
        level: 14,
        xp: 11200,
        tickets: 38,
        totalVolume: 2200000, // 22,000 €
        kycStatus: 'verified',
        acceptedTermsAt: new Date('2024-02-20T00:00:00Z'),
      },
    }),
    prisma.user.upsert({
      where: { email: 'user3@test.com' },
      update: {},
      create: {
        email: 'user3@test.com',
        name: 'CS2Collector',
        emailVerified: true,
        steamId: '76561198000000003',
        steamUsername: 'CS2Collector',
        steamAvatar: 'https://avatars.steamstatic.com/avatar.jpg',
        level: 13,
        xp: 9800,
        tickets: 42,
        totalVolume: 1950000, // 19,500 €
        kycStatus: 'pending',
        acceptedTermsAt: new Date('2024-03-10T00:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ ${users.length} utilisateurs créés`);

  // Créer des méthodes de paiement
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        userId: users[1].id,
        type: 'sepa',
        details: {
          iban: 'FR76****1234',
          accountHolder: 'ProTrader_CS2',
          bankName: 'Banque Populaire',
        },
        isVerified: true,
        isDefault: true,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId: users[2].id,
        type: 'crypto',
        details: {
          address: '0x1234...5678',
          network: 'ethereum',
          label: 'Wallet Principal',
        },
        isVerified: true,
        isDefault: true,
      },
    }),
  ]);

  console.log(`✅ ${paymentMethods.length} méthodes de paiement créées`);

  // Créer des trades
  const trades = await Promise.all([
    prisma.trade.create({
      data: {
        userId: users[1].id,
        status: 'payé',
        brutCentimes: 15000,
        fraisCashout: 75,
        fraisReseau: 200,
        netCentimes: 14725,
        ticketId: 'TICK-20241201-0001',
        tradeAcceptéLe: new Date('2024-12-01T10:30:00Z'),
        disponibleLe: new Date('2024-12-08T10:30:00Z'),
        items: {
          create: [
            {
              name: 'AK-47 | Redline (Field-Tested)',
              marketHashName: 'AK-47 | Redline (Field-Tested)',
              prixCentimes: 15000,
              iconUrl: '/images/cs2/weapons/ak47-redline.png',
              exterior: 'Field-Tested',
              statTrak: false,
              rarity: 'Classified',
            },
          ],
        },
      },
    }),
    prisma.trade.create({
      data: {
        userId: users[2].id,
        status: 'paiement_en_cours',
        brutCentimes: 25000,
        fraisCashout: 125,
        fraisReseau: 300,
        netCentimes: 24575,
        ticketId: 'TICK-20241201-0002',
        tradeAcceptéLe: new Date('2024-12-01T11:15:00Z'),
        disponibleLe: new Date('2024-12-08T11:15:00Z'),
        items: {
          create: [
            {
              name: 'AWP | Dragon Lore (Factory New)',
              marketHashName: 'AWP | Dragon Lore (Factory New)',
              prixCentimes: 25000,
              iconUrl: '/images/cs2/weapons/awp-dragonlore.png',
              exterior: 'Factory New',
              statTrak: false,
              rarity: 'Covert',
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ ${trades.length} trades créés`);

  // Créer des paiements
  const payouts = await Promise.all([
    prisma.payout.create({
      data: {
        userId: users[1].id,
        tradeId: trades[0].id,
        status: 'payé',
        montantCentimes: 14725,
        methodePaiementId: paymentMethods[0].id,
        referencePaiement: 'PAY-20241201-001',
        payéLe: new Date('2024-12-01T14:30:00Z'),
      },
    }),
    prisma.payout.create({
      data: {
        userId: users[2].id,
        tradeId: trades[1].id,
        status: 'en_attente',
        montantCentimes: 24575,
        methodePaiementId: paymentMethods[1].id,
      },
    }),
  ]);

  console.log(`✅ ${payouts.length} paiements créés`);

  // Créer des documents KYC
  const kycDocuments = await Promise.all([
    prisma.kYCDocument.create({
      data: {
        userId: users[1].id,
        type: 'id_card',
        status: 'approved',
        providerId: 'provider_123',
        reviewedAt: new Date('2024-11-15T14:30:00Z'),
      },
    }),
    prisma.kYCDocument.create({
      data: {
        userId: users[3].id,
        type: 'selfie',
        status: 'pending',
        providerId: 'provider_124',
      },
    }),
  ]);

  console.log(`✅ ${kycDocuments.length} documents KYC créés`);

  // Créer des statistiques d'affiliation
  const affiliateStats = await Promise.all([
    prisma.affiliateStats.create({
      data: {
        userId: users[1].id,
        code: 'AFF001',
        totalReferrals: 25,
        totalVolumeCentimes: 500000,
        totalCommissionCentimes: 10000,
        commissionRate: 0.02,
      },
    }),
  ]);

  console.log(`✅ ${affiliateStats.length} statistiques d'affiliation créées`);

  // Créer des giveaways
  const giveaways = await Promise.all([
    prisma.giveaway.create({
      data: {
        title: 'Giveaway AK-47 Redline',
        description: 'Gagnez une AK-47 Redline Field-Tested !',
        prize: 'AK-47 | Redline (Field-Tested)',
        ticketPrice: 10,
        maxTickets: 100,
        soldTickets: 85,
        endDate: new Date('2024-12-15T23:59:59Z'),
        status: 'active',
      },
    }),
  ]);

  console.log(`✅ ${giveaways.length} giveaways créés`);

  console.log('🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
