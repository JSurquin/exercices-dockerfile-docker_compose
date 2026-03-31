/**
 * Liens officiels des réseaux MoonSkin.
 * Les variables NEXT_PUBLIC_* permettent de surcharger en déploiement.
 */
export const MOONSKIN_DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/moonskin";

export const MOONSKIN_X_URL =
  process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://x.com/MoonSkinCs";
