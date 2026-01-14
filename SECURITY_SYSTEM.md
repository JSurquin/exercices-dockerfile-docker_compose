# Système de Sécurité et Anti-Fraude

## Vue d'ensemble

Ce document décrit l'implémentation complète du système de sécurité et anti-fraude pour l'application MoonSkin, conforme aux règles définies dans `.cursorrules`.

## Architecture

Le système de sécurité est composé de plusieurs modules interconnectés :

### 1. Audit Logger (`src/lib/security/audit-logger.ts`)
- **Fonction** : Journalisation complète de toutes les actions sensibles
- **Fonctionnalités** :
  - Enregistrement en base de données et fichiers de log
  - Classification par niveau de sévérité
  - Alertes automatiques pour les actions critiques
  - Nettoyage automatique des anciens logs (RGPD)
  - Hash des données sensibles

### 2. Rate Limiter (`src/lib/security/rate-limiter.ts`)
- **Fonction** : Limitation du taux de requêtes par IP/utilisateur
- **Configurations prédéfinies** :
  - Login : 5 tentatives / 15 minutes
  - API générale : 100 requêtes / minute
  - Actions sensibles : 10 actions / heure
  - Changement IBAN : 3 changements / 24h
  - Demandes de paiement : 5 demandes / heure
  - Upload KYC : 20 uploads / heure
  - Création de trades : 20 trades / heure

### 3. Fraud Detector (`src/lib/security/fraud-detector.ts`)
- **Fonction** : Détection automatique d'activités suspectes
- **Analyses effectuées** :
  - Fraude de vélocité (trop d'actions en peu de temps)
  - Réputation IP (IPs bloquées, multiples utilisateurs)
  - Comportement utilisateur (nouveau compte, volumes anormaux)
  - Géolocalisation (changements d'IP suspects)
  - Empreinte du dispositif (User-Agent suspects)
  - Détection de pics d'activité globaux

### 4. Cooldown Manager (`src/lib/security/cooldown-manager.ts`)
- **Fonction** : Gestion des périodes de refroidissement
- **Types de cooldown** :
  - Changement IBAN : 7 jours (contournable avec vérification)
  - Changement méthode de paiement : 24 heures
  - Resoumission KYC : 24 heures
  - Demande de paiement : 1 heure
  - Création de trade : 5 minutes
  - Activité suspecte : 1 heure

### 5. Security Middleware (`src/lib/security/security-middleware.ts`)
- **Fonction** : Middleware centralisé pour l'application des règles de sécurité
- **Middlewares spécialisés** :
  - Authentification
  - Actions sensibles
  - API générale
  - Changement IBAN
  - Demandes de paiement
  - Upload KYC
  - Création de trades

## Utilisation

### 1. Application du middleware de sécurité

```typescript
import { withSecurity } from '@/lib/security';

// Pour une route d'authentification
export const POST = withSecurity(handleLogin, 'auth');

// Pour une action sensible (paiement, KYC)
export const POST = withSecurity(handlePayment, 'sensitive');

// Pour une API générale
export const GET = withSecurity(handleData, 'general');
```

### 2. Logging d'audit manuel

```typescript
import { AuditLogger, AuditAction } from '@/lib/security';

// Log d'une action sensible
await AuditLogger.logIbanChange(
  userId,
  oldIban,
  newIban,
  ipAddress
);

// Log d'activité suspecte
await AuditLogger.logSuspiciousActivity(
  userId,
  ipAddress,
  'Multiple failed login attempts',
  { attempts: 5, timeframe: '5 minutes' }
);
```

### 3. Vérification de cooldown

```typescript
import { CooldownManager, CooldownType } from '@/lib/security';

// Vérifier si un utilisateur peut changer son IBAN
const cooldownStatus = await CooldownManager.checkCooldown(
  userId,
  CooldownType.IBAN_CHANGE,
  ipAddress
);

if (cooldownStatus.isActive) {
  return NextResponse.json({
    error: 'Cooldown active',
    remainingTime: cooldownStatus.remainingTime,
    canBypass: cooldownStatus.canBypass,
  }, { status: 429 });
}
```

### 4. Détection de fraude

```typescript
import { FraudDetector } from '@/lib/security';

const fraudResult = await FraudDetector.analyzeActivity({
  userId,
  ipAddress,
  userAgent,
  action: 'payment_request',
  timestamp: new Date(),
});

if (fraudResult.recommendedAction === 'block') {
  // Bloquer l'utilisateur
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

## Endpoints d'administration

### 1. Métriques de sécurité
- **URL** : `/api/admin/security/metrics`
- **Méthode** : GET
- **Paramètres** : `timeframe` (hour, day, week, month)
- **Retourne** : Métriques complètes de sécurité

### 2. Maintenance de sécurité (Cron)
- **URL** : `/api/cron/security-maintenance`
- **Méthode** : POST
- **Auth** : Token secret via header Authorization
- **Fonction** : Nettoyage automatique des données expirées

## Configuration

### Variables d'environnement requises

```env
# Token secret pour les tâches cron
CRON_SECRET_TOKEN=your-secret-token-here

# Configuration de logging (optionnel)
LOG_LEVEL=info
```

### Tâche cron recommandée

```bash
# Maintenance de sécurité quotidienne à 2h du matin
0 2 * * * curl -X POST -H "Authorization: Bearer ${CRON_SECRET_TOKEN}" https://your-domain.com/api/cron/security-maintenance
```

## Conformité RGPD

Le système respecte les exigences RGPD :

1. **Minimisation des données** : Seules les données nécessaires sont collectées
2. **Pseudonymisation** : Les données sensibles sont hashées dans les logs
3. **Droit à l'oubli** : Nettoyage automatique des anciens logs
4. **Transparence** : Logs d'accès aux données personnelles

## Alertes et monitoring

### Niveaux de sévérité
- **Low** : Actions normales, logging informatif
- **Medium** : Actions suspectes nécessitant une surveillance
- **High** : Actions dangereuses nécessitant une intervention
- **Critical** : Menaces immédiates, alertes automatiques

### Actions déclenchant des alertes critiques
- Détection de fraude avec score élevé
- Pics d'activité anormaux
- Tentatives de contournement de sécurité
- Échecs répétés de vérification

## Exemples d'implémentation

Voir les fichiers suivants pour des exemples concrets :
- `src/app/api/auth/steam/callback/route.ts` - Authentification sécurisée
- `src/app/api/user/payment-method/route.ts` - Gestion des méthodes de paiement
- `src/app/api/admin/security/metrics/route.ts` - Métriques d'administration

## Évolutions futures

1. **Intégration Redis** : Pour un stockage distribué des rate limits
2. **Machine Learning** : Détection de fraude basée sur l'IA
3. **Géolocalisation IP** : Service de géolocalisation pour détecter les changements de pays
4. **Notifications temps réel** : Webhooks pour les alertes critiques
5. **Dashboard de sécurité** : Interface graphique pour les métriques

## Tests

Pour tester le système de sécurité :

1. **Rate limiting** : Effectuer plusieurs requêtes rapides
2. **Détection de fraude** : Simuler des comportements suspects
3. **Cooldowns** : Tenter des actions répétées
4. **Audit logs** : Vérifier l'enregistrement des actions

## Support

Pour toute question ou problème lié au système de sécurité, consulter les logs d'audit et les métriques d'administration.
