/** Avatars publics de l’équipe (Steam ou assets MoonSkin). */
export const TEAM_MEMBER_AVATAR_SRC: Record<string, string> = {
  moderator1:
    'https://avatars.steamstatic.com/b41610e0a235e45c0174ab806db2e0d57225217f_full.jpg',
  moderator2:
    'https://avatars.steamstatic.com/5bfa8af7ad3286e94012f0e57203957115f86dbc_full.jpg',
  moderator3: '/images/logo.webp',
};

export const MOONSKIN_LOGO_AVATAR_SRC = '/images/logo.webp';

/** Avatar affiché pour un membre staff (logo MoonSkin pour Admin_CTF). */
export function resolveStaffAvatarSrc(
  member?: { steamUsername?: string | null; steamAvatar?: string | null } | null,
): string {
  if (!member) return MOONSKIN_LOGO_AVATAR_SRC;
  if (member.steamUsername === 'Admin_CTF') return MOONSKIN_LOGO_AVATAR_SRC;
  return member.steamAvatar?.trim() || MOONSKIN_LOGO_AVATAR_SRC;
}

export function getTeamMemberAvatarSrc(key: string): string {
  return TEAM_MEMBER_AVATAR_SRC[key] ?? `/team/${key}.jpg`;
}
