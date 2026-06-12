import {
  buildModerationFilterParams,
  canDemoteModerator,
  canInviteAsModerator,
  canPromoteToModerator,
  isModeratorDetailViewable,
  moderationStatCardAccent,
  resolveRoleAfterModeratorDemote,
} from '@/lib/chat-moderation-logic';

describe('resolveRoleAfterModeratorDemote', () => {
  it('restaure AFFILIATE si programme actif', () => {
    expect(resolveRoleAfterModeratorDemote(true)).toBe('AFFILIATE');
  });

  it('repasse USER sinon', () => {
    expect(resolveRoleAfterModeratorDemote(false)).toBe('USER');
  });
});

describe('canDemoteModerator', () => {
  it('refuse si pas modérateur', () => {
    const r = canDemoteModerator({ targetRole: 'USER', targetId: 'u1', actorId: 'admin' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(400);
  });

  it('refuse auto-rétrogradation', () => {
    const r = canDemoteModerator({ targetRole: 'MODERATOR', targetId: 'm1', actorId: 'm1' });
    expect(r.ok).toBe(false);
  });

  it('autorise rétrogradation par admin', () => {
    expect(
      canDemoteModerator({ targetRole: 'MODERATOR', targetId: 'm1', actorId: 'admin' }).ok,
    ).toBe(true);
  });
});

describe('canPromoteToModerator', () => {
  it('refuse MODERATOR et ADMIN', () => {
    expect(canPromoteToModerator('MODERATOR').ok).toBe(false);
    expect(canPromoteToModerator('ADMIN').ok).toBe(false);
  });

  it('autorise USER et AFFILIATE', () => {
    expect(canPromoteToModerator('USER').ok).toBe(true);
    expect(canPromoteToModerator('AFFILIATE').ok).toBe(true);
  });
});

describe('canInviteAsModerator', () => {
  it('refuse staff existant', () => {
    expect(canInviteAsModerator('ADMIN').ok).toBe(false);
    expect(canInviteAsModerator('MODERATOR').ok).toBe(false);
  });

  it('autorise utilisateur standard', () => {
    expect(canInviteAsModerator('USER').ok).toBe(true);
  });
});

describe('isModeratorDetailViewable', () => {
  it('true pour MODERATOR et ADMIN', () => {
    expect(isModeratorDetailViewable('MODERATOR')).toBe(true);
    expect(isModeratorDetailViewable('ADMIN')).toBe(true);
    expect(isModeratorDetailViewable('USER')).toBe(false);
  });
});

describe('buildModerationFilterParams', () => {
  it('ignore les valeurs vides', () => {
    const params = buildModerationFilterParams({
      status: 'ACTIVE',
      search: '',
      page: 1,
      assignedTo: undefined,
    });
    expect(params.get('status')).toBe('ACTIVE');
    expect(params.get('page')).toBe('1');
    expect(params.has('search')).toBe(false);
    expect(params.has('assignedTo')).toBe(false);
  });
});

describe('moderationStatCardAccent — design modération', () => {
  it('assigne une couleur par type de stat', () => {
    expect(moderationStatCardAccent('active')).toContain('green');
    expect(moderationStatCardAccent('closed')).toContain('muted-foreground');
    expect(moderationStatCardAccent('unassigned')).toContain('amber');
    expect(moderationStatCardAccent('response')).toContain('blue');
  });

  it('fallback muted pour type inconnu', () => {
    expect(moderationStatCardAccent('unknown' as 'active')).toContain('muted-foreground');
  });
});
