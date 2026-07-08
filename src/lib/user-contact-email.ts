const INTERNAL_EMAIL_PATTERNS = [
  /^steam_\d+@moonskin\.local$/i,
  /^test-.*@moonskin\.test$/i,
];

/** Emails techniques générés à l'inscription (Steam, tests E2E) — pas des contacts utilisateur. */
export function isInternalUserEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return INTERNAL_EMAIL_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Email de contact effectif : contactEmail prioritaire, sinon user.email si réel. */
export function resolveUserContactEmail(input: {
  contactEmail?: string | null;
  email?: string | null;
}): string | null {
  const contact = input.contactEmail?.trim();
  if (contact) return contact;

  const authEmail = input.email?.trim();
  if (authEmail && !isInternalUserEmail(authEmail)) {
    return authEmail;
  }

  return null;
}
