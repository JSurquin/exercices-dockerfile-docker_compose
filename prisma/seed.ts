import { config } from 'dotenv';
import { prisma } from './prisma';
import { auth } from '../lib/auth';
import { KycStatus, type User, type UserRole } from '@prisma/client';

config({ path: '.env.local' });
config();

const SEED_GIVEAWAY_TITLES = [
  'Giveaway AK-47 Redline StatTrak™',
  'Giveaway AWP Dragon Lore',
] as const;

type SeedUserSpec = {
  email: string;
  password: string;
  name: string;
  steamId: string;
  steamUsername: string;
  steamAvatar: string;
  level: number;
  xp: number;
  tickets: number;
  type: 'ADMIN' | 'MODERATOR' | 'PRO_TRADER' | 'SKIN_MASTER' | 'COLLECTOR' | 'AFFILIATE' | 'USER';
  totalVolumeCents: number;
  kycStatus: string;
  acceptedTermsAt: Date;
};

function roleFromSeedType(type: SeedUserSpec['type']): UserRole {
  if (type === 'ADMIN') return 'ADMIN';
  if (type === 'MODERATOR') return 'MODERATOR';
  if (type === 'AFFILIATE' || type === 'PRO_TRADER' || type === 'SKIN_MASTER') return 'AFFILIATE';
  return 'USER';
}

async function resetSeedData(emails: string[]) {
  await prisma.giveaway.deleteMany({
    where: { title: { in: [...SEED_GIVEAWAY_TITLES] } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: emails } },
  });
}

async function ensureSeedUser(userData: SeedUserSpec): Promise<User> {
  const role = roleFromSeedType(userData.type);

  const signUp = await auth.api.signUpEmail({
    body: {
      email: userData.email,
      password: userData.password,
      name: userData.name,
    },
  });

  if (!signUp.user?.id) {
    throw new Error(`Impossible de créer le compte seed pour ${userData.email}`);
  }

  return prisma.user.update({
    where: { id: signUp.user.id },
    data: {
      name: userData.name,
      role,
      steamId: userData.steamId,
      steamUsername: userData.steamUsername,
      steamAvatar: userData.steamAvatar,
      level: userData.level,
      xp: userData.xp,
      tickets: userData.tickets,
      totalVolumeCents: userData.totalVolumeCents,
      kycStatus: userData.kycStatus as KycStatus,
      acceptedTermsAt: userData.acceptedTermsAt,
      emailVerified: true,
    },
  });
}

