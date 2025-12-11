"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

// Contenu de fallback si la page n'existe pas encore en base
const fallbackSections = [
  {
    id: "acceptance",
    title: "1. Acceptation des conditions",
    content: `En utilisant CashTrade, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.

Ces conditions peuvent être modifiées à tout moment. Les modifications entreront en vigueur dès leur publication sur notre site.`,
  },
  {
    id: "eligibility",
    title: "2. Conditions d'éligibilité",
    content: `Pour utiliser CashTrade, vous devez :
• Être âgé d'au moins 18 ans
• Avoir la capacité juridique de conclure des contrats
• Résider dans un pays où nos services sont légalement disponibles
• Posséder un compte Steam en règle
• Compléter avec succès notre processus KYC (Know Your Customer)`,
  },
  {
    id: "services",
    title: "3. Description des services",
    content: `CashTrade fournit une plateforme permettant de :
• Vendre des skins Counter-Strike 2 contre de l'argent réel
• Recevoir des paiements via SEPA ou cryptomonnaies
• Participer à des giveaways et concours
• Accéder à des statistiques de trading`,
  },
];

export default function TermsPage() {
  const { messages } = useLocale();

  const fallbackContent = {
    title: messages.terms.title,
    subtitle: messages.terms.subtitle,
    content: (
      <div className="space-y-8">
        {fallbackSections.map((section) => (
          <div key={section.id} id={section.id}>
            <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {section.content.split("\n\n").map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-4 leading-relaxed whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <DynamicLegalPage
      slug="terms"
      fallbackContent={fallbackContent}
      icon={DocumentTextIcon}
      showWarning={true}
      warningText={messages.terms.warningText || "Ces conditions d'utilisation constituent un contrat légalement contraignant entre vous et CashTrade. En utilisant nos services, vous acceptez d'être lié par l'ensemble de ces conditions."}
    />
  );
}
