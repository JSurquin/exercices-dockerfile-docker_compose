export function isUsablePartnerPaymentMethod(method: {
  details: unknown;
} | null | undefined): boolean {
  if (!method) return false;
  const { details } = method;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return false;
  return Object.keys(details).length > 0;
}
