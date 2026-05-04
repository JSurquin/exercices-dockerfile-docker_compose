"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { usePublicStats } from "@/hooks/use-public-stats";
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

export function Footer() {
  const { messages } = useLocale();
  const { data: publicStats } = usePublicStats();

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
    account: [
      { name: messages.footer.links.login, href: "/login" },
    ],
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
    <footer className="relative border-t overflow-hidden"
      style={{
        backgroundImage: "url('/images/cs2/footer/moonskin.webp')",
        backgroundSize: "cover",
        backgroundPosition: "100% 50%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay to ensure readability */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Glassmorphism content layer */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Main grid — glass card */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
              {/* Logo & Description */}
              <div className="lg:col-span-2">
                <Link href="/" className="flex items-center space-x-2 mb-4">
                  <div className="h-8 w-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <span className="text-white font-bold text-sm">CS</span>
                  </div>
                  <span className="font-bold text-xl text-white">MoonSkin</span>
                </Link>
                <p className="text-white/70 mb-4 max-w-md text-sm leading-relaxed">
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
                        className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {social.label}
                      </a>
                      {i < arr.length - 1 && <span className="text-white/30">·</span>}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-white/60">
                  <p className="font-medium text-white/80 mb-1">{messages.footer.securedBy}</p>
                  <TooltipProvider delayDuration={200}>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded text-xs backdrop-blur-sm cursor-help hover:bg-green-500/30 transition-colors">
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
                            className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded text-xs backdrop-blur-sm hover:bg-blue-500/30 transition-colors"
                          >
                            {messages.footer.securityBadges.kyc.label}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs p-3">
                          <p className="font-semibold text-sm mb-1">{messages.footer.securityBadges.kyc.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{messages.footer.securityBadges.kyc.description}</p>
                          <p className="text-xs text-blue-400 mt-2">{messages.footer.securityBadges.kyc.linkLabel}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded text-xs backdrop-blur-sm cursor-help hover:bg-purple-500/30 transition-colors">
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

              {/* Company */}
              <div>
                <h3 className="font-semibold mb-4 text-white">{messages.footer.company}</h3>
                <ul className="space-y-2">
                  {links.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="font-semibold mb-4 text-white">{messages.footer.support}</h3>
                <ul className="space-y-2">
                  {links.support.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Account */}
              <div>
                <h3 className="font-semibold mb-4 text-white">Compte</h3>
                <ul className="space-y-2">
                  {links.account.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-semibold mb-4 text-white">{messages.footer.legal}</h3>
                <ul className="space-y-2">
                  {links.legal.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-white/60 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Stats Section — glass card */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-400 drop-shadow-lg">
                  {(publicStats?.totalUsers ?? 0).toLocaleString()}+
                </div>
                <div className="text-sm text-white/60">{messages.footer.stats.activeUsers}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400 drop-shadow-lg">
                  €{publicStats?.volumeMillions ?? 0}M+
                </div>
                <div className="text-sm text-white/60">{messages.footer.stats.volumeProcessed}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400 drop-shadow-lg">
                  {(publicStats?.completedTrades ?? 0).toLocaleString()}+
                </div>
                <div className="text-sm text-white/60">{messages.footer.stats.tradesCompleted}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400 drop-shadow-lg">99.8%</div>
                <div className="text-sm text-white/60">{messages.footer.stats.satisfactionRate}</div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-6 py-4 mb-4 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-sm text-white/50">
              {messages.footer.copyright}
            </div>
            <div className="flex space-x-6">
              {links.community.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/60 hover:text-orange-400 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/40 leading-relaxed">
              {messages.footer.disclaimer}
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
