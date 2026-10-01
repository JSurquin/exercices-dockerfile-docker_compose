import { randomUUID } from 'crypto';
import { accessSync, constants, mkdirSync } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

export const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_IMAGE_DIMENSION = 4096;
const MAX_INPUT_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export type ChatUploadFile = {
  type?: string;
  name?: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export class ChatImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatImageUploadError';
  }
}

export function isChatImageUploadError(error: unknown): error is ChatImageUploadError {
  return (
    error instanceof ChatImageUploadError ||
    (error instanceof Error && error.name === 'ChatImageUploadError')
  );
}

export function getChatUploadFile(formData: FormData): ChatUploadFile | null {
  const entry = formData.get('file');
  if (!entry || typeof entry !== 'object' || !('arrayBuffer' in entry)) {
    return null;
  }
  return entry as ChatUploadFile;
}

let cachedUploadDir: string | null = null;

function canWriteDirectorySync(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveFallbackUploadDirectory(): string {
  return path.join(os.tmpdir(), 'moonskin-chat-uploads');
}

function looksLikeRejectedMarkup(buffer: Buffer): boolean {
  let offset = 0;
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    offset = 3;
  }
  const head = buffer
    .subarray(offset, Math.min(buffer.length, offset + 512))
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trimStart()
    .toLowerCase();

  if (
    head.startsWith('<svg') ||
    head.startsWith('<html') ||
    head.startsWith('<!doctype html') ||
    head.startsWith('<script') ||
    head.startsWith('<body')
  ) {
    return true;
  }
  if (head.includes('<svg') || head.includes('xmlns="http://www.w3.org/2000/svg"')) {
    return true;
  }
  if (head.startsWith('<?xml') && head.includes('svg')) {
    return true;
  }
  return false;
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

export function isChatImageContentLengthTooLarge(contentLengthHeader: string | null): boolean {
  if (contentLengthHeader == null || contentLengthHeader.trim() === '') {
    return false;
  }
  const size = Number(contentLengthHeader);
  if (!Number.isFinite(size) || size < 0) {
    return false;
  }
  return size > MAX_CHAT_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES;
}

/**
 * Accepte uniquement JPEG/PNG/WebP/GIF d’après les magic bytes.
 * Le MIME déclaré et l’extension ne sont jamais utilisés.
 */
export function resolveChatImageMimeType(_file: ChatUploadFile, buffer: Buffer): string {
  if (looksLikeRejectedMarkup(buffer)) {
    throw new ChatImageUploadError('Type de fichier non autorisé (SVG et HTML refusés)');
  }

  const detected = detectMimeFromBuffer(buffer);
  if (detected && ALLOWED_MIME_TYPES.has(detected)) {
    return detected;
  }

  throw new ChatImageUploadError('Type de fichier non autorisé (JPEG, PNG, WebP ou GIF uniquement)');
}

async function reencodeChatImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const pipeline = sharp(buffer, {
    failOn: 'error',
    animated: false,
    limitInputPixels: MAX_INPUT_PIXELS,
  }).rotate().resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  let outputMime = mimeType;
  let output: Buffer;

  if (mimeType === 'image/jpeg') {
    output = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  } else if (mimeType === 'image/png') {
    output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else if (mimeType === 'image/webp') {
    output = await pipeline.webp({ quality: 85 }).toBuffer();
  } else {
    // GIF : première frame ré-encodée en PNG (supprime animation et contenu caché).
    output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    outputMime = 'image/png';
  }

  if (output.byteLength > MAX_CHAT_IMAGE_BYTES) {
    output = await sharp(output, { limitInputPixels: MAX_INPUT_PIXELS })
      .jpeg({ quality: 70, mozjpeg: true })
      .toBuffer();
    outputMime = 'image/jpeg';
  }

  if (output.byteLength > MAX_CHAT_IMAGE_BYTES) {
    throw new ChatImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  return { buffer: output, mimeType: outputMime };
}

export function resolveChatUploadDirectory(): string {
  if (cachedUploadDir) {
    return cachedUploadDir;
  }

  const configured = process.env.CHAT_UPLOAD_DIR?.trim();
  if (configured) {
    cachedUploadDir = path.resolve(configured);
    return cachedUploadDir;
  }

  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'chat');
  if (canWriteDirectorySync(publicDir)) {
    cachedUploadDir = publicDir;
    return cachedUploadDir;
  }

  const fallbackDir = resolveFallbackUploadDirectory();
  mkdirSync(fallbackDir, { recursive: true });
  cachedUploadDir = fallbackDir;
  return cachedUploadDir;
}

export function resetChatUploadDirectoryCache(): void {
  cachedUploadDir = null;
}

export function getChatUploadSearchDirectories(): string[] {
  const dirs: string[] = [];
  const configured = process.env.CHAT_UPLOAD_DIR?.trim();
  if (configured) {
    dirs.push(path.resolve(configured));
  }
  dirs.push(path.join(process.cwd(), 'public', 'uploads', 'chat'));
  dirs.push(resolveFallbackUploadDirectory());
  return [...new Set(dirs.map((dir) => path.resolve(dir)))];
}

export async function resolveChatImageFilePath(filename: string): Promise<string | null> {
  for (const dir of getChatUploadSearchDirectories()) {
    const filePath = path.join(dir, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(`${path.resolve(dir)}${path.sep}`) && resolved !== path.resolve(dir)) {
      continue;
    }
    try {
      await access(resolved);
      return resolved;
    } catch {
      // fichier absent dans ce répertoire
    }
  }
  return null;
}

export function buildChatImagePublicUrl(filename: string): string {
  return `/api/chat-media/${filename}`;
}

export async function saveChatImage(file: ChatUploadFile): Promise<{ url: string }> {
  if (file.size <= 0) {
    throw new ChatImageUploadError('Fichier vide');
  }

  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    throw new ChatImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength <= 0) {
    throw new ChatImageUploadError('Fichier vide');
  }
  if (buffer.byteLength > MAX_CHAT_IMAGE_BYTES) {
    throw new ChatImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  const sourceMime = resolveChatImageMimeType(file, buffer);

  let sanitized: { buffer: Buffer; mimeType: string };
  try {
    sanitized = await reencodeChatImage(buffer, sourceMime);
  } catch (error) {
    if (isChatImageUploadError(error)) {
      throw error;
    }
    throw new ChatImageUploadError('Image illisible ou corrompue');
  }

  const extension = EXTENSION_BY_MIME[sanitized.mimeType];
  const filename = `${randomUUID()}.${extension}`;
  let uploadDir = resolveChatUploadDirectory();
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'chat');

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), sanitized.buffer);
  } catch (error) {
    if (path.resolve(uploadDir) === path.resolve(publicDir)) {
      resetChatUploadDirectoryCache();
      uploadDir = resolveFallbackUploadDirectory();
      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), sanitized.buffer);
        cachedUploadDir = uploadDir;
      } catch (retryError) {
        const message = retryError instanceof Error ? retryError.message : 'Erreur inconnue';
        throw new ChatImageUploadError(
          `Impossible d'enregistrer l'image (${message}). Vérifiez les droits d'écriture ou définissez CHAT_UPLOAD_DIR.`,
        );
      }
    } else {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new ChatImageUploadError(
        `Impossible d'enregistrer l'image (${message}). Vérifiez les droits d'écriture ou définissez CHAT_UPLOAD_DIR.`,
      );
    }
  }

  return { url: buildChatImagePublicUrl(filename) };
}
