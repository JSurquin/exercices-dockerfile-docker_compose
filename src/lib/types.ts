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
  endDate: Date | string;
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  winnerId?: string;
  randomSeed?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GiveawayEntry {
  id: string;
  userId: string;
  giveawayId: string;
  ticketsUsed: number;
  enteredAt: Date | string;
}

export interface AffiliateStats {
  id: string;
  userId: string;
  code: string;
  totalReferrals: number;
  totalVolumeCents: number;
  totalCommissionCents: number;
  commissionRate: number; // 0.02 pour 2%
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  referrals?: AffiliateReferral[];
  commissions?: AffiliateCommission[];
  // Propriétés optionnelles pour l'UI
  metrics?: {
    totalPendingCommissions: number;
    totalPaidCommissions: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  recentReferrals?: AffiliateReferral[];
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  tradeId?: string;
  volumeCents: number;
  commissionCents: number;
  createdAt: Date;
  referredUser?: User;
  trade?: Trade;
}

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  referralId?: string;
  amountCents: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  payoutId?: string;
  createdAt: Date;
  paidAt?: Date;
  referral?: AffiliateReferral;
  payout?: Payout;
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

// Types Skinplace API
export interface SkinplaceInventoryItem {
  id: string;
  name: string;
  market_hash_name: string;
  price: number; // en centimes
  icon_url: string;
  exterior?: string;
  stat_trak: boolean;
  rarity: string;
  wear?: number;
  stickers?: SkinplaceSticker[];
  float_value?: number;
  pattern_index?: number;
  trade_lock?: Date;
}

export interface SkinplaceSticker {
  id: string;
  name: string;
  icon_url: string;
  wear: number;
  position: number;
}

export interface SkinplaceInventoryResponse {
  success: boolean;
  data: {
    items: SkinplaceInventoryItem[];
    total_items: number;
    total_value: number; // en centimes
  };
  error?: string;
}

export interface SkinplaceMultipleInventoryResponse {
  success: boolean;
  data: {
    [steamId: string]: {
      items: SkinplaceInventoryItem[];
      total_items: number;
      total_value: number;
    };
  };
  error?: string;
}

export interface SkinplaceTradeResponse {
  success: boolean;
  data: {
    trade_id: string;
    token: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    expires_at: Date;
    items: SkinplaceInventoryItem[];
    total_value: number;
  };
  error?: string;
}

export interface SkinplacePurchaseRequest {
  items: string[]; // IDs des items
  payment_method: 'balance' | 'stripe' | 'crypto';
  trade_token?: string;
}

export interface SkinplacePurchaseResponse {
  success: boolean;
  data: {
    purchase_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    items: SkinplaceInventoryItem[];
    total_price: number;
    payment_intent_id?: string;
  };
  error?: string;
}

export interface SkinplaceBalanceResponse {
  status: 'success' | 'error';
  data: {
    total: number; // solde total
    deposit: number; // dépôts
    hold: number; // en attente
  };
  error?: string;
}

export interface SkinplaceHistoryItem {
  id: string;
  type: 'purchase' | 'sale' | 'trade' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number; // en centimes
  items: SkinplaceInventoryItem[];
  created_at: Date;
  completed_at?: Date;
  reference_id?: string;
}

export interface SkinplaceHistoryResponse {
  status: 'success' | 'error';
  data: SkinplaceHistoryItem[]; // Array direct, pas d'objet wrapper
  error?: string;
}

export interface SkinplaceHoldOrder {
  id: string;
  items: SkinplaceInventoryItem[];
  total_value: number;
  hold_duration: number; // en heures
  created_at: Date;
  expires_at: Date;
  status: 'active' | 'expired' | 'withdrawn';
}

export interface SkinplaceHoldResponse {
  status: 'success' | 'error';
  data: SkinplaceHoldOrder[]; // Array direct, pas d'objet wrapper
  error?: string;
}

export interface SkinplaceItemListing {
  id: string;
  name: string;
  market_hash_name: string;
  price: number;
  icon_url: string;
  exterior?: string;
  stat_trak: boolean;
  rarity: string;
  seller: {
    id: string;
    username: string;
    reputation: number;
  };
  created_at: Date;
  expires_at: Date;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

export interface SkinplaceListingsResponse {
  success: boolean;
  data: {
    items: SkinplaceItemListing[];
    total_items: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
  error?: string;
}

// Types pour les erreurs Skinplace
export interface SkinplaceError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
