export const HELP_CATEGORY_KEYS = [
  'gettingStarted',
  'trading',
  'payments',
  'security',
  'technical',
] as const;

export type HelpCategoryKey = (typeof HELP_CATEGORY_KEYS)[number];

export interface StaticHelpArticleDef {
  slug: string;
  categoryKey: HelpCategoryKey;
  titleKey: string;
  bodyKey: string;
  sortOrder: number;
}

export const STATIC_HELP_ARTICLES: StaticHelpArticleDef[] = [
  { slug: 'create-account', categoryKey: 'gettingStarted', titleKey: 'createAccount', bodyKey: 'createAccount', sortOrder: 1 },
  { slug: 'steam-connection', categoryKey: 'gettingStarted', titleKey: 'steamConnection', bodyKey: 'steamConnection', sortOrder: 2 },
  { slug: 'kyc-step-by-step', categoryKey: 'gettingStarted', titleKey: 'kycStepByStep', bodyKey: 'kycStepByStep', sortOrder: 3 },
  { slug: 'first-trade', categoryKey: 'gettingStarted', titleKey: 'firstTrade', bodyKey: 'firstTrade', sortOrder: 4 },
  { slug: 'how-to-sell', categoryKey: 'trading', titleKey: 'howToSell', bodyKey: 'howToSell', sortOrder: 10 },
  { slug: 'price-estimation', categoryKey: 'trading', titleKey: 'priceEstimation', bodyKey: 'priceEstimation', sortOrder: 11 },
  { slug: 'trade-hold', categoryKey: 'trading', titleKey: 'tradeHold', bodyKey: 'tradeHold', sortOrder: 12 },
  { slug: 'fees', categoryKey: 'trading', titleKey: 'fees', bodyKey: 'fees', sortOrder: 13 },
  { slug: 'payment-methods', categoryKey: 'payments', titleKey: 'methods', bodyKey: 'methods', sortOrder: 20 },
  { slug: 'payment-delays', categoryKey: 'payments', titleKey: 'delays', bodyKey: 'delays', sortOrder: 21 },
  { slug: 'iban-verification', categoryKey: 'payments', titleKey: 'ibanVerification', bodyKey: 'ibanVerification', sortOrder: 22 },
  { slug: 'payment-issue', categoryKey: 'payments', titleKey: 'paymentIssue', bodyKey: 'paymentIssue', sortOrder: 23 },
  { slug: 'secure-account', categoryKey: 'security', titleKey: 'secureAccount', bodyKey: 'secureAccount', sortOrder: 30 },
  { slug: 'account-suspended', categoryKey: 'security', titleKey: 'accountSuspended', bodyKey: 'accountSuspended', sortOrder: 31 },
  { slug: 'report-suspicious', categoryKey: 'security', titleKey: 'reportSuspicious', bodyKey: 'reportSuspicious', sortOrder: 32 },
  { slug: 'account-recovery', categoryKey: 'security', titleKey: 'accountRecovery', bodyKey: 'accountRecovery', sortOrder: 33 },
  { slug: 'site-not-loading', categoryKey: 'technical', titleKey: 'siteNotLoading', bodyKey: 'siteNotLoading', sortOrder: 40 },
  { slug: 'steam-trade-error', categoryKey: 'technical', titleKey: 'steamTradeError', bodyKey: 'steamTradeError', sortOrder: 41 },
  { slug: 'steam-connection-issue', categoryKey: 'technical', titleKey: 'steamConnectionIssue', bodyKey: 'steamConnectionIssue', sortOrder: 42 },
  { slug: 'buggy-interface', categoryKey: 'technical', titleKey: 'buggyInterface', bodyKey: 'buggyInterface', sortOrder: 43 },
];

const STATIC_SLUGS = new Set(STATIC_HELP_ARTICLES.map((a) => a.slug));

export function isStaticHelpSlug(slug: string): boolean {
  return STATIC_SLUGS.has(slug);
}

export function getStaticHelpArticle(slug: string): StaticHelpArticleDef | undefined {
  return STATIC_HELP_ARTICLES.find((a) => a.slug === slug);
}

/** Maps CMS category strings to canonical category keys. */
export function resolveCategoryKey(category: string | null | undefined): HelpCategoryKey {
  if (!category) return 'gettingStarted';
  const normalized = category.toLowerCase().replace(/[\s_-]+/g, '');
  const map: Record<string, HelpCategoryKey> = {
    gettingstarted: 'gettingStarted',
    premierspas: 'gettingStarted',
    trading: 'trading',
    tradingsales: 'trading',
    payments: 'payments',
    paiements: 'payments',
    security: 'security',
    securitykyc: 'security',
    securitekyc: 'security',
    technical: 'technical',
    technicalissues: 'technical',
    problemetechniques: 'technical',
  };
  if (map[normalized]) return map[normalized];
  if (HELP_CATEGORY_KEYS.includes(category as HelpCategoryKey)) return category as HelpCategoryKey;
  return 'gettingStarted';
}

export function helpfulPercent(helpfulYes: number, helpfulNo: number): number | null {
  const total = helpfulYes + helpfulNo;
  if (total === 0) return null;
  return Math.round((helpfulYes / total) * 100);
}

export function formatViewCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}
