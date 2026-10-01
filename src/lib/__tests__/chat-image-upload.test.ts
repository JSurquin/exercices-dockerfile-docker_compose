import {
  buildChatImagePublicUrl,
  ChatImageUploadError,
  getChatUploadFile,
  isChatImageUploadError,
  resetChatUploadDirectoryCache,
  resolveChatImageFilePath,
  resolveChatImageMimeType,
  resolveChatUploadDirectory,
  saveChatImage,
} from '@/lib/chat-image-upload';
import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

describe('chat-image-upload', () => {
  afterEach(() => {
    resetChatUploadDirectoryCache();
    delete process.env.CHAT_UPLOAD_DIR;
  });

  it('accepte un JPEG sans type MIME via extension', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([buffer], 'screenshot.jpg', { type: '' });
    expect(resolveChatImageMimeType(file, buffer)).toBe('image/jpeg');
  });

  it('accepte un PNG détecté par magic bytes', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([buffer], 'photo.bin', { type: '' });
    expect(resolveChatImageMimeType(file, buffer)).toBe('image/png');
  });

  it('refuse un type non supporté', () => {
    const buffer = Buffer.from('%PDF-1.4');
    const file = new File([buffer], 'doc.pdf', { type: 'application/pdf' });
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(ChatImageUploadError);
  });

  it('extrait le fichier même s’il n’est pas une instance File', () => {
    const blob = {
      type: 'image/jpeg',
      name: 'photo.jpg',
      size: 8,
      arrayBuffer: async () => new Uint8Array([0xff, 0xd8, 0xff]).buffer,
    };
    const formData = {
      get: () => blob,
    } as unknown as FormData;

    expect(getChatUploadFile(formData)).toEqual(blob);
  });

  it('retourne toujours une URL /api/chat-media', () => {
    expect(buildChatImagePublicUrl('abc.jpg')).toBe('/api/chat-media/abc.jpg');
  });

  it('enregistre une image et renvoie une URL publique', async () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const file = new File([buffer], 'photo.jpg', { type: 'image/jpeg' });
    const result = await saveChatImage(file);

    expect(result.url).toMatch(/^\/api\/chat-media\/[a-f0-9-]+\.jpg$/);
  });

  it('bascule sur un dossier temporaire si public/uploads/chat est en lecture seule', async () => {
    const publicDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
    mkdirSync(publicDir, { recursive: true });
    chmodSync(publicDir, 0o555);

    try {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const file = new File([buffer], 'photo.jpg', { type: 'image/jpeg' });
      const result = await saveChatImage(file);

      expect(result.url).toMatch(/^\/api\/chat-media\//);
      expect(resolveChatUploadDirectory()).toBe(path.join(os.tmpdir(), 'moonskin-chat-uploads'));
    } finally {
      chmodSync(publicDir, 0o755);
      resetChatUploadDirectoryCache();
    }
  });

  it('reconnaît une ChatImageUploadError par son nom', () => {
    const error = new ChatImageUploadError('test');
    expect(isChatImageUploadError(error)).toBe(true);
    expect(isChatImageUploadError(new Error('autre'))).toBe(false);
  });

  it('retrouve un fichier dans le dossier temporaire même si public est la cible par défaut', async () => {
    const fallbackDir = path.join(os.tmpdir(), 'moonskin-chat-uploads');
    mkdirSync(fallbackDir, { recursive: true });
    const filename = 'test-resolve-chat-fallback.jpg';
    writeFileSync(path.join(fallbackDir, filename), Buffer.from([0xff, 0xd8, 0xff]));

    resetChatUploadDirectoryCache();
    const resolved = await resolveChatImageFilePath(filename);
    expect(resolved).toBe(path.join(fallbackDir, filename));
  });
});
