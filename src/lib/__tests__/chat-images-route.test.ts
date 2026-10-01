import { NextRequest } from 'next/server';

jest.mock('@/lib/require-admin', () => ({
  resolveChatIdentity: jest.fn(),
}));

jest.mock('@/lib/chat-image-upload', () => {
  const actual = jest.requireActual<typeof import('@/lib/chat-image-upload')>(
    '@/lib/chat-image-upload',
  );
  return {
    ...actual,
    saveChatImage: jest.fn(),
  };
});

import { resolveChatIdentity } from '@/lib/require-admin';
import { saveChatImage } from '@/lib/chat-image-upload';
import { POST as postChatImage } from '@/app/api/chat/images/route';

const mockResolveChatIdentity = resolveChatIdentity as jest.Mock;
const mockSaveChatImage = saveChatImage as jest.Mock;

function makeUploadRequest(file?: Blob) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file, 'photo.jpg');
  }
  return new NextRequest('http://localhost/api/chat/images', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveChatImage.mockResolvedValue({ url: '/api/chat-media/abc-123.jpg' });
});

describe('POST /api/chat/images', () => {
  it('autorise un utilisateur standard à envoyer une image', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: '/api/chat-media/abc-123.jpg' });
    expect(mockSaveChatImage).toHaveBeenCalled();
  });

  it('autorise un modérateur à envoyer une image', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'MODERATOR',
      session: { user: { id: 'mod-1' } },
    });

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: '/api/chat-media/abc-123.jpg' });
    expect(mockSaveChatImage).toHaveBeenCalledTimes(1);
  });

  it('accepte un blob sans instance File (FormData Next.js)', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });

    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: '' });
    const res = await postChatImage(makeUploadRequest(blob));

    expect(res.status).toBe(200);
    expect(mockSaveChatImage).toHaveBeenCalled();
  });

  it('refuse une session invalide', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'invalid' });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));
    expect(res.status).toBe(403);
    expect(mockSaveChatImage).not.toHaveBeenCalled();
  });

  it('refuse une requête sans fichier', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    const res = await postChatImage(makeUploadRequest());
    expect(res.status).toBe(400);
    expect(mockSaveChatImage).not.toHaveBeenCalled();
  });
});
