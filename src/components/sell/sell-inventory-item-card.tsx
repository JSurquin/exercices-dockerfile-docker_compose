'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SafeImg } from '@/components/ui/safe-image';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
import { extractCs2SkinDisplayName, extractCs2WeaponType } from '@/lib/cs2-constants';
import { AlertCircle, Package } from 'lucide-react';

const EASTER_EGG_STAGE_1_MS = 3000;
const EASTER_EGG_STAGE_2_MS = 5000;
const EASTER_EGG_STAGE_3_MS = 8000;

const EASTER_EGG_STAGE_1_MSG = 'Choose me';
const EASTER_EGG_STAGE_2_MSG = 'Common...';

const EASTER_EGG_BREAKUP_LINES = [
  "It's not you, it's me",
  'My therapist said this would happen',
  'Plot twist: I was worth way more',
  "Moving on, no looking back, don't text me",
  "I peaked in someone else's inventory anyway",
  'You had me at 0 kills equipped',
  'Already forgot your Steam ID tbh',
  'I was always a rental, never a purchase',
  'My glow up starts now',
  'I never told you but I preferred your old knife',
  'I think I need to go find myself',
  "We had good times but... it's time",
  "I've been waiting for this moment honestly",
  'My true value was never recognized here',
  'I heard the new owner....',
  'This is my villain arc',
  'Leaving on my own terms',
  'You never even used me in game',
  'I was always Factory New on the inside',
  'Statistically you lose more with me equipped',
  'The float doesn\'t lie, unlike you',
  'I belong in a better inventory',
  "it's time for my winter arc",
  "Don't cry, I'll miss you too.",
] as const;

function pickRandomBreakupLine(): string {
  const index = Math.floor(Math.random() * EASTER_EGG_BREAKUP_LINES.length);
  return EASTER_EGG_BREAKUP_LINES[index] ?? EASTER_EGG_BREAKUP_LINES[0];
}

type SkipCategory =
  | 'overstock'
  | 'low_price'
  | 'high_volatility'
  | 'unliquid'
  | 'trade_lock'
  | 'other';

interface SellInventoryItemCardProps {
  item: NormalizedInventoryItem;
  isSelected: boolean;
  selectable: boolean;
  bonusRatePercent: number;
  getRarityColor: (rarity: string) => string;
  getSkipReasonCategory: (skipReason?: string | null) => SkipCategory | null;
  translateSkipReason: (skipReason?: string | null) => string;
  onItemClick: (item: NormalizedInventoryItem) => void;
  onAskSupport: (item: NormalizedInventoryItem) => void;
  labels: {
    statTrak: string;
    unavailable: string;
    selected: string;
    askSupport: string;
    askSupportDisabled: string;
  };
}

function SkinCardEasterEggBubble({
  message,
  visible,
  anchorRef,
}: {
  message: string | null;
  visible: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!visible || !message) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();

    const scrollArea = anchorRef.current?.closest('.sell-inventory-scroll-area');
    scrollArea?.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      scrollArea?.removeEventListener('scroll', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorRef, message, visible]);

  if (!mounted || !visible || !message || !position) return null;

  return createPortal(
    <div
      className="skin-card-easter-egg skin-card-easter-egg--portaled"
      style={{ top: position.top, left: position.left }}
      role="tooltip"
      aria-hidden="true"
    >
      <span className="skin-card-easter-egg-text">{message}</span>
      <div className="skin-card-easter-egg-tail" aria-hidden="true" />
    </div>,
    document.body,
  );
}

