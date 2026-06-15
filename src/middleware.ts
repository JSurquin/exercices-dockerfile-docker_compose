import { NextRequest, NextResponse } from 'next/server';

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
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    httpOnly: false, // Accessible côté client pour les analytics
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function middleware(request: NextRequest) {
  const refCode = request.nextUrl.searchParams.get('ref');
  const affiliateId = request.nextUrl.searchParams.get('affiliate');
  const affiliateCode = refCode || affiliateId;

  if (!affiliateCode) {
    return NextResponse.next();
  }

  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete('ref');
  cleanUrl.searchParams.delete('affiliate');
  const needsRedirect =
    cleanUrl.searchParams.toString() !== request.nextUrl.searchParams.toString();

  // Ne jamais rediriger les requêtes RSC/prefetch : cela provoque ERR_TOO_MANY_REDIRECTS
  // et "Failed to fetch RSC payload" lors de la navigation client-side.
  if (isBackgroundNavigation(request)) {
    const response = NextResponse.next();
    setAffiliateCookie(response, affiliateCode);
    return response;
  }

  if (needsRedirect) {
    const redirectResponse = NextResponse.redirect(cleanUrl, 307);
    setAffiliateCookie(redirectResponse, affiliateCode);
    return redirectResponse;
  }

  const response = NextResponse.next();
  setAffiliateCookie(response, affiliateCode);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (API routes)
     * - _next/ (Next.js internals, including RSC)
     * - favicon.ico, icon, apple-icon (metadata static files)
     */
    '/((?!api/|api$|_next/|_next$|favicon.ico|icon|apple-icon|health|monitoring).*)',
  ],
};
