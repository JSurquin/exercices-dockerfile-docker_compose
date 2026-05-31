"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  usePublicStats,
  formatPlatformVolume,
  formatCompactCount,
} from "@/hooks/use-public-stats";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import {
  homeDelay,
  homeEnter,
  homeHover,
} from "@/lib/home-animation-classes";
import {
  CS2Background,
  WeaponGradeIndicator,
} from "@/components/ui/cs2-icons";
import {
  CS2HeroBackground,
  usePreloadCS2Backgrounds,
} from "@/components/ui/cs2-header-background";
import { CardTilt } from "@/components/ui/card-tilt";
import { SectionBottomFade } from "@/components/home/section-bottom-fade";
import {
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

const UsdtIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V8H8.595v3.427h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.126 0 1.053 3.309 1.924 7.709 2.126v7.6h3.913v-7.6c4.393-.202 7.694-1.073 7.694-2.124 0-1.051-3.301-1.923-7.694-2.127" fill="white"/>
  </svg>
);

const BitcoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path d="M22.56 14.624c.312-2.083-1.276-3.204-3.447-3.952l.703-2.822-1.718-.428-.686 2.75c-.451-.113-.915-.218-1.376-.323l.692-2.77-1.717-.428-.703 2.82c-.374-.085-.741-.17-1.097-.258l.002-.009-2.369-.592-.457 1.835s1.277.293 1.249.31c.697.174.823.635.802 1-.002.003-.004.006-.005.01l-.974 3.903c.058.015.134.036.218.069l-.221-.056-1.367 5.48c-.104.257-.366.643-.957.496.02.03-1.25-.312-1.25-.312l-.855 1.965 2.236.557c.416.104.824.213 1.224.316l-.71 2.847 1.716.428.704-2.823c.47.127.925.245 1.37.356l-.701 2.808 1.718.428.71-2.84c2.928.554 5.129.33 6.056-2.318.747-2.131-.038-3.36-1.578-4.162 1.123-.258 1.968-1 2.193-2.527zm-3.924 5.502c-.53 2.131-4.12.979-5.285.69l.943-3.777c1.165.29 4.9.865 4.342 3.087zm.53-5.533c-.485 1.943-3.477.955-4.448.714l.854-3.425c.971.242 4.098.693 3.594 2.71z" fill="white"/>
  </svg>
);

const EthereumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path d="M16.498 4v8.87l7.497 3.35z" fill="white" fillOpacity="0.602"/>
    <path d="M16.498 4L9 16.22l7.498-3.35z" fill="white"/>
    <path d="M16.498 21.968v6.027L24 17.616z" fill="white" fillOpacity="0.602"/>
    <path d="M16.498 27.995v-6.028L9 17.616z" fill="white"/>
    <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="white" fillOpacity="0.2"/>
    <path d="M9 16.22l7.498 4.353v-7.701z" fill="white" fillOpacity="0.602"/>
  </svg>
);

const VisaIcon = () => (
  <svg viewBox="0 0 48 32" className="w-10 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#1A1F71"/>
    <path d="M20.18 21.5h-2.8l1.75-10.82h2.8L20.18 21.5zM15.47 10.68l-2.67 7.44-.32-1.6-.95-4.84s-.11-.99-1.32-.99H6.03l-.05.18s1.33.28 2.89 1.2l2.4 9.39h2.87l4.38-10.78h-3.05zM35.73 21.5h2.53l-2.21-10.82h-2.21c-1.04 0-1.3.8-1.3.8L28.37 21.5h2.87l.57-1.58h3.5l.42 1.58zm-3.04-3.77l1.45-3.97.81 3.97h-2.26zM27.38 13.5l.39-2.27s-1.2-.46-2.45-.46c-1.35 0-4.56.59-4.56 3.46 0 2.7 3.76 2.73 3.76 4.15s-3.37 1.16-4.49.27l-.41 2.38s1.21.59 3.07.59c1.85 0 4.64-.96 4.64-3.58 0-2.72-3.79-2.97-3.79-4.15s2.65-1.06 3.84-.39z" fill="white"/>
  </svg>
);

