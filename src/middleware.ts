import { NextRequest, NextResponse } from 'next/server';
import {
  LOCALE_COOKIE,
  isValidLocale,
  resolveLocale,
  shouldPersistLocaleCookie,
} from '@/lib/locale-detection';

const AFFILIATE_COOKIE = 'ctf_affiliate_ref';

function isBackgroundNavigation(request: NextRequest): boolean {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('Next-Router-State-Tree') !== null ||
    request.headers.get('Purpose') === 'prefetch' ||
    request.nextUrl.searchParams.has('_rsc') ||
    request.nextUrl.searchParams.has('_nextDataReq')
  );
}

function setAffiliateCookie(response: NextResponse, affiliateCode: string) {
  response.cookies.set(AFFILIATE_COOKIE, affiliateCode, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function setLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: 365 * 24 * 60 * 60,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

function applyLocale(request: NextRequest, response: NextResponse) {
  const urlLang = request.nextUrl.searchParams.get('lang');
  const existingCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = resolveLocale({
    cookieLocale: urlLang ? null : existingCookie,
    urlLang,
    acceptLanguage: request.headers.get('accept-language'),
  });

  if (shouldPersistLocaleCookie(existingCookie, urlLang)) {
    setLocaleCookie(response, locale);
  }

  response.headers.set('x-moonskin-locale', locale);
}

function nextWithLocale(request: NextRequest, locale: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-moonskin-locale', locale);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function resolveRequestLocale(request: NextRequest) {
  const urlLang = request.nextUrl.searchParams.get('lang');
  const existingCookie = request.cookies.get(LOCALE_COOKIE)?.value;

  return resolveLocale({
    cookieLocale: urlLang ? null : existingCookie,
    urlLang,
    acceptLanguage: request.headers.get('accept-language'),
  });
}

function buildCleanUrl(request: NextRequest): {
  cleanUrl: URL;
  needsRedirect: boolean;
} {
  const cleanUrl = request.nextUrl.clone();
  let changed = false;
  const urlLang = request.nextUrl.searchParams.get('lang');

  if (urlLang && isValidLocale(urlLang)) {
    cleanUrl.searchParams.delete('lang');
    changed = true;
  }

  if (cleanUrl.searchParams.has('ref')) {
    cleanUrl.searchParams.delete('ref');
    changed = true;
  }

  if (cleanUrl.searchParams.has('affiliate')) {
    cleanUrl.searchParams.delete('affiliate');
    changed = true;
  }

  return {
    cleanUrl,
    needsRedirect: changed && cleanUrl.toString() !== request.nextUrl.toString(),
  };
}

export function middleware(request: NextRequest) {
  const refCode = request.nextUrl.searchParams.get('ref');
  const affiliateId = request.nextUrl.searchParams.get('affiliate');
  const affiliateCode = refCode || affiliateId;
  const urlLang = request.nextUrl.searchParams.get('lang');
  const locale = resolveRequestLocale(request);
  const { cleanUrl, needsRedirect } = buildCleanUrl(request);
  const shouldRedirectForLang = Boolean(urlLang && isValidLocale(urlLang));

  if (isBackgroundNavigation(request)) {
    const response = nextWithLocale(request, locale);
    applyLocale(request, response);
    if (affiliateCode) {
      setAffiliateCookie(response, affiliateCode);
    }
    return response;
  }

  if (needsRedirect && (affiliateCode || shouldRedirectForLang)) {
    const redirectResponse = NextResponse.redirect(cleanUrl, 307);
    applyLocale(request, redirectResponse);
    if (affiliateCode) {
      setAffiliateCookie(redirectResponse, affiliateCode);
    }
    return redirectResponse;
  }

  const response = nextWithLocale(request, locale);
  applyLocale(request, response);
  if (affiliateCode) {
    setAffiliateCookie(response, affiliateCode);
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api/|api$|_next/|_next$|favicon.ico|icon|apple-icon|health|monitoring).*)',
  ],
};
