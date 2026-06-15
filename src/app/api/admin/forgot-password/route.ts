import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { safeParseJson } from '@/lib/validation/helpers';

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

const ADMIN_PANEL_ROLES = new Set(['ADMIN', 'MODERATOR']);

const GENERIC_SUCCESS_MESSAGE =
  'Si un compte administrateur existe avec cette adresse, un email de réinitialisation a été envoyé.';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = safeParseJson(raw, forgotPasswordSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    const email = parsed.data.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, role: true, email: true },
    });

    if (user && ADMIN_PANEL_ROLES.has(user.role)) {
      await auth.api.requestPasswordReset({
        body: {
          email: user.email,
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/password/reset-password`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error('[admin/forgot-password]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
