import { NextRequest, NextResponse } from 'next/server';
import { skinplaceService, handleSkinplaceError } from '@/lib/skinplace';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const rarity = searchParams.get('rarity');
    const exterior = searchParams.get('exterior');
    const statTrak = searchParams.get('stat_trak');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const search = searchParams.get('search');

    // Valider les paramètres
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'page doit être >= 1 et limit entre 1 et 100' },
        { status: 400 }
      );
    }

    const filters: Record<string, string | number | boolean> = {};
    if (rarity) filters.rarity = rarity;
    if (exterior) filters.exterior = exterior;
    if (statTrak) filters.stat_trak = statTrak === 'true';
    if (minPrice) filters.min_price = parseInt(minPrice);
    if (maxPrice) filters.max_price = parseInt(maxPrice);
    if (search) filters.search = search;

    const listings = await skinplaceService.getItemListings(page, limit, filters);

    return NextResponse.json(listings);
  } catch (error) {
    console.error('Erreur lors de la récupération des items en vente:', error);
    
    const skinplaceError = handleSkinplaceError(error);
    return NextResponse.json(skinplaceError, { status: 500 });
  }
}
