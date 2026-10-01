import { isSepaFrPayout, buildSepaFrRejectionEmailHtml } from '@/lib/sepa-fr-notify';
import { resolveUserContactEmail } from '@/lib/user-contact-email';

describe('sepa-fr-notify', () => {
  describe('isSepaFrPayout', () => {
    it('reconnaît une référence virement bancaire instantané', () => {
      expect(isSepaFrPayout('MOON-SEPA-FR-1790286632111-E94C81F4')).toBe(true);
    });

    it('ignore Flexify / crypto / absences', () => {
      expect(isSepaFrPayout('MOON-FLEXIFY-1')).toBe(false);
      expect(isSepaFrPayout(null)).toBe(false);
      expect(isSepaFrPayout(undefined)).toBe(false);
    });
  });

  it('envoie les mails SEPA FR vers contactEmail, pas steam@moonskin.local', () => {
    expect(
      resolveUserContactEmail({
        contactEmail: 'player@example.com',
        email: 'steam_76561198172176591@moonskin.local',
      })
    ).toBe('player@example.com');
  });

  it('échappe la raison de refus dans le mail HTML', () => {
    const html = buildSepaFrRejectionEmailHtml({
      userName: 'Rouscau',
      amount: '29,91 €',
      reason: '<script>alert(1)</script>',
    });
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
