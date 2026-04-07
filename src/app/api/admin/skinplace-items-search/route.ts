import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { skinplaceService } from '@/lib/skinplace';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get('search') ?? '';
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '30'), 50);

  try {
    const result = await skinplaceService.getItemListings(1, limit, {
      search: search || undefined,
    } as Parameters<typeof skinplaceService.getItemListings>[2]);

    console.log('[skinplace-items-search] raw result keys:', Object.keys(result ?? {}));
    console.log('[skinplace-items-search] raw result (truncated):', JSON.stringify(result).slice(0, 500));

    type RawItem = {
      steam_market_hash_name?: string;
      market_hash_name?: string;
      name?: string;
      icon_url?: string;
      price?: number;
      rarity?: string;
      rarity_color?: string;
      exterior?: string;
      item_type?: string;
      phase?: string | null;
    };

    type AnyResult = Record<string, unknown>;
    const r = result as AnyResult;

    const rawItems: RawItem[] = (
      Array.isArray(r?.data) ? r.data :
      Array.isArray((r?.data as AnyResult)?.items) ? (r.data as AnyResult).items :
      Array.isArray((r?.data as AnyResult)?.data) ? (r.data as AnyResult).data :
      Array.isArray(r?.items) ? r.items :
      Array.isArray(r?.results) ? r.results :
      []
    ) as RawItem[];

    console.log('[skinplace-items-search] rawItems count:', rawItems.length);

    const items = rawItems.map((s) => ({
      steam_market_hash_name: s.steam_market_hash_name ?? s.market_hash_name ?? s.name ?? '',
      icon_url: s.icon_url
        ? s.icon_url.startsWith('http')
          ? s.icon_url
          : `https://community.cloudflare.steamstatic.com/economy/image/${s.icon_url}`
        : null,
      price: s.price ?? null,
      rarity: s.rarity ?? null,
      rarity_color: s.rarity_color ?? null,
      exterior: s.exterior ?? null,
      item_type: s.item_type ?? null,
      phase: s.phase ?? null,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('[skinplace-items-search]', err);
    return NextResponse.json({ items: [], error: 'Erreur Skinplace' }, { status: 200 });
  }
}
