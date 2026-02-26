import { prisma } from '~/prisma/prisma';

const PAYOUT_AUTO_APPROVE_KEY = 'payout_auto_approve';

export interface PayoutAutoApproveSettings {
  enabled: boolean;
  thresholdCents: number;
}

const DEFAULT_SETTINGS: PayoutAutoApproveSettings = {
  enabled: false,
  thresholdCents: 2000, // 20 EUR
};

/**
 * Lit le réglage d'auto-approbation des payouts (seuil en centimes).
 * Crée l'entrée avec les valeurs par défaut si elle n'existe pas.
 */
export async function getPayoutAutoApproveSettings(): Promise<PayoutAutoApproveSettings> {
  const row = await prisma.siteSettings.findUnique({
    where: { key: PAYOUT_AUTO_APPROVE_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== 'object') {
    return DEFAULT_SETTINGS;
  }
  const v = row.valueJson as Record<string, unknown>;
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : DEFAULT_SETTINGS.enabled,
    thresholdCents: typeof v.thresholdCents === 'number' ? v.thresholdCents : DEFAULT_SETTINGS.thresholdCents,
  };
}

/**
 * Met à jour le réglage d'auto-approbation des payouts.
 */
export async function setPayoutAutoApproveSettings(
  settings: Partial<PayoutAutoApproveSettings>,
  updatedBy?: string
): Promise<PayoutAutoApproveSettings> {
  const current = await getPayoutAutoApproveSettings();
  const next: PayoutAutoApproveSettings = {
    enabled: settings.enabled ?? current.enabled,
    thresholdCents: settings.thresholdCents ?? current.thresholdCents,
  };
  await prisma.siteSettings.upsert({
    where: { key: PAYOUT_AUTO_APPROVE_KEY },
    create: {
      key: PAYOUT_AUTO_APPROVE_KEY,
      valueJson: next,
      updatedBy: updatedBy ?? null,
    },
    update: {
      valueJson: next,
      updatedBy: updatedBy ?? null,
    },
  });
  return next;
}
