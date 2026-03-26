"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function TermsPage() {
  const { messages } = useLocale();

  const sections = messages.terms.sections;
  const fallbackSections = [
    { id: "object", ...sections.object },
    { id: "access", ...sections.access },
    { id: "kycCompliance", ...sections.kycCompliance },
    { id: "servicesDescription", ...sections.servicesDescription },
    { id: "transactionsRisks", ...sections.transactionsRisks },
    { id: "noFinancialAdvice", ...sections.noFinancialAdvice },
    { id: "liability", ...sections.liability },
    { id: "userConduct", ...sections.userConduct },
    { id: "personalData", ...sections.personalData },
    { id: "modifications", ...sections.modifications },
    { id: "governingLaw", ...sections.governingLaw },
    { id: "contactSection", ...sections.contactSection },
  ];

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
      warningText={messages.terms.warningText}
    />
  );
}
