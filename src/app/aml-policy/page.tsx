"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function AmlPolicyPage() {
  const { locale } = useLocale();

  const fallbackContent = {
    title: locale === 'fr' 
      ? "Politique Anti-Blanchiment (AML)" 
      : locale === 'cn' 
      ? "反洗钱政策 (AML)" 
      : "Anti-Money Laundering (AML) Policy",
    subtitle: locale === 'fr' 
      ? "Notre engagement dans la lutte contre le blanchiment d'argent et le financement du terrorisme"
      : locale === 'cn'
      ? "我们在打击洗钱和恐怖融资方面的承诺"
      : "Our commitment to fighting money laundering and terrorist financing",
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
      slug="aml-policy"
      fallbackContent={fallbackContent}
      icon={ShieldExclamationIcon}
      showWarning={true}
      warningText={
        locale === 'fr'
          ? "Toute tentative de blanchiment d'argent ou de financement d'activités illicites entraînera la fermeture immédiate du compte et le signalement aux autorités."
          : locale === 'cn'
          ? "任何洗钱或资助非法活动的企图都将导致账户立即关闭并向当局举报。"
          : "Any attempt at money laundering or financing of illicit activities will result in immediate account closure and reporting to authorities."
      }
    />
  );
}
