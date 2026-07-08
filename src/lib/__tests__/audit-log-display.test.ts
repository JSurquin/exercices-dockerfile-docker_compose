import {
  resolveUserDisplayName,
  truncateAuditUserId,
} from '@/lib/admin/audit-log-display';

describe('audit-log-display', () => {
  it('prefers steam username for display', () => {
    expect(
      resolveUserDisplayName({
        id: 'user_1',
        steamUsername: 'ProPlayer',
        name: 'Jean',
        email: 'jean@example.com',
      })
    ).toBe('ProPlayer');
  });

  it('falls back to email then id', () => {
    expect(
      resolveUserDisplayName({
        id: 'user_abc_long_id',
        steamUsername: null,
        name: null,
        email: 'jean@example.com',
      })
    ).toBe('jean@example.com');
  });

  it('truncates long user ids with ellipsis', () => {
    expect(truncateAuditUserId('xKJrKSDpeNHJkJN7toWlgnkmVPy86zmY', 10)).toBe('xKJrKSDpeN…');
    expect(truncateAuditUserId('short', 10)).toBe('short');
  });
});
