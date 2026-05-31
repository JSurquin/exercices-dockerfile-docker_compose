"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { LevelBadge } from "@/components/ui/level-badge";
import {
  LEVELS,
  XP_RATE,
  getTierReward,
  TIERS_PER_LEVEL,
  type LevelDef,
} from "@/lib/level-system";
import {
  homeReveal,
  homeStagger,
} from "@/lib/home-animation-classes";
import {
  SparklesIcon,
  ArrowTrendingUpIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import { SectionBottomFade } from "@/components/home/section-bottom-fade";

const LEVEL_BADGE_SIZES = [32, 42, 54, 68, 84, 104] as const;

function getLevelOpacity(levelIndex: number): number {
  return 0.5 + (levelIndex / 5) * 0.5;
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(0)}k`;
  return `${(xp / 1000).toFixed(1)}k`;
}

function formatBonus(level: LevelDef): string {
  if (level.saleBonus === 0) return "—";
  return `+${(level.saleBonus * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

function getShortRewardSummary(
  levelIndex: number,
  locale: "fr" | "en"
): string {
  const level = LEVELS[levelIndex];
  const firstReward = getTierReward(levelIndex * TIERS_PER_LEVEL);
  const parts: string[] = [];

  if (firstReward.fragments) {
    parts.push(`+${firstReward.fragments} fragments`);
  }
  if (level.saleBonus > 0) {
    parts.push(`${formatBonus(level)} bonus`);
  }
  if (parts.length === 0) {
    return locale === "en" ? "First tiers" : "Premiers paliers";
  }
  return parts.join(", ");
}

function getLevelTierRewards(levelIndex: number, locale: "fr" | "en"): string[] {
  return Array.from({ length: TIERS_PER_LEVEL }, (_, i) => {
    const reward = getTierReward(levelIndex * TIERS_PER_LEVEL + i);
    return locale === "en" ? reward.descriptionEn : reward.description;
  });
}

const COPY = {
  fr: {
    badge: "Programme fidélité",
    title: "Montez en niveau,",
    titleHighlight: " gagnez plus",
    subtitle:
      "Chaque vente vous fait progresser dans 6 niveaux cosmiques. Débloquez des bonus permanents, des fragments et des skins à chaque palier.",
    levelsTitle: "Les 6 niveaux cosmiques",
    xpRate: (rate: string) => `1 XP = ${rate} € vendus`,
    fragmentsDesc: "Collectez des fragments à chaque palier pour participer aux giveaways.",
    tierRewards: "Récompenses par palier",
    cta: "Commencer à vendre",
    bonusLabel: "Bonus vente",
    xpRequired: "XP requis",
    fullRewards: "Récompenses complètes",
    whyLine1: "Plus vous vendez, plus vous gagnez.",
    whyLine2:
      "Chaque niveau débloque des avantages permanents : bonus sur chaque vente, fragments pour les giveaways, et skins exclusifs.",
    comingSoon: "À venir",
    comingSoonDetail:
      "pour les membres fidèles — crédit instantané, bonus majorés, giveaways exclusifs réservés aux hauts rangs.",
    soonBadge: "SOON",
  },
  en: {
    badge: "Loyalty program",
    title: "Level up,",
    titleHighlight: " earn more",
    subtitle:
      "Every sale progresses you through 6 cosmic levels. Unlock permanent bonuses, fragments and skins at each tier.",
    levelsTitle: "The 6 cosmic levels",
    xpRate: (rate: string) => `1 XP = ${rate} € sold`,
    fragmentsDesc: "Collect fragments at each tier to enter giveaways.",
    tierRewards: "Tier rewards",
    cta: "Start selling",
    bonusLabel: "Sale bonus",
    xpRequired: "XP required",
    fullRewards: "Full rewards",
    whyLine1: "The more you sell, the more you earn.",
    whyLine2:
      "Each level unlocks permanent perks: sale bonuses, giveaway fragments, and exclusive skins.",
    comingSoon: "Coming soon",
    comingSoonDetail:
      "for loyal members — instant credit, boosted bonuses, exclusive high-rank giveaways.",
    soonBadge: "SOON",
  },
} as const;

export function LevelsSection() {
  const { locale } = useLocale();
  const t = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const lang = (locale === "fr" ? "fr" : "en") as "fr" | "en";
  const xpPerEuro = (1 / XP_RATE).toFixed(2);

  const exampleRewards = Array.from({ length: TIERS_PER_LEVEL }, (_, i) => {
    const reward = getTierReward(TIERS_PER_LEVEL + i);
    return lang === "en" ? reward.descriptionEn : reward.description;
  });

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-orange-500/5 pointer-events-none" />
      <SectionBottomFade to="background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 ${homeReveal.upSm}`}>
          <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            <SparklesIcon className="w-3.5 h-3.5 mr-1" />
            {t.badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.title}
            <span className="bg-gradient-to-r from-purple-500 to-orange-500 bg-clip-text text-transparent">
              {t.titleHighlight}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.subtitle}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t.xpRate(xpPerEuro)}</p>
        </div>

        {/* Cosmic levels pyramid */}
        <div className={`mb-10 ${homeReveal.up} ${homeStagger(1)}`}>
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            {t.levelsTitle}
          </h3>
          <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-5 md:gap-6 px-2">
            {LEVELS.map((level, i) => {
              const name = lang === "en" ? level.nameEn : level.name;
              const shortSummary = getShortRewardSummary(level.index, lang);
              const tierRewards = getLevelTierRewards(level.index, lang);
              const badgeTier = Math.min(level.index, 3);

              return (
                <div
                  key={level.index}
                  className={`level-card group relative flex flex-col items-center gap-1.5 transition-transform duration-200 ease-out hover:scale-[1.12] hover:z-10 cursor-default ${homeReveal.scale} ${homeStagger(i + 2)}`}
                >
                  <LevelBadge
                    tierIndex={badgeTier}
                    pixelSize={LEVEL_BADGE_SIZES[i]}
                    alt={name}
                    style={{ opacity: getLevelOpacity(level.index) }}
                  />
                  <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-tight max-w-[80px]">
                    {name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 text-center leading-tight max-w-[88px]">
                    {shortSummary}
                  </span>

                  <div className="tooltip pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 rounded-xl border border-purple-500/20 bg-popover/95 backdrop-blur-sm p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                    <p className="font-semibold text-sm mb-1">{name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t.xpRequired}: {formatXp(level.xpStart)} – {formatXp(level.xpEnd)} XP
                    </p>
                    <p className="text-xs font-medium text-orange-500 dark:text-orange-400 mb-2">
                      {t.bonusLabel}: {formatBonus(level)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t.fullRewards}
                    </p>
                    <ul className="space-y-1">
                      {tierRewards.map((reward, j) => (
                        <li key={j} className="text-xs text-muted-foreground leading-snug">
                          • {reward}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Why progress block */}
        <div
          className={`mb-16 max-w-2xl mx-auto rounded-xl border border-border/50 bg-[rgba(255,255,255,0.04)] px-5 py-4 text-center ${homeReveal.upSm}`}
        >
          <p className="text-sm text-muted-foreground mb-2">{t.whyLine1}</p>
          <p className="text-sm text-muted-foreground mb-3">{t.whyLine2}</p>
          <p className="text-xs text-muted-foreground/90 flex flex-wrap items-center justify-center gap-1.5">
            <span aria-hidden>🔮</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 border-orange-500/40 bg-orange-500/10 text-orange-500 dark:text-orange-400 font-semibold uppercase tracking-wide"
            >
              {t.soonBadge}
            </Badge>
            <span className="italic text-purple-500 dark:text-purple-400">{t.comingSoon}</span>
            <span>{t.comingSoonDetail}</span>
            <span aria-hidden>😚</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Cosmic levels list */}
          <div className={homeReveal.left}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-theme-accent" />
              {t.levelsTitle}
            </h3>
            <div className="space-y-2">
              {LEVELS.map((level) => {
                const name = lang === "en" ? level.nameEn : level.name;
                const bonusStr = formatBonus(level);
                const badgeTier = Math.min(level.index, 3);

                return (
                  <div
                    key={level.index}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5 hover:border-orange-500/30 transition-colors"
                  >
                    {level.index > 0 ? (
                      <LevelBadge tierIndex={badgeTier} size="sm" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        0
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatXp(level.xpStart)} – {formatXp(level.xpEnd)} XP
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-orange-600 dark:text-orange-400 border-orange-500/30">
                      {bonusStr}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier rewards example */}
          <div className={homeReveal.right}>
            <Card className="h-full border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-orange-500/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <GiftIcon className="w-5 h-5 text-purple-500" />
                  {t.tierRewards}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{t.fragmentsDesc}</p>

                <div className="space-y-3">
                  {exampleRewards.map((label, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <LevelBadge tierIndex={i} size="sm" />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className={`text-center ${homeReveal.upSm}`}>
          <Button asChild size="lg" variant="cta">
            <Link href="/sell">{t.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
