import type { NextRequest, NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import { partnerError } from '@/lib/partner-api/response';
import { partnerTradeUrlSchema } from '@/lib/partner-api/schemas';
import { normalizePartnerCurrency, type PartnerCurrency } from '@/lib/partner-api/currency';

export type PartnerParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export function safeParsePartnerJson<T>(body: unknown, schema: ZodType<T>): PartnerParseResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0]?.message ?? 'Invalid request data';
    return { ok: false, response: partnerError('VALIDATION_ERROR', first, 400) };
  }
  return { ok: true, data: result.data };
}

export async function readPartnerJsonBody(request: NextRequest): Promise<PartnerParseResult<unknown>> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false, response: partnerError('VALIDATION_ERROR', 'Invalid JSON body', 400) };
  }
}

function parseOptionalInt(raw: string | null, fallback: number): number | null {
  if (raw === null || raw === '') return fallback;
  if (!/^-?\d+$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export function parsePartnerPagination(searchParams: URLSearchParams): PartnerParseResult<{
  limit: number;
  offset: number;
}> {
  const limit = parseOptionalInt(searchParams.get('limit'), 50);
  const offset = parseOptionalInt(searchParams.get('offset'), 0);

  if (limit === null || offset === null) {
    return {
      ok: false,
      response: partnerError('VALIDATION_ERROR', 'limit and offset must be integers', 400),
    };
  }
  if (limit < 1 || limit > 100) {
    return {
      ok: false,
      response: partnerError('VALIDATION_ERROR', 'limit must be between 1 and 100', 400),
    };
  }
  if (offset < 0) {
    return {
      ok: false,
      response: partnerError('VALIDATION_ERROR', 'offset must be greater than or equal to 0', 400),
    };
  }

  return { ok: true, data: { limit, offset } };
}

export function parseOptionalPartnerTradeUrl(
  searchParams: URLSearchParams
): PartnerParseResult<string | undefined> {
  const raw = searchParams.get('trade_url');
  if (raw === null || raw === '') return { ok: true, data: undefined };
  const parsed = partnerTradeUrlSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: partnerError('VALIDATION_ERROR', 'Invalid Steam trade URL', 400),
    };
  }
  return { ok: true, data: parsed.data };
}

export function parsePartnerCurrencyParam(
  searchParams: URLSearchParams
): PartnerParseResult<PartnerCurrency> {
  const parsed = normalizePartnerCurrency(searchParams.get('currency'));
  if (!parsed) {
    return {
      ok: false,
      response: partnerError('VALIDATION_ERROR', 'currency must be USD, EUR or CNY', 400),
    };
  }
  return { ok: true, data: parsed };
}
