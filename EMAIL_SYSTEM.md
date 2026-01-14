# Système d'Emails CashTrade

## Vue d'ensemble

Le système d'emails de CashTrade est intégré avec Better Auth et gère automatiquement l'envoi d'emails pour différents événements de la plateforme.

## Configuration

### Variables d'environnement requises

```env
# Configuration SMTP (Ethereal Email pour les tests)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-email@ethereal.email
SMTP_PASSWORD=your-ethereal-password
SMTP_FROM=your-ethereal-email@ethereal.email
SMTP_FROM_NAME=CashTrade
SMTP_SECURE=false
ALERT_EMAIL_TO=admin@moonskin.com
```

## Types d'emails automatiques

### 1. Email de bienvenue à l'inscription

**Déclencheur :** 
- Première inscription via Better Auth (`/sign-up`)
- Première connexion d'un utilisateur (`isFirstLogin = true`)

**Template :** `sendPlatformWelcomeEmail()`

**Contenu :**
- Message de bienvenue personnalisé
- Prochaines étapes pour utiliser la plateforme
- Informations de sécurité
- Avantages de la plateforme

### 2. Email de confirmation de trade

**Déclencheur :** Création d'un nouveau trade via `/api/steam/create-trade`

**Template :** `sendTradeCreatedEmail()`

**Contenu :**
- Détails du trade (ID, valeur, items)
- Timeline du processus (7 jours de trade hold)
- Lien vers le dashboard de suivi

### 3. Email de newsletter

**Déclencheur :** Inscription à la newsletter via `/api/newsletter/subscribe`

**Template :** `sendWelcomeEmail()` (newsletter)

**Contenu :**
- Confirmation d'inscription
- Informations sur le contenu de la newsletter
- Lien de désabonnement

## Architecture technique

### Services

1. **NewsletterService** (`/src/lib/newsletter-service.ts`)
   - Service principal pour l'envoi d'emails
   - Gestion des templates HTML/text
   - Configuration Nodemailer

2. **EmailService** (`/src/lib/email.ts`)
   - Service pour les emails administratifs (reset password, etc.)
   - Utilisé par Better Auth

### Intégration Better Auth

Les hooks sont configurés dans `/src/lib/auth.ts` :

```typescript
hooks: {
  after: [
    {
      matcher(context) {
        return context.path === "/sign-up" && context.method === "POST";
      },
      handler: async (ctx) => {
        // Envoi email de bienvenue
      },
    },
    // ...
  ],
}
```

### Intégration Trade Hooks

Les emails de trade sont envoyés via `/src/lib/trade-hooks.ts` lors de la création d'un trade.

## Tests

### Endpoints de test disponibles

1. **Test configuration email :** `GET /api/test-newsletter`
2. **Test email de bienvenue :** `POST /api/test-welcome-email`

### Exemple d'utilisation

```bash
# Test de la configuration
curl -X GET http://localhost:3000/api/test-newsletter

# Test email de bienvenue
curl -X POST http://localhost:3000/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"type": "welcome"}'

# Test email de trade
curl -X POST http://localhost:3000/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"type": "trade"}'
```

## Gestion des erreurs

- Les erreurs d'envoi d'email ne font pas échouer les opérations principales
- Logs détaillés pour le debugging
- Fallback gracieux en cas d'échec SMTP

## Sécurité

- Validation des adresses email
- Protection contre le spam
- Liens de désabonnement obligatoires pour la newsletter
- Headers de sécurité appropriés

## Monitoring

- Logs de tous les envois d'emails
- Tracking des erreurs SMTP
- Métriques d'engagement (ouvertures, clics)

## Conformité RGPD

- Consentement explicite pour la newsletter
- Possibilité de désabonnement en un clic
- Conservation limitée des données d'email
- Export/suppression des données sur demande
