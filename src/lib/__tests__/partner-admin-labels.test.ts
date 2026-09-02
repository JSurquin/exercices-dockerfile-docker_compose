import {
  parsePartnerWebhookEventStatus,
  partnerCallLabel,
  partnerEndpointLabel,
  partnerEventLabel,
  partnerHttpResultLabel,
  partnerScopeHelp,
  partnerStatusLabel,
} from '@/lib/partner-api/admin-labels';

describe('partner admin labels', () => {
  it('translates webhook events into short French labels', () => {
    expect(partnerEventLabel('trade.created', 'fr')).toBe('Vente créée');
    expect(partnerEventLabel('trade.status_changed', 'fr')).toBe('Statut de vente');
    expect(partnerEventLabel('payout.created', 'en')).toBe('Payout requested');
  });

  it('translates trade statuses', () => {
    expect(partnerStatusLabel('cancelled', 'fr')).toBe('Annulée');
    expect(partnerStatusLabel('accepted_by_bot', 'fr')).toBe('Offre envoyée');
  });

  it('maps partner endpoints to human names', () => {
    expect(partnerEndpointLabel('/api/v1/partner/inventory', 'fr')).toBe('Inventaire');
    expect(partnerEndpointLabel('/api/v1/partner/trades/TRADE-1', 'fr')).toBe('Détail vente');
  });

  it('turns API calls into short sentences', () => {
    expect(partnerCallLabel('GET', '/api/v1/partner/inventory', 'fr')).toBe('A lu l’inventaire');
    expect(partnerCallLabel('POST', '/api/v1/partner/trades', 'fr')).toBe('A créé une vente');
    expect(partnerCallLabel('GET', '/api/v1/partner/trades/TRADE-1', 'fr')).toBe('A ouvert une vente');
  });

  it('turns HTTP codes into friendly results', () => {
    expect(partnerHttpResultLabel(200, 'fr')).toBe('OK');
    expect(partnerHttpResultLabel(401, 'fr')).toBe('Refusé');
    expect(partnerHttpResultLabel(503, 'fr')).toBe('Erreur');
  });

  it('explains each admin scope in French', () => {
    expect(partnerScopeHelp('read', 'fr')).toMatch(/inventaire/i);
    expect(partnerScopeHelp('trade', 'fr')).toMatch(/vente/i);
    expect(partnerScopeHelp('payout', 'fr')).toMatch(/virement/i);
  });

  it('reads the status from a webhook event id', () => {
    expect(
      parsePartnerWebhookEventStatus(
        'trade.status_changed:TRADE-1788356023966-6B7BA4:cancelled:cmtk2z4nr000dox1r5k54ywde'
      )
    ).toBe('cancelled');
  });
});
