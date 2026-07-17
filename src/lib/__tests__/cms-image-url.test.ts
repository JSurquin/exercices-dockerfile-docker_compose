import { normalizeCmsImageUrl, extractCmsImageFilename } from '@/lib/cms-image-url';

describe('cms-image-url', () => {
  it('normalise /uploads/cms vers /api/cms-media', () => {
    expect(normalizeCmsImageUrl('/uploads/cms/abc-123.jpg')).toBe('/api/cms-media/abc-123.jpg');
  });

  it('conserve /api/cms-media', () => {
    expect(normalizeCmsImageUrl('/api/cms-media/abc-123.png')).toBe('/api/cms-media/abc-123.png');
  });

  it('conserve les URLs externes', () => {
    expect(normalizeCmsImageUrl('https://cdn.example.com/img.jpg')).toBe(
      'https://cdn.example.com/img.jpg',
    );
  });

  it('retourne null pour une valeur vide', () => {
    expect(normalizeCmsImageUrl(null)).toBeNull();
    expect(normalizeCmsImageUrl('')).toBeNull();
  });

  it('extrait le nom de fichier', () => {
    expect(extractCmsImageFilename('/uploads/cms/19d61abb-4726.png')).toBe('19d61abb-4726.png');
    expect(extractCmsImageFilename('/api/cms-media/19d61abb-4726.png')).toBe('19d61abb-4726.png');
    expect(extractCmsImageFilename('https://example.com/x.jpg')).toBeNull();
  });
});
