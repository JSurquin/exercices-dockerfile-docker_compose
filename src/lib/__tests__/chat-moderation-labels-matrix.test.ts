import { messages } from '@/lib/i18n';
import {
  chatCategoryLabel,
  chatPriorityLabel,
  chatStatusLabel,
} from '@/lib/chat-moderation-labels';

const LOCALES = [
  { id: 'fr', msgs: messages.fr },
  { id: 'en', msgs: messages.en },
  { id: 'cn', msgs: messages.cn },
] as const;

const STATUSES = ['ACTIVE', 'CLOSED', 'ARCHIVED', 'DELETED'] as const;
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
const CATEGORIES = ['trade', 'payment', 'support'] as const;

describe('chatStatusLabel — toutes locales', () => {
  for (const locale of LOCALES) {
    describe(`locale ${locale.id}`, () => {
      it.each([...STATUSES])('traduit %s', (status) => {
        const label = chatStatusLabel(status, locale.msgs);
        expect(label).toBeTruthy();
        expect(label).not.toBe('');
      });

      it('retourne la clé brute pour statut inconnu', () => {
        expect(chatStatusLabel('PENDING', locale.msgs)).toBe('PENDING');
      });
    });
  }
});

describe('chatPriorityLabel — toutes locales', () => {
  for (const locale of LOCALES) {
    describe(`locale ${locale.id}`, () => {
      it.each([...PRIORITIES])('traduit %s', (priority) => {
        const label = chatPriorityLabel(priority, locale.msgs);
        expect(label).toBeTruthy();
        expect(label).not.toBe('');
      });

      it('retourne la clé brute pour priorité inconnue', () => {
        expect(chatPriorityLabel('CRITICAL', locale.msgs)).toBe('CRITICAL');
      });
    });
  }
});

describe('chatCategoryLabel — toutes locales', () => {
  for (const locale of LOCALES) {
    describe(`locale ${locale.id}`, () => {
      it.each([...CATEGORIES])('traduit %s', (category) => {
        const label = chatCategoryLabel(category, locale.msgs);
        expect(label).toBeTruthy();
        expect(label).not.toBe('');
      });

      it('retourne la clé brute pour catégorie inconnue', () => {
        expect(chatCategoryLabel('billing', locale.msgs)).toBe('billing');
      });
    });
  }
});

describe('chatStatusLabel — cohérence inter-locales', () => {
  it.each([...STATUSES])('statut %s diffère entre fr et en', (status) => {
    const fr = chatStatusLabel(status, messages.fr);
    const en = chatStatusLabel(status, messages.en);
    if (status === 'ACTIVE' || status === 'CLOSED') {
      expect(fr).not.toBe(en);
    }
  });
});
