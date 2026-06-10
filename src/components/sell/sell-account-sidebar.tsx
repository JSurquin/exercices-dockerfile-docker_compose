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
    <aside className="w-full space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:scrollbar-thin">
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