const MastercardIcon = () => (
  <svg viewBox="0 0 48 32" className="w-10 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#000000"/>
    <circle cx="18" cy="16" r="8" fill="#EB001B"/>
    <circle cx="30" cy="16" r="8" fill="#F79E1B"/>
    <path d="M24 9.6c-1.7 1.4-2.8 3.6-2.8 6s1.1 4.6 2.8 6c1.7-1.4 2.8-3.6 2.8-6s-1.1-4.6-2.8-6z" fill="#FF5F00"/>
  </svg>
);

const SepaIcon = () => (
  <svg viewBox="0 0 48 32" className="w-10 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="32" rx="4" fill="#003087"/>
    <text x="24" y="21" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial, sans-serif">SEPA</text>
    <circle cx="8" cy="16" r="4" fill="#FFD700" opacity="0.8"/>
    <circle cx="14" cy="16" r="4" fill="#FF6B35" opacity="0.8"/>
  </svg>
);

const EuroIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#003087"/>
    <path d="M20 9.5c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.39 0 2.68-.43 3.74-1.16l-1.28-1.77A4.47 4.47 0 0120 20.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5c.83 0 1.6.23 2.27.62l1.27-1.77A6.44 6.44 0 0020 9.5z" fill="white"/>
    <path d="M10 15h9v2h-9zM10 12h8v2h-8z" fill="#FFD700"/>
  </svg>
);

const UsdIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2E7D32"/>
    <path d="M16.5 8v1.2c1.9.3 3.5 1.4 3.5 3.2 0 1.7-1.2 2.6-3 3.1l-.5.1v3.8c1.1-.2 1.9-.8 2.1-1.7h2c-.3 2-1.8 3.1-4.1 3.4V22h-1.5v-1.1c-2.1-.3-3.7-1.5-3.7-3.4h2c.2 1 .9 1.7 1.7 1.9v-3.9l-.6-.1c-1.7-.4-3.1-1.4-3.1-3.2 0-1.8 1.5-2.9 3.7-3.1V8h1.5zm-1.5 2.3c-1.1.2-1.8.7-1.8 1.6 0 .9.7 1.4 1.8 1.7v-3.3zm1.5 5.4v3.5c1.2-.2 1.9-.8 1.9-1.8 0-.9-.7-1.4-1.9-1.7z" fill="white"/>
  </svg>
);

/** Vignettes Steam (512×512) servies depuis public/images/hero-demo-skins */
const HERO_DEMO_SKIN_IMAGES = {
  ak47RedlineFt: "/images/hero-demo-skins/ak47-redline-field-tested.png",
  awpDragonLoreFn: "/images/hero-demo-skins/awp-dragon-lore-factory-new.png",
} as const;

const HERO_PAYMENT_METHOD_ORDER = [
  "usdt",
  "card",
  "mastercard",
  "bankTransfer",
  "eur",
  "usd",
  "bitcoin",
  "ethereum",
] as const;

type HeroPaymentMethodKey = (typeof HERO_PAYMENT_METHOD_ORDER)[number];

const HERO_PAYMENT_METHOD_ICONS: Record<HeroPaymentMethodKey, ComponentType> = {
  usdt: UsdtIcon,
  card: VisaIcon,
  mastercard: MastercardIcon,
  bankTransfer: SepaIcon,
  eur: EuroIcon,
  usd: UsdIcon,
  bitcoin: BitcoinIcon,
  ethereum: EthereumIcon,
};


