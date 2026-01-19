"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function PrivacyPage() {
  const { messages, locale } = useLocale();

  const fallbackSections = [
    {
      title: messages.privacy.commitment.title,
      content: `${messages.privacy.commitment.description1}\n\n${messages.privacy.commitment.description2 || ''}`,
    },
    {
      title: messages.privacy.dataTypes.title,
      content: messages.privacy.dataTypes.identity 
        ? `**${messages.privacy.dataTypes.identity.category}** : ${messages.privacy.dataTypes.identity.data.join(', ')}\n**${messages.privacy.dataTypes.kyc.category}** : ${messages.privacy.dataTypes.kyc.data.join(', ')}\n**${messages.privacy.dataTypes.financial.category}** : ${messages.privacy.dataTypes.financial.data.join(', ')}\n**${messages.privacy.dataTypes.usage.category}** : ${messages.privacy.dataTypes.usage.data.join(', ')}`
        : '',
    },
    {
      title: messages.privacy.rights?.title || messages.privacy.rights.title,
      content: `• ${messages.privacy.rights.access.description}\n• ${messages.privacy.rights.rectification.description}\n• ${messages.privacy.rights.erasure.description}\n• ${messages.privacy.rights.portability.description}`,
    },
  ];

  const fallbackContent = {
    title: messages.privacy.title,
    subtitle: messages.privacy.subtitle,
    content: (
      <div className="space-y-8">
        {fallbackSections.map((section, index) => (
          <div key={index}>
            <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
                  {section.content.split("\n\n").map((paragraph: string, pIndex: number) => (
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
