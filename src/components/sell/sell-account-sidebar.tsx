"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConnectedSteamAccountCard } from "@/components/sell/connected-steam-account-card";
import InlineTradeLinkEditor from "@/components/sell/inline-trade-link-editor";
import { SellSelectionPanel } from "@/components/sell/sell-selection-panel";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";

const PANEL_DIVIDER = "border-t border-[rgba(159,196,255,0.12)]";

interface SellAccountSidebarProps {
  onTradeLinkUpdate: (tradeLink: string) => void;
  previewItems: NormalizedInventoryItem[];
  onContinue: () => void;
  onDeselect: () => void;
}

export function SellAccountSidebar({
  onTradeLinkUpdate,
  previewItems,
  onContinue,
  onDeselect,
}: SellAccountSidebarProps) {
  return (
    <aside className="w-full lg:sticky lg:top-20">
      <Card className="brand-panel overflow-hidden">
        <CardContent className="p-0">
          <div data-tour="sell-steam-account" className="px-3 py-2">
            <ConnectedSteamAccountCard embedded />
          </div>

          <div data-tour="sell-trade-link" className={`${PANEL_DIVIDER} px-3 py-2`}>
            <InlineTradeLinkEditor embedded onSuccess={onTradeLinkUpdate} />
          </div>

          <div className={`${PANEL_DIVIDER} px-3 py-2.5`}>
            <SellSelectionPanel
              embedded
              items={previewItems}
              onContinue={onContinue}
              onDeselect={onDeselect}
            />
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
