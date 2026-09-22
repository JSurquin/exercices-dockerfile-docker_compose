import { locales } from '@/lib/locales';

describe('locales', () => {
  it('exposes the supported locale list', () => {
    expect(locales).toEqual(['fr', 'en', 'cn']);
  });
});
