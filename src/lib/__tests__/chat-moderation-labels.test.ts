import { messages } from '@/lib/i18n';
import {
  chatCategoryLabel,
  chatPriorityLabel,
  chatStatusLabel,
} from '@/lib/chat-moderation-labels';

describe('chat-moderation-labels', () => {
  const fr = messages.fr;
  const en = messages.en;
  const cn = messages.cn;

  it('traduit les statuts de conversation', () => {
    expect(chatStatusLabel('ACTIVE', fr)).toBe('Actives');
    expect(chatStatusLabel('CLOSED', en)).toBe('Closed');
    expect(chatStatusLabel('ARCHIVED', fr)).toBe('Archivées');
    expect(chatStatusLabel('DELETED', fr)).toBe('Supprimées');
    expect(chatStatusLabel('UNKNOWN', fr)).toBe('UNKNOWN');
  });

  it('traduit les priorités', () => {
    expect(chatPriorityLabel('URGENT', fr)).toBe('Urgente');
    expect(chatPriorityLabel('NORMAL', en)).toBe('Normal');
    expect(chatPriorityLabel('HIGH', fr)).toBe('Élevée');
    expect(chatPriorityLabel('LOW', en)).toBe('Low');
    expect(chatPriorityLabel('UNKNOWN', fr)).toBe('UNKNOWN');
  });

  it('traduit les catégories chat', () => {
    expect(chatCategoryLabel('trade', fr)).toBe('Problème de trade');
    expect(chatCategoryLabel('payment', en)).toBe('Payment');
    expect(chatCategoryLabel('support', cn)).toBe('一般支持');
    expect(chatCategoryLabel('unknown', fr)).toBe('unknown');
  });
});
