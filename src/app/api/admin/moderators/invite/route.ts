import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger, logAudit } from '@/lib/logger';
import { emailService } from '@/lib/email';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminModeratorInviteSchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';
import { canInviteAsModerator } from '@/lib/chat-moderation-logic';

function generateTempPassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join('');
}

// POST /api/admin/moderators/invite
// Crée un compte modérateur via email (sans écraser la session admin courante)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, adminModeratorInviteSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { email, name } = parsed.data;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
    }

    // Si le compte existe déjà → on le promeut simplement
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      const inviteCheck = canInviteAsModerator(existingUser.role);
      if (!inviteCheck.ok) {
        return NextResponse.json({ error: inviteCheck.reason }, { status: inviteCheck.status });
      }

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'MODERATOR' },
        select: { id: true, name: true, email: true, role: true },
      });

      await logAudit(session.user.id, 'USER_PROMOTED_TO_MODERATOR', {
        targetUserId: existingUser.id,
        targetUserEmail: email,
        previousRole: existingUser.role,
        newRole: 'MODERATOR',
        method: 'email_existing',
      });

      try {
        await emailService.sendEmail({
          to: email,
          subject: 'MoonSkin — Vous êtes maintenant modérateur',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;">
              <h2 style="color:#f97316;margin:0 0 8px">MoonSkin — Nouveau rôle</h2>
              <p style="color:#94a3b8;margin:0 0 16px">Bonjour ${existingUser.name || email},</p>
              <p style="color:#94a3b8;margin:0 0 16px">Votre compte a été promu au rôle de <strong style="color:#f97316">Modérateur</strong> par l'équipe MoonSkin.</p>
              <p style="color:#64748b;font-size:13px;margin:16px 0 0">Si vous n'êtes pas à l'origine de cette demande, contactez-nous.</p>
            </div>
          `,
          text: `Votre compte MoonSkin a été promu au rôle de Modérateur.`,
        });
      } catch {
        // Email secondaire, non bloquant
      }

      return NextResponse.json({ ...updatedUser, invited: false });
    }

    // Nouveau compte → utiliser auth.api.createUser (plugin admin)
    // Cette méthode ne crée PAS de session, contrairement à signUpEmail
    const tempPassword = generateTempPassword();
    const displayName = name?.trim() || email.split('@')[0];

    const created = await (auth.api as any).createUser({
      body: {
        email: email.toLowerCase(),
        password: tempPassword,
        name: displayName,
        role: 'MODERATOR',
        data: { emailVerified: true },
      },
      headers: request.headers,
    });

    if (!created?.user) {
      return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
    }

    await logAudit(session.user.id, 'MODERATOR_INVITED', {
      targetUserId: created.user.id,
      targetUserEmail: email,
      newRole: 'MODERATOR',
      method: 'email_invite',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://moonskin.gg';

    let emailError = false;
    try {
      await emailService.sendEmail({
        to: email,
        subject: 'MoonSkin — Invitation modérateur',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;border-radius:12px;">
            <h2 style="color:#f97316;margin:0 0 8px">MoonSkin — Invitation modérateur</h2>
            <p style="color:#94a3b8;margin:0 0 16px">Bonjour ${displayName},</p>
            <p style="color:#94a3b8;margin:0 0 16px">Vous avez été invité(e) en tant que <strong style="color:#f97316">Modérateur</strong> sur la plateforme MoonSkin.</p>
            <div style="background:#1e293b;border-radius:8px;padding:16px;margin:0 0 16px;">
              <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Vos identifiants de connexion :</p>
              <p style="color:#fff;margin:0 0 4px"><strong>Email :</strong> ${email}</p>
              <p style="color:#fff;margin:0"><strong>Mot de passe temporaire :</strong> <span style="color:#f97316;font-family:monospace">${tempPassword}</span></p>
            </div>
            <p style="color:#94a3b8;margin:0 0 16px">Connectez-vous et changez votre mot de passe dès que possible.</p>
            <a href="${appUrl}/moderator" style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Se connecter</a>
            <p style="color:#64748b;font-size:13px;margin:16px 0 0">Ne transférez pas cet email.</p>
          </div>
        `,
        text: `MoonSkin — Email: ${email} — Mot de passe temporaire: ${tempPassword} — ${appUrl}/moderator`,
      });
    } catch {
      emailError = true;
    }

    return NextResponse.json({
      id: created.user.id,
      name: created.user.name,
      email: created.user.email,
      role: 'MODERATOR',
      invited: true,
      emailError,
    });
  } catch (error: any) {
    logger.error("Erreur lors de l'invitation du modérateur:", error);
    return NextResponse.json({ error: error?.message ?? 'Erreur serveur' }, { status: 500 });
  }
}
