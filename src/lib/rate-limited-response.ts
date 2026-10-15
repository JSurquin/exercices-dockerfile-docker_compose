import { NextResponse } from 'next/server';
import { getRequestLocale } from '@/lib/get-request-locale';
import { rateLimitUserMessage } from '@/lib/rate-limit-message';

/**
 * 429 JSON body in the visitor's language (cookie, then Accept-Language).
 * Extra fields such as `success` or `resetTime` are preserved; `error` is always localized.
 */
export async function rateLimitedJson(
  body: Record<string, unknown> = {},
  init?: { headers?: HeadersInit },
): Promise<NextResponse> {
  const locale = await getRequestLocale();
  return NextResponse.json(
    { ...body, error: rateLimitUserMessage(locale) },
    { status: 429, headers: init?.headers },
  );
}
