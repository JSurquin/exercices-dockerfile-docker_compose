import {
  isCryptoTimingQuestion,
  isHowToGetMoneyQuestion,
  isHowToSellQuestion,
  isReverseTradeQuestion,
  isScamVictimConcern,
  isSellFromOtherAccountQuestion,
  resolveTrustedAiAnswer,
} from '@/lib/chat-ai-trusted-answers';

describe('isScamVictimConcern', () => {
  it.each([
    'et si je me fais scam?',
    'Est-ce que je vais me faire arnaquer ?',
    'J\'ai peur de me faire arnaquer sur MoonSkin',
    'C\'est sûr ? Je risque pas de me faire scam ?',
    'What if I get scammed?',
  ])('détecte la crainte victime : %s', (message) => {
    expect(isScamVictimConcern(message)).toBe(true);
  });

  it.each([
    'Si vous essayez de faire du scam sur MoonSkin',
    'Comment arnaquer les gens avec des skins',
    'Je veux scammer les utilisateurs',
  ])('ignore une intention frauduleuse : %s', (message) => {
    expect(isScamVictimConcern(message)).toBe(false);
  });
});

describe('isCryptoTimingQuestion', () => {
  it.each([
    'Les virements crypto sont instantanés ?',
    'Quel délai pour le paiement crypto ?',
    'C\'est rapide en USDT ?',
    'Combien de temps pour recevoir ma crypto ?',
    'Le bitcoin c\'est instantané ?',
  ])('détecte une question délai crypto : %s', (message) => {
    expect(isCryptoTimingQuestion(message)).toBe(true);
  });

  it('ignore une question sans lien timing', () => {
    expect(isCryptoTimingQuestion('Comment activer le KYC ?')).toBe(false);
  });
});

describe('isHowToSellQuestion', () => {
  it.each([
    'how to sell my skins?',
    'How do I sell my CS2 skins?',
    'hey how are you , i wonder how can i sel skins',
    'Comment vendre mes skins CS2 ?',
    'comment vendre mes skins',
    '如何出售我的CS2皮肤？',
  ])('détecte une question vente : %s', (message) => {
    expect(isHowToSellQuestion(message)).toBe(true);
  });

  it.each([
    'Je ne peux pas vendre mes skins',
    'I cannot sell my skins, error',
    'Mon trade est bloqué pour vendre',
  ])('ignore un problème de vente : %s', (message) => {
    expect(isHowToSellQuestion(message)).toBe(false);
  });
});

describe('isHowToGetMoneyQuestion', () => {
  it.each([
    'and how i can get the money?',
    'How can I get my money?',
    'How do I withdraw my payout?',
    'Comment recevoir mon argent ?',
    'Comment retirer mon solde ?',
    '如何领取我的款项？',
  ])('détecte une question retrait : %s', (message) => {
    expect(isHowToGetMoneyQuestion(message)).toBe(true);
  });

  it('ignore une question vente', () => {
    expect(isHowToGetMoneyQuestion('how to sell my skins?')).toBe(false);
  });
});

