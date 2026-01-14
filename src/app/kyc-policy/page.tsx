"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function KycPolicyPage() {
  const { locale, messages } = useLocale();

  const translations = {
    fr: {
      title: "Politique KYC",
      subtitle: "Processus de vérification d'identité conforme aux réglementations européennes",
      comingSoon: "Cette page sera bientôt disponible avec du contenu dynamique.",
      warning: "La vérification KYC est obligatoire avant tout paiement selon la réglementation européenne."
    },
    en: {
      title: "KYC Policy",
      subtitle: "Identity verification process compliant with European regulations",
      comingSoon: "This page will soon be available with dynamic content.",
      warning: "KYC verification is mandatory before any payment according to European regulations."
    },
    cn: {
      title: "KYC政策",
      subtitle: "符合欧洲法规的身份验证流程",
      comingSoon: "此页面即将提供动态内容。",
      warning: "根据欧洲法规，KYC验证是任何付款前的强制要求。"
    }
  };

  const t = translations[locale] || translations.en;

  const fallbackContent = {
    title: t.title,
    subtitle: t.subtitle,
    content: (
      <div className="space-y-6 text-muted-foreground">
        <p>{t.comingSoon}</p>
      </div>
    ),
  };

  return (
    <DynamicLegalPage
      slug="kyc-policy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
      showWarning={true}
      warningText={t.warning}
    />
  );
}
