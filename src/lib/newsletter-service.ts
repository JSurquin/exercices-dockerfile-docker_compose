import nodemailer from 'nodemailer';
import { prisma } from '~/prisma/prisma';
import {
  EmailTemplateConfig,
  EmailTemplateVariables,
  renderTemplate,
  renderSubject,
  getTemplateById,
  platformWelcomeTemplate,
  tradeCreatedTemplate,
  newsletterWelcomeTemplate,
} from './email-templates';


// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

export interface EmailTemplate {
  subject: string;
  text: string;
  html?: string;
}

// Re-export template utilities for convenience
export { 
  getTemplateById, 
  renderTemplate, 
  renderSubject,
  type EmailTemplateConfig,
  type EmailTemplateVariables 
} from './email-templates';

export class NewsletterService {
  private transporter;

  constructor() {
    console.log('🔧 Initialisation du service newsletter...');
    console.log('Configuration SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: process.env.SMTP_SECURE,
      from: process.env.SMTP_FROM
    });
    this.transporter = createTransporter();
  }

  // Envoyer un email à un destinataire
  async sendEmail(to: string, template: EmailTemplate, unsubscribeToken?: string) {
    try {
      const unsubscribeUrl = unsubscribeToken 
        ? `${process.env.NEXT_PUBLIC_APP_URL}api/newsletter/unsubscribe?token=${unsubscribeToken}`
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
        from: `"${process.env.SMTP_FROM_NAME || 'MoonSkin'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
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
                errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
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

  // Envoyer un email de bienvenue pour l'inscription à la plateforme
  async sendPlatformWelcomeEmail(email: string, username: string, steamUsername?: string) {
    const variables: EmailTemplateVariables = {
      username,
      email,
      steamUsername: steamUsername || username,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.com',
    };

    const template: EmailTemplate = {
      subject: renderSubject(platformWelcomeTemplate, variables),
      text: renderTemplate(platformWelcomeTemplate, variables, 'text'),
      html: renderTemplate(platformWelcomeTemplate, variables, 'html'),
    };

    return this.sendEmail(email, template);
  }

  // Envoyer un email de confirmation de création de trade
  async sendTradeCreatedEmail(email: string, username: string, tradeData: {
    tradeId: string;
    itemsCount: number;
    grossValue: number;
    netValue: number;
    availableAt: string;
  }) {
    const grossEuros = (tradeData.grossValue / 100).toFixed(2);
    const netEuros = (tradeData.netValue / 100).toFixed(2);
    const availableDate = new Date(tradeData.availableAt).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const variables: EmailTemplateVariables = {
      username,
      tradeId: tradeData.tradeId,
      itemsCount: tradeData.itemsCount,
      grossValue: grossEuros,
      netValue: netEuros,
      availableDate,
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.com',
    };

    const template: EmailTemplate = {
      subject: renderSubject(tradeCreatedTemplate, variables),
      text: renderTemplate(tradeCreatedTemplate, variables, 'text'),
      html: renderTemplate(tradeCreatedTemplate, variables, 'html'),
    };

    return this.sendEmail(email, template);
  }

  // Envoyer un email de bienvenue newsletter
  async sendWelcomeEmail(email: string, unsubscribeToken: string) {
    const variables: EmailTemplateVariables = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.com',
    };

    const template: EmailTemplate = {
      subject: renderSubject(newsletterWelcomeTemplate, variables),
      text: renderTemplate(newsletterWelcomeTemplate, variables, 'text'),
      html: renderTemplate(newsletterWelcomeTemplate, variables, 'html'),
    };

    return this.sendEmail(email, template, unsubscribeToken);
  }

  // Envoyer un email avec un template personnalisé
  async sendTemplatedEmail(
    email: string, 
    templateId: string, 
    variables: EmailTemplateVariables,
    unsubscribeToken?: string
  ) {
    const templateConfig = getTemplateById(templateId);
    
    if (!templateConfig) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const template: EmailTemplate = {
      subject: renderSubject(templateConfig, variables),
      text: renderTemplate(templateConfig, variables, 'text'),
      html: renderTemplate(templateConfig, variables, 'html'),
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
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
}

export const newsletterService = new NewsletterService();