import { NextRequest, NextResponse } from 'next/server';
import { auth } from '~/lib/auth';
import { skinplaceService } from '@/lib/skinplace';
import {
  SKINPLACE_ITEMS_DEFAULT_LIMIT,
  SKINPLACE_ITEMS_MAX_LIMIT,
} from '@/lib/admin-constants';
import { getPlatformConfig } from '@/lib/platform-config-service';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin requis' }, { status: 403 });
  }

  const search = request.nextUrl.searchParams.get('search') ?? '';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? String(SKINPLACE_ITEMS_DEFAULT_LIMIT)),
    SKINPLACE_ITEMS_MAX_LIMIT
  );

  try {
    const { steamCdnUrl } = await getPlatformConfig();
    const result = await skinplaceService.getItemListings(1, limit, {
      search: search || undefined,
    });

    // L'API retourne { data: ListingSteamItem[], status: "success" }
    type RawItem = {
      steam_market_hash_name?: string;
      icon_url?: string;
      price?: number;
      rarity?: string;
      rarity_color?: string;
      exterior?: string;
      item_type?: string;
      phase?: string | null;
    };

    const r = result as unknown as Record<string, unknown>;
    const rawItems: RawItem[] = Array.isArray(r?.data) ? (r.data as RawItem[]) : [];

    const items = rawItems.map((s) => ({
      steam_market_hash_name: s.steam_market_hash_name ?? '',
      icon_url: s.icon_url
        ? s.icon_url.startsWith('http')
          ? s.icon_url
          : `${steamCdnUrl}${s.icon_url}`
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
