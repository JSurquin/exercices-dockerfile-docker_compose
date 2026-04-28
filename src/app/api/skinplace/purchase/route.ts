import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '~/lib/auth';
import { safeParseJson } from '@/lib/validation/helpers';
import { skinplacePurchaseBodySchema } from '@/lib/validation/schemas/integrations';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, skinplacePurchaseBodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }
    const { items, payment_method, trade_token } = parsed.data;
    
    // ⚠️ SÉCURITÉ CRITIQUE: FAILLE PURCHASE BALANCE MARCHAND ⚠️
    // 
    // PROBLÈME: payment_method='balance' utilise le SOLDE MARCHAND Skinplace (clé API globale)
    // et non un solde utilisateur individuel. TOUS les utilisateurs authentifiés peuvent
    // acheter avec la balance de la plateforme.
    // 
    // RISQUE:
    //   - N'importe quel utilisateur peut vider le solde marchand Skinplace
    //   - Pas de débit du solde utilisateur MoonSkin (balanceCents)
    //   - Pas de traçabilité par utilisateur côté Skinplace
    //   - Perte financière directe pour la plateforme
    // 
    // CORRECTIF REQUIS:
    //   1. BLOQUER payment_method='balance' temporairement (ligne ci-dessous)
    //   2. IMPLÉMENTER un système de sous-comptes Skinplace par utilisateur
    //      OU débiter balanceCents AVANT l'achat et créditer après livraison
    //   3. VALIDER trade_token appartient à l'utilisateur
    //   4. LOGGER tous les achats avec userId pour audit
    // 
    // SOLUTION TEMPORAIRE: Bloquer 'balance' jusqu'à refonte
    if (payment_method === 'balance') {
      return NextResponse.json(
        { 
          error: 'Le paiement par balance marchand est temporairement désactivé pour des raisons de sécurité',
          code: 'PAYMENT_METHOD_DISABLED'
        },
        { status: 403 }
      );
    }
    
    // TODO: Vérifier que trade_token appartient à l'utilisateur
    // const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    // if (trade_token && user?.tradeLink && !user.tradeLink.includes(trade_token)) {
    //   return NextResponse.json({ error: 'Trade token non autorisé' }, { status: 403 });
    // }

    // Limiter le nombre d'items pour éviter les abus
    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 items autorisés' },
        { status: 400 }
      );
    }

    const purchase = await skinplaceService.purchaseItems({
      items,
      payment_method,
      trade_token,
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Erreur lors de l\'achat d\'items:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
