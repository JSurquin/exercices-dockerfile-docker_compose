import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
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
     * - api/ (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, apple-icon (metadata static files)
     */
    '/((?!api/|api$|_next/static|_next/image|favicon.ico|icon|apple-icon|health|monitoring).*)',
  ],
};