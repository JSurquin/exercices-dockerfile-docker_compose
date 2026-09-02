import { partnerTrace, runPartnerTrace } from '@/lib/partner-api/trace';

describe('partner-api trace', () => {
  it('writes a step without throwing', () => {
    expect(() =>
      runPartnerTrace('testtraceid1', () => {
        partnerTrace('unit.test', { ok: true });
      })
    ).not.toThrow();
  });
});
