import {
  estimateGiveawayFragmentDemand,
  spawnsPer30Days,
} from '@/lib/gamification-economy';

describe('estimateGiveawayFragmentDemand', () => {
  it('calcule la demande restante et la demande si complet', () => {
    const demand = estimateGiveawayFragmentDemand([
      { ticketPrice: 100, maxTickets: 10, soldTickets: 4 },
      { ticketPrice: 50, maxTickets: 20, soldTickets: 0 },
    ]);

    expect(demand.demandIfSoldOut).toBe(100 * 10 + 50 * 20);
    expect(demand.demandRemaining).toBe(100 * 6 + 50 * 20);
    expect(demand.demandRecurring30d).toBe(0);
  });

  it('projette la demande des séries récurrentes sur 30 jours', () => {
    const demand = estimateGiveawayFragmentDemand(
      [],
      [
        { frequency: 'WEEKLY', ticketPrice: 100, maxTickets: 10 },
        { frequency: 'DAILY', ticketPrice: 20, maxTickets: 5 },
      ]
    );

    expect(demand.demandRecurring30d).toBe(
      Math.round(100 * 10 * (30 / 7)) + Math.round(20 * 5 * 30)
    );
  });

  it('ignore les tickets vendus au-delà du maximum', () => {
    const demand = estimateGiveawayFragmentDemand([
      { ticketPrice: 10, maxTickets: 5, soldTickets: 99 },
    ]);

    expect(demand.demandRemaining).toBe(0);
    expect(demand.demandIfSoldOut).toBe(50);
  });
});

describe('spawnsPer30Days', () => {
  it('mappe les fréquences récurrentes', () => {
    expect(spawnsPer30Days('DAILY')).toBe(30);
    expect(spawnsPer30Days('WEEKLY')).toBeCloseTo(30 / 7);
    expect(spawnsPer30Days('MONTHLY')).toBe(1);
    expect(spawnsPer30Days('YEARLY')).toBeCloseTo(1 / 12);
    expect(spawnsPer30Days('CUSTOM')).toBe(0);
  });
});
