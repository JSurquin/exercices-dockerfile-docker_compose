"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { LevelBadge, FragmentBadge } from "@/components/ui/level-badge";
import {
  LEVELS,
  XP_RATE,
  getTierReward,
  TIERS_PER_LEVEL,
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

const COPY = {
  fr: {
    badge: "Programme fidélité",
    title: "Montez en niveau,",
    titleHighlight: " gagnez plus",
    subtitle:
      "Chaque vente vous fait progresser dans 6 niveaux cosmiques. Débloquez des bonus permanents, des fragments et des skins à chaque palier.",
    tierEvolution: "Évolution des badges",
    tierLabels: ["Palier 1", "Palier 2", "Palier 3", "Palier 4–5"],
    fragmentsTitle: "Fragments bonus",
    fragmentsDesc: "Collectez des fragments à chaque palier pour participer aux giveaways.",
    levelsTitle: "Les 6 niveaux cosmiques",
    xpRate: (rate: string) => `1 XP = ${rate} € vendus`,
    tierRewards: "Récompenses par palier",
    cta: "Commencer à vendre",
    bonusLabel: "Bonus vente",
  },
  en: {
    badge: "Loyalty program",
    title: "Level up,",
    titleHighlight: " earn more",
    subtitle:
      "Every sale progresses you through 6 cosmic levels. Unlock permanent bonuses, fragments and skins at each tier.",
    tierEvolution: "Badge evolution",
    tierLabels: ["Tier 1", "Tier 2", "Tier 3", "Tier 4–5"],
    fragmentsTitle: "Bonus fragments",
    fragmentsDesc: "Collect fragments at each tier to enter giveaways.",
    levelsTitle: "The 6 cosmic levels",
    xpRate: (rate: string) => `1 XP = ${rate} € sold`,
    tierRewards: "Tier rewards",
    cta: "Start selling",
    bonusLabel: "Sale bonus",
  },
} as const;

export function LevelsSection() {
  const { locale } = useLocale();
  const t = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const xpPerEuro = (1 / XP_RATE).toFixed(2);

  const exampleRewards = Array.from({ length: TIERS_PER_LEVEL }, (_, i) => {
    const reward = getTierReward(TIERS_PER_LEVEL + i);
    return locale === "en" ? reward.descriptionEn : reward.description;
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

        {/* Badge evolution row */}
        <div className={`mb-16 ${homeReveal.up} ${homeStagger(1)}`}>
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            {t.tierEvolution}
          </h3>
          <div className="flex flex-wrap items-end justify-center gap-6 sm:gap-10">
            {[0, 1, 2, 3].map((tierIdx, i) => (
              <div
                key={tierIdx}
                className={`flex flex-col items-center gap-2 ${homeReveal.scale} ${homeStagger(i + 2)}`}
              >
                <LevelBadge tierIndex={tierIdx} size="lg" />
                <span className="text-xs text-muted-foreground">{t.tierLabels[i]}</span>
              </div>
            ))}
            <div className={`flex flex-col items-center gap-2 ${homeReveal.scale} ${homeStagger(6)}`}>
              <FragmentBadge size="lg" />
              <span className="text-xs text-muted-foreground">{t.fragmentsTitle}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Cosmic levels grid */}
          <div className={homeReveal.left}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-theme-accent" />
              {t.levelsTitle}
            </h3>
            <div className="space-y-2">
              {LEVELS.map((level) => {
                const name = locale === "en" ? level.nameEn : level.name;
                const bonusStr =
                  level.saleBonus === 0
                    ? "—"
                    : `+${(level.saleBonus * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
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
                        {(level.xpStart / 1000).toFixed(level.xpStart >= 1000 ? 0 : 1)}k – {(level.xpEnd / 1000).toFixed(0)}k XP
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
