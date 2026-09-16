'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { GiveawaySort, GiveawayTier, GiveawayTierFilter } from '@/lib/giveaway-presentation';
import { GIVEAWAY_TIER_ACCENTS } from '@/lib/giveaway-presentation';
import type { Messages } from '~/utils/types';

const TIER_FILTERS: GiveawayTierFilter[] = ['all', 'daily', 'weekly', 'monthly', 'special'];

function filterLabel(filter: GiveawayTierFilter, messages: Messages): string {
  const layout = messages.giveaways.layout;
  if (filter === 'all') return layout.filterAll;
  if (filter === 'daily') return layout.tierDaily;
  if (filter === 'weekly') return layout.tierWeekly;
  if (filter === 'monthly') return layout.tierMonthly;
  return layout.tierSpecial;
}

export function GiveawayToolbar({
  messages,
  counts,
  selectedTab,
  tierFilter,
  onTierFilterChange,
  sort,
  onSortChange,
}: {
  messages: Messages;
  counts: { active: number; mine: number; ended: number };
  selectedTab: string;
  tierFilter: GiveawayTierFilter;
  onTierFilterChange: (value: GiveawayTierFilter) => void;
  sort: GiveawaySort;
  onSortChange: (value: GiveawaySort) => void;
}) {
  const layout = messages.giveaways.layout;

  return (
    <div
      data-tour="giveaways-tabs"
      className="sticky top-16 z-30 -mx-4 mb-6 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:mb-8 lg:px-8"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 overflow-x-auto scrollbar-none md:mx-0">
          <TabsList className="flex h-auto w-max min-w-full gap-1 md:grid md:w-full md:grid-cols-3 lg:w-auto">
            <TabsTrigger value="active" className="shrink-0 px-3">
              {messages.giveaways.tabs.active} ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="my-entries" className="shrink-0 px-3">
              {messages.giveaways.tabs.myEntries} ({counts.mine})
            </TabsTrigger>
            <TabsTrigger value="ended" className="shrink-0 px-3">
              {messages.giveaways.tabs.ended} ({counts.ended})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          {selectedTab === 'active' && (
            <div className="flex flex-wrap gap-1.5">
              {TIER_FILTERS.map((filter) => {
                const active = tierFilter === filter;
                const accent =
                  filter === 'all' ? undefined : GIVEAWAY_TIER_ACCENTS[filter as GiveawayTier];
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => onTierFilterChange(filter)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      active
                        ? 'border-theme-accent/40 bg-theme-accent/15 text-foreground'
                        : 'border-white/10 bg-white/5 text-foreground/70 hover:text-foreground'
                    )}
                    style={
                      active && accent
                        ? { borderColor: `${accent}66`, color: accent, background: `${accent}22` }
                        : undefined
                    }
                  >
                    {filterLabel(filter, messages)}
                  </button>
                );
              })}
            </div>
          )}

          <Select value={sort} onValueChange={(value) => onSortChange(value as GiveawaySort)}>
            <SelectTrigger size="sm" aria-label={layout.sortLabel} name="sort">
              <SelectValue placeholder={layout.sortLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="endingSoon">{layout.sortEndingSoon}</SelectItem>
              <SelectItem value="highestValue">{layout.sortHighestValue}</SelectItem>
              <SelectItem value="lowestCost">{layout.sortLowestCost}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
