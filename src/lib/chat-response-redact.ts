function nullEmailOnUser(user: unknown): unknown {
  if (user && typeof user === 'object' && user !== null) {
    return { ...(user as Record<string, unknown>), email: null };
  }
  return user;
}

/**
 * Invité : la conversation est identifiée par UUID (secret), mais on ne renvoie pas
 * d’adresses e-mail (staff / utilisateur) dans le JSON — évite fuite PII par lien partagé.
 */
export function redactEmailsInConversationForGuest(
  conversation: Record<string, unknown>
): Record<string, unknown> {
  const c = { ...conversation };

  if (c.user) {
    c.user = nullEmailOnUser(c.user);
  }
  if (c.assignedModerator) {
    c.assignedModerator = nullEmailOnUser(c.assignedModerator);
  }
  if (Array.isArray(c.messages)) {
    c.messages = c.messages.map((m) => {
      if (m && typeof m === 'object' && m !== null) {
        const row = m as Record<string, unknown>;
        if (row.user) {
          return {
            ...row,
            user: nullEmailOnUser(row.user),
          };
        }
      }
      return m;
    });
  }
  return c;
}

/**
 * Utilisateur connecté (non admin / non modérateur) : masque les e-mails du staff
 * (modérateur assigné + messages d’un autre compte que le visiteur).
 */
export function redactEmailsForNonStaffViewer(
  conversation: Record<string, unknown>,
  viewerUserId: string
): Record<string, unknown> {
  const c = { ...conversation };

  if (c.assignedModerator) {
    c.assignedModerator = nullEmailOnUser(c.assignedModerator);
  }

  if (Array.isArray(c.messages)) {
    c.messages = c.messages.map((m) => {
      if (!m || typeof m !== 'object' || m === null) {
        return m;
      }
      const row = m as Record<string, unknown>;
      const senderType = row.senderType;
      const authorId = row.userId as string | null | undefined;
      const hideAuthorEmail =
        senderType === 'MODERATOR' ||
        (authorId != null && authorId !== viewerUserId);
      if (row.user && hideAuthorEmail) {
        return { ...row, user: nullEmailOnUser(row.user) };
      }
      return m;
    });
  }

  return c;
}
