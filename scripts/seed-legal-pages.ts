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
    contentFr: `# 1. Objet

Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation des services proposés par Moonskin, plateforme spécialisée dans l'intermédiation, l'achat, la vente et l'échange de skins liés au jeu Counter-Strike 2 (CS2).

En accédant à la plateforme, l'utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter sans réserve.

# 2. Accès aux services

L'accès à la plateforme est ouvert à toute personne.

Toutefois, certaines fonctionnalités, notamment les retraits de fonds, sont soumises à des conditions spécifiques.

L'utilisateur s'engage à :

- Fournir des informations exactes
- Ne pas usurper l'identité d'un tiers

Moonskin se réserve le droit de suspendre, limiter ou supprimer l'accès à tout utilisateur en cas de non-respect des présentes CGU.

# 3. Vérification d'identité (KYC) et conformité

Dans le cadre de la lutte contre le blanchiment de capitaux et le financement du terrorisme, Moonskin peut exiger une vérification d'identité (KYC), notamment lors des retraits.

Cette vérification peut être requise pour :

- Les retraits de fonds
- Certaines opérations jugées sensibles
- Le respect des obligations réglementaires

Moonskin se réserve le droit de :

- Refuser ou bloquer une transaction en cas d'informations incomplètes, incohérentes ou suspectes
- Demander des documents complémentaires
- Suspendre ou clôturer un compte en cas de non-conformité, d'utilisation de faux documents ou de tentative de fraude

Aucun retrait ne pourra être effectué sans validation préalable du KYC lorsque celui-ci est requis.

# 4. Description des services

Moonskin propose notamment :

- Un service de vente de skins CS2 via le site
- Une mise en relation entre vendeurs et acheteurs via le Discord officiel
- Des services d'accès à la supply de skins issus de marketplaces étrangères
- Des outils d'analyse, d'estimation et d'accompagnement

Moonskin agit en tant qu'intermédiaire.

Sauf mention contraire, Moonskin ne détient pas la propriété des biens échangés.

# 5. Transactions et risques

Les utilisateurs reconnaissent que :

- Le marché des skins est fluctuant et non garanti
- Les transactions peuvent être soumises à des contraintes techniques (trade lock Steam de 7 jours, délais, plateformes tierces, frais externes)

Les décisions prises par les utilisateurs relèvent de leur seule responsabilité.

# 6. Absence de conseil financier

Les informations fournies sur Moonskin ne constituent en aucun cas :

- Un conseil en investissement
- Une recommandation financière
- Une incitation à acheter ou vendre

# 7. Responsabilité

Moonskin met en œuvre tous les moyens raisonnables pour assurer le bon fonctionnement de ses services.

Toutefois, la responsabilité de Moonskin ne saurait être engagée en cas de :

- Perte financière
- Fluctuation de la valeur des skins
- Dysfonctionnement de services tiers (Steam, marketplaces, etc.)
- Retard, blocage ou annulation de transaction indépendant de sa volonté

# 8. Comportement des utilisateurs

L'utilisateur s'engage à :

- Respecter les lois en vigueur
- Ne pas utiliser la plateforme à des fins frauduleuses
- Ne pas contourner les systèmes de sécurité

Tout comportement abusif pourra entraîner une suspension immédiate ou définitive du compte.

# 9. Données personnelles

Moonskin accorde une importance particulière à la protection des données personnelles et s'engage à respecter la réglementation en vigueur, notamment le RGPD.

Dans le cadre de certaines opérations, notamment les retraits de fonds, une procédure de vérification d'identité (KYC) peut être requise.

À ce titre :

- Les données KYC sont collectées, traitées et stockées par un prestataire spécialisé : **KYCAID**
- Moonskin n'accède pas directement aux données sensibles, sauf dans les limites strictement nécessaires à la validation des comptes
- Ce prestataire assure un traitement conforme aux exigences réglementaires

L'utilisateur accepte que ses données soient transmises à ce prestataire dans ce cadre.

Moonskin peut également faire appel à des prestataires de paiement, notamment :

- **Flexify**
- **Whitepay**

Moonskin ne saurait être tenue responsable en cas de défaillance imputable à ces prestataires, dans la limite des dispositions légales applicables.

# 10. Modification des CGU

Moonskin se réserve le droit de modifier les présentes CGU à tout moment.

L'utilisation continue des services vaut acceptation des nouvelles conditions.

# 11. Droit applicable

Les présentes CGU sont régies par le droit français.

Tout litige sera soumis aux juridictions compétentes.

# 12. Contact

Pour toute question : **contact@moonskin.com**`,
    contentEn: `# 1. Purpose

These Terms of Service set out the terms of access to and use of the services offered by Moonskin, a platform specialising in intermediation, purchase, sale and exchange of skins related to Counter-Strike 2 (CS2).

By accessing the platform, the user acknowledges having read these Terms and accepts them without reservation.

# 2. Access to services

Access to the platform is open to everyone.

However, certain features, in particular withdrawals, are subject to specific conditions.

The user undertakes to:

- Provide accurate information
- Not impersonate a third party

Moonskin reserves the right to suspend, restrict or remove access for any user who fails to comply with these Terms.

# 3. Identity verification (KYC) and compliance

As part of anti-money laundering and counter-terrorist financing obligations, Moonskin may require identity verification (KYC), in particular for withdrawals.

Such verification may be required for:

- Fund withdrawals
- Certain operations deemed sensitive
- Compliance with regulatory obligations

Moonskin reserves the right to:

- Refuse or block a transaction if information is incomplete, inconsistent or suspicious
- Request additional documents
- Suspend or close an account in the event of non-compliance, use of forged documents or attempted fraud

No withdrawal may be made without prior KYC approval when KYC is required.

# 4. Description of services

Moonskin offers in particular:

- Sale of CS2 skins via the website
- Introduction of sellers and buyers through the official Discord
- Access to skin supply from foreign marketplaces
- Analysis, valuation and support tools

Moonskin acts as an intermediary.

Unless otherwise stated, Moonskin does not own the assets being traded.

# 5. Transactions and risks

Users acknowledge that:

- The skin market is volatile and not guaranteed
- Transactions may be subject to technical constraints (7-day Steam trade lock, delays, third-party platforms, external fees)

Decisions made by users are their sole responsibility.

# 6. No financial advice

Information provided on Moonskin does not constitute:

- Investment advice
- A financial recommendation
- An inducement to buy or sell

# 7. Liability

Moonskin uses reasonable efforts to ensure proper operation of its services.

However, Moonskin shall not be liable for:

- Financial loss
- Fluctuations in skin value
- Malfunction of third-party services (Steam, marketplaces, etc.)
- Delay, blocking or cancellation of a transaction beyond its control

# 8. User conduct

The user undertakes to:

- Comply with applicable laws
- Not use the platform for fraudulent purposes
- Not circumvent security systems

Abusive behaviour may result in immediate or permanent suspension of the account.

# 9. Personal data

Moonskin attaches particular importance to the protection of personal data and undertakes to comply with applicable regulations, including the GDPR.

For certain operations, in particular withdrawals, identity verification (KYC) may be required.

In this respect:

- KYC data is collected, processed and stored by a specialised provider: **KYCAID**
- Moonskin does not directly access sensitive data, except to the strictly limited extent necessary to validate accounts
- That provider processes data in compliance with regulatory requirements

The user agrees that their data may be transferred to that provider in this context.

Moonskin may also use payment providers, including:

- **Flexify**
- **Whitepay**

Moonskin shall not be liable for failures attributable to those providers, to the extent permitted by applicable law.

# 10. Changes to the Terms

Moonskin reserves the right to amend these Terms at any time.

Continued use of the services constitutes acceptance of the new terms.

# 11. Governing law

These Terms are governed by French law.

Any dispute shall be submitted to the competent courts.

# 12. Contact

For any questions: **contact@moonskin.com**`,
    contactEmail: 'contact@moonskin.com',
    contactPhone: null,
    isPublished: true,
  },
  {
    slug: 'privacy',
    titleFr: 'Politique de Confidentialité',
    titleEn: 'Privacy Policy',
    subtitleFr: 'Comment nous collectons, utilisons et protégeons vos données personnelles',
    subtitleEn: 'How we collect, use and protect your personal data',
    contentFr: `# Notre engagement

Chez MoonSkin, la protection de vos données personnelles est notre priorité absolue. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations en conformité avec le Règlement Général sur la Protection des Données (RGPD) et les lois françaises.

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

At MoonSkin, protecting your personal data is our absolute priority. This policy explains how we collect, use, store and protect your information in compliance with the General Data Protection Regulation (GDPR) and French laws.

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
    contactEmail: 'dpo@moonskin.gg',
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
    contactEmail: 'kyc@moonskin.gg',
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

MoonSkin applique une politique de tolérance zéro envers le blanchiment d'argent, le financement du terrorisme et toute activité illicite. Nous mettons en œuvre des mesures strictes conformes aux réglementations européennes et françaises.

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

MoonSkin applies a zero-tolerance policy towards money laundering, terrorist financing and any illicit activity. We implement strict measures in accordance with European and French regulations.

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
    contactEmail: 'compliance@moonskin.gg',
    contactPhone: '+33 1 23 45 67 89',
    isPublished: true,
  },
];

async function seedLegalPages(forceReset: boolean = false) {
  console.log('🌱 Seeding legal pages...');
  
  if (forceReset) {
    console.log('  🔄 Force reset enabled - deleting existing pages...');
    // Supprimer toutes les pages existantes (l'historique est conservé)
    await prisma.legalPage.deleteMany({
      where: {
        slug: {
          in: defaultLegalPages.map(p => p.slug)
        }
      }
    });
    console.log('  🗑️  Existing pages deleted');
  }

  for (const page of defaultLegalPages) {
    const existing = await prisma.legalPage.findUnique({
      where: { slug: page.slug },
    });

    if (existing && !forceReset) {
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
          titleCn: createdPage.titleCn,
          contentFr: createdPage.contentFr,
          contentEn: createdPage.contentEn,
          contentCn: createdPage.contentCn,
          version: createdPage.version,
          changedBy: 'system',
          changeReason: forceReset ? 'Reset (seed --force)' : 'Création initiale (seed)',
        },
      });
    }

    console.log(`  ✅ Created page "${page.slug}"`);
  }

  console.log('✨ Legal pages seeding completed!');
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);
const forceReset = args.includes('--force') || args.includes('-f');

if (forceReset) {
  console.log('⚠️  Running with --force flag: existing pages will be reset!');
}

seedLegalPages(forceReset)
  .catch((e) => {
    console.error('❌ Error seeding legal pages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

