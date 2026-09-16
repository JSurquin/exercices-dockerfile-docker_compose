'use client';

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GiftIcon } from '@heroicons/react/24/outline';

export function GiveawayEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-card/80">
      <CardContent className="p-8 text-center">
        <GiftIcon className="mx-auto mb-4 h-16 w-16 text-foreground/55" aria-hidden />
        <h3 className="mb-2 text-xl font-semibold">{title}</h3>
        {description ? <p className="text-foreground/70">{description}</p> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
