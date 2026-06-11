export const AFFILIATE_MAX_PENDING_GIVEAWAY_REQUESTS = 2;

export type GiveawayRequestErrorCode =
  | 'INVALID_DATES'
  | 'INVALID_WINNER_COUNT'
  | 'INVALID_COST'
  | 'ACCOUNT_FROZEN'
  | 'INSUFFICIENT_BALANCE'
  | 'TOO_MANY_PENDING'
  | 'AFFILIATE_INACTIVE'
  | 'INVALID_STATUS';

type Result<T extends GiveawayRequestErrorCode = GiveawayRequestErrorCode> =
  | { ok: true }
  | { ok: false; error: T };

export function validateGiveawayRequestInput(input: {
  startDate: Date;
  endDate: Date;
  winnerCount: number;
  costCents: number;
  now?: Date;
}): Result<'INVALID_DATES' | 'INVALID_WINNER_COUNT' | 'INVALID_COST'> {
  const now = input.now ?? new Date();

  if (
    !(input.startDate instanceof Date) ||
    !(input.endDate instanceof Date) ||
    Number.isNaN(input.startDate.getTime()) ||
    Number.isNaN(input.endDate.getTime()) ||
    input.endDate <= input.startDate ||
    input.startDate < now
  ) {
    return { ok: false, error: 'INVALID_DATES' };
  }

  if (!Number.isInteger(input.winnerCount) || input.winnerCount < 1) {
    return { ok: false, error: 'INVALID_WINNER_COUNT' };
  }

  if (!Number.isInteger(input.costCents) || input.costCents < 1) {
    return { ok: false, error: 'INVALID_COST' };
  }

  return { ok: true };
}

export function canSubmitGiveawayRequest(input: {
  pendingCount: number;
  maxPending: number;
  affiliateActive: boolean;
  availableCents: number;
  costCents: number;
  accountFrozen: boolean;
}): Result {
  if (!input.affiliateActive) {
    return { ok: false, error: 'AFFILIATE_INACTIVE' };
  }

  if (input.accountFrozen) {
    return { ok: false, error: 'ACCOUNT_FROZEN' };
  }

  if (input.pendingCount >= input.maxPending) {
    return { ok: false, error: 'TOO_MANY_PENDING' };
  }

  if (input.availableCents <= 0 || input.availableCents < input.costCents) {
    return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  }

  return { ok: true };
}

export function canApproveGiveawayRequest(input: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  availableCents: number;
  costCents: number;
  accountFrozen: boolean;
}): Result {
  if (input.status !== 'PENDING') {
    return { ok: false, error: 'INVALID_STATUS' };
  }

  if (input.accountFrozen) {
    return { ok: false, error: 'ACCOUNT_FROZEN' };
  }

  if (input.availableCents <= 0 || input.availableCents < input.costCents) {
    return { ok: false, error: 'INSUFFICIENT_BALANCE' };
  }

  return { ok: true };
}

export function giveawayRequestErrorMessage(code: GiveawayRequestErrorCode): string {
  const messages: Record<GiveawayRequestErrorCode, string> = {
    INVALID_DATES: 'Dates invalides — la fin doit être après le début et le début ne peut pas être dans le passé',
    INVALID_WINNER_COUNT: 'Le nombre de gagnants doit être au moins 1',
    INVALID_COST: 'Le coût doit être un montant positif en centimes',
    ACCOUNT_FROZEN: 'Compte gelé — action impossible',
    INSUFFICIENT_BALANCE: 'Solde disponible insuffisant',
    TOO_MANY_PENDING: 'Nombre maximum de demandes en attente atteint',
    AFFILIATE_INACTIVE: 'Programme affilié inactif',
    INVALID_STATUS: 'Cette demande ne peut plus être traitée',
  };
  return messages[code];
}
