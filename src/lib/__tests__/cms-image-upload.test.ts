import {
  buildCmsImagePublicUrl,
  CmsImageUploadError,
  resolveCmsImageMimeType,
  resolveCmsUploadDirectory,
} from '@/lib/cms-image-upload';

describe('cms-image-upload', () => {
  it('accepte un JPEG sans type MIME via extension', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([buffer], 'cover.jpg', { type: '' });
    expect(resolveCmsImageMimeType(file, buffer)).toBe('image/jpeg');
  });

  it('accepte un PNG détecté par magic bytes', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([buffer], 'photo.bin', { type: '' });
    expect(resolveCmsImageMimeType(file, buffer)).toBe('image/png');
  });

  it('refuse un type non supporté', () => {
    const buffer = Buffer.from('%PDF-1.4');
    const file = new File([buffer], 'doc.pdf', { type: 'application/pdf' });
    expect(() => resolveCmsImageMimeType(file, buffer)).toThrow(CmsImageUploadError);
  });

  it('utilise /uploads/cms quand le dossier public est cible', () => {
    const uploadDir = resolveCmsUploadDirectory();
    expect(buildCmsImagePublicUrl('abc.jpg', uploadDir)).toMatch(/^\/(uploads\/cms|api\/cms-media)\//);
  });
});
