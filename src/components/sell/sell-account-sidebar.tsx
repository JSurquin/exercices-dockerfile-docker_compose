"use client";

import { ConnectedSteamAccountCard } from "@/components/sell/connected-steam-account-card";
import InlineTradeLinkEditor from "@/components/sell/inline-trade-link-editor";
import { SellSelectionPanel } from "@/components/sell/sell-selection-panel";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";

interface SellAccountSidebarProps {
  onTradeLinkUpdate: () => void;
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
    <aside className="w-full space-y-4 lg:space-y-5 lg:sticky lg:top-20">
      <div data-tour="sell-steam-account">
        <ConnectedSteamAccountCard compact />
      </div>
      <div data-tour="sell-trade-link">
        <InlineTradeLinkEditor compact onSuccess={onTradeLinkUpdate} />
      </div>
      <SellSelectionPanel items={previewItems} onContinue={onContinue} onDeselect={onDeselect} />
    </aside>
  );
}
