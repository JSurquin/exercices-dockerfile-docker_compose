import { NextRequest, NextResponse } from 'next/server';
import { AffiliateService } from '@/lib/affiliate-service';
import { requireUserSession } from '@/lib/require-session-user';
import { safeParseJson } from '@/lib/validation/helpers';
import { affiliateLinkPostSchema } from '@/lib/validation/schemas/affiliate';

export async function POST(request: NextRequest) {
  try {
    const session = await requireUserSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentification requise' }, { status: 401 });
    }
    const userId = session.user.id;
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      raw = {};
    }
    const parsed = safeParseJson(raw, affiliateLinkPostSchema, { errorStyle: 'affiliate' });
    if (!parsed.ok) {
      return parsed.response;
    }
    const path = parsed.data.path ?? '';
    
    const affiliate = await AffiliateService.getAffiliateStats(userId);
    
    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Compte affilié non trouvé' },
        { status: 404 }
      );
    }
    
    // SÉCURITÉ: generateAffiliateLink valide maintenant que path est relatif
    // Une erreur sera levée si path est une URL absolue (protection open redirect)
    try {
      const affiliateLink = AffiliateService.generateAffiliateLink(affiliate.code, path);
      
      return NextResponse.json({
        success: true,
        data: {
          link: affiliateLink,
          code: affiliate.code,
          shortLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://moonskin.fr'}?ref=${affiliate.code}`
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid path';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Erreur génération lien affilié:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}