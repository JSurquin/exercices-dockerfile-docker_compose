import { prisma } from "./prisma";
import { auth } from '../src/lib/auth';
import { KycStatus } from '@prisma/client';
async function main() {
  console.log('🌱 Début du seeding de la base de données CashTrade...');

  // Créer des utilisateurs de test avec Better Auth API
  const testUsers = [
    {
      email: 'admin@cashtrade.com',
      password: 'CashTrade2024!',
      name: 'Admin CashTrade',
      steamId: '76561198000000000',
      steamUsername: 'Admin_CTF',
      steamAvatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      level: 25,
      xp: 75000,
      tickets: 150,
      type: 'ADMIN',  // ADMIN, PRO_TRADER, SKIN_MASTER, COLLECTOR
      totalVolumeCents: 15000000, // 150,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      email: 'protrader@cashtrade.com',
      password: 'ProTrader2024!',
      name: 'ProTrader CS2',
      steamId: '76561198000000001',
      steamUsername: 'ProTrader_CS2',
      steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_full.jpg',
      level: 18,
      xp: 35000,
      tickets: 85,
      type: 'PRO_TRADER',  // ADMIN, PRO_TRADER, SKIN_MASTER, COLLECTOR
      totalVolumeCents: 5500000, // 55,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-15T00:00:00Z'),
    },
    {
      email: 'skinmaster@cashtrade.com',
      password: 'SkinMaster2024!',
      name: 'SkinMaster Elite',
      steamId: '76561198000000002',
      steamUsername: 'SkinMaster_Elite',
      steamAvatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
      level: 16,
      xp: 28000,
      tickets: 72,
      type: 'SKIN_MASTER',  // ADMIN, PRO_TRADER, SKIN_MASTER, COLLECTOR
      totalVolumeCents: 4200000, // 42,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-02-20T00:00:00Z'),
    },
    {
      email: 'collector@cashtrade.com',
      password: 'Collector2024!',
      name: 'CS2 Collector Pro',
      steamId: '76561198000000003',
      steamUsername: 'CS2Collector_Pro',
      steamAvatar: 'https://avatars.steamstatic.com/85f5ac0c5117493a2d3b5b0f29f7da6b67e6ca7a_full.jpg',
      level: 14,
      xp: 22000,
      tickets: 58,
      type: 'COLLECTOR',  // ADMIN, PRO_TRADER, SKIN_MASTER, COLLECTOR
      totalVolumeCents: 3100000, // 31,000 € en centimes
      kycStatus: 'PENDING',
      acceptedTermsAt: new Date('2024-03-10T00:00:00Z'),
    },
  ];

  const users = [];
  
  for (const userData of testUsers) {
    try {
      // D'abord créer le compte avec Better Auth
      const signUpResponse = await fetch('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
        }),
      });

      if (!signUpResponse.ok) {
        console.log(`⚠️ Utilisateur ${userData.email} existe peut-être déjà, tentative de mise à jour...`);
      }

      // Ensuite mettre à jour avec les données complètes via Prisma
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.type === 'ADMIN' ? 'ADMIN' : 'USER',
          steamId: userData.steamId,
          steamUsername: userData.steamUsername,
          steamAvatar: userData.steamAvatar,
          level: userData.level,
          xp: userData.xp,
          tickets: userData.tickets,
          totalVolumeCents: userData.totalVolumeCents,
          kycStatus: userData.kycStatus as KycStatus,
          acceptedTermsAt: userData.acceptedTermsAt,
          emailVerified: true, // Marquer comme vérifié pour les tests
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.type === 'ADMIN' ? 'ADMIN' : 'USER',
          steamId: userData.steamId,
          steamUsername: userData.steamUsername,
          steamAvatar: userData.steamAvatar,
          level: userData.level,
          xp: userData.xp,
          tickets: userData.tickets,
          totalVolumeCents: userData.totalVolumeCents,
          kycStatus: userData.kycStatus as KycStatus,
          acceptedTermsAt: userData.acceptedTermsAt,
          emailVerified: true, // Marquer comme vérifié pour les tests
        },
      });

      users.push(user);
      console.log(`✅ Utilisateur créé/mis à jour: ${userData.name} (${userData.email}) - Rôle: ${userData.type === 'ADMIN' ? 'ADMIN' : 'USER'}`);
    } catch (error) {
      console.log(`❌ Erreur lors de la création/mise à jour de l'utilisateur ${userData.email}:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`✅ ${users.length} utilisateurs traités`);

  // Créer des méthodes de paiement (SEPA et Crypto selon les règles)
  const paymentMethods = await Promise.all([
    // Méthode SEPA pour ProTrader (vérifiée)
    prisma.paymentMethod.create({
      data: {
        userId: users[1].id,
        type: 'SEPA',
        details: {
          iban: 'FR7630001007941234567890185',
          accountHolder: 'ProTrader CS2',
          bankName: 'BNP Paribas',
          bic: 'BNPAFRPP',
          verified: true,
          verificationMethod: 'micro_virement',
          verificationCode: 'CTF2024',
        },
        isVerified: true,
        isDefault: true,
      },
    }),
    // Méthode Crypto pour SkinMaster (vérifiée)
    prisma.paymentMethod.create({
      data: {
        userId: users[2].id,
        type: 'CRYPTO',
        details: {
          address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
          network: 'ethereum',
          currency: 'USDT',
          label: 'Wallet Principal Binance',
          kycCompleted: true,
        },
        isVerified: true,
        isDefault: true,
      },
    }),
    // Méthode SEPA non vérifiée pour Collector (nécessite vérification)
    prisma.paymentMethod.create({
      data: {
        userId: users[3].id,
        type: 'SEPA',
        details: {
          iban: 'FR7630004000031234567890143',
          accountHolder: 'CS2 Collector Pro',
          bankName: 'Crédit Agricole',
          bic: 'AGRIFRPP',
          verified: false,
          requiresVerification: true,
        },
        isVerified: false,
        isDefault: true,
      },
    }),
  ]);

  console.log(`✅ ${paymentMethods.length} méthodes de paiement créées`);

  // Créer des trades avec les bons noms de champs du schéma
  const trades = await Promise.all([
    // Trade payé (ProTrader)
    prisma.trade.create({
      data: {
        userId: users[1].id,
        steamId: users[1].steamId as string,
        status: 'PAID',
        grossCents: 15000, // 150€
        cashoutFees: 75, // 0.5% de 150€
        networkFees: 200, // 2€ frais réseau
        netCents: 14725, // 147.25€
        ticketId: `TICK-${Date.now()}-0001`,
        tradeAcceptedAt: new Date('2024-12-01T10:30:00Z'),
        availableAt: new Date('2024-12-08T10:30:00Z'),
        items: {
          create: [
            {
              name: 'AK-47 | Redline (Field-Tested)',
              marketHashName: 'AK-47 | Redline (Field-Tested)',
              priceCents: 15000,
              iconUrl: '/images/cs2/weapons/ak47-redline.png',
              exterior: 'Field-Tested',
              statTrak: false,
              rarity: 'Classified',
            },
          ],
        },
      },
    }),
    // Trade en cours de paiement (SkinMaster)
    prisma.trade.create({
      data: {
        userId: users[2].id,
        steamId: users[2].steamId as string,
        status: 'PAYOUT_PENDING',
        grossCents: 45000, // 450€
        cashoutFees: 225, // 0.5% de 450€
        networkFees: 300, // 3€ frais réseau crypto
        netCents: 44475, // 444.75€
        ticketId: `TICK-${Date.now()}-0002`,
        tradeAcceptedAt: new Date('2024-12-01T11:15:00Z'),
        availableAt: new Date('2024-12-08T11:15:00Z'),
        items: {
          create: [
            {
              name: 'AWP | Dragon Lore (Factory New)',
              marketHashName: 'AWP | Dragon Lore (Factory New)',
              priceCents: 45000,
              iconUrl: '/images/cs2/weapons/awp-dragonlore.png',
              exterior: 'Factory New',
              statTrak: false,
              rarity: 'Covert',
            },
          ],
        },
      },
    }),
    // Trade en trade hold (Collector - nécessite KYC)
    prisma.trade.create({
      data: {
        userId: users[3].id,
        steamId: users[3].steamId as string,
        status: 'IN_TRADE_HOLD',
        grossCents: 8500, // 85€
        cashoutFees: 43, // 0.5% de 85€
        networkFees: 200, // 2€ frais réseau
        netCents: 8257, // 82.57€
        ticketId: `TICK-${Date.now()}-0003`,
        tradeAcceptedAt: new Date('2024-12-02T09:45:00Z'),
        availableAt: new Date('2024-12-09T09:45:00Z'),
        items: {
          create: [
            {
              name: 'M4A4 | Howl (Minimal Wear)',
              marketHashName: 'M4A4 | Howl (Minimal Wear)',
              priceCents: 8500,
              iconUrl: '/images/cs2/weapons/m4a4-howl.png',
              exterior: 'Minimal Wear',
              statTrak: false,
              rarity: 'Contraband',
            },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ ${trades.length} trades créés`);

  // Créer des paiements avec les bons noms de champs
  const payouts = await Promise.all([
    // Paiement effectué
    prisma.payout.create({
      data: {
        userId: users[1].id,
        tradeId: trades[0].id,
        status: 'PAID',
        amountCents: 14725,
        paymentMethodId: paymentMethods[0].id,
        paymentReference: `SEPA-${Date.now()}-001`,
        txId: `TXN_QONTO_${Date.now()}`,
        paidAt: new Date('2024-12-01T14:30:00Z'),
      },
    }),
    // Paiement en cours (crypto)
    prisma.payout.create({
      data: {
        userId: users[2].id,
        tradeId: trades[1].id,
        status: 'SCHEDULED',
        amountCents: 44475,
        paymentMethodId: paymentMethods[1].id,
        paymentReference: `CRYPTO-${Date.now()}-002`,
      },
    }),
  ]);

  console.log(`✅ ${payouts.length} paiements créés`);

  // Créer des documents KYC selon les règles
  const kycDocuments = await Promise.all([
    // KYC approuvé pour ProTrader
    prisma.kycDocument.create({
      data: {
        userId: users[1].id,
        type: 'ID_CARD',
        status: 'VERIFIED',
        providerId: 'SUMSUB_ID_123456',
        reviewedAt: new Date('2024-11-15T14:30:00Z'),
      },
    }),
    prisma.kycDocument.create({
      data: {
        userId: users[1].id,
        type: 'SELFIE',
        status: 'VERIFIED',
        providerId: 'SUMSUB_SELFIE_123456',
        reviewedAt: new Date('2024-11-15T14:35:00Z'),
      },
    }),
    // KYC approuvé pour SkinMaster
    prisma.kycDocument.create({
      data: {
        userId: users[2].id,
        type: 'PASSPORT',
        status: 'VERIFIED',
        providerId: 'SUMSUB_PASS_789012',
        reviewedAt: new Date('2024-11-20T16:20:00Z'),
      },
    }),
    // KYC en attente pour Collector
    prisma.kycDocument.create({
      data: {
        userId: users[3].id,
        type: 'ID_CARD',
        status: 'PENDING',
        providerId: 'SUMSUB_ID_345678',
      },
    }),
  ]);

  console.log(`✅ ${kycDocuments.length} documents KYC créés`);

  // Créer des statistiques d'affiliation (2% commission selon les règles)
  const affiliateStats = await Promise.all([
    prisma.affiliateStats.upsert({
      where: { userId: users[1].id },
      update: {
        totalReferrals: 15,
        totalVolumeCents: 750000, // 7,500€ de volume généré
        totalCommissionCents: 15000, // 150€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
      create: {
        userId: users[1].id,
        code: 'PROTRADER',
        totalReferrals: 15,
        totalVolumeCents: 750000, // 7,500€ de volume généré
        totalCommissionCents: 15000, // 150€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
    prisma.affiliateStats.upsert({
      where: { userId: users[2].id },
      update: {
        totalReferrals: 8,
        totalVolumeCents: 420000, // 4,200€ de volume généré
        totalCommissionCents: 8400, // 84€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
      create: {
        userId: users[2].id,
        code: 'SKINMASTER',
        totalReferrals: 8,
        totalVolumeCents: 420000, // 4,200€ de volume généré
        totalCommissionCents: 8400, // 84€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${affiliateStats.length} statistiques d'affiliation créées`);

  // Créer des giveaways avec système de tickets
  const giveaways = await Promise.all([
    prisma.giveaway.create({
      data: {
        title: 'Giveaway AK-47 Redline StatTrak™',
        description: 'Gagnez une AK-47 Redline StatTrak™ Field-Tested d\'une valeur de 180€ !',
        prize: 'AK-47 | Redline StatTrak™ (Field-Tested)',
        ticketPrice: 5, // 5 tickets par entrée
        maxTickets: 200,
        soldTickets: 156,
        endDate: new Date('2024-12-15T23:59:59Z'),
        status: 'ACTIVE',
        randomSeed: null, // Sera généré au tirage
      },
    }),
    prisma.giveaway.create({
      data: {
        title: 'Giveaway AWP Dragon Lore',
        description: 'Le giveaway ultime ! Une AWP Dragon Lore Factory New d\'une valeur de 4500€ !',
        prize: 'AWP | Dragon Lore (Factory New)',
        ticketPrice: 25, // 25 tickets par entrée (prix élevé)
        maxTickets: 500,
        soldTickets: 287,
        endDate: new Date('2024-12-31T23:59:59Z'),
        status: 'ACTIVE',
        randomSeed: null,
      },
    }),
  ]);

  console.log(`✅ ${giveaways.length} giveaways créés`);

  // Créer des entrées de giveaway
  const giveawayEntries = await Promise.all([
    // Entrées pour le giveaway AK-47
    prisma.giveawayEntry.create({
      data: {
        userId: users[1].id,
        giveawayId: giveaways[0].id,
        ticketsUsed: 15, // 3 entrées × 5 tickets
      },
    }),
    prisma.giveawayEntry.create({
      data: {
        userId: users[2].id,
        giveawayId: giveaways[0].id,
        ticketsUsed: 10, // 2 entrées × 5 tickets
      },
    }),
    // Entrées pour le giveaway AWP
    prisma.giveawayEntry.create({
      data: {
        userId: users[1].id,
        giveawayId: giveaways[1].id,
        ticketsUsed: 50, // 2 entrées × 25 tickets
      },
    }),
  ]);

  console.log(`✅ ${giveawayEntries.length} entrées de giveaway créées`);

  // Mettre à jour les tickets utilisés des utilisateurs
  await Promise.all([
    prisma.user.update({
      where: { id: users[1].id },
      data: { tickets: { decrement: 65 } }, // 15 + 50 tickets utilisés
    }),
    prisma.user.update({
      where: { id: users[2].id },
      data: { tickets: { decrement: 10 } }, // 10 tickets utilisés
    }),
  ]);

  console.log('✅ Tickets des utilisateurs mis à jour');

  console.log(`
🎉 Seeding CashTrade terminé avec succès !

📊 Résumé :
- ${users.length} utilisateurs créés/mis à jour
- ${paymentMethods.length} méthodes de paiement (SEPA + Crypto)
- ${trades.length} trades avec différents statuts
- ${payouts.length} paiements
- ${kycDocuments.length} documents KYC
- ${affiliateStats.length} comptes d'affiliation
- ${giveaways.length} giveaways actifs
- ${giveawayEntries.length} entrées de giveaway

🔐 Comptes de test :
- admin@cashtrade.com (Admin, KYC vérifié)
- protrader@cashtrade.com (Trader pro, KYC vérifié, paiement effectué)
- skinmaster@cashtrade.com (Trader, KYC vérifié, paiement crypto en cours)
- collector@cashtrade.com (Nouveau, KYC en attente)

💰 Tous les montants sont en centimes selon les règles CashTrade
🎫 Système de gamification avec XP et tickets opérationnel
🔒 Schéma Prisma 100% anglais et professionnel
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });