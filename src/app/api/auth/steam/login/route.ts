import { NextRequest, NextResponse } from 'next/server';
import { generateSteamAuthUrl } from '@/lib/steam-auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const returnUrl = `${url.origin}/api/auth/steam/callback`;
    
    const steamAuthUrl = generateSteamAuthUrl(returnUrl);
    
    return NextResponse.redirect(steamAuthUrl);
  } catch (error) {
    console.error('Steam login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Steam login' },
      { status: 500 }
    );
  }
}
