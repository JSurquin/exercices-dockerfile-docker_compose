// Steam OpenID Connect implementation
import { NextRequest } from 'next/server';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const STEAM_API_URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';

export interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate: number;
  lastlogoff: number;
  commentpermission: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

/**
 * Génère l'URL d'authentification Steam OpenID
 */
export function generateSteamAuthUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': new URL(returnUrl).origin,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Vérifie la réponse OpenID de Steam
 */
export async function verifySteamOpenID(request: NextRequest): Promise<string | null> {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());

  // Vérifier que tous les paramètres requis sont présents
  const requiredParams = [
    'openid.mode',
    'openid.op_endpoint',
    'openid.claimed_id',
    'openid.identity',
    'openid.return_to',
    'openid.response_nonce',
    'openid.assoc_handle',
    'openid.signed',
    'openid.sig'
  ];

  for (const param of requiredParams) {
    if (!params[param]) {
      console.error(`Missing required parameter: ${param}`);
      return null;
    }
  }

  // Vérifier que c'est bien Steam
  if (params['openid.op_endpoint'] !== 'https://steamcommunity.com/openid/login') {
    console.error('Invalid OpenID endpoint');
    return null;
  }

  // Préparer les paramètres pour la vérification
  const verifyParams = new URLSearchParams();
  verifyParams.set('openid.mode', 'check_authentication');
  
  // Copier tous les paramètres sauf le mode
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'openid.mode') {
      verifyParams.set(key, value);
    }
  }

  try {
    // Vérifier auprès de Steam
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    const responseText = await response.text();
    
    if (responseText.includes('is_valid:true')) {
      // Extraire le Steam ID de l'identity
      const identity = params['openid.identity'];
      const steamIdMatch = identity.match(/\/id\/(\d+)$/);
      
      if (steamIdMatch) {
        return steamIdMatch[1]; // Steam ID 64
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying Steam OpenID:', error);
    return null;
  }
}

/**
 * Récupère les informations du profil Steam
 */
export async function getSteamUserInfo(steamId: string): Promise<SteamUser | null> {
  const apiKey = process.env.STEAM_API_KEY;
  
  if (!apiKey) {
    console.error('STEAM_API_KEY not configured');
    return null;
  }

  try {
    const url = `${STEAM_API_URL}?key=${apiKey}&steamids=${steamId}&format=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Steam API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.response?.players?.length > 0) {
      return data.response.players[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Steam user info:', error);
    return null;
  }
}
