"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

// Contenu de fallback si la page n'existe pas encore en base
const fallbackSections = [
  {
    title: "Notre engagement",
    content: `Chez CashTrade, la protection de vos données personnelles est notre priorité absolue. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations en conformité avec le Règlement Général sur la Protection des Données (RGPD) et les lois françaises.`,
  },
  {
    title: "Types de données collectées",
    content: `**Données d'identification** : Nom, prénom, date de naissance, adresse email, Steam ID, adresse IP
**Données KYC** : Pièce d'identité, selfie de vérification, justificatif de domicile
**Données financières** : IBAN (haché), adresses crypto, historique transactions
**Données d'usage** : Logs de connexion, activité de trading, préférences utilisateur`,
  },
  {
    title: "Vos droits RGPD",
    content: `Conformément au RGPD, vous avez le droit de :
• Accéder à vos données personnelles
• Demander leur rectification ou suppression
• Vous opposer à leur traitement
• Demander la portabilité de vos données`,
  },
];

export default function PrivacyPage() {
  const { messages, locale } = useLocale();

  const fallbackContent = {
    title: locale === 'fr' ? "Politique de confidentialité" : "Privacy Policy",
    subtitle: locale === 'fr' 
      ? "Comment nous collectons, utilisons et protégeons vos données personnelles"
      : "How we collect, use and protect your personal data",
    content: (
      <div className="space-y-8">
        {fallbackSections.map((section, index) => (
          <div key={index}>
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
      slug="privacy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
    />
  );
}
