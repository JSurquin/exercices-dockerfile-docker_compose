import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { resolveChatImageFilePath } from '@/lib/chat-image-upload';
import {
  authorizeChatMediaRequest,
  CHAT_MEDIA_HEADERS,
  chatMediaJson,
  isSafeChatMediaFilename,
} from '@/lib/chat-media-access';

interface RouteParams {
  params: Promise<{ filename: string }>;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { filename } = await params;
    if (!isSafeChatMediaFilename(filename)) {
      return chatMediaJson('Not found', 404);
    }

    const access = await authorizeChatMediaRequest(request, filename);
    if (!access.ok) {
      return chatMediaJson(access.error, access.status);
    }

    const resolved = await resolveChatImageFilePath(filename);
    if (!resolved) {
      return chatMediaJson('Not found', 404);
    }

    const buffer = await readFile(resolved);
    const extension = path.extname(filename).toLowerCase().slice(1);
    const contentType = MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        ...CHAT_MEDIA_HEADERS,
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return chatMediaJson('Not found', 404);
  }
}
