"use client";

import { DynamicLegalPage } from "@/components/legal/dynamic-legal-page";
import { ScaleIcon } from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export default function MentionsLegalesPage() {
  const { messages } = useLocale();
  const t = messages.mentionsLegales;
  const sections = t.sections;

  const fallbackSections = [
    { id: "publisher", ...sections.publisher },
    { id: "publicationDirector", ...sections.publicationDirector },
    { id: "hosting", ...sections.hosting },
    { id: "intellectualProperty", ...sections.intellectualProperty },
    { id: "liability", ...sections.liability },
    { id: "personalData", ...sections.personalData },
    { id: "externalLinks", ...sections.externalLinks },
    { id: "applicableLaw", ...sections.applicableLaw },
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
      slug="mentions-legales"
      fallbackContent={fallbackContent}
      icon={ScaleIcon}
      showWarning={true}
      warningText={t.warningText}
    />
  );
}
