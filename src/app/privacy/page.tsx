"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function PrivacyPage() {
  const { messages } = useLocale();

  const sections = messages.privacy.sections;
  const fallbackSections = [
    { id: "introduction", ...sections.introduction },
    { id: "controller", ...sections.controller },
    { id: "dataCollected", ...sections.dataCollected },
    { id: "purposes", ...sections.purposes },
    { id: "legalBasisSection", ...sections.legalBasisSection },
    { id: "sharingSection", ...sections.sharingSection },
    { id: "retention", ...sections.retention },
    { id: "securitySection", ...sections.securitySection },
    { id: "yourRights", ...sections.yourRights },
    { id: "cookies", ...sections.cookies },
    { id: "modifications", ...sections.modifications },
    { id: "contactSection", ...sections.contactSection },
  ];

  const fallbackContent = {
    title: messages.privacy.title,
    subtitle: messages.privacy.subtitle,
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
      slug="privacy"
      fallbackContent={fallbackContent}
      icon={ShieldCheckIcon}
    />
  );
}
