const headerGet = jest.fn();
const cookieGet = jest.fn();

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({ get: headerGet })),
  cookies: jest.fn(async () => ({ get: cookieGet })),
}));

import { getRequestLocale } from '@/lib/get-request-locale';

describe('getRequestLocale', () => {
  beforeEach(() => {
    headerGet.mockReset();
    cookieGet.mockReset();
  });

  it('prefers the middleware locale header', async () => {
    headerGet.mockImplementation((name: string) =>
      name === 'x-moonskin-locale' ? 'cn' : null
    );
    cookieGet.mockReturnValue({ value: 'fr' });

    await expect(getRequestLocale()).resolves.toBe('cn');
  });

  it('uses the locale cookie when the header is missing', async () => {
    headerGet.mockReturnValue(null);
    cookieGet.mockReturnValue({ value: 'fr' });

    await expect(getRequestLocale()).resolves.toBe('fr');
  });

  it('uses Accept-Language on a first visit without cookie', async () => {
    headerGet.mockImplementation((name: string) =>
      name === 'accept-language' ? 'zh-CN,zh;q=0.9,en;q=0.8' : null
    );
    cookieGet.mockReturnValue(undefined);

    await expect(getRequestLocale()).resolves.toBe('cn');
  });

  it('uses English from Accept-Language on a first visit', async () => {
    headerGet.mockImplementation((name: string) =>
      name === 'accept-language' ? 'en-GB,en;q=0.9' : null
    );
    cookieGet.mockReturnValue(undefined);

    await expect(getRequestLocale()).resolves.toBe('en');
  });

  it('does not default to French when Accept-Language is English', async () => {
    headerGet.mockImplementation((name: string) =>
      name === 'accept-language' ? 'en-US,en;q=0.8' : null
    );
    cookieGet.mockReturnValue(undefined);

    await expect(getRequestLocale()).resolves.not.toBe('fr');
  });
});
