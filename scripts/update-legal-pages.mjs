import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const privacyFr = `# Politique de confidentialité

## 1. Introduction

La présente politique de confidentialité a pour objectif d'informer les utilisateurs de la plateforme Moonskin sur la manière dont leurs données personnelles sont collectées, utilisées et protégées.

Moonskin attache une importance particulière à la protection de la vie privée et s'engage à traiter les données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD).

## 2. Responsable du traitement

Le responsable du traitement est :

COUNTER TRADE FRANCE
SASU immatriculée en France
SIRET : 939 155 875 00015
Email : countertradefrance@gmail.com
Adresse : 53 T RUE AUGUSTE BLANQUI 78800 HOUILLES

## 3. Données collectées

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

Ces données sont collectées et traitées via notre prestataire spécialisé :
KYCAID

## 4. Finalités du traitement

Les données sont utilisées pour :

- Fournir et améliorer les services Moonskin
- Sécuriser les transactions
- Prévenir la fraude et les activités illicites
- Gérer les paiements et retraits
- Respecter les obligations légales
- Communiquer avec les utilisateurs

## 5. Base légale

Les traitements reposent sur :

- L'exécution du contrat (utilisation de la plateforme)
- Le respect des obligations légales
- L'intérêt légitime (sécurité, amélioration du service)
- Le consentement (le cas échéant)

## 6. Partage des données

Les données peuvent être partagées avec des prestataires de confiance, uniquement lorsque cela est nécessaire au fonctionnement du service :

- KYCAID — vérification d'identité (KYC)
- Flexify — traitement des paiements
- Whitepay — solutions de paiement

Ainsi que :

- Fournisseurs techniques (hébergement, infrastructure)
- Autorités légales si requis

Moonskin ne vend ni ne loue les données personnelles.

## 7. Conservation des données

Les données sont conservées :

- Pendant la durée d'utilisation du service
- Puis archivées selon les obligations légales

Les données de vérification (KYC) peuvent être conservées conformément aux exigences réglementaires des prestataires concernés.

## 8. Sécurité

Moonskin met en œuvre des mesures de sécurité adaptées :

- Accès restreint aux données
- Chiffrement des données sensibles
- Surveillance des activités suspectes

## 9. Vos droits

Conformément au RGPD, vous disposez des droits suivants :

- Droit d'accès
- Droit de rectification
- Droit de suppression
- Droit d'opposition
- Droit à la portabilité

Vous pouvez exercer vos droits à : contact@moonskin.fun

## 10. Cookies

Moonskin utilise des cookies afin de :

- Assurer le bon fonctionnement du site
- Améliorer l'expérience utilisateur
- Analyser l'utilisation de la plateforme

Vous pouvez gérer vos préférences directement depuis votre navigateur.

## 11. Modifications

Cette politique peut être modifiée à tout moment afin de refléter les évolutions du service ou des obligations légales.

## 12. Contact

Pour toute question relative à cette politique :

Email : contact@moonskin.fun`;

