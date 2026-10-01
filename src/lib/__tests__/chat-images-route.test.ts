import { NextRequest } from 'next/server';

jest.mock('@/lib/require-admin', () => ({
  resolveChatIdentity: jest.fn(),
}));

jest.mock('@/lib/security/rate-limiter', () => ({
  applyRateLimit: jest.fn().mockResolvedValue(null),
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
import { applyRateLimit } from '@/lib/security/rate-limiter';
import { saveChatImage } from '@/lib/chat-image-upload';
import { POST as postChatImage } from '@/app/api/chat/images/route';

const mockResolveChatIdentity = resolveChatIdentity as jest.Mock;
const mockSaveChatImage = saveChatImage as jest.Mock;
const mockApplyRateLimit = applyRateLimit as jest.Mock;

function makeUploadRequest(file?: Blob, headers?: Record<string, string>) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file, 'photo.jpg');
  }
  return new NextRequest('http://localhost/api/chat/images', {
    method: 'POST',
    body: formData,
    headers,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSaveChatImage.mockResolvedValue({ url: '/api/chat-media/abc-123.jpg' });
  mockApplyRateLimit.mockResolvedValue(null);
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
    expect(mockApplyRateLimit).toHaveBeenCalledWith(expect.anything(), 'chatImageUpload', 'u1');
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

  it('rate-limite un invité par IP', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));
    expect(res.status).toBe(200);
    expect(mockApplyRateLimit).toHaveBeenCalledWith(expect.anything(), 'chatImageUpload', 'guest');
  });

  it('refuse une session invalide', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'invalid' });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));
    expect(res.status).toBe(403);
    expect(mockSaveChatImage).not.toHaveBeenCalled();
    expect(mockApplyRateLimit).not.toHaveBeenCalled();
  });

  it('refuse une requête sans fichier', async () => {
    mockResolveChatIdentity.mockResolvedValue({ kind: 'guest' });
    const res = await postChatImage(makeUploadRequest());
    expect(res.status).toBe(400);
    expect(mockSaveChatImage).not.toHaveBeenCalled();
  });

  it('refuse un fichier trop gros via Content-Length', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });

    const request = {
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-length' ? String(6 * 1024 * 1024) : null),
      },
    } as unknown as NextRequest;

    const res = await postChatImage(request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/trop volumineux/) });
    expect(mockSaveChatImage).not.toHaveBeenCalled();
  });

  it('renvoie 429 quand le rate limit est atteint', async () => {
    mockResolveChatIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u1' } },
    });
    mockApplyRateLimit.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
    );

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    const res = await postChatImage(makeUploadRequest(file));
    expect(res.status).toBe(429);
    expect(mockSaveChatImage).not.toHaveBeenCalled();
  });
});