export function HeroSection() {
  const { messages } = useLocale();
  const { user } = useAuth();
  const { data: publicStats } = usePublicStats();
  const { data: platformSettings } = usePlatformSettings();

  // Calculs de la carte démo basés sur les vrais taux
  const demoAk47Cents = 22403;
  const demoAwpCents = 886858;
  const demoGrossCents = demoAk47Cents + demoAwpCents;
  const demoCashoutFeeCents = Math.round(demoGrossCents * (platformSettings?.cashoutFeeRate ?? 0.005));
  const demoNetworkFeeCents = platformSettings?.networkFeeCentimes ?? 200;
  const demoNetCents = demoGrossCents - demoCashoutFeeCents - demoNetworkFeeCents;
  const fmt = (cents: number) => `${(cents / 100).toFixed(2)}€`;

  // Précharger les vraies images CS2
  usePreloadCS2Backgrounds();

  const stats = [
    {
      ...formatCompactCount(publicStats?.totalUsers ?? 0),
      label: messages.hero.stats.users,
    },
    {
      ...formatPlatformVolume(publicStats?.totalVolumeCents ?? 0),
      label: messages.hero.stats.volume,
    },
    {
      ...formatCompactCount(publicStats?.completedTrades ?? 0),
      label: messages.hero.stats.trades,
    },
    {
      ...formatCompactCount(publicStats?.totalSkinsSold ?? 0),
      label: messages.hero.stats.skinsSold,
    },
  ];

  const features = [
    {
      icon: ClockIcon,
      title: messages.hero.features.instant,
      description: messages.hero.features.instantDesc,
    },
    {
      icon: ShieldCheckIcon,
      title: messages.hero.features.secure,
      description: messages.hero.features.secureDesc,
    },
    {
      icon: CurrencyDollarIcon,
      title: messages.hero.features.transparent,
      description: messages.hero.features.transparentDesc.replace('{rate}', ((platformSettings?.cashoutFeeRate ?? 0.005) * 100).toFixed(1)),
    },
  ];

  const testimonials = [
    {
      name: messages.hero.testimonials.name[0],
      rating: 5,
      comment: messages.hero.testimonials.comment[0],
      amount: messages.hero.testimonials.amount[0],
    },
    {
      name: messages.hero.testimonials.name[1],
      rating: 5,
      comment: messages.hero.testimonials.comment[1],
      amount: messages.hero.testimonials.amount[1],
    },
    {
      name: messages.hero.testimonials.name[2],
      rating: 5,
      comment: messages.hero.testimonials.comment[2],
      amount: messages.hero.testimonials.amount[2],
    },
  ];

  return (
    <CS2HeroBackground className="relative overflow-hidden">
      {/* CS2 Background Pattern Overlay pour plus de texture */}
      <CS2Background className="opacity-20" />
      <SectionBottomFade to="muted" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-18">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column - Hero Content */}
          <div className={`space-y-6 sm:space-y-8 ${homeEnter.left}`}>
            {/* Badge */}
            <div className={`${homeEnter.up} ${homeDelay[200]}`}>
              <Badge
                variant="secondary"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-theme-accent" />
                {messages.hero.badge}
              </Badge>
            </div>

            {/* Main Title */}
            <div className={`space-y-3 sm:space-y-4 lunar-card px-5 py-4 ${homeEnter.upLg} ${homeDelay[300]}`}>
              <h1 className="hero-title text-gaming-title text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                {messages.hero.title
                  .split(/(CS2|MOONSKIN)/)
                  .map((part, i) =>
                    part === "CS2" ? (
                      <span key={i} className="text-chrome-gradient">
                        CS2
                      </span>
                    ) : part === "MOONSKIN" ? (
                      <span key={i} className="text-brand-gradient">
                        MOONSKIN
                      </span>
                    ) : (
                      part
                    )
                  )}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gaming-body text-foreground/70 max-w-lg">
                {messages.hero.subtitle}
              </p>
            </div>

            {/* Features */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lunar-card px-4 py-3 ${homeEnter.up} ${homeDelay[500]}`}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-1.5 sm:space-x-2"
                >
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-theme-accent flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gaming-caption text-muted-foreground">
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 w-full ${homeEnter.up} ${homeDelay[600]}`}>
              <Button
                asChild
                variant="cta"
                className="w-full sm:w-auto h-12 sm:h-11 px-6 sm:px-8 text-sm sm:text-base"
              >
                <Link href={user ? "/sell" : "/login"}>
                  {user ? messages.hero.cta : messages.hero.cta}
                </Link>
              </Button>
              <Button
                variant="chrome"
                asChild
                className="w-full sm:w-auto h-12 sm:h-11 px-6 sm:px-8 text-sm sm:text-base"
              >
                <Link href="#how-it-works">{messages.hero.secondaryCta}</Link>
              </Button>
            </div>

            {/* Payment Methods */}
            <div className={`lunar-card px-4 py-3 ${homeEnter.up} ${homeDelay[650]}`}>
              <p className="lunar-label mb-2">
                {messages.hero.paymentMethods.title}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {HERO_PAYMENT_METHOD_ORDER.map((key) => {
                  const Icon = HERO_PAYMENT_METHOD_ICONS[key];
                  const label = messages.hero.paymentMethods[key];
                  return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-1.5 hover:bg-white/10 transition-colors">
                      <Icon />
                    </div>
                    <span className="text-[10px] text-white/50">{label}</span>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6 sm:pt-8 border-t ${homeEnter.up} ${homeDelay[700]}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-brand-gradient font-display tabular-nums">
                    {stat.prefix}
                    {stat.value.toLocaleString(undefined, {
                      minimumFractionDigits: stat.decimals,
                      maximumFractionDigits: stat.decimals,
                    })}
                    {stat.suffix}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className={`relative ${homeEnter.right}`}>
            {/* Main Card — 3D glass chrome */}
            <div className="hero-product relative mt-6 lg:-mt-48">
            <CardTilt shimmer className="p-4 sm:p-6 lg:p-8">
              {/* Fake Trade Interface */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {messages.trade.estimation}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="text-theme-accent text-xs sm:text-sm border-theme-accent/30"
                  >
                    {messages.common.online}
                  </Badge>
                </div>

                {/* Skin Items */}
                <div className="space-y-2 sm:space-y-3">
                  <div className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-theme-accent/30 hover:bg-white/[0.07] transition-all duration-300 ${homeHover.scale}`}>
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#14141a] shadow-lg ring-1 ring-white/10 sm:h-12 sm:w-12">
                      <Image
                        src={HERO_DEMO_SKIN_IMAGES.ak47RedlineFt}
                        alt="AK-47 | Redline (Minimal Wear)"
                        width={512}
                        height={512}
                        className="h-full w-full object-cover"
                        sizes="(min-width: 640px) 48px, 40px"
                      />
                      <WeaponGradeIndicator
                        grade="Classified"
                        className="absolute -right-1 -top-1 z-10 h-2 w-2 sm:h-3 sm:w-3"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          AK-47 | Redline
                        </p>
                        <div className="px-1.5 sm:px-2 py-0.5 bg-theme-accent/15 text-theme-accent text-xs rounded font-mono flex-shrink-0">
                          StatTrak™
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-1">
                        <span>Minimal Wear</span>
                        <span className="text-yellow-500">★★★★</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-lg text-green-600">
                        {fmt(demoAk47Cents)}
                      </p>
                      <p className="text-xs text-theme-accent">+15% ↗</p>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:border-theme-accent/30 hover:bg-white/[0.07] transition-all duration-300 ${homeHover.scale}`}>
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#14141a] shadow-lg ring-1 ring-white/10 sm:h-12 sm:w-12">
                      <Image
                        src={HERO_DEMO_SKIN_IMAGES.awpDragonLoreFn}
                        alt="AWP | Dragon Lore (Factory New)"
                        width={512}
                        height={512}
                        className="h-full w-full object-cover"
                        sizes="(min-width: 640px) 48px, 40px"
                      />
                      <WeaponGradeIndicator
                        grade="Covert"
                        className="absolute -right-1 -top-1 z-10 h-2 w-2 sm:h-3 sm:w-3"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <p className="font-medium text-sm sm:text-base truncate">
                          AWP | Dragon Lore
                        </p>
                        <div className="px-1.5 py-0.5 bg-theme-accent/15 text-theme-accent text-xs rounded flex-shrink-0">
                          ★
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-1">
                        <span>Factory New</span>
                        <span className="text-yellow-500">★★★★★</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm sm:text-lg text-green-600">
                        {fmt(demoAwpCents)}
                      </p>
                      <p className="text-xs text-theme-accent">+8% ↗</p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-2 bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between font-bold text-lg pt-2 text-green-600">
                    <span>{messages.hero.tradeInterface.totalNet}</span>
                    <span className="bg-green-500/10 px-2 py-1 rounded">
                      {fmt(demoNetCents)}
                    </span>
                  </div>
                  <div className="text-xs text-center text-muted-foreground pt-2">
                    💡 {messages.trade.automaticPayment}
                  </div>
                </div>

                <Button variant="cta" className="w-full">
                  {messages.trade.confirm}
                </Button>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-theme-accent rounded-full flex items-center justify-center shadow-[0_0_20px_var(--cta-shadow)]">
                <CheckCircleIcon className="w-5 h-5 text-white" />
              </div>
            </CardTilt>
            </div>
          </div>
        </div>
      </div>
    </CS2HeroBackground>
  );
}
