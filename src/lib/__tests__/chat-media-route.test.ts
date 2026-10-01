import { NextRequest } from 'next/server';
import { mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

jest.mock('~/prisma/prisma', () => ({
  prisma: {
    chatMessage: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/require-admin', () => ({
  resolveChatIdentity: jest.fn(),
}));

import { prisma } from '~/prisma/prisma';
import { resolveChatIdentity } from '@/lib/require-admin';
import { GET as getChatMedia } from '@/app/api/chat-media/[filename]/route';
import { GET as getLegacyChatUpload } from '@/app/uploads/chat/[filename]/route';
import { resetChatUploadDirectoryCache } from '@/lib/chat-image-upload';

const mockIdentity = resolveChatIdentity as jest.Mock;
const mockFindFirst = prisma.chatMessage.findFirst as jest.Mock;

const FILENAME = 'abc-123.jpg';

function makeRequest() {
  return new NextRequest(`http://localhost/api/chat-media/${FILENAME}`);
}

function seedStoredImage() {
  const dir = path.join(os.tmpdir(), 'moonskin-chat-uploads');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, FILENAME), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  resetChatUploadDirectoryCache();
}

beforeEach(() => {
  jest.clearAllMocks();
  seedStoredImage();
});

describe('GET /api/chat-media/[filename]', () => {
  it('refuse l’accès à une image sans droit (403)', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u-intrus' } },
    });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getChatMedia(makeRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(403);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('sert une image déjà stockée au participant autorisé', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u-owner' } },
    });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getChatMedia(makeRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('autorise le staff à lire une image d’un autre utilisateur', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'MODERATOR',
      session: { user: { id: 'mod-1' } },
    });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getChatMedia(makeRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(200);
  });

  it('refuse à un invité une image d’une conversation utilisateur (403)', async () => {
    mockIdentity.mockResolvedValue({ kind: 'guest' });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getChatMedia(makeRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(403);
  });

  it('sert une image d’un ticket invité à un invité', async () => {
    mockIdentity.mockResolvedValue({ kind: 'guest' });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: null, assignedTo: null },
    });

    const res = await getChatMedia(makeRequest(), { params: Promise.resolve({ filename: FILENAME }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('GET /uploads/chat/[filename]', () => {
  it('refuse la redirection sans droit (403)', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u-intrus' } },
    });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getLegacyChatUpload(
      new NextRequest(`http://localhost/uploads/chat/${FILENAME}`),
      { params: Promise.resolve({ filename: FILENAME }) },
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('redirige vers chat-media pour un participant autorisé', async () => {
    mockIdentity.mockResolvedValue({
      kind: 'user',
      role: 'USER',
      session: { user: { id: 'u-owner' } },
    });
    mockFindFirst.mockResolvedValue({
      conversation: { userId: 'u-owner', assignedTo: null },
    });

    const res = await getLegacyChatUpload(
      new NextRequest(`http://localhost/uploads/chat/${FILENAME}`),
      { params: Promise.resolve({ filename: FILENAME }) },
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('Location')).toBe(`http://localhost/api/chat-media/${FILENAME}`);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
