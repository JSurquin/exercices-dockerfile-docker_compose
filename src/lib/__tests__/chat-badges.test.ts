import {
  chatMessageBubbleClass,
  chatPriorityBadgeClass,
  chatSenderBadgeClass,
  chatStatusBadgeClass,
} from '@/lib/chat-badges';
import { chatWidgetMessageBubbleClass } from '@/lib/chat-widget-styles';

describe('chatStatusBadgeClass', () => {
  it('applique success pour ACTIVE', () => {
    expect(chatStatusBadgeClass('ACTIVE')).toContain('admin-badge-status--success');
  });

  it('applique pending pour statut inconnu', () => {
    expect(chatStatusBadgeClass('ARCHIVED')).toContain('admin-badge-status--pending');
  });

  it('applique le style par défaut pour CLOSED', () => {
    expect(chatStatusBadgeClass('CLOSED')).toContain('admin-badge-status');
    expect(chatStatusBadgeClass('CLOSED')).not.toContain('admin-badge-status--success');
  });
});

describe('chatPriorityBadgeClass', () => {
  it('applique danger pour URGENT', () => {
    expect(chatPriorityBadgeClass('URGENT')).toContain('admin-badge-status--danger');
  });

  it('applique pending pour HIGH', () => {
    expect(chatPriorityBadgeClass('HIGH')).toContain('admin-badge-status--pending');
  });

  it('applique le style par défaut pour NORMAL et LOW', () => {
    expect(chatPriorityBadgeClass('NORMAL')).toContain('admin-badge-status');
    expect(chatPriorityBadgeClass('LOW')).toContain('admin-badge-status');
  });
});

describe('chatSenderBadgeClass', () => {
  it('couvre tous les sender types du chat', () => {
    for (const type of ['USER', 'MODERATOR', 'BOT', 'AI', 'SYSTEM', 'UNKNOWN']) {
      expect(chatSenderBadgeClass(type)).toContain('admin-badge-status');
    }
  });

  it('applique un style violet distinct pour AI', () => {
    expect(chatSenderBadgeClass('AI')).toContain('violet');
    expect(chatSenderBadgeClass('BOT')).not.toContain('violet');
  });
});

describe('chatMessageBubbleClass', () => {
  it('différencie USER, MODERATOR, BOT/SYSTEM et AI', () => {
    expect(chatMessageBubbleClass('USER')).toContain('bg-muted');
    expect(chatMessageBubbleClass('MODERATOR')).toContain('bg-primary');
    expect(chatMessageBubbleClass('BOT')).toContain('bg-theme-accent');
    expect(chatMessageBubbleClass('AI')).toContain('bg-theme-highlight');
  });

  it('aligne les coins (rounded) par type — modération/admin', () => {
    expect(chatMessageBubbleClass('USER')).toContain('rounded-tl-sm');
    expect(chatMessageBubbleClass('MODERATOR')).toContain('rounded-tr-sm');
    expect(chatMessageBubbleClass('AI')).toContain('rounded-tr-sm');
  });

  it('fallback pour sender type inconnu', () => {
    expect(chatMessageBubbleClass('UNKNOWN')).toContain('bg-muted/50');
  });
});

describe('cohérence design widget vs modération', () => {
  it('widget Intercom : staff gris clair, admin conserve theme-highlight pour AI', () => {
    expect(chatWidgetMessageBubbleClass('AI')).toContain('bg-neutral-100');
    expect(chatMessageBubbleClass('AI')).toContain('theme-highlight');
  });
});
