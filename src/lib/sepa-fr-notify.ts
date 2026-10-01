import { emailService, escapeHtml } from '@/lib/email';
import { formatCentsToCurrency } from '@/lib/currency-converter';
import { resolveUserContactEmail } from '@/lib/user-contact-email';

export function isSepaFrPayout(gateFiOrderId: string | null | undefined): boolean {
  return typeof gateFiOrderId === 'string' && gateFiOrderId.startsWith('MOON-SEPA-FR');
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return '****';
  return iban.slice(0, 4) + ' **** **** ' + iban.slice(-4);
}

export function buildSepaFrApprovalEmailHtml({
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
        <p style="color:#475569;">Bonjour <strong>${escapeHtml(userName)}</strong>,</p>
        <p style="color:#475569;">Nous avons bien effectué votre virement SEPA France. Les fonds devraient apparaître sur votre compte <strong>instantanément</strong>.</p>
        <table style="background:#f8fafc;border-radius:8px;padding:20px;width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Montant</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#1e293b;font-size:16px;">${escapeHtml(amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">IBAN destinataire</td><td style="padding:8px 0;text-align:right;font-family:monospace;color:#1e293b;">${escapeHtml(iban)}</td></tr>
          ${bic ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">BIC</td><td style="padding:8px 0;text-align:right;font-family:monospace;color:#1e293b;">${escapeHtml(bic)}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#64748b;font-size:14px;">Référence</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;color:#475569;">${escapeHtml(reference)}</td></tr>
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

export function buildSepaFrRejectionEmailHtml({
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
        <p style="color:#475569;">Bonjour <strong>${escapeHtml(userName)}</strong>,</p>
        <p style="color:#475569;">Nous avons étudié votre demande de virement SEPA France de <strong>${escapeHtml(amount)}</strong>, mais nous ne sommes pas en mesure de la traiter.</p>
        <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Raison du refus :</strong><br>${escapeHtml(reason)}</p>
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

type NotifyUser = {
  name?: string | null;
  email?: string | null;
  contactEmail?: string | null;
};

export async function notifySepaFrApproved(params: {
  user: NotifyUser;
  amountCents: number;
  reference: string;
  iban?: string;
  bic?: string;
}): Promise<void> {
  const to = resolveUserContactEmail(params.user);
  if (!to) return;

  const userName = params.user.name ?? 'Utilisateur';
  const amountFormatted = formatCentsToCurrency(params.amountCents, 'EUR');
  const ibanMasked = params.iban ? maskIban(params.iban) : '****';

  await emailService.sendEmail({
    to,
    subject: `✅ Votre virement SEPA France de ${amountFormatted} a été effectué — MoonSkin`,
    html: buildSepaFrApprovalEmailHtml({
      userName,
      amount: amountFormatted,
      reference: params.reference,
      iban: ibanMasked,
      bic: params.bic ?? '',
    }),
    text: `Bonjour ${userName},\n\nVotre virement SEPA France de ${amountFormatted} a été effectué avec succès.\nRéférence : ${params.reference}\n\nL'équipe MoonSkin`,
  });
}

export async function notifySepaFrRejected(params: {
  user: NotifyUser;
  amountCents: number;
  reason: string;
}): Promise<void> {
  const to = resolveUserContactEmail(params.user);
  if (!to) return;

  const userName = params.user.name ?? 'Utilisateur';
  const amountFormatted = formatCentsToCurrency(params.amountCents, 'EUR');
  const reason = params.reason.trim();

  await emailService.sendEmail({
    to,
    subject: `❌ Votre demande de virement SEPA France a été refusée — MoonSkin`,
    html: buildSepaFrRejectionEmailHtml({ userName, amount: amountFormatted, reason }),
    text: `Bonjour ${userName},\n\nVotre demande de virement SEPA France de ${amountFormatted} a été refusée.\nRaison : ${reason}\n\nSi vous avez des questions, contactez notre support.\n\nL'équipe MoonSkin`,
  });
}
