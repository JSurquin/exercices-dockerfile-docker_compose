/**
 * Email Templates - Centralized email template system for MoonSkin
 * 
 * This file contains all email templates used across the platform.
 * Templates are organized by category and support variable interpolation.
 */

export interface EmailTemplateConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: 'transactional' | 'marketing' | 'notification' | 'welcome' | 'promotion' | 'newsletter' | 'announcement' | 'giveaway';
  subject: string;
  subjectEn: string;
  variables: string[];
  textContent: string;
  htmlContent: string;
}

export interface EmailTemplateVariables {
  [key: string]: string | number | undefined;
}

// Base styles for email templates
const baseStyles = {
  container: 'max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;',
  headerGradient: 'background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 40px; text-align: center; color: white;',
  headerTitle: 'margin: 0; font-size: 28px;',
  headerSubtitle: 'margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;',
  body: 'padding: 40px; background: #f8fafc;',
  card: 'background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;',
  cardHighlight: 'background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f97316;',
  button: 'background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;',
  buttonOutline: 'background: transparent; color: #f97316; border: 2px solid #f97316; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;',
  footer: 'text-align: center; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;',
  text: 'color: #475569; line-height: 1.6;',
  textMuted: 'color: #64748b; font-size: 14px;',
  heading: 'color: #1e293b; margin-bottom: 20px;',
};

// Helper function to create email wrapper
const createEmailWrapper = (content: string, previewText?: string): string => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>MoonSkin</title>
  ${previewText ? `<!--[if !mso]><!--><meta name="x-apple-disable-message-reformatting"><!--<![endif]--><span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#fff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ============================================
// TRANSACTIONAL TEMPLATES
// ============================================

export const platformWelcomeTemplate: EmailTemplateConfig = {
  id: 'platform-welcome',
  name: 'Bienvenue sur la plateforme',
  nameEn: 'Platform Welcome',
  description: 'Email envoyé lors de la création d\'un nouveau compte utilisateur',
  descriptionEn: 'Email sent when a new user account is created',
  category: 'welcome',
  subject: '🎮 Bienvenue sur MoonSkin - Votre compte est créé !',
  subjectEn: '🎮 Welcome to MoonSkin - Your account is created!',
  variables: ['{{username}}', '{{email}}', '{{steamUsername}}', '{{baseUrl}}'],
  textContent: `
Bienvenue sur MoonSkin, {{username}} !

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

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}">
      <div style="${baseStyles.headerGradient}">
        <h1 style="${baseStyles.headerTitle}">🎮 Bienvenue sur MoonSkin !</h1>
        <p style="${baseStyles.headerSubtitle}">Votre compte {{steamUsername}} est créé</p>
      </div>
      
      <div style="${baseStyles.body}">
        <h2 style="${baseStyles.heading}">Félicitations {{username}} ! 🎉</h2>
        
        <p style="${baseStyles.text}">
          Votre compte a été créé avec succès sur notre plateforme de trading CS2.
        </p>
        
        <div style="${baseStyles.cardHighlight}">
          <h3 style="color: #f97316; margin-bottom: 15px; margin-top: 0;">🎯 Prochaines étapes :</h3>
          <ul style="${baseStyles.text}; margin: 0; padding-left: 20px;">
            <li>Connectez votre compte Steam pour accéder à votre inventaire</li>
            <li>Explorez nos fonctionnalités de trading</li>
            <li>Découvrez nos giveaways exclusifs</li>
            <li>Participez à notre programme d'affiliation</li>
          </ul>
        </div>
        
        <div style="${baseStyles.card}">
          <h3 style="color: #10b981; margin-bottom: 15px; margin-top: 0;">🔒 Sécurité :</h3>
          <ul style="${baseStyles.text}; margin: 0; padding-left: 20px;">
            <li>Votre compte est protégé par notre système de sécurité avancé</li>
            <li>Nous ne demandons jamais vos mots de passe Steam</li>
            <li>Toutes les transactions sont sécurisées</li>
          </ul>
        </div>
        
        <div style="${baseStyles.card}">
          <h3 style="color: #3b82f6; margin-bottom: 15px; margin-top: 0;">💰 Avantages :</h3>
          <ul style="${baseStyles.text}; margin: 0; padding-left: 20px;">
            <li>Estimations en temps réel de vos skins</li>
            <li>Paiements rapides et sécurisés</li>
            <li>Support client 24/7</li>
            <li>Commissions compétitives</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{baseUrl}}/dashboard" style="${baseStyles.button}">
            Accéder à mon Dashboard
          </a>
        </div>
        
        <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-weight: 600;">
            Merci de nous faire confiance pour vos trades CS2 ! 🚀
          </p>
        </div>
        
        <p style="${baseStyles.footer}">
          L'équipe MoonSkin
        </p>
      </div>
    </div>
  `, 'Bienvenue sur MoonSkin ! Votre compte a été créé avec succès.')
};

export const tradeCreatedTemplate: EmailTemplateConfig = {
  id: 'trade-created',
  name: 'Trade créé',
  nameEn: 'Trade Created',
  description: 'Email envoyé lorsqu\'un trade est créé avec succès',
  descriptionEn: 'Email sent when a trade is successfully created',
  category: 'transactional',
  subject: '🎯 Trade créé avec succès - {{tradeId}}',
  subjectEn: '🎯 Trade created successfully - {{tradeId}}',
  variables: ['{{username}}', '{{tradeId}}', '{{itemsCount}}', '{{grossValue}}', '{{netValue}}', '{{availableDate}}', '{{baseUrl}}'],
  textContent: `
