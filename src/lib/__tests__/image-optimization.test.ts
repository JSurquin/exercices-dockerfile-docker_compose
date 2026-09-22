import { isSteamImageUrl, shouldUseNextImageOptimizer } from '@/lib/image-optimization';

describe('image-optimization', () => {
  it('detects Steam CDN skin images', () => {
    expect(
      isSteamImageUrl(
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLw/360fx360f'
      )
    ).toBe(true);
    expect(isSteamImageUrl('/images/local.webp')).toBe(false);
  });

  it('routes Steam, YouTube and local assets through the Next optimizer', () => {
    expect(
      shouldUseNextImageOptimizer(
        'https://community.cloudflare.steamstatic.com/economy/image/abc'
      )
    ).toBe(true);
    expect(shouldUseNextImageOptimizer('https://i.ytimg.com/vi/abc/hqdefault.jpg')).toBe(true);
    expect(shouldUseNextImageOptimizer('/levels/FRAGMENTMS.webp')).toBe(true);
    expect(shouldUseNextImageOptimizer('https://cdn.example.com/logo.png')).toBe(false);
  });
});
