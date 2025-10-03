import { NextRequest, NextResponse } from 'next/server';
import { SteamInventoryItem, SteamInventoryResponse } from '@/hooks/use-steam-inventory';

interface SteamAPIAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

interface SteamAPIDescription {
  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  background_color: string;
  icon_url: string;
  icon_url_large?: string;
  descriptions?: Array<{
    type: string;
    value: string;
    color?: string;
  }>;
  tradable: number;
  actions?: Array<{
    link: string;
    name: string;
  }>;
  name: string;
  name_color: string;
  type: string;
  market_name: string;
  market_hash_name: string;
  market_actions?: Array<{
    link: string;
    name: string;
  }>;
  commodity: number;
  market_tradable_restriction: number;
  marketable: number;
  tags?: Array<{
    category: string;
    internal_name: string;
    localized_category_name: string;
    localized_tag_name: string;
    color?: string;
  }>;
}

interface SteamInventoryAPIResponse {
  assets?: SteamAPIAsset[];
  descriptions?: SteamAPIDescription[];
  total_inventory_count?: number;
  success?: number;
  Error?: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steam_id');

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: 'Steam ID requis' },
        { status: 400 }
      );
    }

    // Validation du format Steam ID64
    if (!/^\d{17}$/.test(steamId)) {
      return NextResponse.json(
        { success: false, error: 'Format Steam ID64 invalide' },
        { status: 400 }
      );
    }

    // Appel à l'API Steam publique
    const steamApiUrl = `https://steamcommunity.com/inventory/${steamId}/440/2`;
    
    const response = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    console.log('response de lapi', response);

    if (!response.ok) {
      if (response.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Inventaire privé ou inaccessible' },
          { status: 403 }
        );
      }
      if (response.status === 500) {
        return NextResponse.json(
          { success: false, error: 'Inventaire temporairement indisponible' },
          { status: 500 }
        );
      }
      throw new Error(`Erreur Steam API: ${response.status}`);
    }

    const data: SteamInventoryAPIResponse = await response.json();

    console.log('data de lapi', data);

    // Vérifier si Steam a retourné une erreur
    if (data.Error || data.error) {
      return NextResponse.json(
        { success: false, error: data.Error || data.error },
        { status: 400 }
      );
    }

    if (!data.assets || !data.descriptions) {
      return NextResponse.json({
        success: true,
        total_inventory_count: 0,
        items: [],
      });
    }

    console.log('data.assets de lapi', data.assets);
    console.log('data.descriptions de lapi', data.descriptions);

    // Mapper les assets avec leurs descriptions
    const items = data.assets.map((asset, index) => {
      const description = data.descriptions?.find(
        desc => desc.classid === asset.classid && desc.instanceid === asset.instanceid
      );

      console.log('items de lapi', description);

      if (!description) {
        return null;
      }

      return {
        id: asset.assetid,
        classid: asset.classid,
        instanceid: asset.instanceid,
        amount: asset.amount,
        pos: index,
        appid: asset.appid,
        contextid: asset.contextid,
        assetid: asset.assetid,
        market_hash_name: description.market_hash_name,
        market_name: description.market_name,
        name: description.name,
        name_color: description.name_color,
        type: description.type,
        icon_url: `https://community.cloudflare.steamstatic.com/economy/image/${description.icon_url}`,
        icon_url_large: description.icon_url_large 
          ? `https://community.cloudflare.steamstatic.com/economy/image/${description.icon_url_large}`
          : undefined,
        tradable: description.tradable,
        marketable: description.marketable,
        commodity: description.commodity,
        market_tradable_restriction: description.market_tradable_restriction,
        descriptions: description.descriptions,
        tags: description.tags,
      };
    }).filter((item) => item !== null);

    // Filtrer uniquement les items CS2 tradables et marketables
    const cs2TradableItems = items.filter(item => 
      item !== null &&
      item.appid === 440
      && item.tradable === 1 
    //   && 
    //   item.tradable === 1 && 
    //   item.marketable === 1 &&
    //   // Exclure les cases, clés, etc.
    //   !item.market_hash_name.includes('Case') &&
    //   !item.market_hash_name.includes('Key') &&
    //   !item.market_hash_name.includes('Sticker') &&
    //   !item.market_hash_name.includes('Patch') &&
    //   !item.market_hash_name.includes('Music Kit') &&
    //   !item.market_hash_name.includes('Graffiti')
    );

    const result: SteamInventoryResponse = {
      success: true,
      total_inventory_count: data.total_inventory_count || items.length,
      items: cs2TradableItems,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'inventaire Steam:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Timeout lors de la récupération de l\'inventaire' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
