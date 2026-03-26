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
    titleFr: 'Politique de confidentialité',
    titleEn: 'Privacy Policy',
    subtitleFr: 'Comment Moonskin collecte, utilise et protège vos données personnelles',
    subtitleEn: 'How Moonskin collects, uses and protects your personal data',
    contentFr: `# 1. Introduction

La présente politique de confidentialité a pour objectif d'informer les utilisateurs de la plateforme Moonskin sur la manière dont leurs données personnelles sont collectées, utilisées et protégées.

Moonskin attache une importance particulière à la protection de la vie privée et s'engage à traiter les données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD).

# 2. Responsable du traitement

Le responsable du traitement est :

COUNTER TRADE FRANCE  
SASU immatriculée en France  
SIRET : 939 155 875 00015  
Email : countertradefrance@gmail.com  
Adresse : 53 T RUE AUGUSTE BLANQUI 78800 HOUILLES

# 3. Données collectées

Nous pouvons collecter les données suivantes :

**Données d'identification**
- Nom / pseudonyme
- Adresse email
- Identifiant Steam

**Données de transaction**
- Historique des ventes et achats
- Skins échangés
- Montants des transactions

**Données techniques**
- Adresse IP
- Données de connexion
- Navigateur / appareil

**Données de vérification (KYC)**

Dans le cadre de la sécurisation de la plateforme et de la conformité réglementaire, certaines vérifications peuvent être requises.

Ces données sont collectées et traitées via notre prestataire spécialisé : **KYCAID**

# 4. Finalités du traitement

Les données sont utilisées pour :

- Fournir et améliorer les services Moonskin
- Sécuriser les transactions
- Prévenir la fraude et les activités illicites
- Gérer les paiements et retraits
- Respecter les obligations légales
- Communiquer avec les utilisateurs

# 5. Base légale

Les traitements reposent sur :

- L'exécution du contrat (utilisation de la plateforme)
- Le respect des obligations légales
- L'intérêt légitime (sécurité, amélioration du service)
- Le consentement (le cas échéant)

# 6. Partage des données

Les données peuvent être partagées avec des prestataires de confiance, uniquement lorsque cela est nécessaire au fonctionnement du service :

- **KYCAID** — vérification d'identité (KYC)
- **Flexify** — traitement des paiements
- **Whitepay** — solutions de paiement

Ainsi que :

- Fournisseurs techniques (hébergement, infrastructure)
- Autorités légales si requis

Moonskin ne vend ni ne loue les données personnelles.

# 7. Conservation des données

Les données sont conservées :

- Pendant la durée d'utilisation du service
- Puis archivées selon les obligations légales

Les données de vérification (KYC) peuvent être conservées conformément aux exigences réglementaires des prestataires concernés.

# 8. Sécurité

Moonskin met en œuvre des mesures de sécurité adaptées :

- Accès restreint aux données
- Chiffrement des données sensibles
- Surveillance des activités suspectes

# 9. Vos droits

Conformément au RGPD, vous disposez des droits suivants :

- Droit d'accès
- Droit de rectification
- Droit de suppression
- Droit d'opposition
- Droit à la portabilité

Vous pouvez exercer vos droits à : **contact@moonskin.fun**

# 10. Cookies

Moonskin utilise des cookies afin de :

- Assurer le bon fonctionnement du site
- Améliorer l'expérience utilisateur
- Analyser l'utilisation de la plateforme

Vous pouvez gérer vos préférences directement depuis votre navigateur.

# 11. Modifications

Cette politique peut être modifiée à tout moment afin de refléter les évolutions du service ou des obligations légales.

# 12. Contact

Pour toute question relative à cette politique :

Email : **contact@moonskin.fun**`,
    contentEn: `# 1. Introduction

This privacy policy describes how Moonskin collects, uses and protects personal data for users of the platform.

Moonskin takes privacy seriously and processes personal data in accordance with the General Data Protection Regulation (GDPR).

# 2. Data controller

The data controller is:

COUNTER TRADE FRANCE  
French simplified joint-stock company (SASU)  
SIRET: 939 155 875 00015  
Email: countertradefrance@gmail.com  
Address: 53 T rue Auguste Blanqui, 78800 Houilles, France

# 3. Data collected

We may collect:

**Identification data**
- Name / display name
- Email address
- Steam ID

**Transaction data**
- Sales and purchase history
- Skins exchanged
- Transaction amounts

**Technical data**
- IP address
- Connection data
- Browser / device

**Verification data (KYC)**

Certain checks may be required for platform security and regulatory compliance.

This data is collected and processed through our specialised provider: **KYCAID**

# 4. Purposes

Data is used to:

- Provide and improve Moonskin services
- Secure transactions
- Prevent fraud and unlawful activity
- Manage payments and withdrawals
- Comply with legal obligations
- Communicate with users

# 5. Legal basis

Processing is based on:

- Performance of the contract (use of the platform)
- Legal obligations
- Legitimate interests (security, service improvement)
- Consent (where applicable)

# 6. Sharing

Data may be shared with trusted processors only where necessary:

- **KYCAID** — identity verification (KYC)
- **Flexify** — payment processing
- **Whitepay** — payment solutions

As well as:

- Technical providers (hosting, infrastructure)
- Authorities where required by law

Moonskin does not sell or rent personal data.

# 7. Retention

Data is retained:

- For the duration of use of the service
- Then archived according to legal obligations

KYC data may be retained in line with requirements applicable to the relevant providers.

# 8. Security

Moonskin implements appropriate measures:

- Restricted access to data
- Encryption of sensitive data
- Monitoring of suspicious activity

# 9. Your rights

Under the GDPR you have:

- Right of access
- Right to rectification
- Right to erasure
- Right to object
- Right to data portability

To exercise your rights: **contact@moonskin.fun**

# 10. Cookies

Moonskin uses cookies to:

- Ensure the site works properly
- Improve user experience
- Analyse use of the platform

You can manage preferences in your browser.

# 11. Changes

This policy may be updated at any time to reflect changes to our services or legal requirements.

# 12. Contact

Questions about this policy:

Email: **contact@moonskin.fun**`,
    contactEmail: 'contact@moonskin.fun',
    contactPhone: null,
    isPublished: true,
  },
  {
    slug: 'kyc-policy',
    titleFr: 'Politique KYC (Know Your Customer)',
    titleEn: 'KYC Policy (Know Your Customer)',
    subtitleFr: "Vérification d'identité, sécurité des transactions et conformité LCB-FT",
    subtitleEn: 'Identity verification, transaction security and AML/CFT compliance',
    contentFr: `# 1. Introduction

Dans le cadre de son activité, Moonskin met en place des procédures de vérification d'identité (KYC – Know Your Customer) afin de garantir la sécurité des transactions et de prévenir toute activité frauduleuse.

Cette politique vise à assurer la conformité avec les obligations en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT).

# 2. Objectifs du KYC

Les procédures KYC ont pour objectif de :

- Vérifier l'identité des utilisateurs
- Prévenir les fraudes et les usurpations d'identité
- Lutter contre les activités illicites
- Sécuriser les transactions sur la plateforme
- Assurer la conformité réglementaire

# 3. Cas nécessitant une vérification

Une vérification KYC peut être exigée dans les situations suivantes :

- Lors d'une demande de retrait de fonds
- En cas d'activité suspecte ou inhabituelle
- Pour certains volumes de transactions
- En cas de doute sur l'identité de l'utilisateur
- Pour répondre à des obligations légales

Moonskin se réserve le droit d'exiger un KYC à tout moment.

# 4. Procédure de vérification

La vérification d'identité est réalisée via notre prestataire spécialisé : **KYCAID**

L'utilisateur pourra être amené à fournir :

- Une pièce d'identité valide
- Un selfie ou une vérification biométrique
- Tout document complémentaire jugé nécessaire

Le traitement des données est effectué directement par KYCAID.

# 5. Refus ou non-conformité

Moonskin se réserve le droit de :

- Refuser un KYC en cas de documents invalides ou falsifiés
- Demander des informations complémentaires
- Suspendre ou restreindre un compte
- Bloquer une transaction

Aucun retrait ne pourra être effectué sans validation du KYC lorsque celui-ci est requis.

# 6. Lutte contre la fraude

Moonskin applique une politique de tolérance zéro concernant :

- Les comptes frauduleux
- Les tentatives d'usurpation d'identité
- L'utilisation de fonds d'origine illicite
- Les skins issus de scams

Toute activité suspecte pourra entraîner :

- Une suspension immédiate du compte
- Un gel des fonds
- Un signalement aux autorités compétentes si nécessaire

# 7. Protection des données

Les données collectées dans le cadre du KYC :

- Sont traitées par KYCAID
- Sont sécurisées conformément aux standards en vigueur
- Ne sont accessibles que dans la limite nécessaire à la validation

Moonskin ne stocke pas directement les données sensibles lorsque cela n'est pas nécessaire.

# 8. Conservation des données

Les données KYC peuvent être conservées pendant la durée nécessaire au respect des obligations légales et réglementaires.

# 9. Droits des utilisateurs

Conformément à la réglementation en vigueur, les utilisateurs disposent de droits sur leurs données personnelles.

Toute demande peut être adressée à : **contact@moonskin.com**

# 10. Modification de la politique

Moonskin se réserve le droit de modifier la présente politique à tout moment.`,
    contentEn: `# 1. Introduction

Moonskin operates Know Your Customer (KYC) identity verification procedures to secure transactions and help prevent fraudulent activity.

This policy supports compliance with anti-money laundering and counter-terrorist financing (AML/CFT) obligations.

# 2. Objectives of KYC

KYC procedures aim to:

- Verify users' identities
- Prevent fraud and identity theft
- Combat unlawful activity
- Secure transactions on the platform
- Meet regulatory requirements

# 3. When verification is required

KYC may be required in situations such as:

- A request to withdraw funds
- Suspicious or unusual activity
- Certain transaction volumes
- Doubts about a user's identity
- Legal obligations

Moonskin may require KYC at any time.

# 4. Verification process

Identity verification is performed through our specialised provider: **KYCAID**

You may be asked to provide:

- A valid identity document
- A selfie or biometric verification
- Any additional document deemed necessary

Data processing is carried out directly by KYCAID.

# 5. Refusal or non-compliance

Moonskin may:

- Reject KYC if documents are invalid or forged
- Request further information
- Suspend or restrict an account
- Block a transaction

No withdrawal may be made without KYC approval when KYC is required.

# 6. Anti-fraud

Moonskin applies a zero-tolerance policy regarding:

- Fraudulent accounts
- Identity theft attempts
- Use of funds from illicit sources
- Skins originating from scams

Suspicious activity may lead to:

- Immediate account suspension
- Freezing of funds
- Reporting to competent authorities where appropriate

# 7. Data protection

Data collected for KYC:

- Is processed by KYCAID
- Is secured in line with applicable standards
- Is accessed only to the extent necessary for validation

Moonskin does not store sensitive data directly where this is not necessary.

# 8. Data retention

KYC data may be retained for as long as necessary to comply with legal and regulatory obligations.

# 9. User rights

Under applicable law, users have rights over their personal data.

Requests may be sent to: **contact@moonskin.com**

# 10. Changes to this policy

Moonskin may amend this policy at any time.`,
    contactEmail: 'contact@moonskin.com',
    contactPhone: null,
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

