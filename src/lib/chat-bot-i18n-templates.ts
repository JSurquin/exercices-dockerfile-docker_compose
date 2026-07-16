/** Templates BOT du widget support — contenu i18n (clé {username} remplacée au rendu). */

export type ChatBotTemplateTree = {
  trade: {
    pending: string;
    blocked: string;
    item_missing: string;
    lock: string;
    bot_issue: string;
  };
  payment: {
    card: string;
    sepa_fr: string;
    sepa_eu: string;
    crypto: string;
  };
  delay: {
    card: string;
    sepa_fr: string;
    sepa_eu: string;
    crypto: string;
  };
  support: {
    bug: string;
    partnership: string;
    kyc: string;
    other: string;
  };
};

export const chatBotTemplatesFr: ChatBotTemplateTree = {
  trade: {
    pending: `Bonjour {username} ! Si vous venez d'envoyer votre trade, le bot peut prendre jusqu'à 15 minutes pour l'accepter.

En attendant, vérifiez attentivement que les informations du bot correspondent bien :
• Steam ID
• Photo de profil
• Pseudo

Si une de ces informations ne correspond pas, vous pourriez être victime d'un API scam ([voir notre guide](/help/scam)).

Si votre problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Si votre problème est résolu, vous pouvez fermer ce ticket.

Merci d'utiliser Moonskin 🤝`,

    blocked: `Bonjour {username} ! Si vous n'arrivez pas à envoyer un trade vers notre bot, vérifiez les points suivants :

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

Merci d'utiliser Moonskin 🤝`,

    item_missing: `Bonjour {username} ! Si vous avez envoyé un trade et que votre skin n'est toujours pas détecté sur le site après 15 minutes, il est possible que vous soyez victime d'un API scam (indépendant de notre plateforme).

Voici comment vérifier :
• Assurez-vous que le compte ayant reçu les skins correspond exactement à notre bot
• Vérifiez le Steam ID, le pseudo et la photo de profil
• Attention : les comptes frauduleux copient généralement la photo et les informations visibles, mais le Steam ID est différent

👉 Dans la plupart des cas, l'API scam fonctionne ainsi :
Vous envoyez l'offre au bon compte, mais un bot malveillant annule l'offre et vous fait accepter une nouvelle offre vers un compte frauduleux.

Si vous êtes victime d'un API scam :
Pas de panique. Vous pouvez effectuer un reverse trade pour tenter de récupérer vos items.
Une fois récupérés, vous pourrez de nouveau les échanger après le délai de trade lock (généralement 30 jours).

⚠️ Important :
Ces bots ne proviennent pas de notre site. Cela signifie que vous avez probablement autorisé votre compte Steam via un site externe malveillant dans le passé. Pensez à changer votre mot de passe.

Si votre problème ne correspond pas à un API scam, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,

    lock: `Bonjour {username} ! Si vous n'arrivez pas à vendre vos skins sur Moonskin, cela est généralement dû à une restriction de trade sur votre compte Steam.

Voici les principales raisons :

1️⃣ Steam Guard non activé
Sans Steam Guard mobile, chaque échange est bloqué pendant 15 jours.
👉 Solution : activez Steam Guard mobile et revenez dans 7 jours.

2️⃣ Connexion récente après inactivité
Si vous vous êtes reconnecté après une longue période d'inactivité, Steam applique automatiquement une restriction de 2 jours.
👉 Vous pourrez vendre vos skins après ce délai.

3️⃣ Modification récente du pseudo
Changer de pseudo entraîne une restriction temporaire d'environ 2 heures sur les échanges.

4️⃣ Modification du compte (mot de passe / Steam Guard / téléphone)
Toute modification récente de sécurité peut entraîner une restriction de 2 à 7 jours.

Si vous ne vous reconnaissez dans aucun de ces cas, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,

    bot_issue: `Bonjour {username} ! Si vous rencontrez un problème lors d'un trade et pensez qu'il provient de notre bot, merci de vérifier les points suivants :

1️⃣ Vérifiez le statut du trade
Si votre trade est immédiatement décliné, il est possible que vous soyez victime d'un API scam.
👉 Consultez notre [guide API scam](/help/scam)

2️⃣ Validation Steam Guard
Assurez-vous d'avoir bien confirmé le trade sur votre téléphone via Steam Guard.

3️⃣ Disponibilité de nos bots
Il est possible que ce bot soit temporairement indisponible.
👉 Dans ce cas :
• laissez la transaction échouer
• annulez l'offre
• puis relancez un nouveau trade

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin 🤝`,
  },
  payment: {
    card: `Bonjour {username} ! 💳 Carte bancaire (Visa / Mastercard)

Nous acceptons la majorité des cartes. Cependant, notre système utilise un mécanisme technique pouvant être interprété comme inhabituel par certaines banques.

👉 En cas de problème :
• Vérifiez les limites de votre carte
• Essayez avec un montant plus faible
• Si la transaction échoue après une autorisation à 0€, votre banque peut bloquer le paiement

👉 Solution :
Contactez votre banque ou validez la transaction via leur notification.

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin 🤝`,

    sepa_fr: `Bonjour {username} ! 🏦 Virement SEPA (France)

Si vous êtes en France, utilisez bien l'option SEPA France. Notre prestataire traite les virements différemment pour la France.

👉 Délais :
• Généralement vers 18h (heure FR)
• Ou le lendemain selon l'heure de demande
• Parfois plus rapide (traitement manuel)

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin 🤝`,

    sepa_eu: `Bonjour {username} ! 🌍 Virement SEPA (Europe)

Les virements SEPA fonctionnent normalement sans problème.

👉 Possibles délais si :
• votre banque effectue des vérifications
• votre banque bloque notre prestataire

👉 Si votre virement n'est pas reçu après 5 jours, merci de nous contacter.

Si le problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Toutes nos excuses pour la gêne occasionnée et merci d'utiliser Moonskin 🤝`,

    crypto: `Bonjour {username} ! 🪙 Cryptomonnaies

Assurez-vous d'envoyer :
• la bonne adresse
• sur la bonne blockchain

⚠️ Une erreur de réseau peut entraîner une perte définitive des fonds. Moonskin ne peut pas être tenu responsable en cas d'erreur d'envoi.

Si votre problème persiste, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,
  },
  delay: {
    card: `Bonjour {username} ! 💳 Délai — Carte bancaire

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam, afin d'éviter tout risque de retour ou d'annulation.

En règle générale, vous recevrez rapidement :
• une demande de remboursement
• ou une autorisation de paiement de 0€

Une fois cette étape validée, le paiement est lancé et ne peut plus être annulé.

👉 Délais :
• instantané à quelques minutes dans la plupart des cas
• jusqu'à 24h selon votre banque

⚠️ Certaines banques ne traitent pas les paiements le week-end ou le lundi.

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,

    sepa_fr: `Bonjour {username} ! 🏦 Délai — Virement SEPA (France)

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

Les virements sont effectués chaque jour aux alentours de 18h (heure FR).

👉 Délais :
• le jour même ou le lendemain
• parfois plus rapide (traitement manuel)

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,

    sepa_eu: `Bonjour {username} ! 🌍 Délai — Virement SEPA (Europe)

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

👉 Délais :
• instantané si votre banque accepte les virements instantanés
• sinon 1 à 3 jours ouvrés

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,

    crypto: `Bonjour {username} ! 🪙 Délai — Cryptomonnaies

Les paiements sont déclenchés après validation de 7 jours du trade côté Steam.

Une fois ce délai passé et votre paiement déclenché, l'envoi crypto est très rapide.

👉 Délais après déclenchement du paiement :
• quasi instantané — en général sous 10 minutes
• quelques minutes selon le réseau blockchain (USDT, ETH, BTC…)

⚠️ Ne confondez pas : les 7 jours de trade hold Steam s'appliquent à toutes les méthodes. Ce n'est pas un délai crypto.

Si vous rencontrez un problème, décrivez votre situation ci-dessous.
Un membre de notre équipe vous répondra rapidement.

Merci d'utiliser Moonskin 🤝`,
  },
  support: {
    bug: `Si vous rencontrez un bug ou avez identifié une amélioration (design, UX, UI, fonctionnalités), merci de nous le signaler ci-dessous.

👉 Vous pouvez préciser :
• votre idée/observation
• la page concernée
• ce qu'il s'est passé
• (optionnel) un screenshot

Un membre de notre équipe prendra en charge votre demande rapidement.

Merci pour votre aide précieuse dans l'amélioration de Moonskin 🤝`,

    partnership: `Bonjour {username} ! Nous sommes toujours ouverts à développer notre communauté et à collaborer avec de nouveaux partenaires.

Que vous soyez :
• créateur de contenu (YouTube, Twitch, réseaux sociaux)
• site ou plateforme
• fournisseur de skins / trader / botter

Vous pouvez nous contacter à l'adresse suivante :
📩 marketing@moonskin.com

Vous pouvez également décrire votre demande ci-dessous afin qu'un membre de notre équipe vérifie qu'elle est bien adaptée.

👉 Si votre profil correspond à nos critères, nous vous recontacterons par email.

Merci pour l'intérêt que vous portez à Moonskin 🤝`,

    kyc: `Bonjour {username} ! Si votre vérification KYC a été refusée, cela peut être dû à plusieurs raisons :

• Documents incomplets ou non conformes
• Informations incorrectes ou illisibles
• Restrictions liées à certains pays ou réglementations

Si vous pensez qu'il s'agit d'une erreur, décrivez votre situation ci-dessous et précisez, si possible, les documents soumis.

Un membre de notre équipe examinera votre demande dans les plus brefs délais.

Merci pour votre compréhension et merci d'utiliser Moonskin 🤝`,

    other: `Merci de décrire votre situation ci-dessous.
Notre équipe support reviendra vers vous rapidement afin de vous aider au mieux. 🤝`,
  },
};