Bonjour {{username}},

Votre trade a été créé avec succès !

📋 Détails du trade :
- ID du trade : {{tradeId}}
- Nombre d'items : {{itemsCount}}
- Valeur brute : {{grossValue}}€
- Valeur nette : {{netValue}}€
- Disponible le : {{availableDate}}

⏳ Prochaines étapes :
1. Notre bot va accepter votre trade automatiquement
2. Période de trade hold Steam (7 jours)
3. Paiement automatique dès que les items sont disponibles

🔍 Suivi :
Vous pouvez suivre l'état de votre trade en temps réel sur votre dashboard.

Merci de votre confiance !

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; color: white;">
        <h1 style="${baseStyles.headerTitle}">🎯 Trade créé avec succès !</h1>
        <p style="${baseStyles.headerSubtitle}">{{tradeId}}</p>
      </div>
      
      <div style="${baseStyles.body}">
        <h2 style="${baseStyles.heading}">Bonjour {{username}} ! 👋</h2>
        
        <p style="${baseStyles.text}">
          Votre trade a été créé avec succès et est maintenant en cours de traitement.
        </p>
        
        <div style="${baseStyles.cardHighlight}; border-left-color: #10b981;">
          <h3 style="color: #10b981; margin-bottom: 20px; margin-top: 0;">📋 Détails du trade</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">ID du trade :</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600; font-family: monospace;">{{tradeId}}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Nombre d'items :</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">{{itemsCount}}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Valeur brute :</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">{{grossValue}}€</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; color: #6b7280;">Valeur nette :</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 700; font-size: 18px; color: #10b981;">{{netValue}}€</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280;">Disponible le :</td>
              <td style="padding: 10px 0; text-align: right; font-weight: 600;">{{availableDate}}</td>
            </tr>
          </table>
        </div>
        
        <div style="${baseStyles.card}">
          <h3 style="color: #f97316; margin-bottom: 15px; margin-top: 0;">⏳ Prochaines étapes :</h3>
          <div style="${baseStyles.text}">
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
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{baseUrl}}/dashboard" style="${baseStyles.button}">
            Suivre mon trade
          </a>
        </div>
        
        <p style="${baseStyles.footer}">
          Merci de votre confiance !<br/>
          <strong>L'équipe MoonSkin</strong>
        </p>
      </div>
    </div>
  `, 'Votre trade a été créé avec succès !')
};

export const newsletterWelcomeTemplate: EmailTemplateConfig = {
  id: 'newsletter-welcome',
  name: 'Bienvenue Newsletter',
  nameEn: 'Newsletter Welcome',
  description: 'Email envoyé lors de l\'inscription à la newsletter',
  descriptionEn: 'Email sent when subscribing to the newsletter',
  category: 'welcome',
  subject: '🎮 Bienvenue sur MoonSkin - Votre inscription est confirmée !',
  subjectEn: '🎮 Welcome to MoonSkin - Your subscription is confirmed!',
  variables: ['{{baseUrl}}'],
  textContent: `
Bienvenue sur MoonSkin !

Merci de vous être abonné à notre newsletter. Vous recevrez désormais :
- Les dernières actualités CS2
- Nos offres exclusives
- Les annonces de nouveaux giveaways
- Les mises à jour importantes de la plateforme

