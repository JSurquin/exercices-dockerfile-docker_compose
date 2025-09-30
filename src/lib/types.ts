export interface User {
  id: string;
  steamId64: string;
  username: string;
  avatar: string;
  acceptedTermsAt?: Date;
  kycStatus: 'pending' | 'in_progress' | 'verified' | 'rejected';
  totalVolume: number; // en centimes
  xp: number;
  level: number;
  tickets: number;
  joinedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  status: 'créé' | 'accepté_par_bot' | 'en_trade_hold' | 'disponible' | 'paiement_en_cours' | 'payé' | 'échoué';
  brutCentimes: number;
  frais: {
    cashout: number;
    réseau: number;
  };
  netCentimes: number;
  ticketId: string;
  tradeAcceptéLe?: Date;
  disponibleLe?: Date;
  créédLe: Date;
  items: TradeItem[];
}

export interface TradeItem {
  id: string;
  name: string;
  marketHashName: string;
  prixCentimes: number;
  iconUrl: string;
  exterior?: string;
  statTrak: boolean;
  rarity: string;
}

export interface PaymentMethod {
  id: string;
  type: 'sepa' | 'crypto';
  details: SEPADetails | CryptoDetails;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: Date;
}

export interface SEPADetails {
  iban: string;
  bic?: string;
  accountHolder: string;
  bankName: string;
  verificationMethod?: 'otp' | 'micro_virement';
  lastVerifiedAt?: Date;
}

export interface CryptoDetails {
  address: string;
  network: 'bitcoin' | 'ethereum' | 'usdt' | 'usdc';
  label?: string;
}

export interface Payout {
  id: string;
  userId: string;
  status: 'en_attente' | 'vérification_requise' | 'vérifié' | 'planifié' | 'exécuté' | 'payé' | 'échoué';
  montantCentimes: number;
  methodePaiement: PaymentMethod;
  referencePaiement?: string;
  txId?: string;
  créédLe: Date;
  payéLe?: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  type: 'id_card' | 'passport' | 'selfie' | 'proof_of_address';
  status: 'pending' | 'approved' | 'rejected';
  providerId: string; // ID du prestataire KYC
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  prize: string;
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  endDate: Date;
  status: 'active' | 'ended' | 'cancelled';
  winnerId?: string;
  randomSeed?: string;
}

export interface GiveawayEntry {
  id: string;
  userId: string;
  giveawayId: string;
  ticketsUsed: number;
  enteredAt: Date;
}

export interface AffiliateStats {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  totalVolumeCentimes: number;
  totalCommissionCentimes: number;
  commissionRate: number; // 0.02 pour 2%
  isActive: boolean;
}

// Types Stripe
export interface StripePaymentIntent {
  id: string;
  amount: number; // en centimes
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
  metadata: {
    tradeId: string;
    userId: string;
    ticketId: string;
  };
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'sepa_debit' | 'us_bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  sepa_debit?: {
    last4: string;
    bank_code: string;
    country: string;
  };
  billing_details: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
  created: number;
}

// Types pour le dashboard admin
export interface AdminStats {
  totalUsers: number;
  totalTrades: number;
  totalVolumeCentimes: number;
  totalPayoutsCentimes: number;
  activeTrades: number;
  pendingPayouts: number;
  kycPending: number;
  monthlyStats: MonthlyStats[];
  topUsers: TopUser[];
  recentTrades: Trade[];
  recentPayouts: Payout[];
}

export interface MonthlyStats {
  month: string;
  trades: number;
  volumeCentimes: number;
  payoutsCentimes: number;
  newUsers: number;
}

export interface TopUser {
  id: string;
  username: string;
  steamId64: string;
  totalVolumeCentimes: number;
  totalTrades: number;
  level: number;
  xp: number;
}

export interface AdminFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}
