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
    subtitleFr: "Lutte contre le blanchiment de capitaux et le financement du terrorisme",
    subtitleEn: 'Combating money laundering and terrorist financing',
    contentFr: `# 1. Introduction

Moonskin met en place une politique de lutte contre le blanchiment de capitaux et le financement du terrorisme (Anti-Money Laundering – AML).

Cette politique vise à prévenir l'utilisation de la plateforme à des fins illégales et à garantir un environnement sécurisé pour l'ensemble des utilisateurs.

# 2. Engagement de Moonskin

Moonskin s'engage à :

- Prévenir toute utilisation frauduleuse de la plateforme
- Identifier et analyser les comportements à risque
- Mettre en œuvre des procédures de contrôle adaptées
- Coopérer avec les autorités compétentes si nécessaire

# 3. Vérification des utilisateurs

Dans le cadre de cette politique, Moonskin applique des procédures de vérification d'identité (KYC).

Ces vérifications sont réalisées via notre prestataire spécialisé : **KYCAID**

Elles peuvent être exigées notamment :

- Lors de retraits de fonds
- En cas d'activité suspecte
- Pour certains volumes de transactions

# 4. Surveillance des transactions

Moonskin met en place des mécanismes de surveillance afin de détecter :

- Les comportements anormaux ou incohérents
- Les volumes de transactions inhabituels
- Les tentatives de contournement des règles
- Les activités pouvant être liées à du blanchiment

# 5. Mesures en cas de suspicion

En cas de suspicion d'activité frauduleuse ou illicite, Moonskin se réserve le droit de :

- Suspendre ou restreindre un compte
- Bloquer une transaction
- Geler temporairement des fonds
- Demander des informations ou justificatifs supplémentaires

# 6. Signalement

Moonskin peut être amenée à transmettre certaines informations aux autorités compétentes, conformément aux obligations légales en vigueur.

# 7. Tolérance zéro

Moonskin applique une politique de tolérance zéro concernant :

- Le blanchiment de capitaux
- Le financement du terrorisme
- L'utilisation de fonds d'origine illicite
- Les skins issus d'activités frauduleuses (scam, vol, etc.)

Tout manquement pourra entraîner une suspension immédiate et définitive du compte.

# 8. Responsabilité des utilisateurs

Les utilisateurs s'engagent à :

- Utiliser la plateforme de manière légale
- Ne pas dissimuler l'origine des fonds
- Fournir des informations exactes
- Coopérer en cas de vérification

# 9. Conservation des données

Les informations collectées dans le cadre des procédures AML/KYC sont conservées conformément aux obligations légales et réglementaires.

# 10. Modification de la politique

Moonskin se réserve le droit de modifier la présente politique à tout moment afin de s'adapter aux évolutions réglementaires et opérationnelles.`,
    contentEn: `# 1. Introduction

Moonskin implements a policy to combat money laundering and terrorist financing (Anti-Money Laundering – AML).

This policy aims to prevent unlawful use of the platform and to maintain a secure environment for all users.

# 2. Moonskin's commitment

Moonskin undertakes to:

- Prevent fraudulent use of the platform
- Identify and analyse higher-risk behaviour
- Apply appropriate control procedures
- Cooperate with competent authorities where necessary

# 3. User verification

As part of this policy, Moonskin applies identity verification (KYC) procedures.

These checks are carried out through our specialised provider: **KYCAID**

They may be required in particular:

- When withdrawing funds
- In case of suspicious activity
- For certain transaction volumes

# 4. Transaction monitoring

Moonskin uses monitoring mechanisms to help detect:

- Abnormal or inconsistent behaviour
- Unusual transaction volumes
- Attempts to circumvent the rules
- Activity that may relate to money laundering

# 5. Measures if suspicion arises

If fraudulent or illicit activity is suspected, Moonskin may:

- Suspend or restrict an account
- Block a transaction
- Temporarily freeze funds
- Request further information or supporting documents

# 6. Reporting

Moonskin may transmit certain information to competent authorities in accordance with applicable legal obligations.

# 7. Zero tolerance

Moonskin applies zero tolerance regarding:

- Money laundering
- Terrorist financing
- Use of illicitly obtained funds
- Skins from fraudulent activity (scams, theft, etc.)

Any breach may result in immediate and permanent account suspension.

# 8. User responsibilities

Users undertake to:

- Use the platform lawfully
- Not conceal the origin of funds
- Provide accurate information
- Cooperate when verification is required

# 9. Data retention

Information collected under AML/KYC procedures is retained in accordance with legal and regulatory requirements.

# 10. Changes to this policy

Moonskin may amend this policy at any time to reflect regulatory and operational changes.`,
    contactEmail: 'contact@moonskin.com',
    contactPhone: null,
    isPublished: true,
  },
  {
    slug: 'payment-cashout',
    titleFr: 'Conditions de paiement & de cashout',
    titleEn: 'Payment & cashout terms',
    subtitleFr: 'Vente de skins, transactions et règlements sur Moonskin',
    subtitleEn: 'Skin sales, transactions and payouts on Moonskin',
    contentFr: `# 1. Objet

Les présentes conditions encadrent les modalités de vente de skins, de traitement des transactions et de paiement sur la plateforme Moonskin.

# 2. Principe de fonctionnement

Moonskin propose un service permettant aux utilisateurs de vendre leurs skins contre une contrepartie financière.

La plateforme agit en tant qu'intermédiaire ou acheteur, selon les cas.

# 3. Estimation et prix

Le prix affiché lors d'une demande de vente constitue une estimation indicative au moment de la demande.

Le prix final peut évoluer jusqu'à la confirmation effective de la transaction, notamment en fonction des plateformes tierces de payout.

Le prix devient définitif uniquement après validation de la transaction de payout.

# 4. Validation de la transaction

Une transaction est considérée comme engagée lorsque :

- L'utilisateur accepte l'offre proposée
- Le skin est transféré à Moonskin ou à un tiers validé

À partir de ce moment, la transaction est irréversible.

# 5. Trade lock et délais

Les utilisateurs reconnaissent que :

- Certains skins sont soumis à un trade lock Steam (généralement 7 jours)
- Le délai de vente dépend de facteurs externes

Le paiement ne peut intervenir qu'après :

- Réception effective du skin
- Fin du trade lock
- Validation complète de la transaction

# 6. Paiement

Les paiements sont effectués via des prestataires tiers, notamment :

- **Flexify**
- **Whitepay**

Les délais de paiement peuvent varier en fonction :

- Du mode de paiement
- Des délais des prestataires
- Des contrôles de sécurité (KYC)

Moonskin ne peut garantir un délai exact de paiement.

# 7. Frais

Des frais peuvent s'appliquer à la transaction.

Ces frais peuvent inclure :

- Des frais Moonskin
- Des frais de prestataires tiers
- Des frais liés aux plateformes utilisées

Les frais connus sont affichés avant validation.

# 8. Conditions de paiement

Le paiement est effectué uniquement si :

- Le skin a été reçu et validé
- Le KYC (si requis) est complété
- Aucune anomalie n'est détectée

En cas de non-respect de ces conditions, le paiement peut être suspendu.

# 9. Absence de garantie

Moonskin ne garantit pas :

- La vente immédiate d'un skin
- Un prix fixe dans le temps
- Une liquidité constante

# 10. Annulation

Une fois le skin transféré :

- La transaction ne peut plus être annulée
- Aucun retour en arrière n'est possible

# 11. Suspension et gel des fonds

Moonskin se réserve le droit de :

- Suspendre une transaction
- Retarder un paiement
- Geler temporairement des fonds

En cas de :

- Suspicion de fraude
- Non-conformité
- Activité anormale
- Demande des forces de l'ordre

# 12. Dépendance aux services tiers

Moonskin dépend de services externes tels que :

- Steam
- Marketplaces
- Prestataires de paiement

Moonskin ne peut être tenue responsable des dysfonctionnements ou retards liés à ces services.

# 13. Responsabilité de l'utilisateur

L'utilisateur est responsable :

- De la validité de ses informations
- De son trade link
- Des actions effectuées depuis son compte

Toute erreur imputable à l'utilisateur ne pourra engager la responsabilité de Moonskin.

# 14. Refus de transaction

Moonskin se réserve le droit de refuser toute transaction :

- Suspecte
- Non conforme
- Ou présentant un risque

Sans obligation de justification détaillée.

# 15. Modification

Moonskin se réserve le droit de modifier les présentes conditions à tout moment.`,
    contentEn: `# 1. Purpose

These terms govern how skin sales, transaction processing and payments work on Moonskin.

# 2. How it works

Moonskin offers a service allowing users to sell skins for cash consideration.

The platform may act as an intermediary or as buyer, depending on the case.

# 3. Pricing and estimates

The price shown when you request a sale is an indicative estimate at that moment.

The final amount may change until the transaction is actually confirmed, including based on third-party payout platforms.

The price is final only once the payout transaction is validated.

# 4. Transaction commitment

A transaction is considered binding when:

- You accept the proposed offer
- The skin is transferred to Moonskin or an approved third party

From that point, the transaction is irreversible.

# 5. Trade lock and timing

You acknowledge that:

- Some skins are subject to a Steam trade lock (often 7 days)
- Sale timing depends on external factors

Payment can only occur after:

- The skin is actually received
- The trade lock ends
- The transaction is fully validated

# 6. Payment

Payments are made through third-party providers, including:

- **Flexify**
- **Whitepay**

Timing may vary depending on:

- Payment method
- Provider processing times
- Security checks (KYC)

Moonskin cannot guarantee an exact payment timeframe.

# 7. Fees

Fees may apply to the transaction.

They may include:

- Moonskin fees
- Third-party provider fees
- Platform-related fees

Known fees are shown before you confirm.

# 8. Payment conditions

Payment is made only if:

- The skin has been received and validated
- KYC (if required) is completed
- No anomaly is detected

If these conditions are not met, payment may be suspended.

# 9. No guarantee

Moonskin does not guarantee:

- Immediate sale of a skin
- A fixed price over time
- Constant liquidity

# 10. Cancellation

Once the skin is transferred:

- The transaction cannot be cancelled
- No rollback is possible

# 11. Suspension and freezing

Moonskin may:

- Suspend a transaction
- Delay a payout
- Temporarily freeze funds

Where there is:

- Suspected fraud
- Non-compliance
- Abnormal activity
- A request from law enforcement

# 12. Third-party services

Moonskin relies on external services such as:

- Steam
- Marketplaces
- Payment providers

Moonskin is not liable for outages or delays caused by those services.

# 13. User responsibility

You are responsible for:

- The accuracy of your information
- Your trade link
- Actions taken from your account

Moonskin is not liable for errors attributable to you.

# 14. Refusal of a transaction

Moonskin may refuse any transaction that is:

- Suspicious
- Non-compliant
- Or presenting undue risk

Without a detailed obligation to justify the decision.

# 15. Changes

Moonskin may amend these terms at any time.`,
    contactEmail: 'contact@moonskin.com',
    contactPhone: null,
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

