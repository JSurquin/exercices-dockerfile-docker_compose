import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenID, getSteamUserInfo } from '@/lib/steam-auth';
// import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la réponse OpenID de Steam
    const steamId = await verifySteamOpenID(request);
    
    if (!steamId) {
      return NextResponse.redirect('/login?error=steam_verification_failed');
    }

    // Récupérer les informations du profil Steam
    const steamUser = await getSteamUserInfo(steamId);
    
    if (!steamUser) {
      return NextResponse.redirect('/login?error=steam_profile_fetch_failed');
    }

    // TODO: Intégrer avec Better Auth - créer ou mettre à jour l'utilisateur
    // Pour l'instant, on redirige avec les infos Steam en query params
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('steam_login', 'success');
    redirectUrl.searchParams.set('steam_id', steamUser.steamid);
    redirectUrl.searchParams.set('steam_username', steamUser.personaname);
    redirectUrl.searchParams.set('steam_avatar', steamUser.avatar);

    // TODO: Créer une session utilisateur réelle
    // const session = await auth.api.signIn(request, {
    //   // Logique de création d'utilisateur Steam
    // });

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Steam callback error:', error);
    return NextResponse.redirect('/login?error=steam_callback_error');
  }
}
