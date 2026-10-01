import {
  buildChatImagePublicUrl,
  ChatImageUploadError,
  getChatUploadFile,
  isChatImageContentLengthTooLarge,
  isChatImageUploadError,
  MAX_CHAT_IMAGE_BYTES,
  resetChatUploadDirectoryCache,
  resolveChatImageFilePath,
  resolveChatImageMimeType,
  resolveChatUploadDirectory,
  saveChatImage,
} from '@/lib/chat-image-upload';
import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

async function makeJpegBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 220, g: 40, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

function toFileBits(buffer: Buffer): ArrayBuffer {
  const copy = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(copy).set(buffer);
  return copy;
}

describe('chat-image-upload', () => {
  afterEach(() => {
    resetChatUploadDirectoryCache();
    delete process.env.CHAT_UPLOAD_DIR;
  });

  it('accepte un JPEG via magic bytes même sans type MIME', () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const file = new File([buffer], 'screenshot.bin', { type: '' });
    expect(resolveChatImageMimeType(file, buffer)).toBe('image/jpeg');
  });

  it('accepte un PNG détecté par magic bytes', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([buffer], 'photo.bin', { type: '' });
    expect(resolveChatImageMimeType(file, buffer)).toBe('image/png');
  });

  it('refuse un SVG déguisé en .jpg malgré un MIME JPEG déclaré', () => {
    const buffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );
    const file = new File([toFileBits(buffer)], 'photo.jpg', { type: 'image/jpeg' });
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(ChatImageUploadError);
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(/SVG/);
  });

  it('refuse un HTML déguisé en image', () => {
    const buffer = Buffer.from('<html><body><script>alert(1)</script></body></html>');
    const file = new File([buffer], 'photo.png', { type: 'image/png' });
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(/HTML|SVG|non autorisé/);
  });

  it('refuse un type non supporté', () => {
    const buffer = Buffer.from('%PDF-1.4');
    const file = new File([buffer], 'doc.pdf', { type: 'application/pdf' });
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(ChatImageUploadError);
  });

  it('ne fait pas confiance à l’extension si les magic bytes ne correspondent pas', () => {
    const buffer = Buffer.from('not-an-image');
    const file = new File([toFileBits(buffer)], 'photo.jpg', { type: 'image/jpeg' });
    expect(() => resolveChatImageMimeType(file, buffer)).toThrow(ChatImageUploadError);
  });

  it('refuse tôt un Content-Length trop élevé', () => {
    expect(isChatImageContentLengthTooLarge(String(MAX_CHAT_IMAGE_BYTES + 65 * 1024))).toBe(true);
    expect(isChatImageContentLengthTooLarge(String(1024))).toBe(false);
    expect(isChatImageContentLengthTooLarge(null)).toBe(false);
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

  it('enregistre une image ré-encodée et renvoie une URL publique', async () => {
    const buffer = await makeJpegBuffer();
    const file = new File([toFileBits(buffer)], 'photo.jpg', { type: 'image/jpeg' });
    const result = await saveChatImage(file);

    expect(result.url).toMatch(/^\/api\/chat-media\/[a-f0-9-]+\.jpg$/);
  });

  it('refuse un fichier trop volumineux via size', async () => {
    const file = {
      type: 'image/jpeg',
      name: 'huge.jpg',
      size: MAX_CHAT_IMAGE_BYTES + 1,
      arrayBuffer: async () => {
        throw new Error('ne doit pas lire le corps');
      },
    };
    await expect(saveChatImage(file)).rejects.toThrow(/trop volumineux/);
  });

  it('refuse un fichier trop volumineux via buffer.byteLength', async () => {
    const buffer = Buffer.alloc(MAX_CHAT_IMAGE_BYTES + 1);
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;
    const copy = Uint8Array.from(buffer);
    const file = {
      type: 'image/jpeg',
      name: 'huge.jpg',
      size: 100,
      arrayBuffer: async () => copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength),
    };
    await expect(saveChatImage(file)).rejects.toThrow(/trop volumineux/);
  });

  it('ré-encode un GIF en PNG pour supprimer animation et métadonnées', async () => {
    const gif = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 0, g: 80, b: 200 } },
    })
      .gif()
      .toBuffer();
    const file = new File([toFileBits(gif)], 'anim.gif', { type: 'image/gif' });
    const result = await saveChatImage(file);
    expect(result.url).toMatch(/^\/api\/chat-media\/[a-f0-9-]+\.png$/);
  });

  it('bascule sur un dossier temporaire si public/uploads/chat est en lecture seule', async () => {
    const publicDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
    mkdirSync(publicDir, { recursive: true });
    chmodSync(publicDir, 0o555);

    try {
      const buffer = await makeJpegBuffer();
      const file = new File([toFileBits(buffer)], 'photo.jpg', { type: 'image/jpeg' });
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
