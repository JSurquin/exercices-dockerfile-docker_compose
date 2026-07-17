import { readFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCmsUploadDirectory } from '@/lib/cms-image-upload';

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

function isSafeFilename(filename: string): boolean {
  return /^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { filename } = await params;
    if (!isSafeFilename(filename)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const uploadDir = resolveCmsUploadDirectory();
    const filePath = path.join(uploadDir, filename);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(uploadDir))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const buffer = await readFile(resolved);
    const extension = path.extname(filename).toLowerCase().slice(1);
    const contentType = MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