async function main() {
  console.log('🌱 Début du seeding de la base de données CashTrade...');

  // Créer des utilisateurs de test avec Better Auth API
  const testUsers = [
    {
      email: 'admin@moonskin.com',
      password: 'CashTrade2024!',
      name: 'Admin CashTrade',
      steamId: '76561198000000000',
      steamUsername: 'Admin_CTF',
      steamAvatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      level: 25,
      xp: 75000,
      tickets: 150,
      type: 'ADMIN',  // ADMIN, MODERATOR, PRO_TRADER, SKIN_MASTER, COLLECTOR, AFFILIATE
      totalVolumeCents: 15000000, // 150,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      email: 'moderator@moonskin.com',
      password: 'Moderator2024!',
      name: 'Modérateur Support',
      steamId: '76561198000000020',
      steamUsername: 'Moderator_CTF',
      steamAvatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5427_full.jpg',
      level: 12,
      xp: 18000,
      tickets: 45,
      type: 'MODERATOR',  // Modérateur pour gérer les conversations
      totalVolumeCents: 0, // Les modérateurs ne tradent pas
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-10T00:00:00Z'),
    },
    {
      email: 'protrader@moonskin.com',
      password: 'ProTrader2024!',
      name: 'ProTrader CS2',
      steamId: '76561198000000001',
      steamUsername: 'ProTrader_CS2',
      steamAvatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_full.jpg',
      level: 18,
      xp: 35000,
      tickets: 85,
      type: 'AFFILIATE',  // Affilié actif avec de bonnes stats
      totalVolumeCents: 5500000, // 55,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-15T00:00:00Z'),
    },
    {
      email: 'skinmaster@moonskin.com',
      password: 'SkinMaster2024!',
      name: 'SkinMaster Elite',
      steamId: '76561198000000002',
      steamUsername: 'SkinMaster_Elite',
      steamAvatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
      level: 16,
      xp: 28000,
      tickets: 72,
      type: 'AFFILIATE',  // Affilié actif avec stats moyennes
      totalVolumeCents: 4200000, // 42,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-02-20T00:00:00Z'),
    },
    {
      email: 'collector@moonskin.com',
      password: 'Collector2024!',
      name: 'CS2 Collector Pro',
      steamId: '76561198000000003',
      steamUsername: 'CS2Collector_Pro',
      steamAvatar: 'https://avatars.steamstatic.com/85f5ac0c5117493a2d3b5b0f29f7da6b67e6ca7a_full.jpg',
      level: 14,
      xp: 22000,
      tickets: 58,
      type: 'USER',  // Utilisateur normal (pas affilié)
      totalVolumeCents: 3100000, // 31,000 € en centimes
      kycStatus: 'PENDING',
      acceptedTermsAt: new Date('2024-03-10T00:00:00Z'),
    },
    // Nouveaux affiliés dédiés
    {
      email: 'topaffiliate@moonskin.com',
      password: 'TopAffiliate2024!',
      name: 'Top Affiliate CS2',
      steamId: '76561198000000010',
      steamUsername: 'TopAffiliate_CS2',
      steamAvatar: 'https://avatars.steamstatic.com/f1dd60a188883caf82d0cbfccfe6aba0af1732d4_full.jpg',
      level: 22,
      xp: 55000,
      tickets: 120,
      type: 'AFFILIATE',  // Top affilié
      totalVolumeCents: 8500000, // 85,000 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-01-05T00:00:00Z'),
    },
    {
      email: 'newaffiliate@moonskin.com',
      password: 'NewAffiliate2024!',
      name: 'New Affiliate Pro',
      steamId: '76561198000000011',
      steamUsername: 'NewAffiliate_Pro',
      steamAvatar: 'https://avatars.steamstatic.com/b2c8f0c5aa4644a474a2e4972be27ef94e52a299_full.jpg',
      level: 8,
      xp: 12000,
      tickets: 25,
      type: 'AFFILIATE',  // Nouvel affilié
      totalVolumeCents: 850000, // 8,500 € en centimes
      kycStatus: 'VERIFIED',
      acceptedTermsAt: new Date('2024-11-01T00:00:00Z'),
    },
  ];

  const seedEmails = testUsers.map((u) => u.email);
  console.log('🧹 Réinitialisation des données seed précédentes...');
  await resetSeedData(seedEmails);

  const users: User[] = [];
  for (const userData of testUsers) {
    try {
      const user = await ensureSeedUser(userData as SeedUserSpec);
      users.push(user);
      console.log(
        `✅ Utilisateur créé: ${userData.name} (${userData.email}) - Rôle: ${user.role}`,
      );
    } catch (error) {
      console.error(
        `❌ Erreur lors de la création de l'utilisateur ${userData.email}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  console.log(`✅ ${users.length} utilisateurs traités`);

  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const protrader = userByEmail.get('protrader@moonskin.com');
  const skinmaster = userByEmail.get('skinmaster@moonskin.com');
  const collector = userByEmail.get('collector@moonskin.com');
  const topAffiliate = userByEmail.get('topaffiliate@moonskin.com');
  const newAffiliate = userByEmail.get('newaffiliate@moonskin.com');

  if (!protrader || !skinmaster || !collector || !topAffiliate || !newAffiliate) {
    throw new Error('Comptes seed essentiels manquants après création');
  }

  // Créer des méthodes de paiement (SEPA et Crypto selon les règles)
  const paymentMethods = await Promise.all([
    // Méthode SEPA pour ProTrader (vérifiée)
    prisma.paymentMethod.create({
      data: {
        userId: protrader.id,
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
        userId: skinmaster.id,
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
        userId: collector.id,
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
        userId: protrader.id,
        steamId: protrader.steamId as string,
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
        userId: skinmaster.id,
        steamId: skinmaster.steamId as string,
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
        userId: collector.id,
        steamId: collector.steamId as string,
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
        userId: protrader.id,
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
        userId: skinmaster.id,
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
        userId: protrader.id,
        type: 'ID_CARD',
        status: 'VERIFIED',
        kycaidApplicantId: 'SEED_APPLICANT_' + protrader.id,
        kycaidDocumentId: 'SUMSUB_ID_123456',
        reviewedAt: new Date('2024-11-15T14:30:00Z'),
      },
    }),
    prisma.kycDocument.create({
      data: {
        userId: protrader.id,
        type: 'SELFIE',
        status: 'VERIFIED',
        kycaidApplicantId: 'SEED_APPLICANT_' + protrader.id,
        kycaidDocumentId: 'SUMSUB_SELFIE_123456',
        reviewedAt: new Date('2024-11-15T14:35:00Z'),
      },
    }),
    // KYC approuvé pour SkinMaster
    prisma.kycDocument.create({
      data: {
        userId: skinmaster.id,
        type: 'PASSPORT',
        status: 'VERIFIED',
        kycaidApplicantId: 'SEED_APPLICANT_' + skinmaster.id,
        kycaidDocumentId: 'SUMSUB_PASS_789012',
        reviewedAt: new Date('2024-11-20T16:20:00Z'),
      },
    }),
    // KYC en attente pour Collector
    prisma.kycDocument.create({
      data: {
        userId: collector.id,
        type: 'ID_CARD',
        status: 'PENDING',
        kycaidApplicantId: 'SEED_APPLICANT_' + collector.id,
        kycaidDocumentId: 'SUMSUB_ID_345678',
      },
    }),
  ]);

  console.log(`✅ ${kycDocuments.length} documents KYC créés`);

  // Nettoyer les anciennes stats d'affiliation pour éviter les conflits de code
  console.log('🧹 Nettoyage des anciennes statistiques d\'affiliation...');
  await prisma.affiliateStats.deleteMany({
    where: {
      userId: {
        in: users.map(u => u.id)
      }
    }
  });

  // Créer des statistiques d'affiliation (2% commission selon les règles)
  const affiliateUsers = users.filter(user => user.role === 'AFFILIATE');
  console.log(`🎯 Création des stats d'affiliation pour ${affiliateUsers.length} affiliés...`);
  
  const affiliateStats = await Promise.all([
    // ProTrader (users[1]) - Affilié expérimenté
    prisma.affiliateStats.create({
      data: {
        userId: protrader.id,
        code: 'PROTRADER',
        totalReferrals: 15,
        totalVolumeCents: 750000, // 7,500€ de volume généré
        totalCommissionCents: 15000, // 150€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
    // SkinMaster (users[2]) - Affilié actif
    prisma.affiliateStats.create({
      data: {
        userId: skinmaster.id,
        code: 'SKINMASTER',
        totalReferrals: 8,
        totalVolumeCents: 420000, // 4,200€ de volume généré
        totalCommissionCents: 8400, // 84€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
    // TopAffiliate (users[4]) - Top performer
    prisma.affiliateStats.create({
      data: {
        userId: topAffiliate.id,
        code: 'TOPAFFILIATE',
        totalReferrals: 45,
        totalVolumeCents: 2250000, // 22,500€ de volume généré
        totalCommissionCents: 45000, // 450€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
    // NewAffiliate (users[5]) - Débutant
    prisma.affiliateStats.create({
      data: {
        userId: newAffiliate.id,
        code: 'NEWAFFILIATE',
        totalReferrals: 2,
        totalVolumeCents: 85000, // 850€ de volume généré
        totalCommissionCents: 1700, // 17€ de commission (2%)
        commissionRate: 0.02,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${affiliateStats.length} statistiques d'affiliation créées`);

  // Créer quelques référrals d'affiliation pour rendre les données réalistes
  console.log(`🔗 Création de référrals d'affiliation...`);
  
  const affiliateReferrals = await Promise.all([
    // Référrals pour ProTrader
    prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliateStats[0].id, // ProTrader
        referredUserId: collector.id, // Collector référé par ProTrader
        tradeId: trades[2].id, // Le trade du collector
        volumeCents: 8500,
        commissionCents: 170, // 2% de 8500
      },
    }),
    // Référrals pour TopAffiliate
    prisma.affiliateReferral.create({
      data: {
        affiliateId: affiliateStats[2].id, // TopAffiliate
        referredUserId: newAffiliate.id, // NewAffiliate référé par TopAffiliate (cross-referral)
        volumeCents: 85000,
        commissionCents: 1700, // 2% de 85000
      },
    }),
  ]);

  console.log(`✅ ${affiliateReferrals.length} référrals d'affiliation créés`);

  // Créer quelques commissions d'affiliation
  console.log(`💰 Création de commissions d'affiliation...`);
  
  const affiliateCommissions = await Promise.all([
    // Commission payée pour ProTrader
    prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliateStats[0].id, // ProTrader
        referralId: affiliateReferrals[0].id,
        amountCents: 170,
        status: 'PAID',
        paidAt: new Date('2024-12-01T16:00:00Z'),
      },
    }),
    // Commission en attente pour TopAffiliate
    prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliateStats[2].id, // TopAffiliate
        referralId: affiliateReferrals[1].id,
        amountCents: 1700,
        status: 'APPROVED',
      },
    }),
    // Commission en attente pour SkinMaster (sans référral spécifique)
    prisma.affiliateCommission.create({
      data: {
        affiliateId: affiliateStats[1].id, // SkinMaster
        amountCents: 8400,
        status: 'PENDING',
      },
    }),
  ]);

  console.log(`✅ ${affiliateCommissions.length} commissions d'affiliation créées`);

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
        userId: protrader.id,
        giveawayId: giveaways[0].id,
        ticketsUsed: 15, // 3 entrées × 5 tickets
      },
    }),
    prisma.giveawayEntry.create({
      data: {
        userId: skinmaster.id,
        giveawayId: giveaways[0].id,
        ticketsUsed: 10, // 2 entrées × 5 tickets
      },
    }),
    // Entrées pour le giveaway AWP
    prisma.giveawayEntry.create({
      data: {
        userId: protrader.id,
        giveawayId: giveaways[1].id,
        ticketsUsed: 50, // 2 entrées × 25 tickets
      },
    }),
  ]);

  console.log(`✅ ${giveawayEntries.length} entrées de giveaway créées`);

  // Mettre à jour les tickets utilisés des utilisateurs
  await Promise.all([
    prisma.user.update({
      where: { id: protrader.id },
      data: { tickets: { decrement: 65 } }, // 15 + 50 tickets utilisés
    }),
    prisma.user.update({
      where: { id: skinmaster.id },
      data: { tickets: { decrement: 10 } }, // 10 tickets utilisés
    }),
  ]);

  console.log('✅ Tickets des utilisateurs mis à jour');

  console.log(`
🎉 Seeding CashTrade terminé avec succès !

📊 Résumé :
- ${users.length} utilisateurs créés/mis à jour (${affiliateUsers.length} affiliés)
- ${paymentMethods.length} méthodes de paiement (SEPA + Crypto)
- ${trades.length} trades avec différents statuts
- ${payouts.length} paiements
- ${kycDocuments.length} documents KYC
- ${affiliateStats.length} comptes d'affiliation avec stats
- ${affiliateReferrals.length} référrals d'affiliation
- ${affiliateCommissions.length} commissions d'affiliation
- ${giveaways.length} giveaways actifs
- ${giveawayEntries.length} entrées de giveaway

🔐 Comptes de test :
- admin@moonskin.com (Admin, accès complet)
- moderator@moonskin.com (Modérateur, gestion conversations - URL: /moderation)
- protrader@moonskin.com (Affilié expérimenté, 15 référrals, 150€ commission)
- skinmaster@moonskin.com (Affilié actif, 8 référrals, 84€ commission)
- collector@moonskin.com (Utilisateur normal, KYC en attente)
- topaffiliate@moonskin.com (Top affilié, 45 référrals, 450€ commission)
- newaffiliate@moonskin.com (Nouvel affilié, 2 référrals, 17€ commission)

🎯 Système d'affiliation complet :
- Codes d'affiliation : PROTRADER, SKINMASTER, TOPAFFILIATE, NEWAFFILIATE
- Taux de commission : 2% sur le volume brut
- Statuts des commissions : PENDING, APPROVED, PAID
- Référrals avec tracking complet

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