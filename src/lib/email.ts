import nodemailer from 'nodemailer';
import { logger } from './logger';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { prisma } from '~/prisma/prisma';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function loadSmtpConfig(): Promise<{ config: EmailConfig; from: string; alertEmailTo: string; bccAdminEnabled: boolean }> {
  let dbSettings: Record<string, string> = {};

  try {
    const rows = await prisma.siteSettings.findMany({
      where: {
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_secure', 'smtp_alert_email_to', 'smtp_bcc_admin_enabled'],
        },
      },
    });
    dbSettings = Object.fromEntries(rows.map((r) => [r.key, r.valueFr ?? '']));
  } catch {
    // Fallback silencieux si la DB n'est pas disponible
  }

  const host = dbSettings['smtp_host'] || process.env.SMTP_HOST || '';
  const port = dbSettings['smtp_port']
    ? parseInt(dbSettings['smtp_port'])
    : parseInt(process.env.SMTP_PORT || '587');
  const user = dbSettings['smtp_user'] || process.env.SMTP_USER || '';
  const pass = dbSettings['smtp_password'] || process.env.SMTP_PASSWORD || '';
  const from = dbSettings['smtp_from'] || process.env.SMTP_FROM || '';
  const secure = dbSettings['smtp_secure'] !== undefined
    ? dbSettings['smtp_secure'] === 'true'
    : process.env.SMTP_SECURE === 'true';
  const alertEmailTo = dbSettings['smtp_alert_email_to'] || process.env.ALERT_EMAIL_TO || '';
  const bccAdminEnabled = dbSettings['smtp_bcc_admin_enabled'] === 'true';

  return {
    config: { host, port, secure, auth: { user, pass } },
    from,
    alertEmailTo,
    bccAdminEnabled,
  };
}

class EmailService {
  /**
   * La config est rechargée depuis la BDD à chaque envoi.
   * Pas de cache : garantit que les modifications admin sont prises en compte immédiatement,
   * même dans un contexte multi-worker (Next.js serverless).
   */
  private async getTransporter(): Promise<{ transporter: nodemailer.Transporter; from: string; alertEmailTo: string; bccAdminEnabled: boolean }> {
    const { config, from, alertEmailTo, bccAdminEnabled } = await loadSmtpConfig();

    const transporter = nodemailer.createTransport(config as SMTPTransport.Options);

    logger.info('Email transporter created', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
    });

