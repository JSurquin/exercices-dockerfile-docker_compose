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
  { name: 'AK-47 | Redline (Field-Tested)', price: '18.50 €', img: '/images/demo/ak47.png' },
  { name: 'AWP | Asiimov (Battle-Scarred)', price: '42.30 €', img: '/images/demo/awp.png' },
  { name: 'M4A1-S | Hyper Beast (Minimal Wear)', price: '23.80 €', img: '/images/demo/m4a1.png' },
  { name: 'Glock-18 | Fade (Factory New)', price: '31.00 €', img: '/images/demo/glock.png' },
  { name: 'Desert Eagle | Blaze (Factory New)', price: '55.20 €', img: '/images/demo/deagle.png' },
  { name: 'USP-S | Kill Confirmed (FT)', price: '11.40 €', img: '/images/demo/usp.png' },
];

export function SellTourDemo() {
  const { messages } = useLocale();

  const steps = [
    { id: 'inventory', title: messages.sellPage.steps.inventory, icon: LinkIcon },
    { id: 'trade', title: messages.sellPage.steps.trade, icon: CurrencyDollarIcon },
    { id: 'confirmation', title: messages.sellPage.steps.confirmation, icon: CheckCircleIcon },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <TourDemoBanner />

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
          {messages.sellPage.title}
        </h1>
        <p className="text-muted-foreground">{messages.sellPage.subtitle}</p>
      </div>

      {/* Trade link section */}
      <div
        data-tour="sell-trade-link"
        className="max-w-6xl mx-auto mb-4"
      >
        <Card className="border-dashed border-2 border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Steam Trade Link</p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=xxxxxxxx
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/10 shrink-0">
              ✓ Valide
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stepper */}
      <div
        data-tour="sell-steps"
        className="mb-6 sm:mb-8 overflow-x-auto -mx-1 px-1"
      >
        <div className="flex items-center justify-center sm:justify-between gap-1 sm:gap-2 mb-4 min-w-max sm:min-w-0 w-full mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                  index === 0
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-muted-foreground text-muted-foreground'
                }`}
              >
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="ml-2 sm:ml-3 hidden sm:block">
                <p
                  className={`text-xs md:text-sm font-medium ${
                    index === 0 ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="w-6 sm:w-10 md:w-14 lg:w-20 h-0.5 shrink-0 mx-2 sm:mx-3 md:mx-4 bg-muted" />
              )}
            </div>
          ))}
        </div>
        <Progress value={0} className="h-2" />
      </div>

      {/* Inventory */}
      <div data-tour="sell-inventory">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Inventaire CS2 — Demo</h2>
              <Badge variant="secondary" className="text-xs">6 items</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {DEMO_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="relative rounded-lg border bg-muted/30 p-2 flex flex-col items-center gap-1 select-none opacity-80"
                >
                  <div className="w-full aspect-square rounded bg-gradient-to-br from-orange-500/10 to-blue-500/10 flex items-center justify-center mb-1">
                    <span className="text-2xl">🔫</span>
                  </div>
                  <p className="text-[10px] text-center font-medium line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-orange-500">{item.price}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
