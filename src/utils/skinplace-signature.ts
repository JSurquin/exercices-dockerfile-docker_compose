import { createHash } from 'crypto';

/**
 * Génère une signature SHA256 pour l'API Skin.place
 * @param steamId - L'ID Steam de l'utilisateur
 * @param privateKey - La clé privée Skinplace (process.env.SKINPLACE_API_KEY_PRIVATE)
 * @returns La signature SHA256 en hexadécimal
 */
export function generateSkinplaceSignature(steamId: string, privateKey: string): string {
  console.log('🔐 Génération signature Skinplace:');
  console.log('  - steamId:', steamId);
  console.log('  - privateKey (longueur):', privateKey?.length || 'undefined');
  console.log('  - privateKey (premiers 10 chars):', privateKey?.substring(0, 10) + '...' || 'undefined');
  
  if (!steamId || !privateKey) {
    console.error('❌ Paramètres manquants pour la signature');
    throw new Error('steamId et privateKey sont requis pour générer la signature');
  }

  // Validation du format Steam ID64
  if (!/^\d{17}$/.test(steamId)) {
    console.error('❌ Format Steam ID64 invalide:', steamId);
    throw new Error('Format Steam ID64 invalide');
  }

  // Concaténer steamId + privateKey et générer le hash SHA256
  const data = steamId + privateKey;
  console.log('  - Données à hasher (longueur):', data.length);
  console.log('  - Données à hasher (aperçu):', data.substring(0, 20) + '...');
  
  const hash = createHash('sha256');
  hash.update(data);
  const signature = hash.digest('hex');
  
  console.log('  - Signature générée (longueur):', signature.length);
  console.log('  - Signature générée (premiers 16 chars):', signature.substring(0, 16) + '...');
  
  return signature;
}

/**
 * Valide les paramètres requis pour l'API Skin.place
 * @param params - Les paramètres à valider
 * @returns true si tous les paramètres sont valides
 */
export function validateSkinplaceParams(params: {
  steamId: string;
  signature: string;
  project: string;
  publicKey: string;
}): boolean {
  const { steamId, signature, project, publicKey } = params;
  
  // Vérifier que tous les paramètres sont présents
  if (!steamId || !signature || !project || !publicKey) {
    return false;
  }

  // Vérifier le format Steam ID64
  if (!/^\d{17}$/.test(steamId)) {
    return false;
  }

  // Vérifier que la signature est un hash SHA256 valide (64 caractères hexadécimaux)
  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  // Vérifier que le projet est 'csgo'
  if (project !== 'csgo') {
    return false;
  }

  return true;
}

/**
 * Construit l'URL complète pour l'API Skin.place avec tous les paramètres
 * @param steamId - L'ID Steam de l'utilisateur
 * @param signature - La signature SHA256 générée
 * @param publicKey - La clé publique Skinplace
 * @returns L'URL complète avec les paramètres
 */
export function buildSkinplaceInventoryUrl(
  steamId: string, 
  signature: string, 
  publicKey: string
): string {
  const baseUrl = 'https://api.skin.place/api/v3/instant/inventory';
  const params = new URLSearchParams({
    steamid: steamId, // ⚠️ CORRECTION: steamid en minuscules !
    signature,
    project: 'csgo',
    'public key': publicKey
  });

  return `${baseUrl}?${params.toString()}`;
}