const kycPolicyFr = `# Politique KYC (Know Your Customer)

## 1. Introduction

Dans le cadre de son activité, Moonskin met en place des procédures de vérification d'identité (KYC – Know Your Customer) afin de garantir la sécurité des transactions et de prévenir toute activité frauduleuse.

Cette politique vise à assurer la conformité avec les obligations en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme (LCB-FT).

## 2. Objectifs du KYC

Les procédures KYC ont pour objectif de :

- Vérifier l'identité des utilisateurs
- Prévenir les fraudes et les usurpations d'identité
- Lutter contre les activités illicites
- Sécuriser les transactions sur la plateforme
- Assurer la conformité réglementaire

## 3. Cas nécessitant une vérification

Une vérification KYC peut être exigée dans les situations suivantes :

- Lors d'une demande de retrait de fonds
- En cas d'activité suspecte ou inhabituelle
- Pour certains volumes de transactions
- En cas de doute sur l'identité de l'utilisateur
- Pour répondre à des obligations légales

Moonskin se réserve le droit d'exiger un KYC à tout moment.

## 4. Procédure de vérification

La vérification d'identité est réalisée via notre prestataire spécialisé :

KYCAID

L'utilisateur pourra être amené à fournir :

- Une pièce d'identité valide
- Un selfie ou une vérification biométrique
- Tout document complémentaire jugé nécessaire

Le traitement des données est effectué directement par KYCAID.

## 5. Refus ou non-conformité

Moonskin se réserve le droit de :

- Refuser un KYC en cas de documents invalides ou falsifiés
- Demander des informations complémentaires
- Suspendre ou restreindre un compte
- Bloquer une transaction

Aucun retrait ne pourra être effectué sans validation du KYC lorsque celui-ci est requis.

## 6. Lutte contre la fraude

Moonskin applique une politique de tolérance zéro concernant :

- Les comptes frauduleux
- Les tentatives d'usurpation d'identité
- L'utilisation de fonds d'origine illicite
- Les skins issus de scams

Toute activité suspecte pourra entraîner :

- Une suspension immédiate du compte
- Un gel des fonds
- Un signalement aux autorités compétentes si nécessaire

## 7. Protection des données

Les données collectées dans le cadre du KYC :

- Sont traitées par KYCAID
- Sont sécurisées conformément aux standards en vigueur
- Ne sont accessibles que dans la limite nécessaire à la validation

Moonskin ne stocke pas directement les données sensibles lorsque cela n'est pas nécessaire.

## 8. Conservation des données

Les données KYC peuvent être conservées pendant la durée nécessaire au respect des obligations légales et réglementaires.

## 9. Droits des utilisateurs

Conformément à la réglementation en vigueur, les utilisateurs disposent de droits sur leurs données personnelles.

Toute demande peut être adressée à : contact@moonskin.fun

## 10. Modification de la politique

Moonskin se réserve le droit de modifier la présente politique à tout moment.`;

const amlPolicyFr = `# Politique Anti-Blanchiment (AML)

## 1. Introduction

Moonskin met en place une politique de lutte contre le blanchiment de capitaux et le financement du terrorisme (Anti-Money Laundering – AML).

Cette politique vise à prévenir l'utilisation de la plateforme à des fins illégales et à garantir un environnement sécurisé pour l'ensemble des utilisateurs.

## 2. Engagement de Moonskin

Moonskin s'engage à :

- Prévenir toute utilisation frauduleuse de la plateforme
- Identifier et analyser les comportements à risque
- Mettre en œuvre des procédures de contrôle adaptées
- Coopérer avec les autorités compétentes si nécessaire

## 3. Vérification des utilisateurs

Dans le cadre de cette politique, Moonskin applique des procédures de vérification d'identité (KYC).

Ces vérifications sont réalisées via notre prestataire spécialisé :

KYCAID

Elles peuvent être exigées notamment :

- Lors de retraits de fonds
- En cas d'activité suspecte
- Pour certains volumes de transactions

## 4. Surveillance des transactions

Moonskin met en place des mécanismes de surveillance afin de détecter :

- Les comportements anormaux ou incohérents
- Les volumes de transactions inhabituels
- Les tentatives de contournement des règles
- Les activités pouvant être liées à du blanchiment

## 5. Mesures en cas de suspicion

En cas de suspicion d'activité frauduleuse ou illicite, Moonskin se réserve le droit de :

- Suspendre ou restreindre un compte
- Bloquer une transaction
- Geler temporairement des fonds
- Demander des informations ou justificatifs supplémentaires

## 6. Signalement

Moonskin peut être amenée à transmettre certaines informations aux autorités compétentes, conformément aux obligations légales en vigueur.

## 7. Tolérance zéro

Moonskin applique une politique de tolérance zéro concernant :

- Le blanchiment de capitaux
- Le financement du terrorisme
- L'utilisation de fonds d'origine illicite
- Les skins issus d'activités frauduleuses (scam, vol, etc.)

Tout manquement pourra entraîner une suspension immédiate et définitive du compte.

## 8. Responsabilité des utilisateurs

Les utilisateurs s'engagent à :

- Utiliser la plateforme de manière légale
- Ne pas dissimuler l'origine des fonds
- Fournir des informations exactes
- Coopérer en cas de vérification

## 9. Conservation des données

Les informations collectées dans le cadre des procédures AML/KYC sont conservées conformément aux obligations légales et réglementaires.

## 10. Modification de la politique

Moonskin se réserve le droit de modifier la présente politique à tout moment afin de s'adapter aux évolutions réglementaires et opérationnelles.`;

