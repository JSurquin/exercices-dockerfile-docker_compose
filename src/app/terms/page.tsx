"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function TermsPage() {
  const { messages } = useLocale();

  const sections = messages.terms.sections;
  const fallbackSections = [
    { id: "acceptance", ...sections.acceptance },
    { id: "eligibility", ...sections.eligibility },
    { id: "services", ...sections.services },
    { id: "trading", ...sections.trading },
    { id: "payments", ...sections.payments },
    { id: "kycSection", ...sections.kycSection },
    { id: "security", ...sections.security },
    { id: "restrictions", ...sections.restrictions },
    { id: "liability", ...sections.liability },
    { id: "data", ...sections.data },
    { id: "termination", ...sections.termination },
    { id: "governing", ...sections.governing },
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
      warningText={messages.terms.warningText || "Ces conditions d'utilisation constituent un contrat légalement contraignant entre vous et CashTrade. En utilisant nos services, vous acceptez d'être lié par l'ensemble de ces conditions."}
    />
  );
}
