import {
  buildCmsImagePublicUrl,
  CmsImageUploadError,
  isCmsImageUploadError,
  resetCmsUploadDirectoryCache,
  resolveCmsImageFilePath,
  resolveCmsImageMimeType,
  resolveCmsUploadDirectory,
  saveCmsImage,
} from '@/lib/cms-image-upload';
import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

describe('cms-image-upload', () => {
  afterEach(() => {
    resetCmsUploadDirectoryCache();
    delete process.env.CMS_UPLOAD_DIR;
  });

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

  it('retourne toujours une URL /api/cms-media', () => {
    const uploadDir = resolveCmsUploadDirectory();
    expect(buildCmsImagePublicUrl('abc.jpg', uploadDir)).toBe('/api/cms-media/abc.jpg');
  });

  it('bascule sur un dossier temporaire si public/uploads/cms est en lecture seule', async () => {
    const publicDir = path.join(process.cwd(), 'public', 'uploads', 'cms');
    mkdirSync(publicDir, { recursive: true });
    chmodSync(publicDir, 0o555);

    try {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const file = new File([buffer], 'cover.jpg', { type: 'image/jpeg' });
      const result = await saveCmsImage(file);

      expect(result.url).toMatch(/^\/api\/cms-media\//);
      expect(resolveCmsUploadDirectory()).toBe(path.join(os.tmpdir(), 'moonskin-cms-uploads'));
    } finally {
      chmodSync(publicDir, 0o755);
      resetCmsUploadDirectoryCache();
    }
  });

  it('reconnaît une CmsImageUploadError par son nom', () => {
    const error = new CmsImageUploadError('test');
    expect(isCmsImageUploadError(error)).toBe(true);
    expect(isCmsImageUploadError(new Error('autre'))).toBe(false);
  });

  it('retrouve un fichier dans le dossier temporaire même si public est la cible par défaut', async () => {
    const fallbackDir = path.join(os.tmpdir(), 'moonskin-cms-uploads');
    mkdirSync(fallbackDir, { recursive: true });
    const filename = 'test-resolve-fallback.jpg';
    writeFileSync(path.join(fallbackDir, filename), Buffer.from([0xff, 0xd8, 0xff]));

    resetCmsUploadDirectoryCache();
    const resolved = await resolveCmsImageFilePath(filename);
    expect(resolved).toBe(path.join(fallbackDir, filename));
  });
});
