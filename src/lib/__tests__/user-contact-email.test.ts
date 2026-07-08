import { isInternalUserEmail, resolveUserContactEmail } from '@/lib/user-contact-email';

describe('user-contact-email', () => {
  it('ignore les emails internes Steam', () => {
    expect(isInternalUserEmail('steam_76561198123456789@moonskin.local')).toBe(true);
    expect(isInternalUserEmail('admin@moonskin.com')).toBe(false);
  });

  it('priorise contactEmail', () => {
    expect(
      resolveUserContactEmail({
        contactEmail: 'contact@example.com',
        email: 'admin@moonskin.com',
      })
    ).toBe('contact@example.com');
  });

  it('retombe sur user.email si contactEmail absent', () => {
    expect(
      resolveUserContactEmail({
        contactEmail: null,
        email: 'admin@moonskin.com',
      })
    ).toBe('admin@moonskin.com');
  });

  it('retourne null si seul un email interne existe', () => {
    expect(
      resolveUserContactEmail({
        contactEmail: null,
        email: 'steam_76561198123456789@moonskin.local',
      })
    ).toBeNull();
  });
});
