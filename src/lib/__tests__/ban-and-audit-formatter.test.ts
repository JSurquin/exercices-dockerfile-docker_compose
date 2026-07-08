import { isUserBanned } from '@/lib/user-ban-logic';
import { formatAuditLogDetails } from '@/lib/audit-log-formatter';

describe('isUserBanned', () => {
  it('returns false when banned is false', () => {
    expect(isUserBanned({ banned: false, banExpires: null })).toBe(false);
  });

  it('returns true for active permanent ban', () => {
    expect(isUserBanned({ banned: true, banExpires: null })).toBe(true);
  });

  it('returns false when ban has expired', () => {
    expect(
      isUserBanned({
        banned: true,
        banExpires: new Date(Date.now() - 60_000),
      })
    ).toBe(false);
  });

  it('returns true when ban expires in the future', () => {
    expect(
      isUserBanned({
        banned: true,
        banExpires: new Date(Date.now() + 60_000),
      })
    ).toBe(true);
  });
});

describe('formatAuditLogDetails', () => {
  const labels = {
    reason: 'Motif',
    targetUser: 'Utilisateur cible',
    amount: 'Montant',
    payout: 'Paiement',
    blockedIp: 'Adresse IP',
    expiresAt: 'Expire le',
    type: 'Type',
    endpoint: 'Endpoint',
    steamId: 'Steam ID',
    balanceAfter: 'Solde après',
    outcome: 'Résultat',
    httpStatus: 'Code HTTP',
    eventType: 'Événement',
    transactionId: 'Transaction',
    provider: 'Fournisseur',
    flexifyStatus: 'Statut Flexify',
    reference: 'Référence',
    externalId: 'ID externe',
    webhookId: 'ID webhook',
    txHash: 'Hash blockchain',
    internalStatus: 'Statut interne',
    method: 'Méthode',
    currency: 'Devise',
    errorCode: 'Code erreur',
    errorReason: 'Raison erreur',
    userAgent: 'User-Agent',
    bodyLength: 'Taille body',
    signaturePresent: 'Signature présente',
    tokenConfigured: 'Token configuré',
    noDetails: 'Aucun détail',
  };

  it('formats webhook audit fields', () => {
    const text = formatAuditLogDetails(
      {
        outcome: 'processed',
        httpStatus: 200,
        eventType: 'conversion_withdrawal::completed',
        transactionId: 'tx-123',
        payoutId: 'payout-1',
        signaturePresent: true,
        severity: 'low',
      },
      labels
    );

    expect(text).toContain('Résultat : processed');
    expect(text).toContain('Code HTTP : 200');
    expect(text).toContain('Transaction : tx-123');
    expect(text).toContain('Signature présente : oui');
  });

  it('formats known fields in readable French text', () => {
    const text = formatAuditLogDetails(
      {
        reason: 'Fraude',
        targetUserId: 'user_123',
        amountCents: 1500,
        severity: 'high',
      },
      labels
    );

    expect(text).toContain('Motif : Fraude');
    expect(text).toContain('Utilisateur cible : user_123');
    expect(text).toContain('15.00 €');
    expect(text).not.toContain('severity');
  });

  it('returns noDetails when empty', () => {
    expect(formatAuditLogDetails({}, labels)).toBe('Aucun détail');
  });
});
