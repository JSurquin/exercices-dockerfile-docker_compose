import {
  isCryptoTimingQuestion,
  isHowToSellQuestion,
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

  it('retourne le guide de vente en français', () => {
    const answer = resolveTrustedAiAnswer('Comment vendre mes skins ?', 'fr');
    expect(answer).not.toBeNull();
    expect(answer).toContain('page Vendre');
    expect(answer).toContain('Créer la vente');
    expect(answer).toContain('Steam ou Discord');
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
});

describe('isSellFromOtherAccountQuestion', () => {
  it.each([
    'and if i want to sell from an other account ?',
    'Can I sell from another Steam account?',
    'Je veux vendre depuis un autre compte',
    'Comment vendre avec plusieurs comptes steam ?',
    'sell skins from my smurf account',
  ])('détecte une question multi-compte : %s', (message) => {
    expect(isSellFromOtherAccountQuestion(message)).toBe(true);
  });

  it('ignore une question sans lien multi-compte', () => {
    expect(isSellFromOtherAccountQuestion('Comment vendre mes skins ?')).toBe(false);
  });
});
