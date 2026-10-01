import { randomUUID } from 'crypto';
import { accessSync, constants, mkdirSync } from 'fs';
import { access, mkdir, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

export function resolveChatImageMimeType(file: ChatUploadFile, buffer: Buffer): string {
  const declared = file.type?.toLowerCase();
  if (declared && ALLOWED_MIME_TYPES.has(declared)) {
    return declared;
  }

  const detected = detectMimeFromBuffer(buffer);
  if (detected) {
    return detected;
  }

  const extension = path.extname(file.name ?? '').toLowerCase().slice(1);
  const fromExtension = MIME_BY_EXTENSION[extension];
  if (fromExtension) {
    return fromExtension;
  }

  throw new ChatImageUploadError('Type de fichier non autorisé (JPEG, PNG, WebP ou GIF uniquement)');
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

  if (file.size > MAX_FILE_BYTES) {
    throw new ChatImageUploadError('Fichier trop volumineux (5 Mo maximum)');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = resolveChatImageMimeType(file, buffer);
  const extension = EXTENSION_BY_MIME[mimeType];
  const filename = `${randomUUID()}.${extension}`;
  let uploadDir = resolveChatUploadDirectory();
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'chat');

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
  } catch (error) {
    if (path.resolve(uploadDir) === path.resolve(publicDir)) {
      resetChatUploadDirectoryCache();
      uploadDir = resolveFallbackUploadDirectory();
      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
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
