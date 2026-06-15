import { NextRequest, NextResponse } from 'next/server';
import { isIpBlocked } from '@/lib/blocked-ip-service';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const clientIp = getClientIP(request);
    if (clientIp !== 'unknown' && (await isIpBlocked(clientIp))) {
      const blockedUrl = request.nextUrl.clone();
      blockedUrl.pathname = '/';
      blockedUrl.searchParams.set('error', 'ip_blocked');
      return NextResponse.redirect(blockedUrl);
    }
  }

  const response = NextResponse.next();
  
  // Tracking des codes d'affiliation
  const refCode = request.nextUrl.searchParams.get('ref');
  const affiliateId = request.nextUrl.searchParams.get('affiliate');
  
  if (refCode || affiliateId) {
    // Stocker le code d'affiliation dans un cookie pour 30 jours
    const affiliateCode = refCode || affiliateId;
    if (affiliateCode) {
      response.cookies.set('ctf_affiliate_ref', affiliateCode, {
        maxAge: 30 * 24 * 60 * 60, // 30 jours
        httpOnly: false, // Accessible côté client pour les analytics
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }
    
    // Rediriger sans les paramètres d'affiliation pour nettoyer l'URL
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('ref');
    cleanUrl.searchParams.delete('affiliate');
    
    if (cleanUrl.searchParams.toString() !== request.nextUrl.searchParams.toString()) {
      return NextResponse.redirect(cleanUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, apple-icon (metadata static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|health).*)',
  ],
};