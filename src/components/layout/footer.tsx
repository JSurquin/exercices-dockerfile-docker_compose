"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";

export function Footer() {
  const { messages } = useLocale();

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
    legal: [
      { name: messages.footer.links.terms, href: "/terms" },
      { name: messages.footer.links.privacy, href: "/privacy" },
      { name: messages.footer.links.kycPolicy, href: "/kyc-policy" },
      { name: messages.footer.links.amlPolicy, href: "/aml-policy" },
    ],
    community: [
      { name: messages.footer.socialLinks.discord, href: "https://discord.gg/moonskin" },
      { name: messages.footer.socialLinks.twitter, href: "https://twitter.com/moonskin" },
      { name: messages.footer.socialLinks.reddit, href: "https://reddit.com/r/moonskin" },
      { name: messages.footer.socialLinks.youtube, href: "https://youtube.com/moonskin" },
    ],
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">CS</span>
              </div>
              <span className="font-bold text-xl">MoonSkin</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              {messages.footer.description}
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{messages.footer.securedBy}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                    SSL
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    KYC
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                    2FA
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{messages.footer.company}</h3>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{messages.footer.support}</h3>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{messages.footer.legal}</h3>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t mt-8 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">15,420+</div>
              <div className="text-sm text-muted-foreground">
                {messages.footer.stats.activeUsers}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">€2.4M+</div>
              <div className="text-sm text-muted-foreground">{messages.footer.stats.volumeProcessed}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">8,967+</div>
              <div className="text-sm text-muted-foreground">
                {messages.footer.stats.tradesCompleted}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">99.8%</div>
              <div className="text-sm text-muted-foreground">
                {messages.footer.stats.satisfactionRate}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            {messages.footer.copyright}
          </div>
          <div className="flex space-x-6">
            {links.community.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            {messages.footer.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  );
}
