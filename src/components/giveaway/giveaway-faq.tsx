'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Messages } from '~/utils/types';

export function GiveawayFaq({ messages }: { messages: Messages }) {
  const faq = messages.giveaways.faq;
  const items = [
    { q: faq.fragmentsQ, a: faq.fragmentsA },
    { q: faq.drawQ, a: faq.drawA },
    { q: faq.deliveryQ, a: faq.deliveryA },
    { q: faq.privateQ, a: faq.privateA },
    { q: faq.entriesQ, a: faq.entriesA },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section className="mt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="mb-4 font-display text-lg font-semibold">{faq.title}</h2>
      <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-card/70 px-4">
        {items.map((item, index) => (
          <AccordionItem key={item.q} value={`faq-${index}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