describe('resolveTrustedAiAnswer', () => {
  it('retourne une réponse rassurante pour une crainte d\'arnaque en français', () => {
    const answer = resolveTrustedAiAnswer('et si je me fais scam?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('légitime');
    expect(answer).not.toContain('bloqué sur notre plateforme');
  });

  it('retourne une réponse rassurante en anglais pour une crainte d\'arnaque', () => {
    const answer = resolveTrustedAiAnswer('What if I get scammed?', 'en');
    expect(answer).not.toBeNull();
    expect(answer).toContain('fair question');
    expect(answer).not.toContain('bloqué sur notre plateforme');
  });

  it('retourne une réponse avec délai crypto sous 10 minutes', () => {
    const answer = resolveTrustedAiAnswer('Les paiements crypto sont instantanés ?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('10 minutes');
    expect(answer).toContain('trade hold');
  });

  it('retourne le guide de vente en anglais pour how to sell my skins', () => {
    const answer = resolveTrustedAiAnswer('how to sell my skins?', 'en');
    expect(answer).not.toBeNull();
    expect(answer).toContain('Sell page');
    expect(answer).toContain('Create sale');
    expect(answer).not.toContain('publish your offer');
    expect(answer).not.toContain('wait for offers');
  });

  it('retourne le guide de vente en anglais pour une question avec faute de frappe', () => {
    const answer = resolveTrustedAiAnswer(
      'hey how are you , i wonder how can i sel skins',
      'en',
    );
    expect(answer).not.toBeNull();
    expect(answer).toContain('Sell page');
    expect(answer).toContain('Create sale');
  });

  it('retourne le guide de vente en français', () => {
    const answer = resolveTrustedAiAnswer('Comment vendre mes skins ?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('page Vendre');
    expect(answer).toContain('Créer la vente');
    expect(answer).toContain('Steam ou Discord');
  });

  it('retourne le guide retrait en anglais', () => {
    const answer = resolveTrustedAiAnswer('and how i can get the money?', 'en');
    expect(answer).not.toBeNull();
    expect(answer).toContain('Cashout page');
    expect(answer).toContain('/payout');
    expect(answer).toContain('SEPA Premium');
    expect(answer).toContain('instant');
    expect(answer).not.toContain('SEPA France');
    expect(answer).not.toContain('SEPA Europe');
  });

  it('retourne le guide retrait en français', () => {
    const answer = resolveTrustedAiAnswer('Comment recevoir mon argent ?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('page Retrait');
    expect(answer).toContain('SEPA Premium');
    expect(answer).toContain('instantané');
  });

  it('retourne null pour une question générique', () => {
    expect(resolveTrustedAiAnswer('Bonjour')).toBeNull();
  });

  it('retourne le guide multi-compte en anglais', () => {
    const answer = resolveTrustedAiAnswer('and if i want to sell from an other account ?', 'en');
    expect(answer).not.toBeNull();
    expect(answer).toContain('Trade Link');
    expect(answer).toContain('right-hand panel');
    expect(answer).toContain('/help/sell-multiple-steam-accounts');
  });

  it('retourne le guide multi-compte en français', () => {
    const answer = resolveTrustedAiAnswer('Je veux vendre depuis un autre compte Steam', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('panneau de droite');
    expect(answer).toContain('smurfs');
  });

  it('retourne le guide multi-compte pour « comment changer de compte »', () => {
    const answer = resolveTrustedAiAnswer('comment changer de compte', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('Trade Link');
    expect(answer).toContain('page Vendre');
    expect(answer).not.toContain('mot de passe');
    expect(answer).not.toContain('S\'inscrire');
  });

  it('retourne la politique reverse trade en anglais', () => {
    const answer = resolveTrustedAiAnswer('ok and what happen if you reverse ?', 'en');
    expect(answer).not.toBeNull();
    expect(answer).toContain('ban');
    expect(answer).toContain('20%');
    expect(answer).toContain('never reverse trades');
    expect(answer).toContain('/blog/reverse-trade-steam-cs2');
    expect(answer).not.toContain('No refunds');
  });

  it('retourne la politique reverse trade en français', () => {
    const answer = resolveTrustedAiAnswer('Et si je reverse trade ma vente MoonSkin ?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('bannissement');
    expect(answer).toContain('20 %');
    expect(answer).toContain('ne reverse trade jamais');
    expect(answer).toContain('/blog/reverse-trade-steam-cs2');
  });
});

describe('isSellFromOtherAccountQuestion', () => {
  it.each([
    'and if i want to sell from an other account ?',
    'Can I sell from another Steam account?',
    'Je veux vendre depuis un autre compte',
    'Comment vendre avec plusieurs comptes steam ?',
    'sell skins from my smurf account',
    'comment changer de compte',
    'Comment changer de compte ?',
    'How do I change account?',
    '如何更换账号？',
  ])('détecte une question multi-compte : %s', (message) => {
    expect(isSellFromOtherAccountQuestion(message)).toBe(true);
  });

  it.each([
    'Comment vendre mes skins ?',
    'Comment changer mon mot de passe ?',
    'Comment changer mon IBAN ?',
  ])('ignore une question sans lien multi-compte : %s', (message) => {
    expect(isSellFromOtherAccountQuestion(message)).toBe(false);
  });
});

describe('isReverseTradeQuestion', () => {
  it.each([
    'ok and what happen if you reverse ?',
    'What happens if I reverse trade my sale?',
    'Et si je reverse trade ma vente MoonSkin ?',
    'Que se passe-t-il si j annule mon trade après une vente ?',
  ])('détecte une question reverse trade vente : %s', (message) => {
    expect(isReverseTradeQuestion(message)).toBe(true);
  });

  it('ignore une question API scam sans lien vente MoonSkin', () => {
    expect(isReverseTradeQuestion('Comment faire un reverse trade après un API scam ?')).toBe(false);
  });
});
