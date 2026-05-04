/**
 * Liens officiels des réseaux MoonSkin.
 * Les variables NEXT_PUBLIC_* permettent de surcharger en déploiement.
 */
export const MOONSKIN_DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/moonskin";

export const MOONSKIN_X_URL =
  process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://x.com/MoonSkinCs";

export const MOONSKIN_INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/moonskinscs";

export const MOONSKIN_TIKTOK_URL =
  process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/@moonskincs";

export const MOONSKIN_YOUTUBE_URL =
  process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/@MoonSkinCs";

export const MOONSKIN_TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/+1gKVtRrz9p81OTM0";

export const MOONSKIN_STEAM_GROUP_URL =
  process.env.NEXT_PUBLIC_STEAM_GROUP_URL ?? "https://steamcommunity.com/groups/MoonSkin";

export const SOCIAL_MISSION_URLS: Record<string, string> = {
  SOCIAL_TWITTER: MOONSKIN_X_URL,
  SOCIAL_INSTAGRAM: MOONSKIN_INSTAGRAM_URL,
  SOCIAL_DISCORD: MOONSKIN_DISCORD_URL,
  SOCIAL_TIKTOK: MOONSKIN_TIKTOK_URL,
  SOCIAL_YOUTUBE: MOONSKIN_YOUTUBE_URL,
  SOCIAL_TELEGRAM: MOONSKIN_TELEGRAM_URL,
  SOCIAL_STEAM_GROUP: MOONSKIN_STEAM_GROUP_URL,
};
