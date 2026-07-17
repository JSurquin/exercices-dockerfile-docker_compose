import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export class CmsImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CmsImageUploadError';
  }
}

export async function saveCmsImage(file: File): Promise<{ url: string }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new CmsImageUploadError('Type de fichier non autorisé (JPEG, PNG, WebP ou GIF uniquement)');
  }

  if (file.size <= 0) {
    throw new CmsImageUploadError('Fichier vide');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new CmsImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  const extension = EXTENSION_BY_MIME[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'cms');

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/cms/${filename}` };
}
