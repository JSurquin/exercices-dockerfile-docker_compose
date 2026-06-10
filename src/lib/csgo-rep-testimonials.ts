import type { Locale } from '@/lib/i18n';

export interface CsgoRepTestimonialSource {
  steamId: string;
  avatar: string;
  /** Original CSGO-Rep review text, kept for traceability */
  commentOriginal: string;
  commentOriginalLang: 'en' | 'fr';
  dateIso: string;
}

export const CSGO_REP_TESTIMONIAL_SOURCE: CsgoRepTestimonialSource[] = [
  {
    steamId: '76561198354097387',
    avatar: 'https://avatars.steamstatic.com/8707319fd87ef78f9c3166d44d5a928d72230415_full.jpg',
    commentOriginal: 'Gift for him, fast and smooth trade',
    commentOriginalLang: 'en',
    dateIso: '2025-11-10',
  },
  {
    steamId: '76561198980987936',
    avatar: 'https://avatars.steamstatic.com/ddce018ed952993af326e8724b47384fcae6a10f_full.jpg',
    commentOriginal:
      'Tu peux lui faire confiance à 100%. Je trade avec lui depuis des années sans jamais de problème. Il propose toujours les meilleurs prix possibles.',
    commentOriginalLang: 'fr',
    dateIso: '2026-03-03',
  },
  {
    steamId: '76561199496067896',
    avatar: 'https://avatars.steamstatic.com/19e7c4f5d57f662bc37925422efa31aeaebbd9e2_full.jpg',
    commentOriginal: 'Ty again for this trade, perfect inventory',
    commentOriginalLang: 'en',
    dateIso: '2025-04-12',
  },
  {
    steamId: '76561198061376237',
    avatar: 'https://avatars.steamstatic.com/cefaaaad35c70dd51850d509c6916b42743e8d98_full.jpg',
    commentOriginal:
      '+rep, have supplied his customers with 100k+ rmb, I went first, got money at the end of the day.',
    commentOriginalLang: 'en',
    dateIso: '2025-11-15',
  },
  {
    steamId: '76561198067621699',
    avatar: 'https://avatars.steamstatic.com/d13c71aa50fa3bc9a4ef543138e362fffbdebf93_full.jpg',
    commentOriginal:
      'Bought 8k eur worth of buff ball and 2k usdt from him, I can only recommend him for not taking advantage of my trust!',
    commentOriginalLang: 'en',
    dateIso: '2024-01-11',
  },
  {
    steamId: '76561198001122376',
    avatar: 'https://avatars.steamstatic.com/f77faaef3023f24ec09a5398c650f552bd4a7b6a_full.jpg',
    commentOriginal:
      'I sold him $1,100 worth of skins, and he bought $5,500 worth of skins from me on Youpin. It was really fast! Skins were in my account that same day!',
    commentOriginalLang: 'en',
    dateIso: '2026-04-13',
  },
];

const LOCALE_TO_INTL: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  cn: 'zh-CN',
};

export function formatTestimonialDate(dateIso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${dateIso}T12:00:00`));
}
