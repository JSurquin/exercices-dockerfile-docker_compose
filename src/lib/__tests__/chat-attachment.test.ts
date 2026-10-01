import {
  CHAT_IMAGE_MESSAGE_I18N_KEY,
  isLikelyChatImageFile,
  isValidChatAttachmentUrl,
  mergeChatMessageMetadata,
  parseChatMessageAttachment,
  prepareChatOutgoingMessage,
  shouldShowChatMessageText,
} from '@/lib/chat-attachment';

describe('chat-attachment', () => {
  it('valide les URLs de pièces jointes chat', () => {
    expect(isValidChatAttachmentUrl('/uploads/chat/abc-123.jpg')).toBe(true);
    expect(isValidChatAttachmentUrl('/api/chat-media/abc-123.jpg')).toBe(true);
    expect(isValidChatAttachmentUrl('/uploads/cms/foo.jpg')).toBe(false);
    expect(isValidChatAttachmentUrl('/uploads/chat/../secret.jpg')).toBe(false);
  });

  it('parse une image depuis metadata', () => {
    expect(
      parseChatMessageAttachment({
        attachment: { type: 'image', url: '/uploads/chat/file.png' },
      }),
    ).toEqual({ type: 'image', url: '/uploads/chat/file.png' });
    expect(
      parseChatMessageAttachment({
        attachment: { type: 'image', url: '/api/chat-media/file.png' },
      }),
    ).toEqual({ type: 'image', url: '/api/chat-media/file.png' });
    expect(parseChatMessageAttachment(null)).toBeNull();
  });

  it('prépare un message image seul avec placeholder i18n', () => {
    expect(
      prepareChatOutgoingMessage({
        attachmentUrl: '/uploads/chat/file.webp',
      }),
    ).toEqual({
      content: CHAT_IMAGE_MESSAGE_I18N_KEY,
      metadata: { attachment: { type: 'image', url: '/uploads/chat/file.webp' } },
      skipAi: true,
    });
  });

  it('conserve le texte avec une image jointe', () => {
    expect(
      prepareChatOutgoingMessage({
        content: 'Voici mon écran',
        attachmentUrl: '/uploads/chat/file.webp',
      }),
    ).toMatchObject({
      content: 'Voici mon écran',
      skipAi: true,
    });
  });

  it('refuse une URL de pièce jointe invalide', () => {
    expect(() =>
      prepareChatOutgoingMessage({ attachmentUrl: 'https://evil.test/x.jpg' }),
    ).toThrow('INVALID_ATTACHMENT_URL');
  });

  it('masque le placeholder quand seule une image est envoyée', () => {
    expect(shouldShowChatMessageText(CHAT_IMAGE_MESSAGE_I18N_KEY, true)).toBe(false);
    expect(shouldShowChatMessageText('Screenshot du bug', true)).toBe(true);
    expect(shouldShowChatMessageText('Bonjour', false)).toBe(true);
  });

  it('reconnaît un fichier image même sans type MIME', () => {
    expect(isLikelyChatImageFile({ type: 'image/png', name: 'x.bin' })).toBe(true);
    expect(isLikelyChatImageFile({ type: '', name: 'photo.JPG' })).toBe(true);
    expect(isLikelyChatImageFile({ type: '', name: 'notes.pdf' })).toBe(false);
  });

  it('fusionne les métadonnées de traduction et de pièce jointe', () => {
    expect(
      mergeChatMessageMetadata({ staffLocale: 'fr' }, { attachment: { type: 'image', url: '/api/chat-media/a.jpg' } }),
    ).toEqual({
      staffLocale: 'fr',
      attachment: { type: 'image', url: '/api/chat-media/a.jpg' },
    });
    expect(mergeChatMessageMetadata(undefined, null)).toBeUndefined();
  });
});
