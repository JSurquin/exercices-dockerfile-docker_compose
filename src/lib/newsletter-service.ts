import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export interface EmailTemplate {
  subject: string;
  text: string;
  html?: string;
}

export class NewsletterService {
  private transporter;

  constructor() {
    this.transporter = createTransporter();
  }

  // Envoyer un email à un destinataire
  async sendEmail(to: string, template: EmailTemplate, unsubscribeToken?: string) {
    try {
      const unsubscribeUrl = unsubscribeToken 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`
        : null;

      let htmlContent = template.html || this.textToHtml(template.text);
      
      // Ajouter le lien de désabonnement si disponible
      if (unsubscribeUrl) {
        htmlContent += `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>Vous recevez cet email car vous êtes abonné à notre newsletter.</p>
            <p><a href="${unsubscribeUrl}" style="color: #666;">Se désabonner</a></p>
          </div>
        `;
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'CashTrade'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: htmlContent,
        headers: unsubscribeUrl ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        } : undefined,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Envoyer une campagne newsletter
  async sendCampaign(campaignId: string) {
    try {
      // Récupérer la campagne
      const campaign = await prisma.newsletterCampaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new Error('Campagne introuvable');
      }

      if (campaign.status !== 'SCHEDULED' && campaign.status !== 'DRAFT') {
        throw new Error('La campagne ne peut pas être envoyée');
      }

      // Marquer la campagne comme en cours d'envoi
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { status: 'SENDING' },
      });

      // Récupérer tous les abonnés actifs
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        select: {
          email: true,
          unsubscribeToken: true,
        },
      });

      const template: EmailTemplate = {
        subject: campaign.subject,
        text: campaign.content,
        html: campaign.htmlContent || undefined,
      };

      let successCount = 0;
      let errorCount = 0;

      // Envoyer les emails par batch pour éviter la surcharge
      const batchSize = 50;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        const promises = batch.map(async (subscriber) => {
          try {
            const result = await this.sendEmail(
              subscriber.email, 
              template, 
              subscriber.unsubscribeToken
            );

            // Enregistrer l'envoi
            await prisma.newsletterSend.create({
              data: {
                campaignId,
                email: subscriber.email,
                status: result.success ? 'SENT' : 'FAILED',
                sentAt: result.success ? new Date() : null,
                errorMessage: result.success ? null : result.error,
              },
            });

            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error sending to ${subscriber.email}:`, error);
            errorCount++;
            
            // Enregistrer l'erreur
            await prisma.newsletterSend.create({
              data: {
                campaignId,
                email: subscriber.email,
                status: 'FAILED',
                errorMessage: error.message,
              },
            });
          }
        });

        await Promise.all(promises);
        
        // Attendre un peu entre les batches pour éviter les limites de taux
        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Marquer la campagne comme envoyée
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      console.log(`Campagne ${campaignId} envoyée: ${successCount} succès, ${errorCount} erreurs`);

      return {
        success: true,
        totalSent: successCount,
        totalErrors: errorCount,
        totalSubscribers: subscribers.length,
      };

    } catch (error) {
      console.error('Error sending campaign:', error);
      
      // Marquer la campagne comme échouée
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { status: 'DRAFT' }, // Retour au brouillon pour permettre une nouvelle tentative
      });

      throw error;
    }
  }

  // Envoyer un email de bienvenue
  async sendWelcomeEmail(email: string, unsubscribeToken: string) {
    const template: EmailTemplate = {
      subject: '🎮 Bienvenue sur CashTrade - Votre inscription est confirmée !',
      text: `
Bienvenue sur CashTrade !

Merci de vous être abonné à notre newsletter. Vous recevrez désormais :
- Les dernières actualités CS2
- Nos offres exclusives
- Les annonces de nouveaux giveaways
- Les mises à jour importantes de la plateforme

Nous sommes ravis de vous compter parmi notre communauté !

L'équipe CashTrade
      `,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎮 Bienvenue sur CashTrade !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Votre inscription est confirmée</p>
          </div>
          
          <div style="padding: 40px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Merci de vous être abonné !</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Vous recevrez désormais en exclusivité :
            </p>
            
            <ul style="color: #475569; line-height: 1.8; margin-bottom: 30px;">
              <li>🎯 Les dernières actualités CS2</li>
              <li>💰 Nos offres exclusives</li>
              <li>🎁 Les annonces de nouveaux giveaways</li>
              <li>📢 Les mises à jour importantes de la plateforme</li>
            </ul>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;">
              <p style="margin: 0; color: #1e293b; font-weight: 600;">
                Nous sommes ravis de vous compter parmi notre communauté !
              </p>
            </div>
            
            <p style="color: #64748b; margin-top: 30px; text-align: center;">
              L'équipe CashTrade
            </p>
          </div>
        </div>
      `,
    };

    return this.sendEmail(email, template, unsubscribeToken);
  }

  // Convertir le texte en HTML basique
  private textToHtml(text: string): string {
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  // Vérifier la configuration email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true };
    } catch (error) {
      console.error('Email configuration error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const newsletterService = new NewsletterService();