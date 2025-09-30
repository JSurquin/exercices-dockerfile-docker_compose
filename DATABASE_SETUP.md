# Configuration Base de Données - CashTrade

## Prérequis

### 1. PostgreSQL
Installez PostgreSQL sur votre machine :

**macOS (avec Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Téléchargez et installez depuis [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Créer la base de données
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE cashtrade_dev;
CREATE USER cashtrade_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cashtrade_dev TO cashtrade_user;
\q
```

## Configuration

### 1. Variables d'environnement
Mettez à jour votre fichier `.env.local` :

```env
# Database
DATABASE_URL=postgresql://cashtrade_user:your_password@localhost:5432/cashtrade_dev
```

### 2. Installation des dépendances
```bash
pnpm install
```

### 3. Génération du client Prisma
```bash
pnpm db:generate
```

### 4. Création des tables
```bash
pnpm db:push
```

### 5. Peuplement avec des données de test
```bash
pnpm db:seed
```

## Scripts Disponibles

| Script | Description |
|--------|-------------|
| `pnpm db:generate` | Génère le client Prisma |
| `pnpm db:push` | Synchronise le schéma avec la DB (développement) |
| `pnpm db:migrate` | Crée et applique une migration |
| `pnpm db:studio` | Ouvre Prisma Studio (interface graphique) |
| `pnpm db:reset` | Remet à zéro la base de données |
| `pnpm db:seed` | Peuple la DB avec des données de test |

## Structure de la Base de Données

### Tables Better Auth
- **User** : Utilisateurs avec champs personnalisés CashTrade
- **Account** : Comptes OAuth (Steam, Discord)
- **Session** : Sessions utilisateur
- **VerificationToken** : Tokens de vérification

### Tables CashTrade
- **Trade** : Trades de skins
- **TradeItem** : Items dans chaque trade
- **PaymentMethod** : Méthodes de paiement (SEPA, crypto, Stripe)
- **Payout** : Paiements effectués
- **KYCDocument** : Documents de vérification d'identité
- **AffiliateStats** : Statistiques d'affiliation
- **Giveaway** : Giveaways
- **GiveawayEntry** : Participations aux giveaways

## Champs Personnalisés Utilisateur

Chaque utilisateur a ces champs supplémentaires :
- `steamId` : ID Steam unique
- `steamUsername` : Nom d'utilisateur Steam
- `steamAvatar` : Avatar Steam
- `level` : Niveau utilisateur (défaut: 1)
- `xp` : Points d'expérience (défaut: 0)
- `tickets` : Tickets pour giveaways (défaut: 0)
- `totalVolume` : Volume total en centimes (défaut: 0)
- `kycStatus` : Statut KYC (pending/verified/rejected)
- `acceptedTermsAt` : Date d'acceptation des CGV

## Utilisation en Développement

### 1. Visualiser les données
```bash
pnpm db:studio
```
Ouvre une interface web pour explorer la base de données.

### 2. Réinitialiser la DB
```bash
pnpm db:reset
```
Supprime toutes les données et recrée les tables.

### 3. Ajouter des données de test
```bash
pnpm db:seed
```
Peuple la base avec des utilisateurs, trades, etc.

## Production

### 1. Migrations
En production, utilisez les migrations :
```bash
pnpm db:migrate
```

### 2. Variables d'environnement
```env
DATABASE_URL=postgresql://user:password@host:5432/cashtrade_prod
```

### 3. Sauvegardes
Configurez des sauvegardes automatiques :
```bash
# Sauvegarde
pg_dump cashtrade_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
psql cashtrade_prod < backup_20241201_120000.sql
```

## Sécurité

### 1. Connexions sécurisées
- Utilisez SSL en production
- Limitez les connexions par IP
- Utilisez des mots de passe forts

### 2. Permissions
- Utilisez un utilisateur dédié avec permissions limitées
- Ne donnez pas d'accès superuser à l'application

### 3. Monitoring
- Surveillez les performances
- Configurez des alertes sur les erreurs
- Loggez les requêtes sensibles

## Dépannage

### Erreur de connexion
```bash
# Vérifier que PostgreSQL est démarré
brew services list | grep postgresql

# Vérifier la connexion
psql -U cashtrade_user -d cashtrade_dev -h localhost
```

### Erreur de schéma
```bash
# Regénérer le client
pnpm db:generate

# Synchroniser le schéma
pnpm db:push
```

### Données corrompues
```bash
# Réinitialiser complètement
pnpm db:reset
pnpm db:seed
```

## Support

- **Documentation Prisma** : [prisma.io/docs](https://www.prisma.io/docs)
- **Documentation PostgreSQL** : [postgresql.org/docs](https://www.postgresql.org/docs)
- **Better Auth** : [better-auth.com](https://better-auth.com)