Nous sommes ravis de vous compter parmi notre communauté !

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}">
      <div style="${baseStyles.headerGradient}">
        <h1 style="${baseStyles.headerTitle}">🎮 Bienvenue sur MoonSkin !</h1>
        <p style="${baseStyles.headerSubtitle}">Votre inscription est confirmée</p>
      </div>
      
      <div style="${baseStyles.body}">
        <h2 style="${baseStyles.heading}">Merci de vous être abonné !</h2>
        
        <p style="${baseStyles.text}">
          Vous recevrez désormais en exclusivité :
        </p>
        
        <ul style="${baseStyles.text}; margin-bottom: 30px;">
          <li>🎯 Les dernières actualités CS2</li>
          <li>💰 Nos offres exclusives</li>
          <li>🎁 Les annonces de nouveaux giveaways</li>
          <li>📢 Les mises à jour importantes de la plateforme</li>
        </ul>
        
        <div style="${baseStyles.cardHighlight}">
          <p style="margin: 0; color: #1e293b; font-weight: 600;">
            Nous sommes ravis de vous compter parmi notre communauté !
          </p>
        </div>
        
        <p style="${baseStyles.footer}">
          L'équipe MoonSkin
        </p>
      </div>
    </div>
  `, 'Merci de vous être abonné à notre newsletter !')
};

// ============================================
// MARKETING TEMPLATES (for campaigns)
// ============================================

export const promotionFlashTemplate: EmailTemplateConfig = {
  id: 'promotion-flash',
  name: 'Promotion Flash',
  nameEn: 'Flash Sale',
  description: 'Template pour les promotions limitées avec design accrocheur',
  descriptionEn: 'Template for limited promotions with eye-catching design',
  category: 'promotion',
  subject: '⚡ {{promoTitle}} - {{discount}}% de réduction !',
  subjectEn: '⚡ {{promoTitle}} - {{discount}}% off!',
  variables: ['{{promoTitle}}', '{{discount}}', '{{endDate}}', '{{promoCode}}', '{{baseUrl}}'],
  textContent: `
⚡ {{promoTitle}} ⚡
OFFRE LIMITÉE - DÉPÊCHEZ-VOUS !

{{discount}}% DE RÉDUCTION

🎯 Code Promo: {{promoCode}}

⏰ Offre valable jusqu'au {{endDate}}

Profitez-en maintenant sur {{baseUrl}}/sell

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}; background: #000;">
      <div style="background: linear-gradient(45deg, #ff0000, #ff6b35, #ffff00); padding: 3px;">
        <div style="background: #000; padding: 25px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 32px; text-shadow: 0 0 10px #ff6b35;">
            ⚡ {{promoTitle}} ⚡
          </h1>
          <p style="color: #ff6b35; margin: 10px 0; font-size: 18px; font-weight: bold;">
            OFFRE LIMITÉE - DÉPÊCHEZ-VOUS !
          </p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(90deg, #ff0000, #ff6b35); color: white; padding: 20px; border-radius: 15px; display: inline-block; transform: rotate(-2deg);">
            <span style="font-size: 48px; font-weight: bold;">{{discount}}%</span>
            <p style="margin: 5px 0 0 0; font-size: 16px;">DE RÉDUCTION</p>
          </div>
        </div>
        
        <div style="background: rgba(255, 107, 53, 0.1); border: 2px dashed #ff6b35; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="color: #ff6b35; margin: 0 0 10px 0;">🎯 Code Promo</h3>
          <div style="background: #ff6b35; color: #000; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 20px; letter-spacing: 2px; display: inline-block;">
            {{promoCode}}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #ff6b35; font-weight: bold; margin-bottom: 15px;">
            ⏰ Offre valable jusqu'au {{endDate}}
          </p>
          <a href="{{baseUrl}}/sell" style="background: linear-gradient(90deg, #ff0000, #ff6b35); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; text-transform: uppercase;">
            Profiter maintenant
          </a>
        </div>
      </div>
    </div>
  `, '⚡ PROMO FLASH - {{discount}}% de réduction !')
};

export const giveawayAnnouncementTemplate: EmailTemplateConfig = {
  id: 'giveaway-announcement',
  name: 'Annonce Giveaway',
  nameEn: 'Giveaway Announcement',
  description: 'Template pour annoncer les nouveaux giveaways avec design festif',
  descriptionEn: 'Template to announce new giveaways with festive design',
  category: 'giveaway',
  subject: '🎉 NOUVEAU GIVEAWAY - {{prize}} à gagner !',
  subjectEn: '🎉 NEW GIVEAWAY - Win {{prize}}!',
  variables: ['{{giveawayTitle}}', '{{prize}}', '{{endDate}}', '{{ticketsRequired}}', '{{baseUrl}}'],
  textContent: `
🎉 NOUVEAU GIVEAWAY 🎉

{{giveawayTitle}}

🏆 PRIX À GAGNER: {{prize}}

🎫 Comment participer ?
{{ticketsRequired}} tickets requis

⏰ Tirage le {{endDate}}

Participez maintenant sur {{baseUrl}}/giveaways

Bonne chance ! 🍀

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}; background: radial-gradient(circle, #4c1d95, #1e1b4b);">
      <div style="padding: 30px 20px; text-align: center;">
        <div style="background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: bold; margin-bottom: 10px;">
          🎉 NOUVEAU GIVEAWAY 🎉
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px;">{{giveawayTitle}}</h1>
      </div>
      
      <div style="background: white; margin: 0 20px; border-radius: 15px; padding: 30px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.1;"></div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 25px; border-radius: 15px; display: inline-block; box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);">
            <div style="font-size: 18px; margin-bottom: 10px;">🏆 PRIX À GAGNER</div>
            <div style="font-size: 32px; font-weight: bold;">{{prize}}</div>
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 15px 0; text-align: center;">
            🎫 Comment participer ?
          </h3>
          <div style="text-align: center;">
            <div style="background: #ff6b35; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
              {{ticketsRequired}} tickets requis
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #ef4444; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
            ⏰ Tirage le {{endDate}}
          </p>
          <a href="{{baseUrl}}/giveaways" style="background: linear-gradient(90deg, #8b5cf6, #a855f7); color: white; padding: 18px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; display: inline-block; text-transform: uppercase; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3);">
            Participer maintenant
          </a>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center;">
        <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
          Bonne chance à tous ! 🍀
        </p>
      </div>
    </div>
  `, '🎉 GIVEAWAY - Gagnez {{prize}} !')
};

export const weeklyNewsletterTemplate: EmailTemplateConfig = {
  id: 'newsletter-weekly',
  name: 'Newsletter Hebdomadaire',
  nameEn: 'Weekly Newsletter',
  description: 'Template pour la newsletter hebdomadaire avec actualités et stats',
  descriptionEn: 'Template for weekly newsletter with news and stats',
  category: 'newsletter',
  subject: '📊 MoonSkin Weekly - Semaine {{weekNumber}}',
  subjectEn: '📊 MoonSkin Weekly - Week {{weekNumber}}',
  variables: ['{{weekNumber}}', '{{topSkin}}', '{{marketTrend}}', '{{newsItems}}', '{{baseUrl}}'],
  textContent: `
