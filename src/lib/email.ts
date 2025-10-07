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
      subject: '🔐 Mot de passe réinitialisé avec succès - CashTrade Admin',
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
            <div class="logo">🎮 CashTrade</div>
            <h1 class="title">Mot de passe réinitialisé avec succès</h1>
            <p class="subtitle">Panel d'administration CS2 Skin Trading</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${username}</strong>,</p>
            
            <p>Votre mot de passe a été réinitialisé avec succès.</p>
          </div>

          <div class="footer">
            <p>
              <strong>CashTrade - CS2 Skin Trading Platform</strong><br>
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
      CashTrade - Mot de passe réinitialisé avec succès
      
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
      subject: '🔐 Réinitialisation de votre mot de passe - CashTrade Admin',
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
            <div class="logo">🎮 CashTrade</div>
            <h1 class="title">Réinitialisation de mot de passe</h1>
            <p class="subtitle">Panel d'administration CS2 Skin Trading</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${username}</strong>,</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour accéder au panel d'administration CashTrade.</p>
            
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
              <strong>CashTrade - CS2 Skin Trading Platform</strong><br>
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
CashTrade - Réinitialisation de mot de passe

Bonjour ${username},

Vous avez demandé la réinitialisation de votre mot de passe pour accéder au panel d'administration CashTrade.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${resetUrl}

IMPORTANT :
- Ce lien est valide pendant 1 heure seulement
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
- Ne partagez jamais ce lien avec qui que ce soit

---
CashTrade - CS2 Skin Trading Platform
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
}

export const emailService = new EmailService();
