'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MagnifyingGlassIcon, CheckIcon, CubeIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';

interface SkinItem {
  steam_market_hash_name: string;
  icon_url: string | null;
  price: number | null;
  rarity: string | null;
  rarity_color: string | null;
  exterior: string | null;
  item_type: string | null;
  phase: string | null;
}

interface SkinPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (skin: SkinItem) => void;
  selected: SkinItem | null;
}

export function SkinPickerModal({ open, onOpenChange, onSelect, selected }: SkinPickerModalProps) {
  const { messages } = useLocale();
  const t = messages.admin?.skinPicker;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<SkinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce la recherche (350ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchItems = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (query) params.set('search', query);
      const res = await fetch(
        `/api/admin/skinplace-items-search?${params.toString()}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchItems(debouncedSearch);
    }
  }, [open, debouncedSearch, fetchItems]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setDebouncedSearch('');
      setItems([]);
    }
  }, [open]);

  const handleSelect = (skin: SkinItem) => {
    onSelect(skin);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl w-full p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700/60">
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            {t?.title ?? 'Choisir un article à faire gagner'}
          </DialogTitle>
          <div className="relative mt-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-orange-500"
              placeholder={t?.searchPlaceholder ?? 'Rechercher un skin (ex: AK-47, AWP, Karambit...)'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 animate-pulse">
                {t?.loading ?? 'Chargement…'}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-sm animate-pulse">{t?.loadingItems ?? 'Chargement des articles…'}</span>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <MagnifyingGlassIcon className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">
                {debouncedSearch ? (t?.noResults ?? 'Aucun résultat pour cette recherche') : (t?.noItems ?? 'Aucun article disponible')}
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-6">
              {items.map((skin) => {
                const isSelected = selected?.steam_market_hash_name === skin.steam_market_hash_name;
                const isHovered = highlighted === skin.steam_market_hash_name;
                return (
                  <button
                    key={skin.steam_market_hash_name}
                    type="button"
                    onClick={() => handleSelect(skin)}
                    onMouseEnter={() => setHighlighted(skin.steam_market_hash_name)}
                    onMouseLeave={() => setHighlighted(null)}
                    className={`
                      relative flex flex-col items-center gap-2 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer group
                      ${isSelected
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                        : isHovered
                          ? 'border-slate-500 bg-slate-700/60'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/60'
                      }
                    `}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-orange-500 rounded-full p-0.5">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </span>
                    )}

                    {skin.rarity_color && (
                      <span
                        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-70"
                        style={{ background: `#${skin.rarity_color}` }}
                      />
                    )}

                    <div className="w-full flex items-center justify-center h-16 relative">
                      <SafeImage
                        src={skin.icon_url}
                        alt={skin.steam_market_hash_name}
                        width={100}
                        height={70}
                        className="object-contain max-h-16 drop-shadow-lg"
                        fallbackClassName="w-20 h-12 rounded opacity-40"
                        fallbackIcon={<CubeIcon className="w-8 h-8" />}
                        unoptimized
                      />
                    </div>

                    <div className="w-full">
                      <p className="text-xs font-medium text-white leading-snug line-clamp-2 text-center">
                        {skin.steam_market_hash_name}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1 flex-wrap">
                        {skin.price != null && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-300 border-green-500/30 font-semibold">
                            ~{skin.price.toFixed(2)} $
                          </Badge>
                        )}
                        {skin.exterior && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-slate-700 text-slate-300 border-slate-600">
                            {skin.exterior}
                          </Badge>
                        )}
                        {skin.rarity && skin.rarity_color && (
                          <Badge
                            className="text-[10px] px-1.5 py-0 border"
                            style={{
                              background: `#${skin.rarity_color}22`,
                              color: `#${skin.rarity_color}`,
                              borderColor: `#${skin.rarity_color}55`,
                            }}
                          >
                            {t?.rarity?.[skin.rarity.toLowerCase() as keyof typeof t.rarity] ?? skin.rarity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-slate-900/80">
          <p className="text-xs text-slate-400">
            {!loading && items.length > 0 && (
              debouncedSearch
                ? (items.length === 1 ? (t?.itemCountFound_one ?? `${items.length} article trouvé`) : (t?.itemCountFound_other ?? `${items.length} articles trouvés`)).replace('{{count}}', String(items.length))
                : (items.length === 1 ? (t?.itemCount_one ?? `${items.length} article`) : (t?.itemCount_other ?? `${items.length} articles`)).replace('{{count}}', String(items.length))
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {t?.cancel ?? 'Annuler'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
