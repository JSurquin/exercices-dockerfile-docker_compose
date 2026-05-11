import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '~/prisma/prisma';
import { auth } from '~/lib/auth';

/**
 * Endpoint de test pour créer des sessions d'authentification
 * pour les tests E2E Playwright
 * 
 * ⚠️ SÉCURITÉ : Cet endpoint n'est actif qu'en mode test
 * 
 * Usage dans les tests Playwright :
 * await page.goto('/api/test/auth?role=user');
 * await page.goto('/api/test/auth?role=admin');
 */
function isTestAuthAllowed(): boolean {
  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
    return false;
  }
  return process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_AUTH === 'true';
}

export async function GET(request: NextRequest) {
  if (!isTestAuthAllowed()) {
    return NextResponse.json(
      { error: 'Endpoint not available' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'user';

  try {
    // Déterminer le rôle pour la base de données
    const dbRole = role === 'admin' ? 'ADMIN' : role === 'moderator' ? 'MODERATOR' : 'USER';
    
    // Email et password internes pour better-auth
    const email = `test-${role}@moonskin.test`;
    const password = `test-password-${role}-secure-12345`;

    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('🔨 Création d\'un nouvel utilisateur de test:', role);
      
      // Créer l'utilisateur avec better-auth
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        },
      });

      if (!signUpResult.user) {
        throw new Error('Failed to create test user via Better Auth');
      }

      // Mettre à jour avec les données de test spécifiques
      user = await prisma.user.update({
        where: { id: signUpResult.user.id },
        data: {
          emailVerified: true,
          role: dbRole,
          name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          steamId: `test-${role}-76561198000000000`,
          steamUsername: `Test${role}`,
          steamAvatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
          image: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
          level: 1,
          xp: 0,
          tickets: 0,
          totalVolumeCents: 0,
          kycStatus: 'PENDING',
          acceptedTermsAt: new Date(),
          isFirstLogin: false, // Désactiver l'onboarding pour les tests
        }
      });

      console.log('✅ Utilisateur de test créé:', user.email, 'ID:', user.id);
    } else {
      console.log('✅ Utilisateur de test existant:', user.email, 'ID:', user.id);
      
      // S'assurer que le rôle est correct
      if (user.role !== dbRole) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: dbRole }
        });
      }
    }

    // Connecter l'utilisateur via Better Auth
    console.log('🔐 Connexion de l\'utilisateur de test...');
    
    const signInRequest = new Request(`${request.nextUrl.origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': request.nextUrl.origin,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    // Utiliser le handler Better Auth directement
    const signInResponse = await auth.handler(signInRequest);

    if (!signInResponse.ok) {
      const errorText = await signInResponse.text();
      console.error('❌ Erreur de connexion:', errorText);
      throw new Error('Failed to sign in test user via Better Auth');
    }

    console.log('✅ Connexion réussie, redirection vers dashboard');

    // Créer la réponse avec redirection
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = new URL('/dashboard', baseUrl);
    redirectUrl.searchParams.set('test_login', 'success');
    redirectUrl.searchParams.set('role', role);
    
    const response = NextResponse.redirect(redirectUrl.toString());

    // Transférer tous les cookies de session de Better Auth
    const allCookies = signInResponse.headers.getSetCookie?.() ?? [];
    
    console.log('🍪 Cookies de session:', allCookies.length);
    
    for (const cookie of allCookies) {
      response.headers.append('set-cookie', cookie);
    }

    return response;

  } catch (error) {
    console.error('❌ Erreur lors de la création de la session de test:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create test session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint pour nettoyer les utilisateurs de test
 * Usage : await page.goto('/api/test/auth?cleanup=true');
 * Ou : DELETE /api/test/auth
 */
export async function DELETE(request: NextRequest) {
  if (!isTestAuthAllowed()) {
    return NextResponse.json(
      { error: 'Endpoint not available' },
      { status: 403 }
    );
  }

  try {
    // Supprimer tous les utilisateurs de test
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test-',
          endsWith: '@moonskin.test',
        },
      },
    });

    console.log(`✅ ${result.count} utilisateur(s) de test supprimé(s)`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des utilisateurs de test:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to cleanup test users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

