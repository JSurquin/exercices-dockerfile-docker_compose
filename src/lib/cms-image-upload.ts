import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export class CmsImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmsImageUploadError';
  }
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) {
    return 'image/gif';
  }
  return null;
}

export function resolveCmsImageMimeType(file: File, buffer: Buffer): string {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const detected = detectMimeFromBuffer(buffer);
  if (detected) {
    return detected;
  }

  const extension = path.extname(file.name).toLowerCase().slice(1);
  const fromExtension = MIME_BY_EXTENSION[extension];
  if (fromExtension) {
    return fromExtension;
  }

  throw new CmsImageUploadError('Type de fichier non autorisé (JPEG, PNG, WebP ou GIF uniquement)');
}

export function resolveCmsUploadDirectory(): string {
  const configured = process.env.CMS_UPLOAD_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.join(process.cwd(), 'public', 'uploads', 'cms');
}

export function buildCmsImagePublicUrl(filename: string, uploadDir: string): string {
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'cms');
  if (path.resolve(uploadDir) === path.resolve(publicDir)) {
    return `/uploads/cms/${filename}`;
  }
  return `/api/cms-media/${filename}`;
}

export async function saveCmsImage(file: File): Promise<{ url: string }> {
  if (file.size <= 0) {
    throw new CmsImageUploadError('Fichier vide');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new CmsImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = resolveCmsImageMimeType(file, buffer);
  const extension = EXTENSION_BY_MIME[mimeType];
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = resolveCmsUploadDirectory();

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new CmsImageUploadError(
      `Impossible d'enregistrer l'image (${message}). Vérifiez les droits d'écriture ou définissez CMS_UPLOAD_DIR.`,
    );
  }

  return { url: buildCmsImagePublicUrl(filename, uploadDir) };
}
