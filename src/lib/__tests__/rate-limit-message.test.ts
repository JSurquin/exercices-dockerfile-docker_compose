const headerGet = jest.fn();
const cookieGet = jest.fn();

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({ get: headerGet })),
  cookies: jest.fn(async () => ({ get: cookieGet })),
}));

import { rateLimitedJson } from '@/lib/rate-limited-response';
import {
  localizeRateLimitMessage,
  rateLimitUserMessage,
} from '@/lib/rate-limit-message';

describe('rate limit user message', () => {
  beforeEach(() => {
    headerGet.mockReset();
    cookieGet.mockReset();
  });

  it('returns English, French and Chinese copy', () => {
    expect(rateLimitUserMessage('en')).toBe('Too many requests. Please try again later.');
    expect(rateLimitUserMessage('fr')).toBe('Trop de requêtes. Réessayez plus tard.');
    expect(rateLimitUserMessage('cn')).toBe('请求过多，请稍后再试。');
  });

  it('rewrites a known French sentence to the page language', () => {
    expect(
      localizeRateLimitMessage('Trop de requêtes. Réessayez plus tard.', 'en'),
    ).toBe('Too many requests. Please try again later.');
    expect(localizeRateLimitMessage('Solde insuffisant', 'en')).toBe('Solde insuffisant');
  });

  it('builds a 429 response in the request locale', async () => {
    headerGet.mockImplementation((name: string) =>
      name === 'x-moonskin-locale' ? 'en' : null,
    );
    cookieGet.mockReturnValue({ value: 'fr' });

    const response = await rateLimitedJson(
      { success: false, resetTime: 123 },
      { headers: { 'Retry-After': '30' } },
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    await expect(response.json()).resolves.toEqual({
      success: false,
      resetTime: 123,
      error: 'Too many requests. Please try again later.',
    });
  });
});
