"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { usePublicStats, formatPlatformVolume, formatCompactCount } from "@/hooks/use-public-stats";
import { SiteTour } from "@/components/layout/site-tour";
import { useTourMode } from "@/components/providers/tour-provider";
import { normalizeStoredTheme } from "@/lib/themes";
import {
  MOONSKIN_DISCORD_URL,
  MOONSKIN_X_URL,
  MOONSKIN_INSTAGRAM_URL,
  MOONSKIN_TIKTOK_URL,
  MOONSKIN_YOUTUBE_URL,
  MOONSKIN_TELEGRAM_URL,
  MOONSKIN_STEAM_GROUP_URL,
} from "@/lib/moonskin-social";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Footer() {
  const { messages } = useLocale();
  const { data: publicStats } = usePublicStats();
  const volumeDisplay = formatPlatformVolume(publicStats?.totalVolumeCents ?? 0);
  const tradesDisplay = formatCompactCount(publicStats?.completedTrades ?? 0);
  const skinsDisplay = formatCompactCount(publicStats?.totalSkinsSold ?? 0);
  const usersDisplay = formatCompactCount(publicStats?.totalUsers ?? 0);
  const { isTourMode: tourActive, startTour, endTour } = useTourMode();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = mounted ? normalizeStoredTheme(resolvedTheme ?? theme) : "moonskin";
  const showFooterImage = currentTheme !== "light";

  const links = {
    company: [
      { name: messages.footer.links.about, href: "/about" },
      { name: messages.footer.links.press, href: "/press" },
    ],
    support: [
      { name: messages.footer.links.helpCenter, href: "/help" },
      { name: messages.footer.links.contact, href: "/contact" },
      { name: messages.footer.links.status, href: "/status" },
      { name: messages.footer.links.api, href: "/api-docs" },
    ],
    account: [{ name: messages.footer.links.login, href: "/login" }],
    legal: [
      { name: messages.footer.links.terms, href: "/terms" },
      { name: messages.footer.links.privacy, href: "/privacy" },
      { name: messages.footer.links.kycPolicy, href: "/kyc-policy" },
      { name: messages.footer.links.amlPolicy, href: "/aml-policy" },
      { name: messages.footer.links.paymentCashout, href: "/payment-cashout" },
      { name: messages.footer.links.mentionsLegales, href: "/mentions-legales" },
      { name: messages.footer.links.skinSaleTerms, href: "/skin-sale-terms" },
    ],
    community: [
      { name: messages.footer.socialLinks.discord, href: MOONSKIN_DISCORD_URL },
      { name: messages.footer.socialLinks.x, href: MOONSKIN_X_URL },
      { name: messages.footer.socialLinks.instagram, href: MOONSKIN_INSTAGRAM_URL },
      { name: messages.footer.socialLinks.tiktok, href: MOONSKIN_TIKTOK_URL },
      { name: messages.footer.socialLinks.youtube, href: MOONSKIN_YOUTUBE_URL },
      { name: messages.footer.socialLinks.telegram, href: MOONSKIN_TELEGRAM_URL },
      { name: messages.footer.socialLinks.steamGroup, href: MOONSKIN_STEAM_GROUP_URL },
    ],
  };

  return (
    <>
      <footer
        className={cn(
          "relative border-t overflow-hidden lunar-footer",
          showFooterImage && "lunar-footer--image"
        )}
        style={
          showFooterImage
            ? {
                backgroundImage: "url('/images/cs2/footer/space-background.jpg')",
                backgroundPosition: "center center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 lunar-footer__overlay" />

        <div className="relative z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="lunar-footer__card p-6 sm:p-8 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
                <div className="lg:col-span-2">
                  <Link href="/" className="flex items-center space-x-2 mb-4">
                    <div className="h-8 w-8 rounded lunar-footer__logo flex items-center justify-center">
                      <span className="text-white font-bold text-sm">CS</span>
                    </div>
                    <span className="font-bold text-xl text-foreground">MoonSkin</span>
                  </Link>
                  <p className="text-muted-foreground mb-4 max-w-md text-sm leading-relaxed">
                    {messages.footer.description}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { label: messages.footer.socialLinks.discord, href: MOONSKIN_DISCORD_URL },
                      { label: messages.footer.socialLinks.x, href: MOONSKIN_X_URL },
                      { label: messages.footer.socialLinks.instagram, href: MOONSKIN_INSTAGRAM_URL },
                      { label: messages.footer.socialLinks.tiktok, href: MOONSKIN_TIKTOK_URL },
                      { label: messages.footer.socialLinks.youtube, href: MOONSKIN_YOUTUBE_URL },
                      { label: messages.footer.socialLinks.telegram, href: MOONSKIN_TELEGRAM_URL },
                      { label: messages.footer.socialLinks.steamGroup, href: MOONSKIN_STEAM_GROUP_URL },
                    ].map((social, i, arr) => (
                      <span key={social.label} className="flex items-center gap-3">
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium lunar-footer__link"
                        >
                          {social.label}
                        </a>
                        {i < arr.length - 1 && (
                          <span className="text-muted-foreground/40">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground/80 mb-1">{messages.footer.securedBy}</p>
                    <TooltipProvider delayDuration={200}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="px-2 py-1 bg-theme-success/15 border border-theme-success/25 text-theme-success rounded text-xs cursor-help hover:bg-theme-success/20 transition-colors">
                              {messages.footer.securityBadges.ssl.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <p className="font-semibold text-sm mb-1">{messages.footer.securityBadges.ssl.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{messages.footer.securityBadges.ssl.description}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={messages.footer.securityBadges.kyc.link}
                              className="px-2 py-1 bg-theme-accent/15 border border-theme-accent/25 text-theme-accent rounded text-xs hover:bg-theme-accent/20 transition-colors"
                            >
                              {messages.footer.securityBadges.kyc.label}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <p className="font-semibold text-sm mb-1">{messages.footer.securityBadges.kyc.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{messages.footer.securityBadges.kyc.description}</p>
                            <p className="text-xs text-theme-accent mt-2">{messages.footer.securityBadges.kyc.linkLabel}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="px-2 py-1 bg-theme-highlight/15 border border-theme-highlight/25 text-theme-highlight rounded text-xs cursor-help hover:bg-theme-highlight/20 transition-colors">
                              {messages.footer.securityBadges.twofa.label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs p-3">
                            <p className="font-semibold text-sm mb-1">{messages.footer.securityBadges.twofa.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{messages.footer.securityBadges.twofa.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>

                {(["company", "support", "account", "legal"] as const).map((section) => (
                  <div key={section}>
                    <h3 className="font-semibold mb-4 text-foreground">
                      {messages.footer[section]}
                    </h3>
                    <ul className="space-y-2">
                      {links[section].map((link) => (
                        <li key={link.name}>
                          <Link href={link.href} className="lunar-footer__link text-sm">
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="lunar-footer__card p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { display: usersDisplay, label: messages.footer.stats.activeUsers },
                  { display: volumeDisplay, label: messages.footer.stats.volumeProcessed },
                  { display: tradesDisplay, label: messages.footer.stats.tradesCompleted },
                  { display: skinsDisplay, label: messages.footer.stats.skinsSold },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold lunar-footer__stat">
                      {stat.display.prefix}
                      {stat.display.value.toLocaleString(undefined, {
                        minimumFractionDigits: stat.display.decimals,
                        maximumFractionDigits: stat.display.decimals,
                      })}
                      {stat.display.suffix}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lunar-footer__card px-6 py-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="text-sm text-muted-foreground">{messages.footer.copyright}</div>
              <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 max-w-full">
                {links.community.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="lunar-footer__link text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.name}
                  </Link>
                ))}
                <button
                  data-tour="footer-guide"
                  onClick={() => startTour()}
                  className="text-sm font-medium text-theme-accent hover:text-theme-highlight transition-colors flex items-center gap-1"
                >
                  <span>🗺️</span>
                  {messages.footer.tourButton}
                </button>
              </div>
            </div>

            <div className="lunar-footer__card p-4">
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                {messages.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
      {tourActive && <SiteTour onFinish={() => endTour()} />}
    </>
  );
}
