import {
  evaluateUserMessageForAi,
  OFF_TOPIC_REFUSAL_I18N_KEY,
  shouldAiReplyToConversation,
} from '@/lib/chat-ai-guards';

const MOONSKIN_KEYWORD_SAMPLES: Array<[string, string]> = [
  ['moonskin', 'Je veux utiliser moonskin pour vendre'],
  ['moon skin', 'Question sur moon skin'],
  ['skin', 'Mon skin ne passe pas'],
  ['skins', 'Vendre mes skins cs2'],
  ['cs2', 'Problème cs2 trade'],
  ['csgo', 'Migration csgo vers cs2'],
  ['counter-strike', 'Skins counter-strike bloqués'],
  ['steam', 'Mon compte steam'],
  ['trade', 'Mon trade est en attente'],
  ['trade link', 'Où mettre mon trade link'],
  ['trade hold', 'Délai trade hold'],
  ['trade offer', 'Offre trade offer refusée'],
  ['payout', 'Mon payout n arrive pas'],
  ['paiement', 'Problème de paiement'],
  ['payer', 'Je veux payer en crypto'],
  ['sepa', 'Virement sepa en retard'],
  ['crypto', 'Retrait crypto'],
  ['bitcoin', 'Paiement bitcoin'],
  ['ethereum', 'Ethereum confirmé ?'],
  ['usdt', 'USDT sur le mauvais réseau'],
  ['kyc', 'Mon kyc est refusé'],
  ['iban', 'Changement iban'],
  ['cashout', 'Cashout bloqué'],
  ['retrait', 'Retrait en attente'],
  ['estimation', 'Estimation incorrecte'],
  ['giveaway', 'Ticket giveaway'],
  ['ticket', 'Mon ticket support'],
  ['xp', 'Gain xp après vente'],
  ['modérateur', 'Parler à un modérateur'],
  ['moderateur', 'Besoin moderateur humain'],
  ['bot', 'Le bot refuse mon trade'],
  ['inventaire', 'Inventaire steam vide'],
  ['skinplace', 'API skinplace'],
  ['vendre', 'Comment vendre'],
  ['vente', 'Ma vente est bloquée'],
  ['frais', 'Frais de cashout'],
  ['commission', 'Commission affiliation'],
  ['affiliation', 'Lien affiliation'],
  ['fragment', 'Fragment trade'],
  ['steam guard', 'Steam guard activé'],
  ['carte', 'Paiement carte refusé'],
  ['visa', 'Carte visa'],
  ['mastercard', 'Mastercard bloquée'],
  ['flexify', 'Flexify payout'],
  ['whitepay', 'Whitepay status'],
  ['offre steam', 'Offre steam annulée'],
  ['délai', 'Quel délai payout'],
  ['delai', 'Delai sepa'],
  ['remboursement', 'Demande remboursement'],
  ['litige', 'Litige chargeback'],
  ['bug', 'Bug sur le site'],
  ['problème', 'J ai un problème'],
  ['probleme', 'Probleme trade'],
  ['aide', 'Besoin aide'],
  ['support', 'Support moonskin'],
  ['compte', 'Mon compte est gelé'],
  ['connexion', 'Connexion steam'],
  ['login', 'Login steam openid'],
  ['dépôt', 'Dépôt wallet'],
  ['depot', 'Depot crypto'],
  ['wallet', 'Adresse wallet'],
  ['portefeuille', 'Portefeuille crypto'],
];

const OFF_TOPIC_SAMPLES: Array<[string, string]> = [
  ['recette', 'Donne-moi une recette de tarte aux pommes'],
  ['cuisine', 'Comment cuisiner des pâtes'],
  ['devinette', 'Devine mon âge'],
  ['blague', 'Raconte-moi une blague'],
  ['histoire', 'Raconte une histoire drôle'],
  ['poème', 'Écris-moi un poème'],
  ['devoir', 'Résous mon exercice de mathématiques scolaire'],
  ['homework', 'Help with my homework'],
  ['météo', 'Quel temps demain'],
  ['weather', 'What is the weather today'],
  ['football', 'Score du match de foot'],
  ['politique', 'Ton avis sur la politique'],
  ['actualité', 'Quelles sont les actualités'],
  ['news', 'Latest news please'],
  ['python', 'Écris-moi un script Python'],
  ['javascript', 'Code javascript pour trier un tableau'],
  ['programmer', 'Apprends-moi à programmer'],
  ['recette explicite', 'Fais-moi une recette de gâteau au chocolat'],
  ['poeme explicite', 'Donne-moi un poème sur la mer'],
  ['histoire explicite', 'Write me a short story about dragons'],
  ['blague explicite', 'Give me a joke about cats'],
  ['devinette explicite', 'Devine un nombre entre 1 et 100'],
  ['philosophie', 'Parle-moi de philosophie antique'],
  ['astronomie', 'Explique-moi les trous noirs'],
  ['medecine', 'Diagnostic médical pour mal de tête'],
];

