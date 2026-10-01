export const CHAT_IMAGE_MESSAGE_I18N_KEY = '__i18n:chatWidget.imageMessage__';

export type ChatMessageImageAttachment = {
  type: 'image';
  url: string;
};

const CHAT_ATTACHMENT_URL_PATTERN =
  /^(?:\/uploads\/chat|\/api\/chat-media)\/[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/;

export function isValidChatAttachmentUrl(url: string): boolean {
  if (url.includes('..')) return false;
  return CHAT_ATTACHMENT_URL_PATTERN.test(url);
}

const LIKELY_CHAT_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']);

export function isLikelyChatImageFile(file: { type?: string; name?: string }): boolean {
  const type = file.type?.toLowerCase().trim();
  if (type) {
    if (LIKELY_CHAT_IMAGE_TYPES.has(type)) return true;
    if (type.startsWith('image/')) return false;
  }
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name ?? '');
}

export function mergeChatMessageMetadata(
  ...parts: Array<object | undefined | null>
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = {};
  let hasAny = false;
  for (const part of parts) {
    if (!part || typeof part !== 'object') continue;
    Object.assign(merged, part);
    hasAny = true;
  }
  return hasAny ? merged : undefined;
}

export function parseChatMessageAttachment(
  metadata: unknown,
): ChatMessageImageAttachment | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const attachment = (metadata as { attachment?: unknown }).attachment;
  if (!attachment || typeof attachment !== 'object') return null;
  const typed = attachment as { type?: unknown; url?: unknown };
  if (typed.type !== 'image' || typeof typed.url !== 'string') return null;
  if (!isValidChatAttachmentUrl(typed.url)) return null;
  return { type: 'image', url: typed.url };
}

export function buildChatAttachmentMetadata(
  url: string,
): { attachment: ChatMessageImageAttachment } {
  return { attachment: { type: 'image', url } };
}

export function isChatImageOnlyContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed === '' || trimmed === CHAT_IMAGE_MESSAGE_I18N_KEY;
}

export function prepareChatOutgoingMessage(body: {
  content?: string;
  attachmentUrl?: string;
}): {
  content: string;
  metadata?: { attachment: ChatMessageImageAttachment };
  skipAi: boolean;
} {
  const trimmedContent = body.content?.trim() ?? '';
  const attachmentUrl = body.attachmentUrl?.trim();

  if (attachmentUrl && !isValidChatAttachmentUrl(attachmentUrl)) {
    throw new Error('INVALID_ATTACHMENT_URL');
  }

  const content =
    trimmedContent || (attachmentUrl ? CHAT_IMAGE_MESSAGE_I18N_KEY : '');

  return {
    content,
    metadata: attachmentUrl ? buildChatAttachmentMetadata(attachmentUrl) : undefined,
    skipAi: Boolean(attachmentUrl),
  };
}

export function shouldShowChatMessageText(content: string, hasAttachment: boolean): boolean {
  if (!hasAttachment) return Boolean(content.trim());
  return !isChatImageOnlyContent(content);
}
