import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenID, getSteamUserInfo } from '@/lib/steam-auth';
import { prisma } from '~/prisma/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Vérifier la réponse OpenID de Steam
    const steamId = await verifySteamOpenID(request);

    if (!steamId) {
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('error', 'steam_verification_failed');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Récupérer les informations du profil Steam
    const steamUser = await getSteamUserInfo(steamId);

    if (!steamUser) {
      const errorUrl = new URL('/', request.url);
      errorUrl.searchParams.set('error', 'steam_profile_fetch_failed');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { steamId: steamUser.steamid }
    });

    const email = `steam_${steamUser.steamid}@cashtrade.local`;
    const password = 'steam-auth-' + steamUser.steamid;

    if (!user) {
      // Créer un nouvel utilisateur avec Better Auth
      console.log('Création nouvel utilisateur Steam:', steamUser.personaname);
      
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: email,
          password: password,
          name: steamUser.personaname,
          image: steamUser.avatarfull || steamUser.avatar,
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
      // Mettre à jour les informations Steam si elles ont changé
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
    
    // Créer une requête pour l'endpoint de connexion Better Auth
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

    // Créer la réponse avec redirection
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('steam_login', 'success');
    const response = NextResponse.redirect(redirectUrl.toString());

    // Copier TOUS les cookies de la réponse Better Auth
    const setCookieHeader = signInResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      // Better Auth peut définir plusieurs cookies, on les copie tous
      response.headers.set('set-cookie', setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error('Steam callback error:', error);
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'steam_callback_error');
    return NextResponse.redirect(errorUrl.toString());
  } finally {
    await prisma.$disconnect();
  }
}