import { NextRequest, NextResponse } from 'next/server';
import { generateSteamAuthUrl } from '@/lib/steam-auth';
import { 
  getRequestContext, 
  logUserAction, 
  logSystemError 
} from '@/lib/security/audit-helpers';
import { AuditAction } from '@/lib/security';

export async function GET(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    // Log de tentative de connexion Steam
    await logUserAction(
      context,
      AuditAction.USER_LOGIN,
      {
        type: 'steam_login_initiated',
        method: 'steam',
        timestamp: new Date().toISOString(),
      },
      'low'
    );

    const url = new URL(request.url);
    const returnUrl = `${url.origin}/api/auth/steam/callback`;
    
    const steamAuthUrl = generateSteamAuthUrl(returnUrl);
    
    return NextResponse.redirect(steamAuthUrl);
  } catch (error) {
    console.error('Steam login error:', error);
    
    // Log de l'erreur système
    await logSystemError(context, error, 'steam_login_initiation');
    
    return NextResponse.json(
      { error: 'Failed to initiate Steam login' },
      { status: 500 }
    );
  }
}
