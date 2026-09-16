'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CurrencyDollarIcon,
  GiftIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import type { Messages } from '~/utils/types';

const iconWrap =
  'flex h-12 w-12 items-center justify-center rounded-full border border-theme-accent/30 bg-gradient-to-br from-white/10 to-theme-accent/10 ring-2 ring-theme-accent/15 mx-auto mb-3';

export function GiveawayHowItWorksDialog({
  messages,
  triggerClassName,
}: {
  messages: Messages;
  triggerClassName?: string;
}) {
  const how = messages.giveaways.howTicketsWork;
  const steps = [
    { icon: CurrencyDollarIcon, title: how.earn.title, description: how.earn.description },
    { icon: GiftIcon, title: how.participate.title, description: how.participate.description },
    { icon: TrophyIcon, title: how.win.title, description: how.win.description },
  ];

  return (
    <Dialog>
      <DialogTrigger
        data-tour="giveaways-how"
        className={
          triggerClassName ??
          'text-sm text-theme-accent underline-offset-4 hover:underline'
        }
      >
        {messages.giveaways.layout.howItWorksLink}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{how.title}</DialogTitle>
          <DialogDescription>{messages.giveaways.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="text-center">
              <div className={iconWrap}>
                <step.icon className="h-6 w-6 text-theme-accent" />
              </div>
              <h4 className="mb-2 font-semibold">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
