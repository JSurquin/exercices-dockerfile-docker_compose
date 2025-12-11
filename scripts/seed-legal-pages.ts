/**
 * Script pour initialiser les pages légales par défaut
 * Usage: npx ts-node scripts/seed-legal-pages.ts
 * ou: pnpm prisma db seed (si configuré dans package.json)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultLegalPages = [
  {
    slug: 'terms',
    titleFr: "Conditions Générales d'Utilisation",
    titleEn: 'Terms of Service',
    subtitleFr: "Veuillez lire attentivement ces conditions avant d'utiliser nos services",
    subtitleEn: 'Please read these terms carefully before using our services',
    contentFr: `# 1. Acceptation des conditions

En utilisant CashTrade, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.

Ces conditions peuvent être modifiées à tout moment. Les modifications entreront en vigueur dès leur publication sur notre site. Il est de votre responsabilité de consulter régulièrement ces conditions.

# 2. Conditions d'éligibilité

Pour utiliser CashTrade, vous devez :
- Être âgé d'au moins 18 ans
- Avoir la capacité juridique de conclure des contrats
- Résider dans un pays où nos services sont légalement disponibles
- Posséder un compte Steam en règle
- Compléter avec succès notre processus KYC (Know Your Customer)

Nous nous réservons le droit de refuser ou de suspendre l'accès à tout utilisateur ne respectant pas ces critères.

# 3. Description des services

CashTrade fournit une plateforme permettant de :
- Vendre des skins Counter-Strike 2 contre de l'argent réel
- Recevoir des paiements via SEPA ou cryptomonnaies
- Participer à des giveaways et concours
- Accéder à des statistiques de trading

Nos services sont fournis "en l'état" et nous ne garantissons pas leur disponibilité ininterrompue.

# 4. Processus de trading

Le processus de vente comprend :
- Connexion Steam et ajout du Trade Link
- Estimation automatique des skins via API Skinplace
- Acceptation des conditions de vente
- Trade automatique avec notre bot
- Période de trade hold Steam (7 jours obligatoires)
- Paiement automatique après validation

Les prix sont indicatifs et peuvent varier selon les conditions de marché. Une fois le trade accepté sur Steam, la vente est définitive.

# 5. Paiements et frais

**Frais applicables :**
- Frais de cashout : 0,5% du montant brut
- Frais de réseau variables selon la méthode de paiement
- Aucun frais caché

**Délais de paiement :**
- SEPA : 24-48h ouvrées après trade hold
- Crypto : Quelques heures après trade hold

Tous les montants sont calculés en centimes pour éviter les erreurs d'arrondi.

# 6. Vérification KYC

La vérification KYC est obligatoire pour :
- Effectuer tout paiement
- Respecter la réglementation anti-blanchiment
- Assurer la sécurité de la plateforme

**Documents requis :**
- Pièce d'identité valide (carte d'identité, passeport)
- Selfie de vérification
- Justificatif de domicile (optionnel)

Vos documents sont traités par un prestataire certifié et nous ne conservons que les références de vérification.

# 7. Sécurité et protection

Nous mettons en place :
- Chiffrement SSL 256-bit pour toutes les communications
- Authentification à deux facteurs recommandée
- Surveillance anti-fraude 24/7
- Conformité aux standards de sécurité bancaires

L'utilisateur s'engage à :
- Protéger ses identifiants de connexion
- Signaler immédiatement toute activité suspecte
- Ne pas partager son compte avec des tiers

# 8. Utilisations interdites

Il est strictement interdit de :
- Utiliser la plateforme pour blanchir de l'argent
- Créer plusieurs comptes pour contourner les limites
- Utiliser des bots ou scripts automatisés
- Tenter de manipuler les prix ou le système
- Violer les conditions d'utilisation de Steam
- Effectuer des activités frauduleuses

Toute violation peut entraîner la suspension immédiate du compte.

# 9. Limitation de responsabilité

CashTrade ne peut être tenu responsable :
- Des fluctuations de prix des skins
- Des interruptions de service temporaires
- Des décisions de Steam concernant les trades
- Des pertes indirectes ou consécutives
- Des erreurs d'estimation dues aux conditions de marché

Notre responsabilité est limitée au montant des frais payés pour le service concerné.

# 10. Protection des données

Conformément au RGPD, vous avez le droit de :
- Accéder à vos données personnelles
- Demander leur rectification ou suppression
- Vous opposer à leur traitement
- Demander la portabilité de vos données

Nous conservons vos données uniquement le temps nécessaire aux obligations légales et réglementaires.

# 11. Résiliation

Vous pouvez résilier votre compte à tout moment via les paramètres.

Nous pouvons suspendre ou résilier votre compte en cas de :
- Violation des présentes conditions
- Activité frauduleuse ou suspecte
- Non-respect des exigences KYC
- Demande des autorités compétentes

En cas de résiliation, les trades en cours seront finalisés selon les conditions acceptées.

# 12. Droit applicable

Ces conditions sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux de Paris.

En cas de litige, nous encourageons la résolution amiable via notre service client avant toute action judiciaire.`,
    contentEn: `# 1. Acceptance of Terms

By using CashTrade, you agree to be bound by these terms of service. If you do not accept these terms, please do not use our service.

These terms may be modified at any time. Changes will take effect upon publication on our site. It is your responsibility to regularly review these terms.

# 2. Eligibility Requirements

To use CashTrade, you must:
- Be at least 18 years old
- Have legal capacity to enter into contracts
- Reside in a country where our services are legally available
- Have a valid Steam account
- Successfully complete our KYC (Know Your Customer) process

We reserve the right to refuse or suspend access to any user who does not meet these criteria.

# 3. Service Description

CashTrade provides a platform to:
- Sell Counter-Strike 2 skins for real money
- Receive payments via SEPA or cryptocurrencies
- Participate in giveaways and contests
- Access trading statistics

Our services are provided "as is" and we do not guarantee uninterrupted availability.

# 4. Trading Process

The selling process includes:
- Steam login and Trade Link addition
- Automatic skin estimation via Skinplace API
- Acceptance of sale conditions
- Automatic trade with our bot
- Steam trade hold period (7 mandatory days)
- Automatic payment after validation

Prices are indicative and may vary according to market conditions. Once the trade is accepted on Steam, the sale is final.

# 5. Payments and Fees

**Applicable fees:**
- Cashout fee: 0.5% of gross amount
- Variable network fees depending on payment method
- No hidden fees

**Payment timeframes:**
- SEPA: 24-48 business hours after trade hold
- Crypto: A few hours after trade hold

All amounts are calculated in cents to avoid rounding errors.

# 6. KYC Verification

KYC verification is mandatory to:
- Make any payment
- Comply with anti-money laundering regulations
- Ensure platform security

**Required documents:**
- Valid ID (identity card, passport)
- Verification selfie
- Proof of address (optional)

Your documents are processed by a certified provider and we only retain verification references.

# 7. Security and Protection

We implement:
- 256-bit SSL encryption for all communications
- Recommended two-factor authentication
- 24/7 anti-fraud monitoring
- Compliance with banking security standards

The user agrees to:
- Protect their login credentials
- Immediately report any suspicious activity
- Not share their account with third parties

# 8. Prohibited Uses

It is strictly forbidden to:
- Use the platform for money laundering
- Create multiple accounts to bypass limits
- Use bots or automated scripts
- Attempt to manipulate prices or the system
- Violate Steam's terms of service
- Engage in fraudulent activities

Any violation may result in immediate account suspension.

# 9. Limitation of Liability

CashTrade cannot be held responsible for:
- Skin price fluctuations
- Temporary service interruptions
- Steam's decisions regarding trades
- Indirect or consequential losses
- Estimation errors due to market conditions

Our liability is limited to the amount of fees paid for the service in question.

# 10. Data Protection

Under GDPR, you have the right to:
- Access your personal data
- Request rectification or deletion
- Object to processing
- Request data portability

We retain your data only for the time necessary for legal and regulatory obligations.

# 11. Termination

You can terminate your account at any time via settings.

We may suspend or terminate your account in case of:
- Violation of these terms
- Fraudulent or suspicious activity
- Non-compliance with KYC requirements
- Request from competent authorities

In case of termination, ongoing trades will be finalized according to accepted conditions.

# 12. Governing Law

These terms are governed by French law. Any dispute will be subject to the exclusive jurisdiction of the Paris courts.

In case of dispute, we encourage amicable resolution through our customer service before any legal action.`,
    contactEmail: 'legal@cashtrade.gg',
    contactPhone: '+33 1 23 45 67 89',
    isPublished: true,
  },
  {
    slug: 'privacy',
    titleFr: 'Politique de Confidentialité',
    titleEn: 'Privacy Policy',
    subtitleFr: 'Comment nous collectons, utilisons et protégeons vos données personnelles',
    subtitleEn: 'How we collect, use and protect your personal data',
    contentFr: `# Notre engagement

Chez CashTrade, la protection de vos données personnelles est notre priorité absolue. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations en conformité avec le Règlement Général sur la Protection des Données (RGPD) et les lois françaises.

Nous appliquons le principe de minimisation des données : nous ne collectons que les informations strictement nécessaires au fonctionnement de notre service et à nos obligations légales.

# Types de données collectées

## Données d'identification
- Nom et prénom
- Date de naissance
- Adresse email
- Steam ID
- Adresse IP

**Finalité :** Authentification et vérification d'identité (KYC)
**Conservation :** 5 ans après fermeture du compte

## Données KYC
- Pièce d'identité
- Selfie de vérification
- Justificatif de domicile

**Finalité :** Conformité réglementaire anti-blanchiment
**Conservation :** 10 ans (obligation légale)

## Données financières
- IBAN (haché)
- Adresses crypto
- Historique transactions

**Finalité :** Traitement des paiements et audit
**Conservation :** 7 ans (obligation comptable)

## Données d'usage
- Logs de connexion
- Activité de trading
- Préférences utilisateur

**Finalité :** Amélioration du service et sécurité
**Conservation :** 2 ans maximum

# Base légale du traitement

- **Contrat** : Exécution de nos services de trading et paiement
- **Obligation légale** : Conformité KYC, lutte anti-blanchiment, obligations fiscales
- **Intérêt légitime** : Sécurité, prévention fraude, amélioration du service

# Vos droits RGPD

- **Droit d'accès** : Demander une copie de toutes vos données personnelles
- **Droit de rectification** : Corriger ou mettre à jour vos informations personnelles
- **Droit à l'effacement** : Supprimer vos données (sauf obligations légales)
- **Droit à la portabilité** : Récupérer vos données dans un format lisible

# Sécurité des données

**Mesures techniques :**
- Chiffrement SSL/TLS 256-bit
- Chiffrement des données sensibles en base
- Authentification à deux facteurs
- Surveillance 24/7 des accès

**Mesures organisationnelles :**
- Accès limité aux données (need-to-know)
- Formation sécurité des employés
- Audits de sécurité réguliers
- Plan de réponse aux incidents

# Partage des données

Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement dans les cas suivants :

- **Prestataires de services** : Qonto (paiements SEPA), prestataire KYC, hébergeur cloud - sous contrat de confidentialité strict
- **Obligations légales** : Autorités fiscales, TRACFIN (lutte anti-blanchiment), autorités judiciaires sur réquisition
- **Votre consentement** : Avec votre accord explicite pour des services additionnels`,
    contentEn: `# Our Commitment

At CashTrade, protecting your personal data is our absolute priority. This policy explains how we collect, use, store and protect your information in compliance with the General Data Protection Regulation (GDPR) and French laws.

We apply the principle of data minimization: we only collect information strictly necessary for the operation of our service and our legal obligations.

# Types of Data Collected

## Identification Data
- First and last name
- Date of birth
- Email address
- Steam ID
- IP address

**Purpose:** Authentication and identity verification (KYC)
**Retention:** 5 years after account closure

## KYC Data
- Identity document
- Verification selfie
- Proof of address

**Purpose:** Anti-money laundering regulatory compliance
**Retention:** 10 years (legal obligation)

## Financial Data
- IBAN (hashed)
- Crypto addresses
- Transaction history

**Purpose:** Payment processing and audit
**Retention:** 7 years (accounting obligation)

## Usage Data
- Login logs
- Trading activity
- User preferences

**Purpose:** Service improvement and security
**Retention:** Maximum 2 years

# Legal Basis for Processing

- **Contract**: Execution of our trading and payment services
- **Legal obligation**: KYC compliance, anti-money laundering, tax obligations
- **Legitimate interest**: Security, fraud prevention, service improvement

# Your GDPR Rights

- **Right of access**: Request a copy of all your personal data
- **Right to rectification**: Correct or update your personal information
- **Right to erasure**: Delete your data (except legal obligations)
- **Right to portability**: Retrieve your data in a readable format

# Data Security

**Technical measures:**
- SSL/TLS 256-bit encryption
- Encryption of sensitive data in database
- Two-factor authentication
- 24/7 access monitoring

**Organizational measures:**
- Limited data access (need-to-know)
- Employee security training
- Regular security audits
- Incident response plan

# Data Sharing

We never sell your personal data. We may share it only in the following cases:

- **Service providers**: Qonto (SEPA payments), KYC provider, cloud host - under strict confidentiality contract
- **Legal obligations**: Tax authorities, TRACFIN (anti-money laundering), judicial authorities upon request
- **Your consent**: With your explicit agreement for additional services`,
    contactEmail: 'dpo@cashtrade.gg',
    contactPhone: '+33 1 23 45 67 89',
    isPublished: true,
  },
  {
    slug: 'kyc-policy',
    titleFr: 'Politique KYC',
    titleEn: 'KYC Policy',
    subtitleFr: "Processus de vérification d'identité conforme aux réglementations européennes",
    subtitleEn: 'Identity verification process compliant with European regulations',
    contentFr: `# Pourquoi le KYC ?

Le processus KYC (Know Your Customer) est une obligation légale pour tous les prestataires de services financiers. Il nous permet de :
- Lutter contre le blanchiment d'argent
- Prévenir le financement du terrorisme
- Protéger nos utilisateurs contre la fraude
- Respecter les réglementations ACPR et AMF

## Important à savoir
- La vérification KYC est obligatoire avant tout paiement
- Vos documents sont traités de manière confidentielle
- Le processus est généralement finalisé en 24h
- Aucun paiement n'est effectué sans validation KYC

# Niveaux de vérification

## Niveau 1 - Basique
**Documents requis :**
- Pièce d'identité valide (CNI, passeport)
- Selfie de vérification
- Confirmation d'email et téléphone

**Limites :** 500€/jour - 2,000€/mois
**Délai :** 2-24 heures

## Niveau 2 - Avancé
**Documents requis :**
- Tous les documents du Niveau 1
- Justificatif de domicile (< 3 mois)
- Déclaration de revenus ou fiche de paie

**Limites :** 5,000€/jour - 20,000€/mois
**Délai :** 24-72 heures

## Niveau 3 - Premium
**Documents requis :**
- Tous les documents des niveaux précédents
- Entretien vidéo avec notre équipe
- Vérification source de fonds

**Limites :** Illimité
**Délai :** 3-7 jours

# Documents acceptés

## Pièces d'identité acceptées
- Carte nationale d'identité française
- Passeport français ou européen
- Permis de conduire français
- Titre de séjour (pour les résidents)

**Exigences :**
- Document en cours de validité
- Photo lisible et non floue
- Toutes les informations visibles
- Format JPEG, PNG ou PDF (max 10MB)

## Justificatifs de domicile
- Facture d'électricité, gaz ou eau
- Facture de téléphone fixe ou internet
- Relevé bancaire
- Attestation d'assurance habitation
- Quittance de loyer

**Exigences :**
- Document daté de moins de 3 mois
- Nom et adresse clairement visibles
- Correspondance avec l'identité fournie
- Document original (non modifié)

# Protection des données

- **Chiffrement de bout en bout** : Tous vos documents sont chiffrés avec AES-256
- **Stockage sécurisé** : Hébergement en France, conforme RGPD
- **Accès restreint** : Seule l'équipe KYC peut consulter vos documents
- **Suppression automatique** : Documents supprimés après validation (sauf obligations légales)`,
    contentEn: `# Why KYC?

The KYC (Know Your Customer) process is a legal requirement for all financial service providers. It allows us to:
- Fight against money laundering
- Prevent terrorist financing
- Protect our users against fraud
- Comply with ACPR and AMF regulations

## Important to know
- KYC verification is mandatory before any payment
- Your documents are processed confidentially
- The process is generally completed within 24h
- No payment is made without KYC validation

# Verification Levels

## Level 1 - Basic
**Required documents:**
- Valid ID (national ID, passport)
- Verification selfie
- Email and phone confirmation

**Limits:** €500/day - €2,000/month
**Processing time:** 2-24 hours

## Level 2 - Advanced
**Required documents:**
- All Level 1 documents
- Proof of address (< 3 months)
- Income statement or payslip

**Limits:** €5,000/day - €20,000/month
**Processing time:** 24-72 hours

## Level 3 - Premium
**Required documents:**
- All documents from previous levels
- Video interview with our team
- Source of funds verification

**Limits:** Unlimited
**Processing time:** 3-7 days

# Accepted Documents

## Accepted Identity Documents
- French national identity card
- French or European passport
- French driving license
- Residence permit (for residents)

**Requirements:**
- Valid document
- Clear, non-blurry photo
- All information visible
- JPEG, PNG or PDF format (max 10MB)

## Proof of Address
- Electricity, gas or water bill
- Landline or internet bill
- Bank statement
- Home insurance certificate
- Rent receipt

**Requirements:**
- Document dated less than 3 months
- Name and address clearly visible
- Correspondence with provided identity
- Original document (unmodified)

# Data Protection

- **End-to-end encryption**: All your documents are encrypted with AES-256
- **Secure storage**: Hosted in France, GDPR compliant
- **Restricted access**: Only the KYC team can view your documents
- **Automatic deletion**: Documents deleted after validation (except legal obligations)`,
    contactEmail: 'kyc@cashtrade.gg',
    contactPhone: '+33 1 23 45 67 89',
    isPublished: true,
  },
  {
    slug: 'aml-policy',
    titleFr: 'Politique Anti-Blanchiment (AML)',
    titleEn: 'Anti-Money Laundering (AML) Policy',
    subtitleFr: "Notre engagement dans la lutte contre le blanchiment d'argent et le financement du terrorisme",
    subtitleEn: 'Our commitment to fighting money laundering and terrorist financing',
    contentFr: `# Notre engagement

CashTrade applique une politique de tolérance zéro envers le blanchiment d'argent, le financement du terrorisme et toute activité illicite. Nous mettons en œuvre des mesures strictes conformes aux réglementations européennes et françaises.

Notre approche repose sur la prévention, la détection et le signalement de toute activité suspecte, en collaboration étroite avec les autorités compétentes.

> **Avertissement important** : Toute tentative de blanchiment d'argent ou de financement d'activités illicites entraînera la fermeture immédiate du compte, la saisie des fonds et le signalement aux autorités judiciaires et financières.

# Facteurs de risque surveillés

## Facteurs géographiques
- Pays sous sanctions internationales
- Juridictions à haut risque (liste GAFI)
- Paradis fiscaux non coopératifs
- Zones de conflit ou d'instabilité politique

## Comportements suspects
- Transactions inhabituellement importantes
- Fréquence anormale des opérations
- Utilisation de multiples comptes
- Refus de fournir des informations KYC

## Profils à risque
- Personnes politiquement exposées (PPE)
- Activités dans des secteurs sensibles
- Historique de sanctions ou enquêtes
- Liens avec des entités sanctionnées

## Transactions suspectes
- Montants incohérents avec le profil
- Structuration pour éviter les seuils
- Origine des fonds non justifiée
- Destination finale inconnue

# Mesures de surveillance

## Surveillance en temps réel
- Algorithmes de détection d'anomalies
- Alertes automatiques sur seuils
- Analyse comportementale avancée
- Corrélation avec bases de données externes

## Contrôles renforcés
- Due diligence renforcée (EDD)
- Vérification source des fonds
- Contrôle des listes de sanctions
- Validation manuelle par experts

## Reporting réglementaire
- Déclarations TRACFIN automatiques
- Rapports périodiques à l'ACPR
- Conservation des preuves 5 ans
- Coopération avec les enquêtes

# Activités interdites

## Blanchiment d'argent
Conversion d'argent d'origine illicite en fonds apparemment légaux.
**Sanctions :** Jusqu'à 5 ans de prison et 375 000€ d'amende

## Financement du terrorisme
Fourniture de fonds ou ressources à des organisations terroristes.
**Sanctions :** Jusqu'à 10 ans de prison et 750 000€ d'amende

## Contournement de sanctions
Évitement des mesures restrictives internationales.
**Sanctions :** Sanctions administratives et pénales selon le cas

# Vos obligations

- **Fourniture d'informations exactes** : Vous devez fournir des informations véridiques lors de votre inscription et les maintenir à jour.
- **Justification de l'origine des fonds** : Vous devez pouvoir justifier la provenance légale de vos skins et cryptomonnaies.
- **Signalement d'activités suspectes** : Vous devez nous signaler toute tentative d'utilisation frauduleuse de votre compte.
- **Respect des sanctions internationales** : Vous ne devez pas utiliser nos services pour contourner des sanctions ou embargos.

# Cadre réglementaire

- **Directive européenne** : 5ème directive anti-blanchiment (UE) 2018/843
- **Code monétaire français** : Articles L561-1 à L561-55
- **Autorité de contrôle** : ACPR - Banque de France
- **Cellule de renseignement** : TRACFIN - Ministère des Finances`,
    contentEn: `# Our Commitment

CashTrade applies a zero-tolerance policy towards money laundering, terrorist financing and any illicit activity. We implement strict measures in accordance with European and French regulations.

Our approach is based on the prevention, detection and reporting of any suspicious activity, in close collaboration with the competent authorities.

> **Important warning**: Any attempt at money laundering or financing of illicit activities will result in immediate account closure, seizure of funds and reporting to judicial and financial authorities.

# Monitored Risk Factors

## Geographic Factors
- Countries under international sanctions
- High-risk jurisdictions (FATF list)
- Non-cooperative tax havens
- Areas of conflict or political instability

## Suspicious Behaviors
- Unusually large transactions
- Abnormal frequency of operations
- Use of multiple accounts
- Refusal to provide KYC information

## At-risk Profiles
- Politically Exposed Persons (PEPs)
- Activities in sensitive sectors
- History of sanctions or investigations
- Links with sanctioned entities

## Suspicious Transactions
- Amounts inconsistent with profile
- Structuring to avoid thresholds
- Unjustified source of funds
- Unknown final destination

# Monitoring Measures

## Real-time Surveillance
- Anomaly detection algorithms
- Automatic threshold alerts
- Advanced behavioral analysis
- Correlation with external databases

## Enhanced Controls
- Enhanced Due Diligence (EDD)
- Source of funds verification
- Sanctions list screening
- Manual validation by experts

## Regulatory Reporting
- Automatic TRACFIN declarations
- Periodic reports to ACPR
- Evidence retention for 5 years
- Cooperation with investigations

# Prohibited Activities

## Money Laundering
Conversion of illicitly obtained money into apparently legal funds.
**Penalties:** Up to 5 years imprisonment and €375,000 fine

## Terrorist Financing
Provision of funds or resources to terrorist organizations.
**Penalties:** Up to 10 years imprisonment and €750,000 fine

## Sanctions Evasion
Avoidance of international restrictive measures.
**Penalties:** Administrative and criminal sanctions as applicable

# Your Obligations

- **Provision of accurate information**: You must provide truthful information when registering and keep it up to date.
- **Justification of source of funds**: You must be able to justify the legal origin of your skins and cryptocurrencies.
- **Reporting of suspicious activities**: You must report any attempted fraudulent use of your account.
- **Compliance with international sanctions**: You must not use our services to circumvent sanctions or embargoes.

# Regulatory Framework

- **European Directive**: 5th Anti-Money Laundering Directive (EU) 2018/843
- **French Monetary Code**: Articles L561-1 to L561-55
- **Supervisory Authority**: ACPR - Bank of France
- **Intelligence Unit**: TRACFIN - Ministry of Finance`,
    contactEmail: 'compliance@cashtrade.gg',
    contactPhone: '+33 1 23 45 67 89',
    isPublished: true,
  },
];

async function seedLegalPages() {
  console.log('🌱 Seeding legal pages...');

  for (const page of defaultLegalPages) {
    const existing = await prisma.legalPage.findUnique({
      where: { slug: page.slug },
    });

    if (existing) {
      console.log(`  ⏭️  Page "${page.slug}" already exists, skipping...`);
      continue;
    }

    await prisma.legalPage.create({
      data: page,
    });

    // Créer l'entrée d'historique
    const createdPage = await prisma.legalPage.findUnique({
      where: { slug: page.slug },
    });

    if (createdPage) {
      await prisma.legalPageHistory.create({
        data: {
          legalPageId: createdPage.id,
          legalPageSlug: createdPage.slug,
          titleFr: createdPage.titleFr,
          titleEn: createdPage.titleEn,
          contentFr: createdPage.contentFr,
          contentEn: createdPage.contentEn,
          version: createdPage.version,
          changedBy: 'system',
          changeReason: 'Création initiale (seed)',
        },
      });
    }

    console.log(`  ✅ Created page "${page.slug}"`);
  }

  console.log('✨ Legal pages seeding completed!');
}

seedLegalPages()
  .catch((e) => {
    console.error('❌ Error seeding legal pages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

