import {
  conversationHasTicketTransmittedMessage,
  isUserRequestingHumanModerator,
} from '@/lib/chat-escalation';
import { TICKET_TRANSMITTED_I18N_KEY } from '@/lib/chat-logic';

describe('isUserRequestingHumanModerator', () => {
  it('détecte une demande explicite de modérateur humain', () => {
    expect(isUserRequestingHumanModerator('Je veux parler à un modérateur')).toBe(true);
    expect(isUserRequestingHumanModerator('Passe-moi un humain svp')).toBe(true);
    expect(isUserRequestingHumanModerator('I need a human moderator please')).toBe(true);
    expect(isUserRequestingHumanModerator('Contact a human agent')).toBe(true);
  });

  it('ignore une question support classique', () => {
    expect(isUserRequestingHumanModerator('Mon trade Steam est bloqué')).toBe(false);
    expect(isUserRequestingHumanModerator('Bonjour')).toBe(false);
  });
});

describe('conversationHasTicketTransmittedMessage', () => {
  it('repère le message système ticket transmis', () => {
    expect(
      conversationHasTicketTransmittedMessage([
        { senderType: 'USER', content: 'hello' },
        { senderType: 'SYSTEM', content: TICKET_TRANSMITTED_I18N_KEY },
      ]),
    ).toBe(true);
  });

  it('retourne false sans message ticket transmis', () => {
    expect(
      conversationHasTicketTransmittedMessage([{ senderType: 'AI', content: 'Réponse' }]),
    ).toBe(false);
  });
});
