import {
  isCryptoTimingQuestion,
  isScamVictimConcern,
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

describe('resolveTrustedAiAnswer', () => {
  it('retourne une réponse rassurante pour une crainte d\'arnaque', () => {
    const answer = resolveTrustedAiAnswer('et si je me fais scam?');
    expect(answer).not.toBeNull();
    expect(answer).toContain('légitime');
    expect(answer).not.toContain('bloqué sur notre plateforme');
  });

  it('retourne une réponse avec délai crypto sous 10 minutes', () => {
    const answer = resolveTrustedAiAnswer('Les paiements crypto sont instantanés ?');
    expect(answer).not.toBeNull();
    expect(answer).toContain('10 minutes');
    expect(answer).toContain('trade hold');
  });

  it('retourne null pour une question générique', () => {
    expect(resolveTrustedAiAnswer('Bonjour')).toBeNull();
  });
});
