"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function PaymentCashoutPage() {
  const { messages } = useLocale();
  const t = messages.paymentCashout;
  const sections = t.sections;

  const fallbackSections = [
    { id: "introduction", ...sections.introduction },
    { id: "operatingPrinciple", ...sections.operatingPrinciple },
    { id: "estimationPricing", ...sections.estimationPricing },
    { id: "transactionValidation", ...sections.transactionValidation },
    { id: "tradeLockDelays", ...sections.tradeLockDelays },
    { id: "payment", ...sections.payment },
    { id: "fees", ...sections.fees },
    { id: "paymentConditions", ...sections.paymentConditions },
    { id: "noGuarantee", ...sections.noGuarantee },
    { id: "cancellation", ...sections.cancellation },
    { id: "suspensionFunds", ...sections.suspensionFunds },
    { id: "thirdPartyServices", ...sections.thirdPartyServices },
    { id: "userResponsibility", ...sections.userResponsibility },
    { id: "transactionRefusal", ...sections.transactionRefusal },
    { id: "modifications", ...sections.modifications },
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
      slug="payment-cashout"
      fallbackContent={fallbackContent}
      icon={BanknotesIcon}
      showWarning={true}
      warningText={t.warningText}
    />
  );
}
