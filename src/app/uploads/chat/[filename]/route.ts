import { NextRequest, NextResponse } from 'next/server';
import {
  authorizeChatMediaRequest,
  CHAT_MEDIA_HEADERS,
  chatMediaJson,
  isSafeChatMediaFilename,
} from '@/lib/chat-media-access';

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/** Compatibilité avec les anciennes URLs /uploads/chat/* enregistrées en base. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { filename } = await params;
  if (!isSafeChatMediaFilename(filename)) {
    return chatMediaJson('Not found', 404);
  }

  const access = await authorizeChatMediaRequest(request, filename);
  if (!access.ok) {
    return chatMediaJson(access.error, access.status);
  }

  const location = new URL(`/api/chat-media/${filename}`, request.url);
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: location.toString(),
      ...CHAT_MEDIA_HEADERS,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
