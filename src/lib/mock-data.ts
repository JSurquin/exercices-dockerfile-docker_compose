import { User, Trade, TradeItem, PaymentMethod, Giveaway, AffiliateStats } from './types';

export const mockUser: User = {
  id: 'user_76561198012345678',
  steamId64: '76561198012345678',
  username: 'ProGamer2024',
  avatar: 'https://avatars.steamstatic.com/c5d56249ee5d28a07db4ac9f7f60af961fab5426_full.jpg',
  acceptedTermsAt: new Date('2024-01-15'),
  kycStatus: 'verified',
  totalVolume: 123456, // 1234.56€ en centimes
  xp: 15800,
  level: 12,
  tickets: 45,
  joinedAt: new Date('2024-01-15'),
};

export const mockTradeItems: TradeItem[] = [
  {
    id: '1',
    name: 'AK-47 | Redline',
    marketHashName: 'AK-47 | Redline (Field-Tested)',
    prixCentimes: 8500, // 85€
    iconUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhoyszOeiJL7du6mIWZqPrxN7LEmyUDu8Fy3uqW9I7w0VDi-UM9ZG_6LYGUIwA_aVCBrlS5yb3tgcC56M7NzXUw6D5iuyisxQ0djQ/62fx62f',
    exterior: 'Field-Tested',
    statTrak: false,
    rarity: 'Classified',
  },
  {
    id: '2',
    name: 'AWP | Dragon Lore',
    marketHashName: 'AWP | Dragon Lore (Factory New)',
    prixCentimes: 125000, // 1250€
    iconUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJD_9W7m5a0mvLwOq7c2D4H68Nz2uyVp4ij0VHj_UU4YGimJoTGJAU4aVHU_AK5kuvpjJG8vp_KySQ37nEi7H7YnBGpwUYbZPsj7Og/62fx62f',
    exterior: 'Factory New',
    statTrak: false,
    rarity: 'Extraordinary',
  },
  {
    id: '3',
    name: 'Glock-18 | Fade',
    marketHashName: 'StatTrak™ Glock-18 | Fade (Factory New)',
    prixCentimes: 28000, // 280€
    iconUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf1OD3djFN09C3hoeO2a_8NvXEm25u4MBwnPCPo4n22gzs80o9NWHxJY7Hc1Q3YV7W-gO2wui4h5LouJ_KySZg6ikmtyzZzBCpwUYbbNZXKgE/62fx62f',
    exterior: 'Factory New',
    statTrak: true,
    rarity: 'Covert',
  },
];

export const mockTrades: Trade[] = [
  {
    id: 'trade_001',
    userId: mockUser.steamId64,
    status: 'en_trade_hold',
    brutCentimes: 161500,
    frais: {
      cashout: 807, // 0.5%
      réseau: 2000, // 20€
    },
    netCentimes: 158693,
    ticketId: 'TICK-20240921-0001',
    tradeAcceptéLe: new Date('2024-09-14T12:00:00Z'),
    disponibleLe: new Date('2024-09-21T12:00:00Z'),
    créédLe: new Date('2024-09-14T11:30:00Z'),
    items: mockTradeItems,
  },
  {
    id: 'trade_002',
    userId: mockUser.steamId64,
    status: 'payé',
    brutCentimes: 8500,
    frais: {
      cashout: 42,
      réseau: 500,
    },
    netCentimes: 7958,
    ticketId: 'TICK-20240915-0042',
    tradeAcceptéLe: new Date('2024-09-08T14:20:00Z'),
    disponibleLe: new Date('2024-09-15T14:20:00Z'),
    créédLe: new Date('2024-09-08T14:00:00Z'),
    items: [mockTradeItems[0]],
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'sepa_001',
    type: 'sepa',
    details: {
      iban: 'FR76 1234 5678 9012 3456 789',
      bic: 'QNTOFRP1',
      accountHolder: 'Jean Dupont',
      bankName: 'Qonto',
      verificationMethod: 'otp',
      lastVerifiedAt: new Date('2024-09-01'),
    },
    isVerified: true,
    isDefault: true,
    createdAt: new Date('2024-09-01'),
  },
  {
    id: 'crypto_001',
    type: 'crypto',
    details: {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      network: 'bitcoin',
      label: 'Wallet principal',
    },
    isVerified: true,
    isDefault: false,
    createdAt: new Date('2024-09-10'),
  },
];

export const mockGiveaways: Giveaway[] = [
  {
    id: 'giveaway_001',
    title: 'AK-47 | Redline Giveaway',
    description: 'Tentez de gagner un magnifique AK-47 Redline Field-Tested !',
    prize: 'AK-47 | Redline (Field-Tested)',
    ticketPrice: 10,
    maxTickets: 1000,
    soldTickets: 756,
    endDate: new Date('2024-09-30T23:59:59Z'),
    status: 'ACTIVE',
  },
  {
    id: 'giveaway_002',
    title: 'Dragon Lore Mega Giveaway',
    description: 'Le giveaway du siècle ! Une AWP Dragon Lore Factory New à gagner !',
    prize: 'AWP | Dragon Lore (Factory New)',
    ticketPrice: 50,
    maxTickets: 500,
    soldTickets: 234,
    endDate: new Date('2024-10-15T23:59:59Z'),
    status: 'ACTIVE',
  },
  {
    id: 'giveaway_003',
    title: 'Knife Collection',
    description: 'Collection de couteaux premium à gagner !',
    prize: 'Karambit | Fade (Factory New)',
    ticketPrice: 25,
    maxTickets: 800,
    soldTickets: 800,
    endDate: new Date('2024-09-15T23:59:59Z'),
    status: 'ENDED',
    winnerId: '76561198087654321',
    randomSeed: 'abc123def456',
  },
];

export const mockAffiliateStats: AffiliateStats = {
  id: 'aff_001',
  userId: mockUser.steamId64,
  code: 'PROGAMER2024',
  totalReferrals: 24,
  totalVolumeCents: 456789, // 4567.89€
  totalCommissionCents: 9135, // 91.35€
  commissionRate: 0.02, // 2%
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Données pour les statistiques du dashboard
export const mockStats = {
  totalUsers: 15420,
  totalTrades: 8967,
  totalVolume: 2456789, // en centimes
  totalCommissions: 12283, // en centimes
  averageTradeValue: 27400, // en centimes
  topTraders: [
    { username: 'ProGamer2024', volume: 123456, trades: 45 },
    { username: 'SkinMaster', volume: 98765, trades: 32 },
    { username: 'CSGOKing', volume: 87654, trades: 28 },
  ],
};

// Données pour les graphiques
export const mockVolumeData = [
  { date: '2024-01', volume: 45678 },
  { date: '2024-02', volume: 52341 },
  { date: '2024-03', volume: 48920 },
  { date: '2024-04', volume: 61205 },
  { date: '2024-05', volume: 58734 },
  { date: '2024-06', volume: 67891 },
  { date: '2024-07', volume: 72456 },
  { date: '2024-08', volume: 69123 },
  { date: '2024-09', volume: 78945 },
];

export const mockTradeStatusData = [
  { status: 'Payé', count: 3456, color: '#22c55e' },
  { status: 'En cours', count: 234, color: '#f59e0b' },
  { status: 'En attente', count: 89, color: '#3b82f6' },
  { status: 'Échoué', count: 23, color: '#ef4444' },
];
