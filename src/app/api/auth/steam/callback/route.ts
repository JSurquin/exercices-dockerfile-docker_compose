import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenID, getSteamUserInfo } from '@/lib/steam-auth';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';
import { headers } from 'next/headers';
import { 
  getRequestContext, 
  logUserAction, 
  logSystemError 
} from '@/lib/security/audit-helpers';
import { AuditAction } from '@/lib/security';

export async function GET(request: NextRequest) {
  const context = getRequestContext(request);
  
  try {
    // Vérifier la réponse OpenID de Steam
    const steamId = await verifySteamOpenID(request);

    if (!steamId) {
      // Log d'échec de vérification Steam
      await logUserAction(
        context,
        AuditAction.USER_LOGIN_FAILED,
        {
          type: 'steam_verification_failed',
          reason: 'Invalid Steam OpenID response',
          timestamp: new Date().toISOString(),
        },
        'medium'
      );

      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('error', 'steam_verification_failed');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Récupérer les informations du profil Steam
    const steamUser = await getSteamUserInfo(steamId);

    if (!steamUser) {
      // Log d'échec de récupération du profil Steam
      await logUserAction(
        context,
        AuditAction.USER_LOGIN_FAILED,
        {
          type: 'steam_profile_fetch_failed',
          steamId,
          reason: 'Failed to fetch Steam profile',
          timestamp: new Date().toISOString(),
        },
        'medium'
      );

      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('error', 'steam_profile_fetch_failed');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { steamId: steamUser.steamid }
    });

    const email = `steam_${steamUser.steamid}@moonskin.local`;
    const password = 'steam-auth-' + steamUser.steamid;

    if (!user) {
      // Log de création d'un nouvel utilisateur
      await logUserAction(
        context,
        AuditAction.USER_LOGIN,
        {
          type: 'new_user_registration',
          steamId: steamUser.steamid,
          steamUsername: steamUser.personaname,
          method: 'steam',
          timestamp: new Date().toISOString(),
        },
        'medium'
      );

      // Créer un nouvel utilisateur avec Better Auth
      console.log('Création nouvel utilisateur Steam:', steamUser.personaname);
      
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: email,
          password: password,
          name: steamUser.personaname,
        },
      });

      if (!signUpResult.user) {
        throw new Error('Failed to create user via Better Auth');
      }

      // Mettre à jour avec les données Steam spécifiques
      user = await prisma.user.update({
        where: { id: signUpResult.user.id },
        data: {
          emailVerified: true, // Considéré comme vérifié via Steam
          name: steamUser.personaname,
          image: steamUser.avatarfull || steamUser.avatar,
          steamId: steamUser.steamid,
          steamUsername: steamUser.personaname,
          steamAvatar: steamUser.avatarfull || steamUser.avatar,
          level: 1,
          xp: 0,
          tickets: 0,
          totalVolumeCents: 0,
          kycStatus: 'PENDING',
          acceptedTermsAt: new Date(),
        }
      });
    } else {
      // Log de connexion utilisateur existant
      context.userId = user.id;
      await logUserAction(
        context,
        AuditAction.USER_LOGIN,
        {
          type: 'existing_user_login',
          steamId: steamUser.steamid,
          steamUsername: steamUser.personaname,
          method: 'steam',
          timestamp: new Date().toISOString(),
        },
        'low'
      );

      // Mettre à jour les informations Steam — ne jamais toucher email (clé d'auth interne)
      console.log('Mise à jour utilisateur existant:', user.name);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: steamUser.personaname,
          image: steamUser.avatarfull || steamUser.avatar,
          steamUsername: steamUser.personaname,
          steamAvatar: steamUser.avatarfull || steamUser.avatar,
        }
      });
    }

    // Connecter l'utilisateur via Better Auth en utilisant le handler complet
    console.log('Connexion utilisateur:', user.email);
    
    // Connexion via l'email interne @moonskin.local — jamais le contactEmail
    const signInRequest = new Request(`${request.nextUrl.origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.nextUrl.origin,
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // Utiliser le handler Better Auth directement
    const signInResponse = await auth.handler(signInRequest);
    
    console.log('signInResponse status:', signInResponse.status);
    console.log('signInResponse headers:', Object.fromEntries(signInResponse.headers.entries()));

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      console.error('Sign in error:', errorText);
      throw new Error('Failed to sign in user via Better Auth');
    }

    console.log('Connexion réussie, redirection vers dashboard');
    let requiresTwoFactor = false;
    try {
      const payload = await signInResponse.clone().json();
      requiresTwoFactor = Boolean(payload?.twoFactorRedirect);
    } catch {
      requiresTwoFactor = false;
    }

    // Log de connexion réussie
    context.userId = user.id;
    await logUserAction(
      context,
      AuditAction.USER_LOGIN,
      {
        type: 'steam_login_success',
        userId: user.id,
        steamId: steamUser.steamid,
        steamUsername: steamUser.personaname,
        timestamp: new Date().toISOString(),
      },
      'low'
    );

    // Créer la réponse avec redirection
    const redirectPath = requiresTwoFactor ? '/two-factor' : '/dashboard';
    const redirectUrl = new URL(redirectPath, request.url);
    if (!requiresTwoFactor) {
      redirectUrl.searchParams.set('steam_login', 'success');
    } else {
      redirectUrl.searchParams.set('mode', 'verify');
      redirectUrl.searchParams.set('redirect', '/dashboard');
    }
    const response = NextResponse.redirect(redirectUrl.toString());

    const allCookies = signInResponse.headers.getSetCookie?.() ?? [];

    let cookiesToForward: string[];
    if (requiresTwoFactor) {
      // Cas 2FA : Better Auth émet session_token + cookies de suppression + two_factor.
      // On ne transmet QUE le two_factor — les cookies de suppression (Max-Age=0)
      // effaceraient la session dans le navigateur avant que verify-totp soit appelé.
      cookiesToForward = allCookies.filter(
        (c) => !c.includes('Max-Age=0')
          && !c.startsWith('better-auth.session_token=')
          && !c.startsWith('better-auth.session_data='),
      );
    } else {
      // Cas normal (pas de 2FA) : on transmet tous les cookies tels quels.
      cookiesToForward = allCookies;
    }

    console.log('[Steam] cookies transmis:', cookiesToForward.map(c => c.split(';')[0]));
    for (const cookie of cookiesToForward) {
      response.headers.append('set-cookie', cookie);
    }

    return response;
  } catch (error) {
    console.error('Steam callback error:', error);
    
    // Log de l'erreur système
    await logSystemError(context, error, 'steam_callback');
    
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'steam_callback_error');
    return NextResponse.redirect(errorUrl.toString());
  } finally {
    await prisma.$disconnect();
  }
}