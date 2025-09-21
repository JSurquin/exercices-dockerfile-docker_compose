"use client";

import Link from "next/link";

export function Footer() {
  const links = {
    company: [
      { name: "À propos", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Carrières", href: "/careers" },
      { name: "Presse", href: "/press" },
    ],
    support: [
      { name: "Centre d'aide", href: "/help" },
      { name: "Contact", href: "/contact" },
      { name: "Status", href: "/status" },
      { name: "API", href: "/api" },
    ],
    legal: [
      { name: "Conditions d'utilisation", href: "/terms" },
      { name: "Politique de confidentialité", href: "/privacy" },
      { name: "Politique KYC", href: "/kyc-policy" },
      { name: "Politique anti-blanchiment", href: "/aml-policy" },
    ],
    community: [
      { name: "Discord", href: "https://discord.gg/cashtrade" },
      { name: "Twitter", href: "https://twitter.com/cashtrade" },
      { name: "Reddit", href: "https://reddit.com/r/cashtrade" },
      { name: "YouTube", href: "https://youtube.com/cashtrade" },
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
              <span className="font-bold text-xl">CashTrade</span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md">
              La plateforme la plus rapide et sécurisée pour convertir vos skins
              CS2 en argent réel. Vendez vos skins en toute confiance avec notre
              système de paiement sécurisé.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Sécurisé par :</p>
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
            <h3 className="font-semibold mb-4">Entreprise</h3>
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
            <h3 className="font-semibold mb-4">Support</h3>
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
            <h3 className="font-semibold mb-4">Légal</h3>
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
                Utilisateurs actifs
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">€2.4M+</div>
              <div className="text-sm text-muted-foreground">Volume traité</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">8,967+</div>
              <div className="text-sm text-muted-foreground">
                Trades réalisés
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">99.8%</div>
              <div className="text-sm text-muted-foreground">
                Taux de satisfaction
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 CashTrade. Tous droits réservés. | Licence EU: CT-2024-001
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
            <strong>Avertissement :</strong> CashTrade n&apos;est pas affilié à
            Valve Corporation ou Steam. Counter-Strike et Steam sont des marques
            déposées de Valve Corporation. Le trading de skins comporte des
            risques et les prix peuvent fluctuer. Veuillez trader de manière
            responsable et ne jamais investir plus que ce que vous pouvez vous
            permettre de perdre.
          </p>
        </div>
      </div>
    </footer>
  );
}
