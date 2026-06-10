"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      fill="#FFF"
      fillRule="nonzero"
      d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
    />
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
    <rect width="48" height="32" rx="4" fill="#FFFFFF" />
    <g transform="translate(12 4)">
      <path
        fill="#2350A9"
        d="M12.553 8.72v6.56h1.766v-1.694h1.052l.293-.01c.579-.009.907-.02.984-.033.656-.086 1.09-.418 1.3-.994.106-.29.16-.769.16-1.434 0-.553-.049-.968-.145-1.243-.185-.524-.548-.871-1.09-1.04-.236-.074-.58-.111-1.031-.111zm6.79 0l-1.971 6.56h1.826l.317-1.134h2.36l.337 1.133H24l-1.995-6.558zm-9.339.031a3.36 3.36 0 0 0-1.888.574 3.272 3.272 0 0 0-1.199 1.455h-.742l-.464.996h.969a3.17 3.17 0 0 0 .004.526h-.467l-.465.995H6.94a3.333 3.333 0 0 0 3.064 1.973 3.37 3.37 0 0 0 1.876-.564l.013-.009v-1.241l-.05.056a2.293 2.293 0 0 1-3.618-.215h2.396l.465-.995H7.838a2.356 2.356 0 0 1-.012-.526h3.505l.008-.017.438-.939.019-.04H8.154a2.308 2.308 0 0 1 1.963-1.108c.694 0 1.344.31 1.783.85l.028.035.409-.875-.015-.014a3.359 3.359 0 0 0-2.318-.917zm-7.2.004c-.439 0-.837.016-1.196.048-.43.034-.785.15-1.062.348a1.082 1.082 0 0 0-.41.565c-.086.248-.128.578-.128.99 0 .54.079.943.236 1.21.179.314.537.52 1.074.621.205.035.57.071 1.094.109.654.044 1.02.078 1.098.103.211.063.316.239.316.528a1.1 1.1 0 0 1-.037.315.48.48 0 0 1-.298.287c-.084.032-.281.048-.589.048h-.604a.963.963 0 0 1-.41-.09c-.164-.081-.246-.264-.246-.549v-.136H0c0 .533.04.915.118 1.143.142.412.435.685.879.82.362.11 1.003.164 1.922.164.551 0 .96-.025 1.228-.075.64-.12 1.05-.404 1.233-.853.101-.245.151-.632.151-1.16 0-.23-.01-.435-.033-.617a1.186 1.186 0 0 0-.355-.74c-.252-.242-.66-.392-1.22-.448-.177-.019-.62-.052-1.33-.1l-.331-.023a.768.768 0 0 1-.35-.094c-.124-.075-.185-.233-.185-.471 0-.264.07-.435.208-.514.139-.079.423-.118.852-.118.441 0 .71.068.808.205.063.092.095.272.095.542h1.642c.01-.145.016-.253.016-.326 0-.884-.357-1.421-1.072-1.613-.293-.079-.784-.119-1.473-.119zm17.894 1.27l.827 2.843h-1.63zm-6.38.13h1.116c.18 0 .294.004.342.01.24.042.393.157.456.345.045.134.067.34.067.617a2.9 2.9 0 0 1-.033.512c-.035.172-.105.287-.21.344-.076.042-.288.069-.637.082h-1.1Z"
      />
    </g>
  </svg>
);

const EuroIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#003399" />
    <g transform="translate(4 4)">
      <path
        fill="#FFCC00"
        d="M11.373 1.94 10.36 1.2h1.253L12 0l.387 1.2h1.253l-1.013.74.386 1.207L12 2.4l-1.013.747Zm1.254 20.86.386 1.2L12 23.26l-1.013.74.386-1.2-1.013-.74h1.253L12 20.853l.387 1.207h1.253ZM1.64 12.8l-1.013.747.386-1.2L0 11.627h1.253l.387-1.2.387 1.2h1.26l-1.02.746.386 1.2-1.013-.746Zm5.807-9.467.386 1.2L6.82 3.8l-1.013.74.386-1.2L5.18 2.6h1.253l.387-1.2.387 1.2H8.46Zm-4.78 3.08.386-1.2.394 1.2h1.22l-1.014.747.387 1.2-1.02-.747L2 8.36l.387-1.2-1.014-.747ZM1.387 16.84h1.28l.386-1.2.394 1.2h1.22l-1.014.747.387 1.2-1.02-.74-1.02.74.387-1.2-1.014-.747Zm4.806 4.56-1.013-.733h1.253l.387-1.2.387 1.2H8.46l-1.013.733.386 1.2-1.013-.74-1.013.74Zm16.794-9.027.386 1.2-1.013-.746-1.027.746.387-1.2-1.02-.746H22l.387-1.2.386 1.2H24Zm-6.434-9.04L15.54 2.6h1.253l.387-1.2.387 1.2h1.253l-1.013.733.386 1.2L17.18 3.8l-1.013.74.386-1.2Zm4 3.074.394-1.2.386 1.2h1.254l-.987.753.387 1.2-1.014-.747-1.02.747.387-1.2-1.007-.747Zm.78 10.433h1.254l-.987.747.387 1.2-1.014-.74-1.02.74.387-1.2-1.007-.747h1.254l.393-1.2.387 1.2zm-2.513 3.827-1.013.733.386 1.2-1.013-.74-1.013.74.386-1.2-1.013-.733h1.253l.387-1.2.387 1.2z"
      />
    </g>
  </svg>
);

const UsdIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#3E73C4" />
    <path
      fill="#FFF"
      d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 0 0 .427.303h.975a.416.416 0 0 0 .427-.425v-.06a3.04 3.04 0 0 0-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 0 0-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z"
    />
    <path
      fill="#FFF"
      d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 0 0-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 0 0 7.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z"
    />
  </svg>
);

/** Vignettes Steam (512×512) servies depuis public/images/hero-demo-skins */
const HERO_DEMO_SKIN_IMAGES = {
  ak47RedlineFt: "/images/hero-demo-skins/ak47-redline-field-tested.png",
  awpDragonLoreFn: "/images/hero-demo-skins/awp-dragon-lore-factory-new.png",
} as const;

const HERO_PAYMENT_METHOD_ORDER = [
  "card",
  "mastercard",
  "bankTransfer",
  "eur",
  "bitcoin",
  "ethereum",
  "usdt",
  "usd",
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
      description: messages.hero.features.transparentDesc,
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
              <span
                className={cn(
                  buttonVariants({ variant: "chrome" }),
                  "h-auto w-fit cursor-default px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm hover:brightness-100"
                )}
              >
                <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-theme-accent" />
                {messages.hero.badge}
              </span>
            </div>

            {/* Main Title */}
            <div className={`hero-box space-y-3 sm:space-y-4 lunar-card px-5 py-4 ${homeEnter.upLg} ${homeDelay[300]}`}>
              <h1 className="hero-title text-gaming-title text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight uppercase">
                {messages.hero.title
                  .split(/(CS2|MOONSKIN)/i)
                  .map((part, i) => {
                    const upper = part.toUpperCase();
                    if (upper === "CS2") {
                      return (
                        <span key={i} className="text-chrome-gradient">
                          CS2
                        </span>
                      );
                    }
                    if (upper === "MOONSKIN") {
                      return (
                        <span key={i} className="text-brand-gradient highlight hero-brand-shine">
                          MOONSKIN
                        </span>
                      );
                    }
                    return part;
                  })}
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
            <div className={`payment-box lunar-card hero-payment-methods-card px-4 py-3 ${homeEnter.up} ${homeDelay[650]}`}>
              <p className="hero-payment-title mb-2">
                {messages.hero.paymentMethods.title}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {HERO_PAYMENT_METHOD_ORDER.map((key) => {
                  const Icon = HERO_PAYMENT_METHOD_ICONS[key];
                  const label = messages.hero.paymentMethods[key];
                  return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className="hero-payment-chip rounded-lg p-1.5">
                      <Icon />
                    </div>
                    <span className="hero-payment-label">{label}</span>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-6 sm:pt-8 border-t border-white/15 ${homeEnter.up} ${homeDelay[700]}`}>
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="hero-stat-value text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold font-display tabular-nums">
                    {stat.prefix}
                    {stat.value.toLocaleString(undefined, {
                      minimumFractionDigits: stat.decimals,
                      maximumFractionDigits: stat.decimals,
                    })}
                    {stat.suffix}
                  </div>
                  <div className="hero-stat-label text-xs sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className={`relative ${homeEnter.right}`}>
            {/* Main Card, 3D glass chrome */}
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

                <Button variant="cta" className="w-full" asChild>
                  <Link href={user ? "/sell" : "/login"}>
                    {messages.trade.confirm}
                  </Link>
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
