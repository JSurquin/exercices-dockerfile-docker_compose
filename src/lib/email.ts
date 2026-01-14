import nodemailer from 'nodemailer';
import { logger } from './logger';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

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

class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    };

    this.from = process.env.SMTP_FROM!;
    this.transporter = nodemailer.createTransport(config as SMTPTransport.Options);

    logger.info('Email service initialized', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      logger.info('Sending email', {
        to: options.to,
        subject: options.subject,
      });

      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.success('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
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
            <p>Bonjour <strong>${username}</strong>,</p>
            
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
      
      Bonjour ${username},

      Votre mot de passe a été réinitialisé avec succès.
      
      --------------------------------      
      Panel d'administration CS2 Skin Trading
      
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      --------------------------------

      `;
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username?: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}password/reset-password?token=${resetToken}`;
 
    console.log("email reçu", resetUrl)

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
            <p>Bonjour <strong>${username}</strong>,</p>
            
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

Bonjour ${username},

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

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.success('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error);
      return false;
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
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
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
            <p style="white-space: pre-wrap;">${application.motivation}</p>
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
            Bonjour ${user.steamUsername || ''},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Nous avons examiné votre demande d'affiliation avec attention. Malheureusement, 
            nous ne pouvons pas l'accepter pour le moment.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fc8181;">
            <h3 style="margin-top: 0; color: #fc8181;">Raison du rejet</h3>
            <p style="white-space: pre-wrap;">${reason}</p>
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
}

export const emailService = new EmailService();
