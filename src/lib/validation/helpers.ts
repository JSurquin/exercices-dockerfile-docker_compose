import { NextResponse } from 'next/server';
import type { ZodType, ZodError } from 'zod';

/** Réponse 400 standard pour erreurs Zod (évite de changer le contrat sans besoin). */
export function zodErrorResponse(error: ZodError, status = 400) {
  const first = error.issues[0]?.message ?? 'Données invalides';
  return NextResponse.json(
    { error: first, details: error.issues },
    { status }
  );
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/** Réponse 400 — variante `{ success: false }` (routes affilié, etc.). */
export function zodErrorResponseAffiliate(error: ZodError) {
  const first = error.issues[0]?.message ?? 'Données invalides';
  return NextResponse.json(
    { success: false, error: first, details: error.issues },
    { status: 400 }
  );
}

/** Parse JSON déjà lu ou brut ; renvoie une NextResponse en cas d'échec. */
export function safeParseJson<T>(
  body: unknown,
  schema: ZodType<T>,
  options?: { errorStyle?: 'default' | 'affiliate' | 'successFalse' }
): ParseResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const response =
      options?.errorStyle === 'affiliate' || options?.errorStyle === 'successFalse'
        ? zodErrorResponseAffiliate(result.error)
        : zodErrorResponse(result.error);
    return { ok: false, response };
  }
  return { ok: true, data: result.data };
}

/** Parse les searchParams d'une URL avec un schéma Zod (valeurs toujours string ou null). */
export function safeParseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>,
  options?: { errorStyle?: 'default' | 'affiliate' | 'successFalse' }
): ParseResult<T> {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  const result = schema.safeParse(obj);
  if (!result.success) {
    const response =
      options?.errorStyle === 'affiliate' || options?.errorStyle === 'successFalse'
        ? zodErrorResponseAffiliate(result.error)
        : zodErrorResponse(result.error);
    return { ok: false, response };
  }
  return { ok: true, data: result.data };
}
