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
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { SectionBottomFade } from "@/components/home/section-bottom-fade";
import { useAuth } from "@/components/providers/auth-provider";
import { FragmentAmount } from "@/components/ui/level-badge";

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
    fragmentsTitle: "Fragments — comment ça marche ?",
    fragmentsIntro:
      "Les fragments sont la monnaie de récompense de MoonSkin. Tu en gagnes automatiquement à chaque vente, selon ton niveau de fidélité.",
    fragmentsBullet1: "Utilise tes fragments pour entrer dans les giveaways",
    fragmentsBullet2: "Plus tu as de fragments, plus tu as de chances de gagner",
    fragmentsBullet3: "Chaque palier débloque un bonus de fragments sur tes ventes",
    fragmentsFooter:
      "Les fragments ne se dépensent pas — ils s'accumulent et te donnent des tickets d'entrée aux giveaways exclusifs MoonSkin.",
    fragmentsCta: "Voir les giveaways actifs",
    fragmentsBalance: "Ton solde de fragments",
    cta: "Commencer à vendre",
    bonusLabel: "Bonus vente",
    xpRequired: "XP requis",
    fullRewards: "Récompenses complètes",
  },
  en: {
    badge: "Loyalty program",
    title: "Level up,",
    titleHighlight: " earn more",
    subtitle:
      "Every sale progresses you through 6 cosmic levels. Unlock permanent bonuses, fragments and skins at each tier.",
    levelsTitle: "The 6 cosmic levels",
    xpRate: (rate: string) => `1 XP = ${rate} € sold`,
    fragmentsTitle: "Fragments — how does it work?",
    fragmentsIntro:
      "Fragments are MoonSkin's reward currency. You earn them automatically with every sale, based on your loyalty level.",
    fragmentsBullet1: "Use your fragments to enter giveaways",
    fragmentsBullet2: "The more fragments you have, the better your chances of winning",
    fragmentsBullet3: "Each tier unlocks a fragment bonus on your sales",
    fragmentsFooter:
      "Fragments are not spent — they accumulate and earn you entry tickets to exclusive MoonSkin giveaways.",
    fragmentsCta: "View active giveaways",
    fragmentsBalance: "Your fragment balance",
    cta: "Start selling",
    bonusLabel: "Sale bonus",
    xpRequired: "XP required",
    fullRewards: "Full rewards",
  },
} as const;

const FRAGMENT_BULLETS = ["fragmentsBullet1", "fragmentsBullet2", "fragmentsBullet3"] as const;

export function LevelsSection() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const t = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const lang = (locale === "fr" ? "fr" : "en") as "fr" | "en";
  const xpPerEuro = (1 / XP_RATE).toFixed(2);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-theme-accent/5 pointer-events-none" />
      <SectionBottomFade to="background" />

      <div className="container mx-auto px-4 relative z-10">
        <div className={`text-center mb-16 ${homeReveal.upSm}`}>
          <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            <SparklesIcon className="w-3.5 h-3.5 mr-1" />
            {t.badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.title}
            <span className="bg-gradient-to-r from-purple-500 to-theme-accent bg-clip-text text-transparent">
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
                    <p className="text-xs font-medium text-theme-accent dark:text-theme-highlight mb-2">
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

        <div className="flex flex-col gap-8 mb-12">
          {/* Floating fragment hero — centered above the explanation card */}
          <div className={`${homeReveal.upSm} flex items-center justify-center px-4 py-2`}>
            <img
              src="/levels/FRAGMENTMS.png"
              alt={locale === "fr" ? "Fragments" : "Fragments"}
              className="fragment-hero w-[min(100%,320px)] sm:w-[min(100%,380px)] lg:w-[min(100%,420px)] h-auto object-contain"
              draggable={false}
            />
          </div>

          {/* Fragments explanation */}
          <div className={homeReveal.up}>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-background to-theme-accent/5">
              <CardContent className="p-6 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span aria-hidden>🔮</span>
                  {t.fragmentsTitle}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{t.fragmentsIntro}</p>

                <ul className="space-y-2.5 mb-4">
                  {FRAGMENT_BULLETS.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRightIcon className="w-4 h-4 shrink-0 mt-0.5 text-theme-accent" />
                      <span>{t[key]}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm text-muted-foreground/90 mb-5">{t.fragmentsFooter}</p>

                {user && (
                  <div className="mb-5 rounded-lg border border-theme-accent/20 bg-theme-accent/5 px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">{t.fragmentsBalance}</p>
                    <FragmentAmount
                      amount={user.fragments ?? 0}
                      size="md"
                      className="text-lg font-semibold text-theme-accent dark:text-theme-highlight"
                    />
                  </div>
                )}

                <Button asChild variant="outline" className="mt-auto border-purple-500/30 hover:border-purple-500/50">
                  <Link href="/giveaways">{t.fragmentsCta}</Link>
                </Button>
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
