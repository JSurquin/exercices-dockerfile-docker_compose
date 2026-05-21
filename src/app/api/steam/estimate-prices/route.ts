import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { safeParseJson } from '@/lib/validation/helpers';
import { steamEstimatePricesSchema } from '@/lib/validation/schemas/chat-api';
import { RateLimiter, RATE_LIMIT_CONFIGS } from '@/lib/security/rate-limiter';

const rateLimiter = new RateLimiter('ESTIMATE_PRICES', RATE_LIMIT_CONFIGS.API_GENERAL);

interface SkinplacePriceResponse {
  success: boolean;
  data?: {
    items: Array<{
      market_hash_name: string;
      price: number; // En centimes
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const rateCheck = await rateLimiter.checkLimit(request, session.user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = safeParseJson(raw, steamEstimatePricesSchema, {
      errorStyle: 'affiliate',
    });
    if (!parsed.ok) {
      return parsed.response;
    }
    const body = parsed.data;

    if (body.market_hash_names.length === 0) {
      return NextResponse.json({
        success: true,
        items: [],
      });
    }

    // Limiter à 50 items max par requête pour éviter les timeouts
    const limitedItems = body.market_hash_names.slice(0, 50);

    // Appel à l'API Skinplace pour l'estimation des prix
    const skinplaceApiKey = process.env.SKINPLACE_API_KEY;
    if (!skinplaceApiKey) {
      return NextResponse.json(
        { success: false, error: 'Configuration API manquante' },
        { status: 500 }
      );
    }

    // Pour l'estimation, on peut utiliser l'endpoint de pricing de Skinplace
    // Ici on simule, mais vous devrez adapter selon l'API réelle de Skinplace
    const estimatedPrices = await Promise.all(
      limitedItems.map(async (marketHashName) => {
        try {
          // Simulation d'appel à Skinplace pour l'estimation
          // Remplacez par l'endpoint réel de Skinplace
          const response = await fetch(`https://api.skin.place/v1/items/price?market_hash_name=${encodeURIComponent(marketHashName)}`, {
            headers: {
              'Authorization': `Bearer ${skinplaceApiKey}`,
              'Content-Type': 'application/json',
            },
            // Timeout de 5 secondes par item
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            console.warn(`Impossible d'estimer le prix pour ${marketHashName}: ${response.status}`);
            return {
              market_hash_name: marketHashName,
              estimated_price: 0, // Prix par défaut si estimation échoue
            };
          }

          const priceData: SkinplacePriceResponse = await response.json();
          
          if (priceData.success && priceData.data?.items?.[0]) {
            return {
              market_hash_name: marketHashName,
              estimated_price: priceData.data.items[0].price,
            };
          }

          return {
            market_hash_name: marketHashName,
            estimated_price: 0,
          };

        } catch (error) {
          console.warn(`Erreur estimation prix pour ${marketHashName}:`, error);
          return {
            market_hash_name: marketHashName,
            estimated_price: 0,
          };
        }
      })
    );

    // Créer un mapping par ID d'asset (on utilise market_hash_name comme clé)
    const priceMap = estimatedPrices.reduce((acc, item) => {
      acc[item.market_hash_name] = item.estimated_price;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      items: estimatedPrices.filter(item => item.estimated_price > 0),
      price_map: priceMap,
    });

  } catch (error) {
    console.error('Erreur lors de l\'estimation des prix:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de l\'estimation des prix' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Endpoint GET pour récupérer le prix d'un seul item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const marketHashName = searchParams.get('market_hash_name');

    if (!marketHashName) {
      return NextResponse.json(
        { success: false, error: 'market_hash_name requis' },
        { status: 400 }
      );
    }

    // Réutiliser la logique POST pour un seul item
    const postResponse = await POST(
      new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ market_hash_names: [marketHashName] }),
        headers: request.headers,
      })
    );

    return postResponse;

  } catch (error) {
    console.error('Erreur lors de l\'estimation du prix:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
