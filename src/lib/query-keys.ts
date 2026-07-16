export const queryKeys = {
  // User
  userProfile: ['user', 'profile'] as const,
  userTrades: ['user', 'trades'] as const,
  userBalance: ['user', 'balance'] as const,
  userBalanceHistory: ['user', 'balance-history'] as const,
  userDashboard: ['user', 'dashboard'] as const,
  userPayouts: ['user', 'payouts'] as const,

  // Chat
  conversations: ['chat', 'conversations'] as const,
  conversation: (id: string | null) => ['chat', 'conversation', id] as const,
  conversationMessages: (id: string | null) => ['chat', 'conversation', id, 'messages'] as const,

  // Giveaways
  giveaways: (status?: string) => ['giveaways', status ?? 'all'] as const,
  adminGiveaways: ['admin', 'giveaways'] as const,

  // Affiliate
  affiliateStats: ['affiliate', 'stats'] as const,
  affiliateCommissions: ['affiliate', 'commissions'] as const,
  affiliateLink: ['affiliate', 'link'] as const,
  affiliateApply: ['affiliate', 'apply'] as const,
  affiliateGiveawayRequests: ['affiliate', 'giveaway-requests'] as const,

  // Admin - affiliate applications
  adminAffiliateApplications: (status?: string) =>
    ['admin', 'affiliate-applications', status ?? 'all'] as const,
  adminAffiliateGiveawayRequests: (status?: string) =>
    ['admin', 'affiliate-giveaway-requests', status ?? 'all'] as const,

  // Admin - stats
  adminStats: ['admin', 'stats'] as const,
  adminPendingCounts: ['admin', 'pending-counts'] as const,
  adminAnalytics: (period?: number) => ['admin', 'analytics', period ?? 30] as const,
  adminMetrics: ['admin', 'metrics'] as const,

  // Admin - users
  adminUsers: (filters?: Record<string, unknown>) =>
    ['admin', 'users', filters ?? {}] as const,
  adminUser: (userId: string) => ['admin', 'user', userId] as const,

  // Admin - trades
  adminTrades: (filters?: Record<string, unknown>) =>
    ['admin', 'trades', filters ?? {}] as const,
  adminTradesGallery: (limit: number, period: string) =>
    ['admin', 'trades', 'gallery', limit, period] as const,
  adminProfit: ['admin', 'profit'] as const,

  // Admin - payouts
  adminPayouts: (filters?: Record<string, unknown>) =>
    ['admin', 'payouts', filters ?? {}] as const,
  adminPayoutAutoApprove: ['admin', 'payout-auto-approve'] as const,

  // Admin - KYC
  adminKyc: (filters?: Record<string, unknown>) =>
    ['admin', 'kyc', filters ?? {}] as const,

  // Admin - affiliates
  adminAffiliates: (filters?: Record<string, unknown>) =>
    ['admin', 'affiliates', filters ?? {}] as const,
  adminAffiliateReferrals: (affiliateId: string, filters?: Record<string, unknown>) =>
    ['admin', 'affiliates', affiliateId, 'referrals', filters ?? {}] as const,

  // Admin - balance
  adminBalance: (userId: string) => ['admin', 'balance', userId] as const,

  // Admin - skinplace
  skinplaceBalance: ['skinplace', 'balance'] as const,
  skinplaceHistory: ['skinplace', 'history'] as const,
  skinplaceHold: ['skinplace', 'hold'] as const,

  // Admin - audit
  adminAuditDashboard: ['admin', 'audit', 'dashboard'] as const,
  adminAuditLogs: (filters?: Record<string, unknown>) =>
    ['admin', 'audit', 'logs', filters ?? {}] as const,

  // Admin - newsletter
  adminNewsletterSubscribers: ['admin', 'newsletter', 'subscribers'] as const,
  adminNewsletterCampaigns: ['admin', 'newsletter', 'campaigns'] as const,

  // Admin - legal pages
  adminLegalPages: ['admin', 'legal-pages'] as const,
  adminHelpArticles: ['admin', 'help-articles'] as const,
  adminPressArticles: ['admin', 'press-articles'] as const,
  adminBlogArticles: ['admin', 'blog-articles'] as const,

  // Admin - homepage partners
  adminPartnerVideos: ['admin', 'partners', 'videos'] as const,
  adminPartnerLogos: ['admin', 'partners', 'logos'] as const,
  adminHomePopups: ['admin', 'home-popups'] as const,

  // Admin - settings
  adminSettings: ['admin', 'settings'] as const,
  adminSmtpSettings: ['admin', 'smtp-settings'] as const,
  adminPlatformConfig: ['admin', 'platform-config'] as const,

  // Admin - chat / moderation
  adminChatConversations: (filters?: Record<string, unknown>) =>
    ['admin', 'chat', 'conversations', filters ?? {}] as const,
  adminModerators: ['admin', 'chat', 'moderators'] as const,
  adminChatStats: ['admin', 'chat', 'stats'] as const,
  adminChatModeratorStats: ['admin', 'chat', 'moderator-stats'] as const,
  adminChatFeedback: (filters?: Record<string, unknown>) =>
    ['admin', 'chat', 'feedback', filters ?? {}] as const,
  moderationFeedback: (filters?: Record<string, unknown>) =>
    ['moderation', 'feedback', filters ?? {}] as const,
  moderationConversation: (id: string) =>
    ['moderation', 'conversation', id] as const,
  moderationMessages: (conversationId: string) =>
    ['moderation', 'messages', conversationId] as const,

  // KYC
  kycStatus: ['kyc', 'status'] as const,

  // Payment
  payoutHistory: ['payout', 'history'] as const,
  paymentMethods: ['payment', 'methods'] as const,
  payoutStatus: (endpoint: string) => ['payout', 'status', endpoint] as const,

  // Flexify / payout
  flexifyQuote: (params?: Record<string, unknown>) =>
    ['flexify', 'quote', params ?? {}] as const,
  flexifyHistory: ['flexify', 'history'] as const,

  // Currency converter
  currencyRate: ['currency', 'rate'] as const,

  // Trade status
  tradeStatus: (tradeId: string) => ['trade', 'status', tradeId] as const,

  // Notifications
  adminNotifications: ['admin', 'notifications'] as const,
  userNotifications: ['user', 'notifications'] as const,
  userNotificationPreferences: ['user', 'notification-preferences'] as const,

};