export const chatBotTemplatesEn: ChatBotTemplateTree = {
  trade: {
    pending: `Hello {username}! If you just sent your trade, the bot may take up to 15 minutes to accept it.

In the meantime, carefully verify that the bot's details match:
• Steam ID
• Profile picture
• Username

If any of these do not match, you may be a victim of an API scam ([see our FAQ guide](/help/scam)).

If your issue persists, describe your situation below.
A member of our team will respond shortly.

If your issue is resolved, you can close this ticket.

Thank you for using Moonskin 🤝`,

    blocked: `Hello {username}! If you cannot send a trade to our bot, please check the following:

• Your account has no trade restrictions
• Steam Guard is enabled
• You have not recently:
  – recovered your account (possible restriction)
  – enabled Steam Guard (7-day delay)
  – changed your password (2-day delay)

Without Steam Guard, trades are blocked for 15 days, making trades with our bots impossible.

If everything looks correct, one of our bots may be experiencing an issue. In that case:
→ let the transaction fail on the site
→ then start a new trade

If the problem persists, please describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    item_missing: `Hello {username}! If you sent a trade and your skin is still not detected on the site after 15 minutes, you may be a victim of an API scam (unrelated to our platform).

Here's how to verify:
• Make sure the account that received the skins exactly matches our bot
• Check the Steam ID, username, and profile picture
• Note: fraudulent accounts usually copy the picture and visible info, but the Steam ID is different

👉 In most cases, API scams work like this:
You send the offer to the correct account, but a malicious bot cancels it and tricks you into accepting a new offer to a fraudulent account.

If you are a victim of an API scam:
Don't panic. You can attempt a reverse trade to recover your items.
Once recovered, you can trade them again after the trade lock period (usually 30 days).

⚠️ Important:
These bots do not come from our site. This likely means you authorized your Steam account on a malicious external site in the past. Consider changing your password.

If your issue is not an API scam, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    lock: `Hello {username}! If you cannot sell your skins on Moonskin, this is usually due to a trade restriction on your Steam account.

Here are the main reasons:

1️⃣ Steam Guard not enabled
Without mobile Steam Guard, each trade is blocked for 15 days.
👉 Solution: enable mobile Steam Guard and come back in 7 days.

2️⃣ Recent login after inactivity
If you logged back in after a long period of inactivity, Steam automatically applies a 2-day restriction.
👉 You will be able to sell your skins after this period.

3️⃣ Recent username change
Changing your username causes a temporary restriction of about 2 hours on trades.

4️⃣ Recent account change (password / Steam Guard / phone)
Any recent security change may cause a 2 to 7-day restriction.

If none of these apply, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    bot_issue: `Hello {username}! If you encounter an issue during a trade and believe it comes from our bot, please check the following:

1️⃣ Check the trade status
If your trade is immediately declined, you may be a victim of an API scam.
👉 [See our FAQ guide](/help/scam)

2️⃣ Steam Guard confirmation
Make sure you confirmed the trade on your phone via Steam Guard.

3️⃣ Bot availability
This bot may be temporarily unavailable.
👉 In that case:
• let the transaction fail
• cancel the offer
• then start a new trade

If the problem persists, describe your situation below.
A member of our team will respond shortly.

We apologize for the inconvenience and thank you for using Moonskin 🤝`,
  },
  payment: {
    card: `Hello {username}! 💳 Bank card (Visa / Mastercard)

We accept most cards. However, our system uses a technical mechanism that some banks may flag as unusual.

👉 If you have an issue:
• Check your card limits
• Try a smaller amount
• If the transaction fails after a €0 authorization, your bank may block the payment

👉 Solution:
Contact your bank or approve the transaction via their notification.

If the problem persists, describe your situation below.
A member of our team will respond shortly.

We apologize for the inconvenience and thank you for using Moonskin 🤝`,

    sepa_fr: `Hello {username}! 🏦 SEPA transfer (France)

If you are in France, make sure to use the SEPA France option. Our provider processes transfers differently for France.

👉 Timelines:
• Usually around 6 PM (French time)
• Or the next day depending on when you requested it
• Sometimes faster (manual processing)

If the problem persists, describe your situation below.
A member of our team will respond shortly.

We apologize for the inconvenience and thank you for using Moonskin 🤝`,

    sepa_eu: `Hello {username}! 🌍 SEPA transfer (Europe)

SEPA transfers usually work without issues.

👉 Possible delays if:
• your bank performs additional checks
• your bank blocks our provider

👉 If your transfer is not received after 5 days, please contact us.

If the problem persists, describe your situation below.
A member of our team will respond shortly.

We apologize for the inconvenience and thank you for using Moonskin 🤝`,

    crypto: `Hello {username}! 🪙 Cryptocurrencies

Make sure you send:
• to the correct address
• on the correct blockchain

⚠️ A network error may result in permanent loss of funds. Moonskin cannot be held responsible in case of a sending error.

If your issue persists, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,
  },
  delay: {
    card: `Hello {username}! 💳 Delay — Bank card

Payments are triggered after the 7-day Steam trade validation, to avoid any chargeback or cancellation risk.

Generally, you will quickly receive:
• a refund request
• or a €0 payment authorization

Once this step is validated, the payment is initiated and can no longer be cancelled.

👉 Timelines:
• instant to a few minutes in most cases
• up to 24 hours depending on your bank

⚠️ Some banks do not process payments on weekends or Mondays.

If you encounter an issue, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    sepa_fr: `Hello {username}! 🏦 Delay — SEPA transfer (France)

Payments are triggered after the 7-day Steam trade validation.

Transfers are processed daily around 6 PM (French time).

👉 Timelines:
• same day or next day
• sometimes faster (manual processing)

If you encounter an issue, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    sepa_eu: `Hello {username}! 🌍 Delay — SEPA transfer (Europe)

Payments are triggered after the 7-day Steam trade validation.

👉 Timelines:
• instant if your bank supports instant transfers
• otherwise 1 to 3 business days

If you encounter an issue, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,

    crypto: `Hello {username}! 🪙 Delay — Cryptocurrencies

Payments are triggered after the 7-day Steam trade validation.

Once that hold ends and your payout is triggered, crypto transfers are very fast.

👉 Timelines after payout is triggered:
• nearly instant — usually within 10 minutes
• a few minutes depending on the blockchain network (USDT, ETH, BTC…)

⚠️ Do not confuse: the 7-day Steam trade hold applies to all methods. It is not a crypto delay.

If you encounter an issue, describe your situation below.
A member of our team will respond shortly.

Thank you for using Moonskin 🤝`,
  },
  support: {
    bug: `If you encounter a bug or have identified an improvement (design, UX, UI, features), please report it below.

👉 You can specify:
• your idea/observation
• the page concerned
• what happened
• (optional) a screenshot

A member of our team will handle your request shortly.

Thank you for helping us improve Moonskin 🤝`,

    partnership: `Hello {username}! We are always open to growing our community and collaborating with new partners.

Whether you are:
• a content creator (YouTube, Twitch, social media)
• a website or platform
• a skin supplier / trader / botter

You can contact us at:
📩 marketing@moonskin.com

You can also describe your request below so a team member can verify it is a good fit.

👉 If your profile matches our criteria, we will get back to you by email.

Thank you for your interest in Moonskin 🤝`,

    kyc: `Hello {username}! If your KYC verification was rejected, this may be due to several reasons:

• Incomplete or non-compliant documents
• Incorrect or illegible information
• Restrictions related to certain countries or regulations

If you believe this is an error, describe your situation below and specify, if possible, the documents submitted.

A member of our team will review your request as soon as possible.

Thank you for your understanding and thank you for using Moonskin 🤝`,

    other: `Please describe your situation below.
Our support team will get back to you shortly to help you. 🤝`,
  },
};
