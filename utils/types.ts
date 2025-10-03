export type UserRole = "ADMIN" | "USER";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AffiliateStats = {
  totalReferrals: number;
  totalEarnings: number;
};
export type GiveawayEntry = {
  id: string;
  userId: string;
};
export type KycDocument = {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
};
export type PaymentMethod = {
  id: string;
  userId: string;
  methodType: string;
  methodDetails: string;
};
export type Payout = {
  id: string;
  userId: string;
  amount: number;
  status: string;
};
export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
};

export type User = {
  id: string
  email: string
  name: string
  image: string
  updatedAt: Date
  createdAt: Date
  steamId?: string
  steamUsername?: string
  steamAvatar?: string
  level?: number
  xp?: number
  tickets?: number
  role?: UserRole
  totalVolumeCents?: number
  kycStatus?: KycStatus
  acceptedTermsAt?: Date
  paymentMethods?: PaymentMethod[]
  payouts?: Payout[]
  trades?: Trade[]
  auditLogs?: AuditLog[]
  affiliateStats?: AffiliateStats
  giveawayEntries?: GiveawayEntry[]
  kycDocuments?: KycDocument[]
}   

export type Trade = {
  id: string
}