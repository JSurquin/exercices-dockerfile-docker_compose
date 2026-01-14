"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function AmlPolicyPage() {
  const { locale } = useLocale();

  const translations = {
    fr: {
      title: "Politique Anti-Blanchiment (AML)",
      subtitle: "Notre engagement dans la lutte contre le blanchiment d'argent et le financement du terrorisme",
      comingSoon: "Cette page sera bientôt disponible avec du contenu dynamique.",
      warning: "Toute tentative de blanchiment d'argent ou de financement d'activités illicites entraînera la fermeture immédiate du compte et le signalement aux autorités."
    },
    en: {
      title: "Anti-Money Laundering (AML) Policy",
      subtitle: "Our commitment to fighting money laundering and terrorist financing",
      comingSoon: "This page will soon be available with dynamic content.",
      warning: "Any attempt at money laundering or financing of illicit activities will result in immediate account closure and reporting to authorities."
    },
    cn: {
      title: "反洗钱政策 (AML)",
      subtitle: "我们在打击洗钱和恐怖融资方面的承诺",
      comingSoon: "此页面即将提供动态内容。",
      warning: "任何洗钱或资助非法活动的企图都将导致账户立即关闭并向当局举报。"
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
      slug="aml-policy"
      fallbackContent={fallbackContent}
      icon={ShieldExclamationIcon}
      showWarning={true}
      warningText={t.warning}
    />
  );
}