📊 MoonSkin Weekly
Semaine {{weekNumber}} • Votre résumé hebdomadaire

🔥 Skin de la semaine: {{topSkin}}
Hausse de {{marketTrend}}%

📰 Actualités:
{{newsItems}}

Voir plus sur {{baseUrl}}/dashboard

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">📊 MoonSkin Weekly</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Semaine {{weekNumber}} • Votre résumé hebdomadaire</p>
      </div>
      
      <div style="padding: 30px 20px; background: white;">
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
            🔥 Skin de la semaine
          </h2>
          <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px; border-radius: 10px; margin-top: 15px;">
            <h3 style="margin: 0 0 10px 0;">{{topSkin}}</h3>
            <p style="margin: 0; opacity: 0.9;">Le skin le plus échangé cette semaine avec une hausse de {{marketTrend}}%</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
            📰 Actualités
          </h2>
          <div style="margin-top: 15px;">
            {{newsItems}}
          </div>
        </div>
        
        <div style="text-align: center; background: #f8fafc; padding: 20px; border-radius: 10px;">
          <a href="{{baseUrl}}/dashboard" style="background: #ff6b35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Voir mon Dashboard
          </a>
        </div>
      </div>
    </div>
  `, 'Votre résumé hebdomadaire MoonSkin')
};

export const marketUpdateTemplate: EmailTemplateConfig = {
  id: 'market-update',
  name: 'Mise à jour Marché',
  nameEn: 'Market Update',
  description: 'Template pour les updates du marché CS2 avec graphiques et analyses',
  descriptionEn: 'Template for CS2 market updates with charts and analysis',
  category: 'announcement',
  subject: '📊 Market Update CS2 - {{marketDate}}',
  subjectEn: '📊 CS2 Market Update - {{marketDate}}',
  variables: ['{{marketDate}}', '{{topGainers}}', '{{topLosers}}', '{{marketAnalysis}}', '{{baseUrl}}'],
  textContent: `
📊 Market Update CS2
{{marketDate}}

↗️ Top Gainers:
{{topGainers}}

↘️ Top Losers:
{{topLosers}}

