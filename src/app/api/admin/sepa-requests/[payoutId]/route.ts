import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { decrypt } from '@/lib/encryption';
import { emailService } from '@/lib/email';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { safeParseJson } from '@/lib/validation/helpers';
import { adminSepaRequestBodySchema } from '@/lib/validation/schemas/admin-bodies';
import { requireAdminSessionWithDbCheck } from '@/lib/require-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const session = await requireAdminSessionWithDbCheck(request);
    if (!session) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { payoutId } = await params;
    const raw = await request.json();
    const parsed = safeParseJson(raw, adminSepaRequestBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { action, reason, reference } = parsed.data;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide. Utiliser "approve" ou "reject".' }, { status: 400 });
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    }

    if (!payout.gateFiOrderId?.startsWith('MOON-SEPA-FR')) {
      return NextResponse.json({ error: 'Cette demande n\'est pas une demande SEPA France' }, { status: 400 });
    }

    if (payout.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `Impossible de modifier une demande en statut "${payout.status}"` }, { status: 400 });
    }

    const userEmail = payout.user?.email;
    const userName = payout.user?.name ?? 'Utilisateur';
    const amountFormatted = formatCentsToCurrency(payout.amountCents, 'EUR');

    let beneficiaryIban = '';
    let beneficiaryBic = '';
    if (payout.pendingFlexifyRequestEncrypted) {
      try {
        const decrypted = JSON.parse(decrypt(payout.pendingFlexifyRequestEncrypted));
        beneficiaryIban = decrypted.iban ?? '';
        beneficiaryBic = decrypted.bic ?? '';
      } catch {
        // ignore
      }
    }

    if (action === 'approve') {
      const [updatedPayout] = await prisma.$transaction([
        prisma.payout.update({
          where: { id: payoutId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paymentReference: reference ?? null,
            errorMessage: null,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: 'ADMIN_SEPA_FR_APPROVED',
            details: {
              payoutId,
              reference: reference ?? null,
              amountCents: payout.amountCents,
              adminId: session.user.id,
            },
          },
        }),
      ]);

      // Send approval email to user
      if (userEmail) {
        await emailService.sendEmail({
          to: userEmail,
          subject: `✅ Votre virement SEPA France de ${amountFormatted} a été effectué — MoonSkin`,
          html: buildApprovalEmailHtml({
            userName,
            amount: amountFormatted,
            reference: reference ?? payout.gateFiOrderId ?? '',
            iban: beneficiaryIban ? maskIban(beneficiaryIban) : '****',
            bic: beneficiaryBic,
          }),
          text: `Bonjour ${userName},\n\nVotre virement SEPA France de ${amountFormatted} a été effectué avec succès.\nRéférence : ${reference ?? payout.gateFiOrderId}\n\nL'équipe MoonSkin`,
        });
      }

      return NextResponse.json({ success: true, payout: updatedPayout });
    }

    // action === 'reject'
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'La raison du refus est requise' }, { status: 400 });
    }

    const [updatedPayout] = await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'CANCELLED',
          errorMessage: reason.trim(),
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ADMIN_SEPA_FR_REJECTED',
          details: {
            payoutId,
            reason: reason.trim(),
            amountCents: payout.amountCents,
            adminId: session.user.id,
          },
        },
      }),
    ]);

    // Send rejection email to user
    if (userEmail) {
      await emailService.sendEmail({
        to: userEmail,
        subject: `❌ Votre demande de virement SEPA France a été refusée — MoonSkin`,
        html: buildRejectionEmailHtml({ userName, amount: amountFormatted, reason: reason.trim() }),
        text: `Bonjour ${userName},\n\nVotre demande de virement SEPA France de ${amountFormatted} a été refusée.\nRaison : ${reason.trim()}\n\nSi vous avez des questions, contactez notre support.\n\nL'équipe MoonSkin`,
      });
    }

    return NextResponse.json({ success: true, payout: updatedPayout });
  } catch (error) {
    console.error('[ADMIN SEPA FR] PATCH error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return '****';
  return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4);
}

function buildApprovalEmailHtml({
  userName,
  amount,
  reference,
  iban,
  bic,
}: {
  userName: string;
  amount: string;
  reference: string;
  iban: string;
  bic: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Virement effectué</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
  <tr><td align="center" style="padding:20px 0;">
    <table style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background:linear-gradient(135deg,#f97316 0%,#16a34a 100%);padding:40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:28px;">✅ Virement effectué</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Votre retrait SEPA France a été traité</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="color:#475569;">Bonjour <strong>${userName}</strong>,</p>
        <p style="color:#475569;">Nous avons bien effectué votre virement SEPA France. Les fonds devraient apparaître sur votre compte dans les <strong>1 à 3 jours ouvrés</strong>.</p>
        <table style="background:#f8fafc;border-radius:8px;padding:20px;width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Montant</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#1e293b;font-size:16px;">${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">IBAN destinataire</td><td style="padding:8px 0;text-align:right;font-family:monospace;color:#1e293b;">${iban}</td></tr>
          ${bic ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">BIC</td><td style="padding:8px 0;text-align:right;font-family:monospace;color:#1e293b;">${bic}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Référence</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;color:#475569;">${reference}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px;">Si vous avez des questions, n'hésitez pas à contacter notre support.</p>
        <p style="color:#475569;">L'équipe <strong>MoonSkin</strong></p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">© MoonSkin — Toutes vos transactions sont sécurisées</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildRejectionEmailHtml({
  userName,
  amount,
  reason,
}: {
  userName: string;
  amount: string;
  reason: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Demande refusée</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table role="presentation" style="width:100%;border-collapse:collapse;">
  <tr><td align="center" style="padding:20px 0;">
    <table style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="background:linear-gradient(135deg,#f97316 0%,#dc2626 100%);padding:40px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:28px;">❌ Demande refusée</h1>
        <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Votre demande de virement SEPA France</p>
      </td></tr>
      <tr><td style="padding:40px;">
        <p style="color:#475569;">Bonjour <strong>${userName}</strong>,</p>
        <p style="color:#475569;">Nous avons étudié votre demande de virement SEPA France de <strong>${amount}</strong>, mais nous ne sommes pas en mesure de la traiter.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Raison du refus :</strong><br>${reason}</p>
        </div>
        <p style="color:#475569;">Votre solde n'a pas été débité. Vous pouvez soumettre une nouvelle demande après avoir corrigé le problème.</p>
        <p style="color:#475569;">Pour toute question, contactez notre support.</p>
        <p style="color:#475569;">L'équipe <strong>MoonSkin</strong></p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:20px;text-align:center;">
        <p style="margin:0;color:#94a3b8;font-size:12px;">© MoonSkin — Toutes vos transactions sont sécurisées</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
