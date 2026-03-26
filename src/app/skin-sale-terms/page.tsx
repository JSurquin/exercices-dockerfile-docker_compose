"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function SkinSaleTermsPage() {
  const { messages } = useLocale();
  const t = messages.skinSaleTerms;
  const sections = t.sections;

  const fallbackSections = [
    { id: "introduction", ...sections.introduction },
    { id: "natureOfGoods", ...sections.natureOfGoods },
    { id: "saleProcess", ...sections.saleProcess },
    { id: "ownershipTransfer", ...sections.ownershipTransfer },
    { id: "tradeLock", ...sections.tradeLock },
    { id: "priceVolatility", ...sections.priceVolatility },
    { id: "liquidity", ...sections.liquidity },
    { id: "thirdPartyDependency", ...sections.thirdPartyDependency },
    { id: "skinRefusal", ...sections.skinRefusal },
    { id: "fraudSanctions", ...sections.fraudSanctions },
    { id: "userResponsibility", ...sections.userResponsibility },
    { id: "irreversibility", ...sections.irreversibility },
    { id: "forceMajeure", ...sections.forceMajeure },
  ];

  const fallbackContent = {
    title: t.title,
    subtitle: t.subtitle,
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
      slug="skin-sale-terms"
      fallbackContent={fallbackContent}
      icon={ShoppingBagIcon}
      showWarning={true}
      warningText={t.warningText}
    />
  );
}
