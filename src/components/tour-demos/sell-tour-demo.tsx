'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
import {
  LinkIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { TourDemoBanner } from './tour-demo-banner';

const DEMO_ITEMS = [
  { name: 'AK-47 | Redline (Field-Tested)', price: '18.50 €' },
  { name: 'AWP | Asiimov (Battle-Scarred)', price: '42.30 €' },
  { name: 'M4A1-S | Hyper Beast (Minimal Wear)', price: '23.80 €' },
  { name: 'Glock-18 | Fade (Factory New)', price: '31.00 €' },
  { name: 'Desert Eagle | Blaze (Factory New)', price: '55.20 €' },
  { name: 'USP-S | Kill Confirmed (FT)', price: '11.40 €' },
];

export function SellTourDemo() {
  const { messages } = useLocale();

  const steps = [
    { id: 'inventory', title: messages.sellPage.steps.inventory, icon: LinkIcon },
    { id: 'trade', title: messages.sellPage.steps.trade, icon: CurrencyDollarIcon },
    { id: 'confirmation', title: messages.sellPage.steps.confirmation, icon: CheckCircleIcon },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <TourDemoBanner />

      <div data-tour="sell-steps" className="max-w-[1600px] mx-auto mb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index === 0
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                <step.icon className="w-4 h-4" />
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 mx-2 bg-muted" />
              )}
            </div>
          ))}
        </div>
        <Progress value={0} className="h-1" />
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_288px] gap-4 lg:gap-5 items-start">
        <div className="min-w-0 order-2 lg:order-none" data-tour="sell-inventory">
          <Card className="rounded-b-none shadow-sm">
            <CardContent className="p-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold">Inventaire CS2</h2>
                  <p className="text-sm text-muted-foreground">6 items · 182,20 €</p>
                </div>
                <Badge variant="secondary" className="text-xs">Demo</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-t-none border-t-0 -mt-px shadow-sm">
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {DEMO_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-muted/30 p-2 flex flex-col items-center gap-1 select-none opacity-80"
                  >
                    <div className="w-full aspect-square rounded bg-gradient-to-br from-theme-accent/10 to-primary/10 flex items-center justify-center mb-1">
                      <span className="text-2xl">🔫</span>
                    </div>
                    <p className="text-[10px] text-center font-medium line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-green-600">{item.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="w-full min-w-0 space-y-3 order-1 lg:order-none">
          <div data-tour="sell-steam-account">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-muted border-2 border-border shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {messages.sellPage.steamAccount.label}
                  </p>
                  <p className="font-semibold text-sm truncate">DemoPlayer</p>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">76561198123456789</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div data-tour="sell-trade-link">
            <Card className="border-theme-accent/40 bg-theme-accent/5">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-theme-accent shrink-0" />
                  <p className="text-sm font-semibold">Steam Trade Link</p>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  https://steamcommunity.com/tradeoffer/new/?partner=…
                </p>
                <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10 text-[10px]">
                  ✓ Valide
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="brand-panel">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{messages.sellPage.selectionPanel.selectedTotal}</p>
              <p className="text-2xl font-bold text-green-600">0,00 €</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