    return { transporter, from, alertEmailTo, bccAdminEnabled };
  }

  /** Conservé pour compatibilité, ne fait plus rien (pas de cache à vider) */
  async reload() {
    // no-op
  }

  getAlertEmailTo(): string {
    return process.env.ALERT_EMAIL_TO ?? '';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const { transporter, from, alertEmailTo, bccAdminEnabled } = await this.getTransporter();

      logger.info('Sending email', {
        to: options.to,
        subject: options.subject,
      });

      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      if (bccAdminEnabled && alertEmailTo && alertEmailTo !== options.to) {
        mailOptions.bcc = alertEmailTo;
      }

      const info = await transporter.sendMail(mailOptions);

      logger.success('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
        bcc: bccAdminEnabled ? alertEmailTo : undefined,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendPasswordSuccessResetEmail(email: string, username?: string): Promise<boolean> {
    const html = this.generatePasswordSuccessResetHTML(username || email);
    const text = this.generatePasswordSuccessResetText(username || email);
    return this.sendEmail({
      to: email,
      subject: '🔐 Mot de passe réinitialisé avec succès - MoonSkin Admin',
      html,
      text,
    });
  }

  private generatePasswordSuccessResetHTML(username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .cs2-theme {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎮 MoonSkin</div>
            <h1 class="title">Mot de passe réinitialisé avec succès</h1>
            <p class="subtitle">Panel d'administration CS2 Skin Trading</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${escapeHtml(username)}</strong>,</p>
            
            <p>Votre mot de passe a été réinitialisé avec succès.</p>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Panel d'administration sécurisé
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
      `;
  }

  private generatePasswordSuccessResetText(username: string): string {
    return `
      MoonSkin - Mot de passe réinitialisé avec succès
      
      Bonjour ${escapeHtml(username)},

      Votre mot de passe a été réinitialisé avec succès.
      
      --------------------------------      
      Panel d'administration CS2 Skin Trading
      
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      --------------------------------

      `;
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username?: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}password/reset-password?token=${resetToken}`;
 
    const html = this.generatePasswordResetHTML(resetUrl, username || email);
    const text = this.generatePasswordResetText(resetUrl, username || email);

    return this.sendEmail({
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - MoonSkin Admin',
      html,
      text,
    });
  }

  private generatePasswordResetHTML(resetUrl: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .cs2-theme {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎮 MoonSkin</div>
            <h1 class="title">Réinitialisation de mot de passe</h1>
            <p class="subtitle">Panel d'administration CS2 Skin Trading</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${escapeHtml(username)}</strong>,</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour accéder au panel d'administration MoonSkin.</p>
            
            <div class="cs2-theme">
              <p style="margin: 0; text-align: center;">
                <strong>🔑 Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</strong>
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                🔐 Réinitialiser mon mot de passe
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0;">
                <li>Ce lien est valide pendant <strong>1 heure</strong> seulement</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec qui que ce soit</li>
              </ul>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Panel d'administration sécurisé
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePasswordResetText(resetUrl: string, username: string): string {
    return `
MoonSkin - Réinitialisation de mot de passe

Bonjour ${escapeHtml(username)},

Vous avez demandé la réinitialisation de votre mot de passe pour accéder au panel d'administration MoonSkin.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 1 heure seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec qui que ce soit

---
MoonSkin - CS2 Skin Trading Platform
Panel d'administration sécurisé

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;
  }

  async testConnection(): Promise<{ ok: true } | { ok: false; message: string }> {
    try {
      const { transporter } = await this.getTransporter();
      await transporter.verify();
      logger.success('Email service connection verified');
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Email service connection failed', error);
      return { ok: false, message };
    }
  }
  // ========== NOTIFICATIONS AFFILIATION ==========

  /**
   * Notifie l'admin qu'une nouvelle demande d'affiliation a été soumise
   */
  async sendNewAffiliateApplicationToAdmin(application: {
    id: string;
    user: {
      email: string;
      steamUsername: string | null;
    };
    motivation: string;
    createdAt: Date;
  }): Promise<boolean> {
    const { alertEmailTo } = await this.getTransporter();
    const adminEmail = alertEmailTo || process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) {
      logger.error('ADMIN_EMAIL not configured');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle demande d'affiliation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎯 Nouvelle Demande d'Affiliation</h1>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Une nouvelle demande d'affiliation vient d'être soumise et nécessite votre attention.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Informations du candidat</h3>
            <p><strong>Steam:</strong> ${application.user.steamUsername || 'N/A'}</p>
            <p><strong>Email:</strong> ${application.user.email}</p>
            <p><strong>Date:</strong> ${new Date(application.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #667eea;">Motivation</h3>
            <p style="white-space: pre-wrap;">${escapeHtml(application.motivation)}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/affiliate-applications" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Examiner la demande
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
          <p>MoonSkin Admin - Gestion des affiliations</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: '🎯 Nouvelle demande d\'affiliation - MoonSkin',
      html,
    });
  }

  /**
   * Notifie l'utilisateur que sa demande d'affiliation a été approuvée
   */
  async sendAffiliateApplicationApproved(user: {
    email: string;
    steamUsername: string | null;
  }, affiliateCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande approuvée</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Félicitations ${user.steamUsername || ''} !</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Votre demande d'affiliation a été approuvée</p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Excellente nouvelle ! Votre demande d'affiliation a été approuvée par notre équipe. 
            Vous faites désormais partie du programme d'affiliation MoonSkin ! 🚀
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #48bb78;">
            <h3 style="margin-top: 0; color: #48bb78; text-align: center;">Votre code d'affiliation</h3>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 24px; font-weight: bold; color: #2f855a;">
              ${affiliateCode}
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #667eea;">Prochaines étapes</h3>
            <ul style="padding-left: 20px;">
              <li>Connectez-vous à votre tableau de bord affilié</li>
              <li>Récupérez vos liens d'affiliation personnalisés</li>
              <li>Commencez à partager et gagnez 2% de commission</li>
              <li>Suivez vos performances en temps réel</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" 
               style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Accéder à mon dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
          <p>Bienvenue dans le programme MoonSkin Affiliates!</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🎉 Votre demande d\'affiliation a été approuvée - MoonSkin',
      html,
    });
  }

  /**
   * Notifie l'utilisateur que sa demande d'affiliation a été rejetée
   */
  async sendAffiliateApplicationRejected(user: {
    email: string;
    steamUsername: string | null;
  }, reason: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande rejetée</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Demande d'affiliation</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Réponse à votre candidature</p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Bonjour ${escapeHtml(user.steamUsername || '')},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Nous avons examiné votre demande d'affiliation avec attention. Malheureusement, 
            nous ne pouvons pas l'accepter pour le moment.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fc8181;">
            <h3 style="margin-top: 0; color: #fc8181;">Raison du rejet</h3>
            <p style="white-space: pre-wrap;">${escapeHtml(reason)}</p>
          </div>
          
          <div style="background: #edf2f7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #2d3748;">💡 Que faire maintenant ?</h3>
            <p>
              Vous pouvez soumettre une nouvelle demande après avoir pris en compte les remarques ci-dessus. 
              Nous serons ravis de réexaminer votre candidature !
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/affiliate" 
               style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Soumettre une nouvelle demande
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
          <p>Merci de votre intérêt pour MoonSkin Affiliates</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Réponse à votre demande d\'affiliation - MoonSkin',
      html,
    });
  }

  // ========== CRÉATION DE COMPTES PAR ADMIN ==========

  /**
   * Envoie un email de bienvenue avec lien de définition de mot de passe pour un utilisateur créé par admin
   */
  async sendWelcomeEmailWithPasswordReset(
    email: string,
    resetToken: string,
    username?: string,
    createdByAdmin: boolean = true
  ): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/password/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur MoonSkin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f97316;
            margin-bottom: 10px;
          }
          .title {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .cs2-theme {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎮 MoonSkin</div>
            <h1 class="title">Bienvenue sur MoonSkin !</h1>
            <p class="subtitle">Votre compte a été créé</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${username || email}</strong>,</p>
            
            ${createdByAdmin ? `
            <div class="info-box">
              <p style="margin: 0;">
                <strong>ℹ️ Information :</strong> Votre compte MoonSkin a été créé par un administrateur. 
                Vous êtes maintenant membre de notre plateforme de trading de skins CS2 !
              </p>
            </div>
            ` : ''}
            
            <p>Pour commencer à utiliser votre compte, vous devez définir votre mot de passe.</p>
            
            <div class="cs2-theme">
              <p style="margin: 0; text-align: center;">
                <strong>🔑 Cliquez sur le bouton ci-dessous pour créer votre mot de passe :</strong>
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">
                🔐 Définir mon mot de passe
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0;">
                <li>Ce lien est valide pendant <strong>1 heure</strong> seulement</li>
                <li>Après avoir défini votre mot de passe, vous pourrez vous connecter</li>
                <li>Ne partagez jamais ce lien avec qui que ce soit</li>
              </ul>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Plateforme sécurisée de trading de skins Counter-Strike 2
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
MoonSkin - Bienvenue !

Bonjour ${username || email},

${createdByAdmin ? 'Votre compte MoonSkin a été créé par un administrateur.' : 'Bienvenue sur MoonSkin !'}

Pour commencer à utiliser votre compte, vous devez définir votre mot de passe.

Cliquez sur ce lien pour créer votre mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 1 heure seulement
- Après avoir défini votre mot de passe, vous pourrez vous connecter
- Ne partagez jamais ce lien avec qui que ce soit

---
MoonSkin - CS2 Skin Trading Platform

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    return this.sendEmail({
      to: email,
      subject: '🎮 Bienvenue sur MoonSkin - Définissez votre mot de passe',
      html,
      text,
    });
  }

  /**
   * Envoie un email de bienvenue pour un affilié créé par admin
   */
  async sendAffiliateWelcomeEmail(
    email: string,
    resetToken: string,
    affiliateCode: string,
    username?: string,
    commissionRate: number = 0.02
  ): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/password/reset-password?token=${resetToken}`;
    const commissionPercent = (commissionRate * 100).toFixed(1);
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue dans le programme d'affiliation MoonSkin</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Bienvenue ${username || ''} !</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Vous êtes maintenant affilié MoonSkin</p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Félicitations ! Votre compte affilié a été créé par notre équipe. 
            Vous faites maintenant partie du programme d'affiliation MoonSkin ! 🚀
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #48bb78;">
            <h3 style="margin-top: 0; color: #48bb78; text-align: center;">Votre code d'affiliation</h3>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 24px; font-weight: bold; color: #2f855a;">
              ${affiliateCode}
            </div>
            <p style="text-align: center; margin: 10px 0 0 0; color: #666; font-size: 14px;">
              Taux de commission : <strong>${commissionPercent}%</strong>
            </p>
          </div>

          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #0369a1;">🔐 Première étape : Définir votre mot de passe</h3>
            <p style="margin: 0;">
              Avant de pouvoir accéder à votre dashboard affilié, vous devez définir votre mot de passe.
            </p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              🔐 Définir mon mot de passe
            </a>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #667eea;">Prochaines étapes</h3>
            <ul style="padding-left: 20px;">
              <li>Définissez votre mot de passe (lien ci-dessus)</li>
              <li>Connectez-vous à votre tableau de bord affilié</li>
              <li>Récupérez vos liens d'affiliation personnalisés</li>
              <li>Commencez à partager et gagnez ${commissionPercent}% de commission</li>
              <li>Suivez vos performances en temps réel</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <strong>⚠️ Important :</strong>
            <ul style="margin: 10px 0;">
              <li>Le lien de définition de mot de passe est valide pendant <strong>1 heure</strong></li>
              <li>Après avoir défini votre mot de passe, vous pourrez accéder à votre dashboard</li>
              <li>Ne partagez jamais ce lien avec qui que ce soit</li>
            </ul>
          </div>

          <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            ${resetUrl}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #718096; font-size: 12px;">
          <p>Bienvenue dans le programme MoonSkin Affiliates!</p>
          <p>Dashboard affilié : ${process.env.NEXT_PUBLIC_APP_URL}/affiliate</p>
        </div>
      </body>
      </html>
    `;

    const text = `
MoonSkin - Bienvenue dans le programme d'affiliation !

Bonjour ${username || email},

Félicitations ! Votre compte affilié a été créé par notre équipe.

Votre code d'affiliation : ${affiliateCode}
Taux de commission : ${commissionPercent}%

PREMIÈRE ÉTAPE : Définir votre mot de passe
${resetUrl}

Prochaines étapes :
- Définissez votre mot de passe
- Connectez-vous à votre tableau de bord affilié
- Récupérez vos liens d'affiliation personnalisés
- Commencez à partager et gagnez ${commissionPercent}% de commission
- Suivez vos performances en temps réel

IMPORTANT :
- Le lien est valide pendant 1 heure
- Ne partagez jamais ce lien avec qui que ce soit

Dashboard affilié : ${process.env.NEXT_PUBLIC_APP_URL}/affiliate

---
Bienvenue dans MoonSkin Affiliates!

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Bienvenue dans le programme d\'affiliation MoonSkin',
      html,
      text,
    });
  }

  // ========== NOTIFICATIONS KYC ==========

  /**
   * Envoie un email de confirmation de soumission KYC
   */
  async sendKycSubmittedConfirmation(
    email: string,
    username: string,
    submissionDate: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vérification KYC en cours</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin: -40px -40px 30px -40px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            margin: 10px 0;
          }
          .subtitle {
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
          }
          .info-box {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .status-badge {
            background: #fef3c7;
            color: #92400e;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .cs2-theme {
            background: linear-gradient(135deg, #1e293b, #334155);
            color: white;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
            text-align: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 10px 0;
          }
          .table-label {
            color: #6b7280;
          }
          .table-value {
            text-align: right;
            font-weight: 600;
          }
          .divider {
            border-bottom: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎮 MoonSkin</div>
            <h1 class="title">✅ Vérification en cours</h1>
            <p class="subtitle">Votre dossier KYC a été soumis avec succès</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${escapeHtml(username)}</strong>,</p>
            
            <p>Nous avons bien reçu votre demande de vérification d'identité (KYC).</p>
            
            <div class="card">
              <h3 style="color: #3b82f6; margin-top: 0; margin-bottom: 20px;">📋 Détails de votre soumission</h3>
              <table>
                <tr class="divider">
                  <td class="table-label">Date de soumission :</td>
                  <td class="table-value">${submissionDate}</td>
                </tr>
                <tr>
                  <td class="table-label">Statut :</td>
                  <td class="table-value">
                    <span class="status-badge">⏳ En cours de vérification</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #f97316; margin-top: 0; margin-bottom: 15px;">⏳ Prochaines étapes :</h3>
              <p style="margin: 0 0 15px 0;">
                Notre équipe va maintenant examiner vos documents. Cette vérification prend généralement entre <strong>24 et 48 heures</strong>.
              </p>
              <p style="margin: 0;">
                Vous recevrez un email dès que votre vérification sera <strong style="color: #10b981;">validée ✓</strong>
              </p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1e40af;">🔔 Suivre l'état de ma vérification</h3>
              <p style="margin: 0 0 15px 0; color: #1e40af;">
                Vous pouvez consulter l'état de votre vérification à tout moment sur votre dashboard.
              </p>
              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" class="button">
                  Voir mon Dashboard
                </a>
              </div>
            </div>

            <div class="cs2-theme">
              <p style="margin: 0; font-size: 16px; font-weight: 600;">
                💼 Une fois vérifié, vous pourrez effectuer des retraits sans limite !
              </p>
            </div>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Plateforme sécurisée de trading de skins Counter-Strike 2
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Merci de votre confiance !<br/>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
MoonSkin - Vérification KYC en cours

Bonjour ${escapeHtml(username)},

Nous avons bien reçu votre demande de vérification d'identité (KYC).

📋 Détails de votre soumission :
- Date de soumission : ${submissionDate}
- Statut : En cours de vérification

⏳ Prochaines étapes :
Notre équipe va maintenant examiner vos documents. Cette vérification prend généralement entre 24 et 48 heures.

Vous recevrez un email dès que votre vérification sera validée.

🔔 Suivre l'état de ma vérification :
Vous pouvez consulter l'état de votre vérification à tout moment sur votre dashboard : ${baseUrl}/dashboard

💼 Une fois vérifié, vous pourrez effectuer des retraits sans limite !

---
MoonSkin - CS2 Skin Trading Platform

Merci de votre confiance !
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    return this.sendEmail({
      to: email,
      subject: '✅ Votre vérification d\'identité est en cours - MoonSkin',
      html,
      text,
    });
  }

  /**
   * Envoie un email de KYC approuvé
   */
  async sendKycApprovedEmail(
    email: string,
    username: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KYC Approuvé</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin: -40px -40px 30px -40px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Félicitations !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Votre vérification d'identité est validée</p>
          </div>

          <div style="margin: 30px 0;">
            <p>Bonjour <strong>${escapeHtml(username)}</strong>,</p>
            
            <p>Excellente nouvelle ! Votre vérification d'identité (KYC) a été <strong style="color: #10b981;">approuvée avec succès</strong>.</p>
            
            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
              <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">Votre compte est maintenant entièrement vérifié</h3>
              <p style="margin: 0; color: #065f46;">
                Vous avez accès à toutes les fonctionnalités premium de MoonSkin !
              </p>
            </div>
            
            <div class="card">
              <h3 style="color: #10b981; margin-top: 0; margin-bottom: 15px;">🎯 Avantages débloqués :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 10px;"><strong>Retraits illimités</strong> - Plus de limite sur vos paiements</li>
                <li style="margin-bottom: 10px;"><strong>Tous les modes de paiement</strong> - SEPA, Crypto, et plus</li>
                <li style="margin-bottom: 10px;"><strong>Support prioritaire</strong> - Assistance dédiée</li>
                <li><strong>Sécurité renforcée</strong> - Protection maximale de votre compte</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/dashboard" class="button">
                Accéder à mon Dashboard
              </a>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 25px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 18px; font-weight: 600;">
                💰 Vous pouvez effectuer vos premiers retraits dès maintenant !
              </p>
            </div>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Merci de votre confiance !
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
MoonSkin - KYC Approuvé

Bonjour ${escapeHtml(username)},

Félicitations ! Votre vérification d'identité (KYC) a été approuvée avec succès.

✅ Votre compte est maintenant entièrement vérifié

Avantages débloqués :
- Retraits illimités - Plus de limite sur vos paiements
- Tous les modes de paiement - SEPA, Crypto, et plus
- Support prioritaire - Assistance dédiée
- Sécurité renforcée - Protection maximale

💰 Vous pouvez effectuer vos premiers retraits dès maintenant !

Dashboard : ${baseUrl}/dashboard

---
Merci de votre confiance !
MoonSkin - CS2 Skin Trading Platform

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Votre vérification d\'identité est validée - MoonSkin',
      html,
      text,
    });
  }

  /**
   * Envoie un email de KYC rejeté
   */
  async sendKycRejectedEmail(
    email: string,
    username: string,
    reason: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KYC Rejeté</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin: -40px -40px 30px -40px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
          }
          .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Vérification requise</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Votre dossier KYC nécessite une attention</p>
          </div>

          <div style="margin: 30px 0;">
            <p>Bonjour <strong>${escapeHtml(username)}</strong>,</p>
            
            <p>Nous avons examiné votre demande de vérification d'identité mais nous ne pouvons malheureusement pas la valider pour le moment.</p>
            
            <div style="background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">📋 Raison du rejet</h3>
              <p style="margin: 0; color: #991b1b; font-weight: 500;">${escapeHtml(reason)}</p>
            </div>

            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">💡 Que faire maintenant ?</h3>
              <p style="margin: 0; color: #1e40af;">
                Vous pouvez soumettre un nouveau dossier en corrigeant les points mentionnés ci-dessus. Notre équipe sera ravie de réexaminer votre demande !
              </p>
            </div>

            <div class="card">
              <h3 style="color: #10b981; margin-top: 0; margin-bottom: 15px;">✓ Conseils pour votre nouvelle soumission :</h3>
              <ul style="margin: 0; padding-left: 20px; color: #475569;">
                <li style="margin-bottom: 8px;">Assurez-vous que vos documents sont <strong>clairs et lisibles</strong></li>
                <li style="margin-bottom: 8px;">Vérifiez que <strong>toutes les informations sont visibles</strong></li>
                <li style="margin-bottom: 8px;">Utilisez des photos de <strong>bonne qualité</strong> (pas de reflets, pas floues)</li>
                <li>Vérifiez que vos documents sont <strong>valides et à jour</strong></li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/kyc" class="button">
                Soumettre un nouveau dossier
              </a>
            </div>

            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #4b5563;">
                <strong>Besoin d'aide ?</strong><br/>
                Notre équipe support est là pour vous accompagner
              </p>
            </div>
          </div>

          <div class="footer">
            <p>
              <strong>MoonSkin - CS2 Skin Trading Platform</strong><br>
              Merci de votre compréhension
            </p>
            <p style="font-size: 12px; color: #9ca3af;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
MoonSkin - Vérification KYC

Bonjour ${escapeHtml(username)},

Nous avons examiné votre demande de vérification d'identité mais nous ne pouvons malheureusement pas la valider pour le moment.

📋 Raison du rejet :
${reason}

💡 Que faire maintenant ?
Vous pouvez soumettre un nouveau dossier en corrigeant les points mentionnés ci-dessus. Notre équipe sera ravie de réexaminer votre demande !

✓ Conseils pour votre nouvelle soumission :
- Assurez-vous que vos documents sont clairs et lisibles
- Vérifiez que toutes les informations sont visibles
- Utilisez des photos de bonne qualité (pas de reflets, pas floues)
- Vérifiez que vos documents sont valides et à jour

Soumettre un nouveau dossier : ${baseUrl}/kyc

Besoin d'aide ?
Notre équipe support est là pour vous accompagner

---
Merci de votre compréhension
MoonSkin - CS2 Skin Trading Platform

Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `;

    return this.sendEmail({
      to: email,
      subject: '⚠️ Votre vérification d\'identité nécessite une attention - MoonSkin',
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