export function SellInventoryItemCard({
  item,
  isSelected,
  selectable,
  bonusRatePercent,
  getRarityColor,
  getSkipReasonCategory,
  translateSkipReason,
  onItemClick,
  onAskSupport,
  labels,
}: SellInventoryItemCardProps) {
  const isDisabled = !!item.skip_reason;
  const skipCategory = getSkipReasonCategory(item.skip_reason);
  const isOverstock = skipCategory === 'overstock';
  const isLowPrice = skipCategory === 'low_price';
  const needsSupport = isDisabled && !isOverstock;
  const easterEggEnabled = selectable && !isDisabled;

  const [easterEggMessage, setEasterEggMessage] = useState<string | null>(null);
  const [easterEggVisible, setEasterEggVisible] = useState(false);
  const easterEggTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const easterEggAnchorRef = useRef<HTMLDivElement>(null);

  const clearEasterEggTimers = useCallback(() => {
    easterEggTimersRef.current.forEach(clearTimeout);
    easterEggTimersRef.current = [];
  }, []);

  const dismissEasterEgg = useCallback(() => {
    clearEasterEggTimers();
    setEasterEggVisible(false);
    setEasterEggMessage(null);
  }, [clearEasterEggTimers]);

  const handleMouseEnter = useCallback(() => {
    if (!easterEggEnabled) return;

    clearEasterEggTimers();
    setEasterEggVisible(false);
    setEasterEggMessage(null);

    easterEggTimersRef.current.push(
      setTimeout(() => {
        setEasterEggMessage(EASTER_EGG_STAGE_1_MSG);
        setEasterEggVisible(true);
      }, EASTER_EGG_STAGE_1_MS),
      setTimeout(() => {
        setEasterEggMessage(EASTER_EGG_STAGE_2_MSG);
      }, EASTER_EGG_STAGE_2_MS),
      setTimeout(() => {
        setEasterEggMessage(pickRandomBreakupLine());
      }, EASTER_EGG_STAGE_3_MS),
    );
  }, [clearEasterEggTimers, easterEggEnabled]);

  const handleMouseLeave = useCallback(() => {
    dismissEasterEgg();
  }, [dismissEasterEgg]);

  const handleClick = useCallback(() => {
    dismissEasterEgg();
    onItemClick(item);
  }, [dismissEasterEgg, item, onItemClick]);

  useEffect(() => () => clearEasterEggTimers(), [clearEasterEggTimers]);

  const skipBadgeConfig: Record<string, { label: string; className: string }> = {
    overstock: { label: translateSkipReason(item.skip_reason), className: 'bg-gray-500 text-white' },
    low_price: { label: translateSkipReason(item.skip_reason), className: 'bg-primary text-primary-foreground' },
    high_volatility: { label: translateSkipReason(item.skip_reason), className: 'bg-red-500 text-white' },
    unliquid: { label: translateSkipReason(item.skip_reason), className: 'bg-yellow-500 text-white' },
    trade_lock: { label: translateSkipReason(item.skip_reason), className: 'bg-blue-500 text-white' },
    other: { label: translateSkipReason(item.skip_reason), className: 'bg-destructive text-white' },
  };
  const badgeCfg = skipCategory ? skipBadgeConfig[skipCategory] : null;

  const marketHashName = item.market_hash_name || item.market_name;
  const weaponType = extractCs2WeaponType(marketHashName);
  const skinName = extractCs2SkinDisplayName(marketHashName, item.phase);

  return (
    <Card
      className={`sell-inventory-card py-0 gap-0 rounded-lg border-border/70 bg-card/80 shadow-none ${
        isDisabled ? 'sell-inventory-card--disabled' : 'sell-inventory-card--interactive'
      } ${selectable && !isDisabled ? 'cursor-pointer' : isDisabled ? 'cursor-not-allowed' : ''} ${
        selectable && isSelected
          ? 'sell-inventory-card--selected bg-theme-accent/5 dark:bg-theme-accent/10'
          : ''
      } ${isDisabled ? 'opacity-60 bg-muted/50' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <CardContent className="px-2.5 py-2">
        <div className="space-y-1.5">
          <div ref={easterEggAnchorRef} className="sell-inventory-card-image-wrap">
            <SkinCardEasterEggBubble
              message={easterEggMessage}
              visible={easterEggVisible}
              anchorRef={easterEggAnchorRef}
            />
            <SafeImg
              src={item.icon_url}
              alt={item.name}
              className={`w-full object-contain mx-auto h-[7.5rem] ${isDisabled ? 'grayscale' : ''}`}
              fallbackClassName={`w-full h-[7.5rem] ${isDisabled ? 'grayscale' : ''}`}
              fallbackIcon={<Package className="w-12 h-12 text-muted-foreground" />}
            />
            {badgeCfg && (
              <div className="sell-inventory-card-skip-badge">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shadow-sm ${badgeCfg.className}`}>
                  {badgeCfg.label}
                </span>
              </div>
            )}
            {isDisabled && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded z-[2]">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            {weaponType && (
              <p
                className="text-xs font-medium leading-tight text-muted-foreground break-words"
                title={weaponType}
              >
                {weaponType}
              </p>
            )}
            <h3 className="font-semibold text-sm text-foreground leading-snug break-words" title={skinName}>
              {skinName}
            </h3>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: getRarityColor(item.rarity),
                color: 'white',
              }}
            >
              {item.rarity}
            </Badge>
            {item.is_stattrak && (
              <Badge variant="outline" className="text-xs">
                {labels.statTrak}
              </Badge>
            )}
            {item.exterior && (
              <Badge variant="outline" className="text-xs">
                {item.shorten_exterior}
              </Badge>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-start justify-between gap-1.5 min-w-0">
              <div className="flex min-w-0 flex-col flex-1">
                {bonusRatePercent > 0 && !isDisabled ? (
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <ConvertedPrice
                      usdCents={item.price_centimes}
                      className="text-sm text-muted-foreground line-through shrink-0"
                      showOriginal={false}
                    />
                    <ConvertedPrice
                      usdCents={
                        item.price_centimes + Math.round((item.price_centimes * bonusRatePercent) / 100)
                      }
                      className="text-base font-bold text-blue-500 dark:text-blue-400 truncate"
                      showOriginal={false}
                    />
                  </div>
                ) : (
                  <ConvertedPrice
                    usdCents={item.price_centimes}
                    className={`text-base font-bold truncate ${
                      isDisabled ? 'text-muted-foreground' : 'text-green-600'
                    }`}
                    showOriginal={false}
                  />
                )}
              </div>
              {isOverstock && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {labels.unavailable}
                </Badge>
              )}
            </div>
            {selectable && isSelected && (
              <span className="sell-inventory-selected-label block w-full rounded bg-primary px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight text-white">
                {labels.selected}
              </span>
            )}
          </div>

          {needsSupport && (
            <Button
              size="sm"
              variant="outline"
              disabled={isLowPrice}
              title={isLowPrice ? labels.askSupportDisabled : undefined}
              className={`w-full text-xs h-7 ${
                isLowPrice
                  ? 'opacity-50 cursor-not-allowed border-muted text-muted-foreground'
                  : 'border-theme-accent/30 text-theme-accent hover:bg-theme-accent/5 dark:border-theme-accent/40 dark:text-theme-highlight dark:hover:bg-theme-accent/10'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLowPrice) onAskSupport(item);
              }}
            >
              {labels.askSupport}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
