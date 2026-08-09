import { NextRequest, NextResponse } from 'next/server';
import { getTrustedAuthOrigins } from '@/lib/public-app-url';

/**
 * Vérifie que les mutations proviennent d'une origine de confiance (protection CSRF).
 * Rejette les requêtes cross-origin sans Origin/Referer valide.
 */
export function verifyMutationOrigin(request: NextRequest): NextResponse | null {
  const trusted = new Set(getTrustedAuthOrigins());

  // Autoriser les requêtes sans Origin en dev local (curl, tests)
  if (process.env.NODE_ENV === 'development') {
    trusted.add('http://localhost:3000');
    trusted.add('http://127.0.0.1:3000');
  }

  const origin = request.headers.get('origin');
  if (origin) {
    if (!trusted.has(origin)) {
      return NextResponse.json({ error: 'Requête non autorisée' }, { status: 403 });
    }
    return null;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!trusted.has(refererOrigin)) {
        return NextResponse.json({ error: 'Requête non autorisée' }, { status: 403 });
      }
      return null;
    } catch {
      return NextResponse.json({ error: 'Requête non autorisée' }, { status: 403 });
    }
  }

  // Pas d'Origin ni Referer : bloquer en production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Requête non autorisée' }, { status: 403 });
  }

  return null;
}
