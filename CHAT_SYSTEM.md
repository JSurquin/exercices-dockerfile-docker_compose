# Système de Chat Dynamique - CashTrade

## 📋 Vue d'ensemble

Le système de chat dynamique remplace l'ancien chatbot statique par un système complet de gestion des conversations avec persistance en base de données, rôles de modération, et interface d'administration.

## 🏗️ Architecture

### Base de données

#### Nouveaux modèles Prisma

- **Conversation** : Représente une conversation entre un utilisateur et le support
- **ChatMessage** : Messages individuels dans une conversation
- **UserRole** : Ajout du rôle `MODERATOR`

#### Enums ajoutés

- `ConversationStatus` : ACTIVE, CLOSED, ARCHIVED
- `ConversationPriority` : LOW, NORMAL, HIGH, URGENT  
- `SenderType` : USER, BOT, MODERATOR, SYSTEM

### APIs créées

#### Conversations
- `GET /api/chat/conversations` - Liste des conversations (avec filtres)
- `POST /api/chat/conversations` - Créer une nouvelle conversation
- `GET /api/chat/conversations/[id]` - Détails d'une conversation
- `PATCH /api/chat/conversations/[id]` - Mettre à jour le statut
- `DELETE /api/chat/conversations/[id]` - Supprimer (admin uniquement)

#### Assignation
- `POST /api/chat/conversations/[id]/assign` - Assigner à un modérateur
- `DELETE /api/chat/conversations/[id]/assign` - Désassigner

#### Messages
- `POST /api/chat/messages` - Envoyer un message

#### Statistiques
- `GET /api/chat/stats` - Statistiques générales du chat
- `POST /api/chat/stats/moderators` - Statistiques des modérateurs (admin)

#### Gestion des modérateurs
- `GET /api/admin/moderators` - Liste des modérateurs
- `POST /api/admin/moderators` - Promouvoir un utilisateur
- `DELETE /api/admin/moderators/[id]` - Rétrograder un modérateur
- `GET /api/admin/moderators/[id]` - Détails d'un modérateur

## 🎯 Fonctionnalités

### Pour les utilisateurs
- **Chat widget persistant** : Les conversations sont sauvegardées
- **Historique complet** : Accès à toutes les conversations passées
- **Réponses en temps réel** : Messages des modérateurs en direct
- **Support invité** : Possibilité de créer des conversations sans compte

### Pour les modérateurs
- **Interface dédiée** (`/moderation`) : Tableau de bord complet
- **Gestion des conversations** : Assignation, réponses, fermeture
- **Filtres avancés** : Par statut, priorité, assignation
- **Statistiques** : Temps de réponse, conversations traitées

### Pour les administrateurs
- **Gestion complète** (`/admin/chat`) : Vue d'ensemble du système
- **Gestion des modérateurs** : Promotion/rétrogradation d'utilisateurs
- **Statistiques détaillées** : Performance des modérateurs
- **Contrôle total** : Accès à toutes les conversations

## 🔧 Installation et configuration

### 1. Migration de la base de données

```bash
npx prisma migrate dev --name add_chat_system
npx prisma generate
```

### 2. Créer un modérateur de test (développement uniquement)

```bash
curl -X POST http://localhost:3000/api/seed/moderator
```

### 3. Permissions et rôles

#### Rôles utilisateur
- `USER` : Peut créer et participer à ses conversations
- `MODERATOR` : Peut gérer toutes les conversations, répondre aux utilisateurs
- `ADMIN` : Accès complet + gestion des modérateurs

#### Permissions par endpoint
- **Conversations** : Utilisateurs (leurs conversations), Modérateurs/Admins (toutes)
- **Messages** : Participants à la conversation + Modérateurs/Admins
- **Assignation** : Modérateurs/Admins uniquement
- **Gestion modérateurs** : Admins uniquement

## 🎨 Interface utilisateur

### Chat Widget (`/components/ui/chat-widget.tsx`)
- **Persistance** : Utilise le hook `useChat()` pour la gestion d'état
- **Indicateurs visuels** : Différenciation des types de messages (User, Bot, Modérateur, Système)
- **Notifications** : Badge de messages non lus
- **Réponses automatiques** : Bot répond automatiquement aux nouveaux messages

### Interface de modération (`/moderation`)
- **Dashboard** : Vue d'ensemble avec statistiques
- **Liste des conversations** : Filtres et actions rapides
- **Vue détaillée** : Interface de chat complète pour répondre

### Administration (`/admin/chat`)
- **Onglets organisés** : Conversations, Modérateurs, Statistiques
- **Gestion des modérateurs** : Recherche et promotion d'utilisateurs
- **Métriques** : Performance et utilisation du système

## 📊 Fonctionnalités avancées

### Système de priorités
- **URGENT** : Traitement immédiat requis
- **HIGH** : Priorité élevée  
- **NORMAL** : Priorité standard
- **LOW** : Peut attendre

### Assignation intelligente
- **Auto-assignation** : Les modérateurs peuvent s'assigner des conversations
- **Désassignation** : Libération des conversations pour répartition
- **Notifications système** : Messages automatiques lors des changements

### Audit et logging
- **Actions tracées** : Création, assignation, fermeture de conversations
- **Historique complet** : Tous les changements sont loggés
- **Métriques** : Temps de réponse, volume de messages

## 🔄 Workflow type

### Nouvelle conversation utilisateur
1. Utilisateur envoie un message via le chat widget
2. Création automatique d'une conversation avec statut `ACTIVE`
3. Réponse automatique du bot
4. Conversation apparaît dans la liste des modérateurs (non assignée)
5. Modérateur s'assigne la conversation
6. Échange de messages en temps réel
7. Fermeture de la conversation par le modérateur

### Gestion administrative
1. Admin accède à `/admin/chat`
2. Vue d'ensemble des statistiques
3. Promotion d'utilisateurs en modérateurs si besoin
4. Monitoring des performances des modérateurs
5. Accès aux conversations pour supervision

## 🚀 Améliorations futures possibles

- **WebSocket** : Notifications en temps réel
- **Templates de réponses** : Réponses pré-définies pour les modérateurs  
- **Système de tickets** : Numérotation et suivi avancé
- **Intégration email** : Notifications par email
- **Chatbot IA** : Réponses automatiques intelligentes
- **Métriques avancées** : Satisfaction client, résolution rate
- **Multi-langues** : Support des conversations dans différentes langues

## 📝 Notes techniques

### Hooks React
- `useChat()` : Gestion centralisée des conversations côté client
- Intégration avec `useAuth()` pour les permissions
- État synchronisé avec l'API

### Sécurité
- **Validation des permissions** : Vérification côté serveur pour chaque action
- **Isolation des données** : Utilisateurs ne voient que leurs conversations
- **Audit logging** : Traçabilité complète des actions

### Performance
- **Pagination** : Chargement par pages pour les listes
- **Filtres optimisés** : Index de base de données appropriés
- **Cache intelligent** : Réduction des appels API redondants

---

Le système est maintenant opérationnel et prêt pour la production ! 🎉
