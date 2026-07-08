import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import type { UserRole } from '@prisma/client';

const TEST_PASSWORD = 'E2eTestPassword!9';

const ROLE_MAP: Record<string, UserRole> = {
  user: 'USER',
  admin: 'ADMIN',
  moderator: 'MODERATOR',
};

function isTestAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_AUTH === 'true';
}

async function ensureTestUser(roleKey: string): Promise<{ email: string; password: string }> {
  const prismaRole = ROLE_MAP[roleKey] ?? 'USER';
  const email = `test-${roleKey}@moonskin.test`;

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const signUp = await auth.api.signUpEmail({
      body: {
        email,
        password: TEST_PASSWORD,
        name: `Test ${roleKey}`,
      },
    });

    if (!signUp.user) {
      throw new Error('Échec création utilisateur de test');
    }

    user = await prisma.user.update({
      where: { id: signUp.user.id },
      data: {
        role: prismaRole,
        emailVerified: true,
        acceptedTermsAt: new Date(),
        steamId: `test-${roleKey}-76561198000000000`,
        steamUsername: `Test${roleKey}`,
      },
    });
  } else if (user.role !== prismaRole) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: prismaRole, emailVerified: true },
    });
  }

  return { email, password: TEST_PASSWORD };
}

/** GET /api/test/auth?role=user|admin|moderator — session E2E uniquement */
export async function GET(request: NextRequest) {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  try {
    const role = new URL(request.url).searchParams.get('role') || 'user';
    const { email, password } = await ensureTestUser(role);

    const signInResponse = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    const redirectUrl = new URL('/dashboard', request.url);
    const response = NextResponse.redirect(redirectUrl);

    const setCookies =
      typeof signInResponse.headers.getSetCookie === 'function'
        ? signInResponse.headers.getSetCookie()
        : [];

    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur auth test';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/test/auth — nettoie les comptes @moonskin.test */
export async function DELETE() {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: '@moonskin.test' } },
  });

  return NextResponse.json({ success: true, deleted: result.count });
}
