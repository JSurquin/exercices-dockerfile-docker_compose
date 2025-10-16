import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        from: `"${process.env.SMTP_FROM_NAME || 'CashTrade'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
    const template: EmailTemplate = {
      subject: '🎮 Bienvenue sur CashTrade - Votre compte est créé !',
      text: `
Bienvenue sur CashTrade, ${username} !

Félicitations ! Votre compte a été créé avec succès sur notre plateforme de trading CS2.

🎯 Prochaines étapes :
1. Connectez votre compte Steam pour accéder à votre inventaire
2. Explorez nos fonctionnalités de trading
3. Découvrez nos giveaways exclusifs
4. Participez à notre programme d'affiliation

🔒 Sécurité :
- Votre compte est protégé par notre système de sécurité avancé
- Nous ne demandons jamais vos mots de passe Steam
- Toutes les transactions sont sécurisées

💰 Avantages :
- Estimations en temps réel de vos skins
- Paiements rapides et sécurisés
- Support client 24/7
- Commissions compétitives

Merci de nous faire confiance pour vos trades CS2 !

L'équipe CashTrade
      `,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎮 Bienvenue sur CashTrade !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Votre compte ${steamUsername ? `(${steamUsername})` : ''} est créé</p>
          </div>
          
          <div style="padding: 40px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Félicitations ${username} ! 🎉</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Votre compte a été créé avec succès sur notre plateforme de trading CS2.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #f97316; margin-bottom: 15px;">🎯 Prochaines étapes :</h3>
              <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Connectez votre compte Steam pour accéder à votre inventaire</li>
                <li>Explorez nos fonctionnalités de trading</li>
                <li>Découvrez nos giveaways exclusifs</li>
                <li>Participez à notre programme d'affiliation</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #10b981; margin-bottom: 15px;">🔒 Sécurité :</h3>
              <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Votre compte est protégé par notre système de sécurité avancé</li>
                <li>Nous ne demandons jamais vos mots de passe Steam</li>
                <li>Toutes les transactions sont sécurisées</li>
              </ul>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="color: #3b82f6; margin-bottom: 15px;">💰 Avantages :</h3>
              <ul style="color: #475569; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Estimations en temps réel de vos skins</li>
                <li>Paiements rapides et sécurisés</li>
                <li>Support client 24/7</li>
                <li>Commissions compétitives</li>
              </ul>
            </div>
            
            <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-weight: 600;">
                Merci de nous faire confiance pour vos trades CS2 ! 🚀
              </p>
            </div>
            
            <p style="color: #64748b; margin-top: 30px; text-align: center;">
              L'équipe CashTrade
            </p>
          </div>
        </div>
      `
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

    const template: EmailTemplate = {
      subject: `🎯 Trade créé avec succès - ${tradeData.tradeId}`,
      text: `
Bonjour ${username},

Votre trade a été créé avec succès !

📋 Détails du trade :
- ID du trade : ${tradeData.tradeId}
- Nombre d'items : ${tradeData.itemsCount}
- Valeur brute : ${grossEuros}€
- Valeur nette : ${netEuros}€
- Disponible le : ${availableDate}

⏳ Prochaines étapes :
1. Notre bot va accepter votre trade automatiquement
2. Période de trade hold Steam (7 jours)
3. Paiement automatique dès que les items sont disponibles

🔍 Suivi :
Vous pouvez suivre l'état de votre trade en temps réel sur votre dashboard.

Merci de votre confiance !

L'équipe CashTrade
      `,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎯 Trade créé avec succès !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${tradeData.tradeId}</p>
          </div>
          
          <div style="padding: 40px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Bonjour ${username} ! 👋</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
              Votre trade a été créé avec succès et est maintenant en cours de traitement.
            </p>
            
            <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h3 style="color: #10b981; margin-bottom: 20px; margin-top: 0;">📋 Détails du trade</h3>
              <div style="display: grid; gap: 10px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">ID du trade :</span>
                  <span style="color: #1f2937; font-weight: 600; font-family: monospace;">${tradeData.tradeId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Nombre d'items :</span>
                  <span style="color: #1f2937; font-weight: 600;">${tradeData.itemsCount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Valeur brute :</span>
                  <span style="color: #1f2937; font-weight: 600;">${grossEuros}€</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Valeur nette :</span>
                  <span style="color: #10b981; font-weight: 700; font-size: 18px;">${netEuros}€</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Disponible le :</span>
                  <span style="color: #1f2937; font-weight: 600;">${availableDate}</span>
                </div>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #f97316; margin-bottom: 15px; margin-top: 0;">⏳ Prochaines étapes :</h3>
              <div style="color: #475569; line-height: 1.8;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px; font-weight: bold;">1</span>
                  Notre bot va accepter votre trade automatiquement
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="background: #f97316; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px; font-weight: bold;">2</span>
                  Période de trade hold Steam (7 jours)
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px; font-weight: bold;">3</span>
                  Paiement automatique dès que les items sont disponibles
                </div>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 30px;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                🔍 Vous pouvez suivre l'état de votre trade en temps réel sur votre dashboard.
              </p>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #64748b; margin-bottom: 10px;">Merci de votre confiance !</p>
              <p style="color: #1f2937; font-weight: 600;">L'équipe CashTrade</p>
            </div>
          </div>
        </div>
      `
    };

    return this.sendEmail(email, template);
  }

  // Envoyer un email de bienvenue newsletter
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
      return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
  }
}

export const newsletterService = new NewsletterService();