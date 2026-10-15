import { messages } from '@/lib/i18n';
import { localizeEstimatedDelivery } from '@/lib/payout-delivery-label';

const labelsFor = (locale: 'fr' | 'en' | 'cn') => {
  const request = messages[locale].payoutPage.request;
  return {
    fewMinutes: request.estimatedDelayFewMinutes,
    instant: request.estimatedDelayInstant,
    upTo24h: request.estimatedDelayUpTo24h,
  };
};

describe('localizeEstimatedDelivery', () => {
  it('keeps the French delay on the French locale', () => {
    expect(localizeEstimatedDelivery('Quelques minutes à 1h', labelsFor('fr'))).toBe(
      'Quelques minutes à 1h'
    );
    expect(localizeEstimatedDelivery('Instantané', labelsFor('fr'))).toBe('Instantané');
    expect(localizeEstimatedDelivery('Instantané à 24h', labelsFor('fr'))).toBe('Instantané à 24h');
  });

  it('translates the cashout delay for English and Chinese', () => {
    expect(localizeEstimatedDelivery('Quelques minutes à 1h', labelsFor('en'))).toBe(
      'A few minutes to 1h'
    );
    expect(localizeEstimatedDelivery('Quelques minutes à 1h', labelsFor('cn'))).toBe('几分钟至1小时');
    expect(localizeEstimatedDelivery('Instantané à 24h', labelsFor('en'))).toBe('Instant to 24h');
    expect(localizeEstimatedDelivery('Instantané', labelsFor('cn'))).toBe('即时');
  });

  it('leaves unknown labels unchanged', () => {
    expect(localizeEstimatedDelivery('Custom delay', labelsFor('en'))).toBe('Custom delay');
  });
});
