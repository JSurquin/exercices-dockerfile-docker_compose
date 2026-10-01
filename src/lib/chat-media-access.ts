import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { resolveChatIdentity } from '@/lib/require-admin';
import { canGuestAccessConversation, canUserAccessConversation, isStaffRole } from '@/lib/chat-logic';

export const CHAT_MEDIA_HEADERS = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
} as const;

export type ChatMediaAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 404; error: string };

export function chatMediaJson(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status, headers: CHAT_MEDIA_HEADERS });
}

export function isSafeChatMediaFilename(filename: string): boolean {
  return /^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
}

export function chatMediaPublicUrlsFor(filename: string): string[] {
  return [`/api/chat-media/${filename}`, `/uploads/chat/${filename}`];
}

export async function authorizeChatMediaRequest(
  request: NextRequest,
  filename: string,
): Promise<ChatMediaAuthResult> {
  const identity = await resolveChatIdentity(request);
  if (identity.kind === 'invalid') {
    return { ok: false, status: 403, error: 'Accès refusé' };
  }

  const urls = chatMediaPublicUrlsFor(filename);
  const message = await prisma.chatMessage.findFirst({
    where: {
      OR: urls.map((url) => ({
        metadata: { path: ['attachment', 'url'], equals: url },
      })),
    },
    select: {
      conversation: {
        select: {
          userId: true,
          assignedTo: true,
        },
      },
    },
  });

  if (!message?.conversation) {
    return { ok: false, status: 404, error: 'Not found' };
  }

  const conversation = message.conversation;

  if (identity.kind === 'user') {
    if (isStaffRole(identity.role)) {
      return { ok: true };
    }
    if (
      canUserAccessConversation({
        role: identity.role,
        userId: identity.session.user.id,
        conversationUserId: conversation.userId,
        assignedTo: conversation.assignedTo,
        scope: 'widget',
      })
    ) {
      return { ok: true };
    }
    return { ok: false, status: 403, error: 'Accès refusé' };
  }

  if (canGuestAccessConversation(conversation.userId)) {
    return { ok: true };
  }

  return { ok: false, status: 403, error: 'Accès refusé' };
}