async function main() {
  console.log('Mise à jour des pages légales...');

  // Privacy
  const privacy = await prisma.legalPage.upsert({
    where: { slug: 'privacy' },
    update: {
      titleFr: 'Politique de confidentialité',
      subtitleFr: 'Comment Moonskin collecte, utilise et protège vos données personnelles',
      contentFr: privacyFr,
      contactEmail: 'contact@moonskin.fun',
      isPublished: true,
    },
    create: {
      slug: 'privacy',
      titleFr: 'Politique de confidentialité',
      titleEn: 'Privacy Policy',
      subtitleFr: 'Comment Moonskin collecte, utilise et protège vos données personnelles',
      subtitleEn: 'How Moonskin collects, uses and protects your personal data',
      contentFr: privacyFr,
      contentEn: privacyFr,
      contactEmail: 'contact@moonskin.fun',
      version: '1.0',
      isPublished: true,
    },
  });
  console.log('✓ Privacy mise à jour :', privacy.slug);

  // KYC Policy
  const kyc = await prisma.legalPage.upsert({
    where: { slug: 'kyc-policy' },
    update: {
      titleFr: 'Politique KYC (Know Your Customer)',
      subtitleFr: 'Vérification d\'identité, sécurité des transactions et conformité LCB-FT',
      contentFr: kycPolicyFr,
      contactEmail: 'contact@moonskin.fun',
      isPublished: true,
    },
    create: {
      slug: 'kyc-policy',
      titleFr: 'Politique KYC (Know Your Customer)',
      titleEn: 'KYC Policy (Know Your Customer)',
      subtitleFr: 'Vérification d\'identité, sécurité des transactions et conformité LCB-FT',
      subtitleEn: 'Identity verification, transaction security and AML/CFT compliance',
      contentFr: kycPolicyFr,
      contentEn: kycPolicyFr,
      contactEmail: 'contact@moonskin.fun',
      version: '1.0',
      isPublished: true,
    },
  });
  console.log('✓ KYC Policy mise à jour :', kyc.slug);

  // AML Policy
  const aml = await prisma.legalPage.upsert({
    where: { slug: 'aml-policy' },
    update: {
      titleFr: 'Politique Anti-Blanchiment (AML)',
      subtitleFr: 'Lutte contre le blanchiment de capitaux et le financement du terrorisme',
      contentFr: amlPolicyFr,
      contactEmail: 'contact@moonskin.fun',
      isPublished: true,
    },
    create: {
      slug: 'aml-policy',
      titleFr: 'Politique Anti-Blanchiment (AML)',
      titleEn: 'Anti-Money Laundering Policy (AML)',
      subtitleFr: 'Lutte contre le blanchiment de capitaux et le financement du terrorisme',
      subtitleEn: 'Anti-money laundering and counter-terrorism financing policy',
      contentFr: amlPolicyFr,
      contentEn: amlPolicyFr,
      contactEmail: 'contact@moonskin.fun',
      version: '1.0',
      isPublished: true,
    },
  });
  console.log('✓ AML Policy mise à jour :', aml.slug);

  console.log('\nToutes les pages légales ont été mises à jour avec le texte exact du client.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
