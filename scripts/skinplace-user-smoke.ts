/**
 * Smoke test Skinplace « full API » pour un utilisateur en base (ex. pseudo Steam / email).
 *
 * Par défaut : GET inventaire uniquement (lecture, même contrat que l’app).
 * POST instant (création d’offre réelle) : uniquement avec --post-offer + MOONSKIN_CONFIRM_INSTANT=I_UNDERSTAND
 *
 * Usage:
 *   npx tsx scripts/skinplace-user-smoke.ts nyouz
 *   npx tsx scripts/skinplace-user-smoke.ts nyouz --post-offer --assets 123,456
 *
 * Prérequis: .env ou .env.local avec DATABASE_URL, SKINPLACE_API_KEY_PRIVATE, SKINPLACE_API_KEY_PUBLIC,
 *   et pour le POST: NEXT_PUBLIC_APP_URL, SKINPLACE_WEBHOOK_SECRET (comme create-trade).
 */

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

loadEnv({ path: resolve(process.cwd(), '.env.local') });
loadEnv({ path: resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { generateSkinplaceSignature, validateSkinplaceParams } from '../src/utils/skinplace-signature';

const prisma = new PrismaClient();

const INVENTORY_URL = 'https://api.skin.place/api/v3/instant/inventory';

function maskTradeUrl(url: string): string {
  return url.replace(
    /(token=)([a-zA-Z0-9_-]+)/,
    (_, pre: string, tok: string) =>
      `${pre}${tok.length <= 4 ? '****' : `${tok.slice(0, 2)}…${tok.slice(-2)}`}`,
  );
}

function parseArgs(argv: string[]) {
  const term: string[] = [];
  let postOffer = false;
  const assets: string[] = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--post-offer') postOffer = true;
    else if (a === '--assets' && argv[i + 1]) {
      assets.push(...argv[++i].split(',').map((s) => s.trim()).filter(Boolean));
    } else if (!a.startsWith('-')) term.push(a);
  }
  const needle = term.join(' ').trim() || 'nyouz';
  return { needle, postOffer, assets };
}

async function fetchInventoryGet(steamId: string, privateKey: string, publicKey: string) {
  const signature = generateSkinplaceSignature(steamId, privateKey);
  const params = { steamId, signature, project: 'csgo' as const, publicKey };
  if (!validateSkinplaceParams(params)) {
    throw new Error('Paramètres signature invalides');
  }
  const urlParams = new URLSearchParams();
  urlParams.append('steamid', steamId);
  urlParams.append('signature', signature);
  urlParams.append('project', 'csgo');
  urlParams.append('public key', publicKey);
  const url = `${INVENTORY_URL}?${urlParams.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'User-Agent': 'MoonSkin-smoke/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Réponse non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  return { ok: res.ok, status: res.status, json };
}

async function postInstantOffer(payload: Record<string, unknown>) {
  const res = await fetch(INVENTORY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'MoonSkin-smoke/1.0',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  const { needle, postOffer, assets } = parseArgs(process.argv);

  const privateKey = process.env.SKINPLACE_API_KEY_PRIVATE;
  const publicKey = process.env.SKINPLACE_API_KEY_PUBLIC;
  if (!privateKey?.trim() || !publicKey?.trim()) {
    console.error('Manque SKINPLACE_API_KEY_PRIVATE / SKINPLACE_API_KEY_PUBLIC dans .env');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { steamUsername: { contains: needle, mode: 'insensitive' } },
        { name: { contains: needle, mode: 'insensitive' } },
        { email: { contains: needle, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      steamId: true,
      tradeLink: true,
      steamUsername: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    console.error(`Aucun utilisateur trouvé pour « ${needle} » (steamUsername / name / email).`);
    process.exit(1);
  }

  if (!user.steamId || !/^\d{17}$/.test(user.steamId)) {
    console.error('Utilisateur sans steamId64 valide:', user.id);
    process.exit(1);
  }

  console.log('[MoonSkin/smoke] utilisateur', {
    id: user.id,
    steamUsername: user.steamUsername,
    name: user.name,
    email: user.email?.replace(/(@.).*/, '$1…'),
    steamId: user.steamId,
    tradeLinkMasked: user.tradeLink ? maskTradeUrl(user.tradeLink) : null,
  });

  console.log('[MoonSkin/smoke] GET inventaire Skinplace…');
  const inv = await fetchInventoryGet(user.steamId, privateKey, publicKey);
  console.log('[MoonSkin/smoke] GET status', inv.status, 'ok=', inv.ok);

  type InvRow = {
    assetid?: string;
    untouchable?: boolean;
    skip_reason?: string;
    market_hash_name?: string;
    price?: number;
    price_real?: number;
  };
  const body = inv.json as {
    inventory?: InvRow[];
    status?: string;
    error_message?: string;
    errorcode?: number;
  };
  if (!inv.ok) {
    console.error('[MoonSkin/smoke] erreur inventaire', JSON.stringify(inv.json, null, 2));
    process.exit(1);
  }

  const list = body.inventory ?? [];
  const tradable = list.filter((i) => !i.untouchable && !i.skip_reason && Boolean(i.assetid));
  const priceOf = (i: InvRow) =>
    typeof i.price === 'number' && !Number.isNaN(i.price)
      ? i.price
      : typeof i.price_real === 'number' && !Number.isNaN(i.price_real)
        ? i.price_real
        : Number.POSITIVE_INFINITY;
  const byPrice = [...tradable].sort((a, b) => priceOf(a) - priceOf(b));

  console.log('[MoonSkin/smoke] items total=', list.length, 'tradables≈', tradable.length);
  if (byPrice.length) {
    const cheapest = byPrice[0];
    console.log('[MoonSkin/smoke] moins cher (tradable)', {
      name: cheapest.market_hash_name,
      assetid: cheapest.assetid,
      price_skinplace: priceOf(cheapest),
    });
  }

  if (!postOffer) {
    console.log('[MoonSkin/smoke] Terminé (lecture seule). Pour POST instant: --post-offer + MOONSKIN_CONFIRM_INSTANT=I_UNDERSTAND');
    return;
  }

  if (process.env.MOONSKIN_CONFIRM_INSTANT !== 'I_UNDERSTAND') {
    console.error(
      'Refus: POST instant crée une vraie offre. Exporte MOONSKIN_CONFIRM_INSTANT=I_UNDERSTAND pour confirmer.',
    );
    process.exit(1);
  }

  const tradeUrl = user.tradeLink?.trim();
  if (!tradeUrl) {
    console.error('Pas de tradeLink en base pour cet utilisateur.');
    process.exit(1);
  }

  const m = tradeUrl.match(/partner=(\d+)&token=([a-zA-Z0-9_-]+)/);
  if (!m) {
    console.error('tradeLink invalide (partner/token)');
    process.exit(1);
  }
  const tradeToken = m[2];

  let offerAssets = assets;
  if (offerAssets.length === 0) {
    const cheapest = byPrice[0]?.assetid;
    if (!cheapest) {
      console.error('Aucun asset tradable pour auto-sélection; passe --assets id1,id2');
      process.exit(1);
    }
    offerAssets = [cheapest];
    console.log('[MoonSkin/smoke] auto-sélection: item le moins cher', {
      assetid: cheapest,
      name: byPrice[0].market_hash_name,
      price_skinplace: priceOf(byPrice[0]),
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  const webhookSecret = process.env.SKINPLACE_WEBHOOK_SECRET || '';
  if (!appUrl) {
    console.error('NEXT_PUBLIC_APP_URL requis pour ipn_url');
    process.exit(1);
  }

  const signature = generateSkinplaceSignature(user.steamId, privateKey);
  const orderId = randomBytes(12).toString('hex');

  const skinplacePayload = {
    signature,
    public_key: publicKey,
    project: 'csgo',
    steamid: user.steamId,
    trade_token: tradeToken,
    offers: offerAssets,
    ipn_url: `${appUrl}/api/skinplace/webhook?secret=${webhookSecret}`,
    order_id: orderId,
    send_offer_sync: 1,
  };

  console.log('[MoonSkin/smoke] POST instant (offre réelle)', {
    order_id: orderId,
    offers: offerAssets,
    trade_token_masked: maskTradeUrl(`https://steamcommunity.com/tradeoffer/new/?partner=0&token=${tradeToken}`),
  });

  const post = await postInstantOffer(skinplacePayload);
  console.log('[MoonSkin/smoke] POST status', post.status, JSON.stringify(post.json, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
