"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function KycPolicyPage() {
  const { locale, messages } = useLocale();

  const fallbackContent = {
    title: locale === 'fr' ? "Politique KYC" : locale === 'cn' ? "KYC政策" : "KYC Policy",
    subtitle: locale === 'fr' 
      ? "Processus de vérification d'identité conforme aux réglementations européennes"
      : locale === 'cn'
      ? "符合欧洲法规的身份验证流程"
      : "Identity verification process compliant with European regulations",
    content: (
      <div className="space-y-6 text-muted-foreground">
        <p>
          {locale === 'fr' 
            ? "Cette page sera bientôt disponible avec du contenu dynamique."
            : locale === 'cn'
            ? "此页面即将提供动态内容。"
            : "This page will soon be available with dynamic content."}
        </p>
      </div>
    ),
  };

  return (
    <DynamicLegalPage
      slug="kyc-policy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
      showWarning={true}
      warningText={
        locale === 'fr'
          ? "La vérification KYC est obligatoire avant tout paiement selon la réglementation européenne."
          : locale === 'cn'
          ? "根据欧洲法规，KYC验证是任何付款前的强制要求。"
          : "KYC verification is mandatory before any payment according to European regulations."
      }
    />
  );
}
