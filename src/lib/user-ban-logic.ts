/** Compte banni actif (expiration passée = ban levé). */
export function isUserBanned(user: {
  banned: boolean;
  banExpires: Date | null;
}): boolean {
  if (!user.banned) return false;
  if (user.banExpires && user.banExpires < new Date()) return false;
  return true;
}