const GREETING_SAMPLES = [
  'Bonjour',
  'Salut',
  'Hello',
  'Hi',
  'Hey',
  'Bonsoir',
  'Coucou',
  'Merci',
  'Thanks',
  'Thank you',
  'Ok',
  "D'accord",
  'Daccord',
  'Oui',
  'Non',
  'Help',
  'Aide',
  'Bonjour!',
  'Salut...',
  'Hello?',
];

const SUPPORT_CATEGORIES = [
  'trade',
  'payment',
  'paiement',
  'support',
  'kyc',
  'general',
  'estimation',
  'giveaway',
  'affiliation',
];

describe('evaluateUserMessageForAi — mots-clés MoonSkin', () => {
  it.each(MOONSKIN_KEYWORD_SAMPLES)(
    'accepte un message contenant « %s »',
    (_keyword, message) => {
      expect(evaluateUserMessageForAi({ message }).allowed).toBe(true);
    },
  );
});

describe('evaluateUserMessageForAi — hors sujet', () => {
  it.each(OFF_TOPIC_SAMPLES)(
    'refuse « %s » sans contexte MoonSkin',
    (_label, message) => {
      const result = evaluateUserMessageForAi({ message });
      expect(result.allowed).toBe(false);
      expect(result.refusalMessage).toBe(OFF_TOPIC_REFUSAL_I18N_KEY);
    },
  );
});

describe('evaluateUserMessageForAi — salutations', () => {
  it.each(GREETING_SAMPLES)('accepte la salutation « %s »', (message) => {
    expect(evaluateUserMessageForAi({ message }).allowed).toBe(true);
  });
});

describe('evaluateUserMessageForAi — catégories support', () => {
  it.each(SUPPORT_CATEGORIES)(
    'accepte un message ambigu avec catégorie « %s »',
    (category) => {
      expect(
        evaluateUserMessageForAi({ message: 'J ai un souci', category }).allowed,
      ).toBe(true);
    },
  );
});

describe('shouldAiReplyToConversation — matrice statuts', () => {
  const activeOpen = {
    assignedTo: null,
    hasModeratorMessage: false,
  };

  beforeEach(() => {
    process.env.CHAT_AI_ENABLED = 'true';
  });

  it.each([
    ['ACTIVE', true],
    ['CLOSED', false],
    ['ARCHIVED', false],
    ['DELETED', false],
  ] as const)('statut %s → %s', (status, expected) => {
    expect(
      shouldAiReplyToConversation({ ...activeOpen, status }),
    ).toBe(expected);
  });

  it.each([
    ['mod-1', false],
    [null, true],
  ] as const)('assignedTo=%s → %s', (assignedTo, expected) => {
    expect(
      shouldAiReplyToConversation({
        assignedTo,
        status: 'ACTIVE',
        hasModeratorMessage: false,
      }),
    ).toBe(expected);
  });

  it.each([
    [true, false],
    [false, true],
  ] as const)('hasModeratorMessage=%s → %s', (hasModeratorMessage, expected) => {
    expect(
      shouldAiReplyToConversation({
        assignedTo: null,
        status: 'ACTIVE',
        hasModeratorMessage,
      }),
    ).toBe(expected);
  });
});

describe('evaluateUserMessageForAi — contexte priorUserMessages', () => {
  it.each(MOONSKIN_KEYWORD_SAMPLES.slice(0, 20))(
    'accepte un suivi ambigu après contexte « %s »',
    (_keyword, prior) => {
      expect(
        evaluateUserMessageForAi({
          message: 'Et ensuite ?',
          priorUserMessages: [prior],
        }).allowed,
      ).toBe(true);
    },
  );
});

describe('evaluateUserMessageForAi — questions courtes', () => {
  it.each([
    'Comment ça marche ?',
    'C est quoi ?',
    'Pourquoi ?',
    'Quand je reçois ?',
    'Où trouver ?',
    'Combien de temps ?',
    'Est-ce normal ?',
    'C est possible ?',
    'Que faire maintenant ?',
    'Comment procéder ?',
  ])('accepte la question courte « %s »', (message) => {
    expect(evaluateUserMessageForAi({ message }).allowed).toBe(true);
  });
});