💡 Analyse du marché:
{{marketAnalysis}}

Prêt à trader ? {{baseUrl}}/sell

L'équipe MoonSkin
  `,
  htmlContent: createEmailWrapper(`
    <div style="${baseStyles.container}; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 25px;">
        <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
          <div style="background: #ff6b35; padding: 10px; border-radius: 50%; margin-right: 15px;">
            📊
          </div>
          <h1 style="margin: 0; font-size: 26px;">Market Update CS2</h1>
        </div>
        <p style="margin: 0; text-align: center; opacity: 0.9;">{{marketDate}}</p>
      </div>
      
      <div style="padding: 30px 20px;">
        <div style="margin-bottom: 30px;">
          <h2 style="color: #0f172a; margin-bottom: 20px; display: flex; align-items: center;">
            <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 10px; font-size: 14px;">↗️</span>
            Top Gainers
          </h2>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px;">
            {{topGainers}}
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #0f172a; margin-bottom: 20px; display: flex; align-items: center;">
            <span style="background: #ef4444; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 10px; font-size: 14px;">↘️</span>
            Top Losers
          </h2>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px;">
            {{topLosers}}
          </div>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
          <h3 style="color: #0f172a; margin: 0 0 15px 0;">💡 Analyse du marché</h3>
          <div style="color: #374151; line-height: 1.6;">
            {{marketAnalysis}}
          </div>
        </div>
        
        <div style="text-align: center; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; border-radius: 10px;">
          <h3 style="color: white; margin: 0 0 15px 0;">📈 Prêt à trader ?</h3>
          <a href="{{baseUrl}}/sell" style="background: white; color: #ff6b35; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Vendre mes skins
          </a>
        </div>
      </div>
    </div>
  `, 'Mise à jour du marché CS2 - {{marketDate}}')
};

// ============================================
// TEMPLATE REGISTRY
// ============================================

export const emailTemplates: EmailTemplateConfig[] = [
  platformWelcomeTemplate,
  tradeCreatedTemplate,
  newsletterWelcomeTemplate,
  promotionFlashTemplate,
  giveawayAnnouncementTemplate,
  weeklyNewsletterTemplate,
  marketUpdateTemplate,
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): EmailTemplateConfig | undefined {
  return emailTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: EmailTemplateConfig['category']): EmailTemplateConfig[] {
  return emailTemplates.filter(t => t.category === category);
}

/**
 * Render a template with variables
 */
export function renderTemplate(
  template: EmailTemplateConfig, 
  variables: EmailTemplateVariables,
  format: 'html' | 'text' = 'html'
): string {
  let content = format === 'html' ? template.htmlContent : template.textContent;
  
  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
    content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value ?? ''));
  }
  
  // Replace any remaining unreplaced variables with empty string
  content = content.replace(/\{\{[^}]+\}\}/g, '');
  
  return content;
}

/**
 * Render template subject with variables
 */
export function renderSubject(template: EmailTemplateConfig, variables: EmailTemplateVariables, locale: 'fr' | 'en' = 'fr'): string {
  let subject = locale === 'en' ? template.subjectEn : template.subject;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = key.startsWith('{{') ? key : `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(value ?? ''));
  }
  
  return subject;
}

/**
 * Get template category label
 */
export function getCategoryLabel(category: EmailTemplateConfig['category'], locale: 'fr' | 'en' = 'fr'): string {
  const labels: Record<EmailTemplateConfig['category'], { fr: string; en: string }> = {
    transactional: { fr: 'Transactionnel', en: 'Transactional' },
    marketing: { fr: 'Marketing', en: 'Marketing' },
    notification: { fr: 'Notification', en: 'Notification' },
    welcome: { fr: 'Bienvenue', en: 'Welcome' },
    promotion: { fr: 'Promotion', en: 'Promotion' },
    newsletter: { fr: 'Newsletter', en: 'Newsletter' },
    announcement: { fr: 'Annonce', en: 'Announcement' },
    giveaway: { fr: 'Giveaway', en: 'Giveaway' },
  };
  
  return labels[category]?.[locale] || category;
}

/**
 * Get category color for badges
 */
export function getCategoryColor(category: EmailTemplateConfig['category']): string {
  const colors: Record<EmailTemplateConfig['category'], string> = {
    transactional: '#3b82f6',
    marketing: '#8b5cf6',
    notification: '#6366f1',
    welcome: '#10b981',
    promotion: '#ef4444',
    newsletter: '#22c55e',
    announcement: '#a855f7',
    giveaway: '#eab308',
  };
  
  return colors[category] || '#6b7280';
}
