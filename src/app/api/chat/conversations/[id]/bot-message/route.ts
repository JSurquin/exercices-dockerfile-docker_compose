import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { safeParseJson } from '@/lib/validation/helpers';
import { botSubcategoryPostSchema } from '@/lib/validation/schemas/chat-api';

const BOT_MESSAGES: Record<string, (username: string) => string> = {
  'trade.pending': (u) => `Bonjour ${u} ! Si vous venez d'envoyer votre trade, le bot peut prendre jusqu'à 15 minutes pour l'accepter.

En attendant, vérifiez attentivement que les informations du bot correspondent bien :
• Steam ID
• Photo de profil
• Pseudo

Si une de ces informations ne correspond pas, vous pourriez être victime d'un API scam (voir notre guide dans la FAQ).

Si votre problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Si votre problème est résolu, vous pouvez fermer ce ticket.

Merci d'utiliser Moonskin`,

  'trade.blocked': (u) => `Bonjour ${u} ! Si vous n'arrivez pas à envoyer un trade vers notre bot, vérifiez les points suivants :

• Votre compte n'a aucune restriction de trade
• Vous avez bien Steam Guard activé
• Vous n'avez pas récemment :
  – récupéré votre compte (restriction possible)
  – activé Steam Guard (délai de 7 jours)
  – changé votre mot de passe (délai de 2 jours)

Sans Steam Guard, les échanges sont bloqués pendant 15 jours, ce qui rend les trades impossibles avec nos bots.

Si tout est en règle, il est possible qu'un de nos bots rencontre un problème. Dans ce cas :
→ laissez la transaction échouer sur le site
→ puis relancez un nouveau trade

Si le problème persiste, merci de décrire votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'trade.item_missing': (u) => `Bonjour ${u} ! Si vous avez envoyé un trade et que votre skin n'est toujours pas détecté sur le site après 15 minutes, il est possible que vous soyez victime d'un API scam (indépendant de notre plateforme).

Voici comment vérifier :
• Assurez-vous que le compte ayant reçu les skins correspond exactement à notre bot
• Vérifiez le Steam ID, le pseudo et la photo de profil
• Attention : les comptes frauduleux copient généralement la photo et les informations visibles, mais le Steam ID est différent

• Dans la plupart des cas, l'API scam fonctionne ainsi :
Vous envoyez l'offre au bon compte, mais un bot malveillant annule l'offre et vous fait accepter une nouvelle offre vers un compte frauduleux.

Si vous êtes victime d'un API scam :
Pas de panique. Vous pouvez effectuer un reverse trade pour tenter de récupérer vos items.
Une fois récupérés, vous pourrez de nouveau les échanger après le délai de trade lock (généralement 30 jours).

Important : Important :
Ces bots ne proviennent pas de notre site. Cela signifie que vous avez probablement autorisé votre compte Steam via un site externe malveillant dans le passé. Pensez à changer votre mot de passe.

Si votre problème ne correspond pas à un API scam, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'trade.lock': (u) => `Bonjour ${u} ! Si vous n'arrivez pas à vendre vos skins sur Moonskin, cela est généralement dû à une restriction de trade sur votre compte Steam.

Voici les principales raisons :

1. Steam Guard non activé
Sans Steam Guard mobile, chaque échange est bloqué pendant 15 jours.
• Solution : activez Steam Guard mobile et revenez dans 7 jours.

2. Connexion récente après inactivité
Si vous vous êtes reconnecté après une longue période d'inactivité, Steam applique automatiquement une restriction de 2 jours.
• Vous pourrez vendre vos skins après ce délai.

3. Modification récente du pseudo
Changer de pseudo entraîne une restriction temporaire d'environ 2 heures sur les échanges.

4. Modification du compte (mot de passe / Steam Guard / téléphone)
Toute modification récente de sécurité peut entraîner une restriction de 2 à 7 jours.

Si vous ne vous reconnaissez dans aucun de ces cas, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'trade.bot_issue': (u) => `Bonjour ${u} ! Si vous rencontrez un problème lors d'un trade et pensez qu'il provient de notre bot, merci de vérifier les points suivants :

1. Vérifiez le statut du trade
Si votre trade est immédiatement décliné, il est possible que vous soyez victime d'un API scam.
• Consultez notre guide dans la FAQ

2. Validation Steam Guard
Assurez-vous d'avoir bien confirmé le trade sur votre téléphone via Steam Guard.

3. Disponibilité de nos bots
Il est possible que ce bot soit temporairement indisponible.
• Dans ce cas :
• laissez la transaction échouer
• annulez l'offre
• puis relancez un nouveau trade

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin`,

  'payment.card': (u) => `Bonjour ${u} ! Carte bancaire — Carte bancaire (Visa / Mastercard)

Nous acceptons la majorité des cartes. Cependant, notre système utilise un mécanisme technique pouvant être interprété comme inhabituel par certaines banques.

• En cas de problème :
• Vérifiez les limites de votre carte
• Essayez avec un montant plus faible
• Si la transaction échoue après une autorisation à 0€, votre banque peut bloquer le paiement

• Solution :
Contactez votre banque ou validez la transaction via leur notification.

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin`,

  'payment.sepa_fr': (u) => `Bonjour ${u} ! Virement SEPA (France)

Si vous êtes en France, utilisez bien l'option SEPA France. Notre prestataire traite les virements différemment pour la France.

• Délais :
• Généralement vers 18h (heure FR)
• Ou le lendemain selon l'heure de demande
• Parfois plus rapide (traitement manuel)

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin`,

  'payment.sepa_eu': (u) => `Bonjour ${u} ! Virement SEPA (Europe)

Les virements SEPA fonctionnent normalement sans problème.

• Possibles délais si :
• votre banque effectue des vérifications
• votre banque bloque notre prestataire

• Si votre virement n'est pas reçu après 5 jours, merci de nous contacter.

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin`,

  'payment.crypto': (u) => `Bonjour ${u} ! Cryptomonnaies

Assurez-vous d'envoyer :
• la bonne adresse
• sur la bonne blockchain

Important : Une erreur de réseau peut entraîner une perte définitive des fonds. Moonskin ne peut pas être tenu responsable en cas d'erreur d'envoi.

Si votre problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'delay.card': (u) => `Bonjour ${u} ! Carte bancaire — Délai — Carte bancaire

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam, afin d'éviter tout risque de retour ou d'annulation.

En règle générale, vous recevrez rapidement :
• une demande de remboursement
• ou une autorisation de paiement de 0€

Une fois cette étape validée, le paiement est lancé et ne peut plus être annulé.

• Délais :
• instantané à quelques minutes dans la plupart des cas
• jusqu'à 24h selon votre banque

Important : Certaines banques ne traitent pas les paiements le week-end ou le lundi.

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'delay.sepa_fr': (u) => `Bonjour ${u} ! Délai — Virement SEPA (France)

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

Les virements sont effectués chaque jour aux alentours de 18h (heure FR).

• Délais :
• le jour même ou le lendemain
• parfois plus rapide (traitement manuel)

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'delay.sepa_eu': (u) => `Bonjour ${u} ! Délai — Virement SEPA (Europe)

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

• Délais :
• instantané si votre banque accepte les virements instantanés
• sinon 1 à 3 jours ouvrés

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'delay.crypto': (u) => `Bonjour ${u} ! Délai — Cryptomonnaies

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

Les paiements sont envoyés rapidement après validation.

• Délais :
• quasi instantané
• dépend du temps de validation de la blockchain (variable selon le réseau)

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin`,

  'support.bug': () => `Si vous rencontrez un bug ou avez identifié une amélioration (design, UX, UI, fonctionnalités), merci de nous le signaler ci-dessous.

• Vous pouvez préciser :
• votre idée/observation
• la page concernée
• ce qu'il s'est passé
• (optionnel) un screenshot

Un membre de notre équipe prendra en charge votre demande rapidement.

Merci pour votre aide précieuse dans l'amélioration de Moonskin`,

  'support.partnership': (u) => `Bonjour ${u} ! Nous sommes toujours ouverts à développer notre communauté et à collaborer avec de nouveaux partenaires.

Que vous soyez :
• créateur de contenu (YouTube, Twitch, réseaux sociaux)
• site ou plateforme
• fournisseur de skins / trader / botter

Vous pouvez nous contacter à l'adresse suivante :
marketing@moonskin.com

Vous pouvez également décrire votre demande ci-dessous afin qu'un membre de notre équipe vérifie qu'elle est bien adaptée.

• Si votre profil correspond à nos critères, nous vous recontacterons par email.

Merci pour l'intérêt que vous portez à Moonskin`,

  'support.kyc': (u) => `Bonjour ${u} ! Si votre vérification KYC a été refusée, cela peut être dû à plusieurs raisons :

• Documents incomplets ou non conformes
• Informations incorrectes ou illisibles
• Restrictions liées à certains pays ou réglementations

Si vous pensez qu'il s'agit d'une erreur, décrivez votre situation ci-dessous et précisez, si possible, les documents soumis.

Un membre de notre équipe examinera votre demande dans les plus brefs délais.

Merci pour votre compréhension et merci d'utiliser Moonskin`,

  'support.other': () => `Merci de décrire votre situation ci-dessous.
Notre équipe support reviendra vers vous rapidement afin de vous aider au mieux.`,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await auth.api.getSession({ headers: request.headers });

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, botSubcategoryPostSchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    const conversation = await prisma.conversation.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: { select: { id: true, name: true, steamUsername: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 });
    }

    const username =
      conversation.user?.steamUsername ||
      conversation.user?.name ||
      (session?.user?.name ?? 'Utilisateur');

    const templateFn = BOT_MESSAGES[body.subcategoryKey];
    if (!templateFn) {
      return NextResponse.json({ error: 'Clé de sous-catégorie invalide' }, { status: 400 });
    }

    const content = templateFn(username);

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: resolvedParams.id,
        userId: null,
        content,
        senderType: 'BOT',
        isRead: false,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error('Erreur lors de l\'envoi du message bot:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
