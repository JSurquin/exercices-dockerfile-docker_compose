# Système de Newsletter CashTrade

## Vue d'ensemble

Le système de newsletter permet aux utilisateurs de s'abonner aux actualités de CashTrade et aux administrateurs de gérer les abonnés et d'envoyer des campagnes d'emailing.

## Fonctionnalités

### Pour les utilisateurs
- ✅ Inscription à la newsletter depuis la page d'accueil
- ✅ Email de bienvenue automatique
- ✅ Désabonnement facile via lien dans les emails
- ✅ Page de désabonnement dédiée
- ✅ Protection contre le spam (validation email, rate limiting)

### Pour les administrateurs
- ✅ Interface d'administration complète (`/admin/newsletter`)
- ✅ Gestion des abonnés (liste, recherche, export CSV)
- ✅ Création et envoi de campagnes
- ✅ Aperçu des emails avant envoi
- ✅ Planification d'envois
- ✅ Statistiques d'abonnés
- ✅ Historique des campagnes

## Structure technique

### Base de données

Trois nouvelles tables ont été ajoutées :

```sql
-- Abonnés newsletter
NewsletterSubscriber {
  id: String (cuid)
  email: String (unique)
  isActive: Boolean
  subscribedAt: DateTime
  unsubscribedAt: DateTime?
  unsubscribeToken: String (unique)
}

-- Campagnes newsletter
NewsletterCampaign {
  id: String (cuid)
  title: String
  subject: String
  content: String
  htmlContent: String?
  status: NewsletterStatus (DRAFT/SCHEDULED/SENDING/SENT/CANCELLED)
  scheduledAt: DateTime?
  sentAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
  createdBy: String
}

-- Envois individuels
NewsletterSend {
  id: String (cuid)
  campaignId: String
  email: String
  status: NewsletterSendStatus (PENDING/SENT/DELIVERED/OPENED/CLICKED/BOUNCED/FAILED)
  sentAt: DateTime?
  openedAt: DateTime?
  clickedAt: DateTime?
  errorMessage: String?
}
```

### API Endpoints

#### Publics
- `POST /api/newsletter/subscribe` - Inscription newsletter
- `GET/POST /api/newsletter/unsubscribe` - Désabonnement

#### Admin (authentification requise)
- `GET /api/admin/newsletter/subscribers` - Liste des abonnés
- `DELETE /api/admin/newsletter/subscribers` - Supprimer un abonné
- `GET /api/admin/newsletter/export` - Export CSV des abonnés
- `GET/POST /api/admin/newsletter/campaigns` - Gestion des campagnes
- `POST /api/admin/newsletter/send` - Envoi d'une campagne

### Composants

#### Frontend utilisateur
- `NewsletterSection` - Composant d'inscription sur la page d'accueil
- `UnsubscribePage` - Page de désabonnement

#### Interface admin
- `NewsletterAdminPage` - Page principale d'administration
- `NewsletterCampaignCreator` - Créateur de campagnes

### Services
- `NewsletterService` - Service d'envoi d'emails avec Nodemailer

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Email Configuration (Newsletter)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=CashTrade
SMTP_FROM_EMAIL=noreply@moonskin.com
```

### Configuration Gmail

Pour utiliser Gmail comme serveur SMTP :

1. Activez l'authentification à 2 facteurs sur votre compte Google
2. Générez un mot de passe d'application :
   - Allez dans Paramètres Google > Sécurité
   - Mots de passe d'application
   - Sélectionnez "Autre" et nommez-le "CashTrade Newsletter"
   - Utilisez le mot de passe généré dans `SMTP_PASS`

### Autres fournisseurs SMTP

Le système supporte tous les fournisseurs SMTP standards :
- **SendGrid** : `smtp.sendgrid.net:587`
- **Mailgun** : `smtp.mailgun.org:587`
- **Amazon SES** : `email-smtp.region.amazonaws.com:587`
- **OVH** : `ssl0.ovh.net:587`

## Utilisation

### Inscription utilisateur

Les utilisateurs peuvent s'inscrire via le composant en bas de la page d'accueil. Un email de bienvenue est automatiquement envoyé.

### Administration

1. Accédez à `/admin/newsletter`
2. Onglet "Abonnés" : gérez la liste des abonnés
3. Onglet "Campagnes" : créez et envoyez des newsletters

### Création d'une campagne

1. Remplissez le titre, sujet et contenu
2. Utilisez l'aperçu pour vérifier le rendu
3. Choisissez "Envoyer maintenant" ou planifiez l'envoi
4. La campagne est envoyée à tous les abonnés actifs

## Sécurité et conformité

### RGPD
- ✅ Consentement explicite requis pour l'inscription
- ✅ Désabonnement facile (lien dans chaque email)
- ✅ Export des données personnelles
- ✅ Suppression des données sur demande
- ✅ Conservation limitée des données

### Anti-spam
- ✅ Validation d'email côté client et serveur
- ✅ Rate limiting sur les inscriptions
- ✅ Headers anti-spam dans les emails
- ✅ Lien de désabonnement obligatoire
- ✅ Gestion des bounces et erreurs

### Sécurité
- ✅ Authentification admin requise
- ✅ Validation des données d'entrée
- ✅ Protection contre l'injection SQL (Prisma)
- ✅ Logs d'audit des actions admin

## Monitoring et analytics

### Métriques disponibles
- Nombre total d'abonnés
- Abonnés actifs vs désabonnés
- Taux d'inscription par période
- Historique des campagnes envoyées
- Statistiques d'envoi par campagne

### Logs
- Inscriptions et désabonnements
- Envois de campagnes
- Erreurs d'envoi d'emails
- Actions administratives

## Développement futur

### Améliorations possibles
- [ ] Templates d'emails personnalisables
- [ ] Segmentation des abonnés
- [ ] A/B testing des campagnes
- [ ] Tracking d'ouverture et de clics
- [ ] Intégration avec des services tiers (Mailchimp, etc.)
- [ ] Automatisation des campagnes
- [ ] Newsletters personnalisées par utilisateur

### Optimisations techniques
- [ ] Queue d'envoi avec Redis
- [ ] Retry automatique des échecs
- [ ] Limitation de débit configurable
- [ ] Cache des templates
- [ ] Compression des images

## Support

Pour toute question ou problème :
- Consultez les logs de l'application
- Vérifiez la configuration SMTP
- Testez l'envoi avec un petit groupe d'abonnés
- Contactez l'équipe technique si nécessaire

---

*Système développé pour CashTrade - Plateforme de trading CS2*