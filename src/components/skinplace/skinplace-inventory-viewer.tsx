'use client';

import { useState, useEffect, useRef } from 'react';
import { useSkinplaceInventory, NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SafeImg } from '@/components/ui/safe-image';
import { 
  Search, 
  RefreshCw, 
  DollarSign, 
  Package, 
  AlertCircle, 
  Filter,
  TrendingUp,
  Star,
  ExternalLink,
  User,
  Edit,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { useCurrency } from '@/components/providers/currency-provider';
import { currencyConverter } from '@/lib/currency-converter';
import { isValidSteamId64, parseSteamId64FromUserInput } from '@/lib/steam-id';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { isInventoryPrivateError } from '@/lib/inventory-api-errors';

function isPurchasable(item: NormalizedInventoryItem): boolean {
  return item.tradable && !item.skip_reason;
}

/** Saisie utilisateur en dollars US → centimes USD (entier). */
function parseUsdDollarsToCents(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

interface SkinplaceInventoryViewerProps {
  /** Vide si l’utilisateur n’a pas de Steam lié (ex. connexion Discord uniquement). */
  steamId64?: string;
  /** Identité Steam du compte MoonSkin (affichée seulement si currentSteamId === SteamID du profil) */
  linkedSteamIdentity?: { name: string; avatarUrl: string };
  onItemSelect?: (items: NormalizedInventoryItem[]) => void;
  /** Appelé en temps réel à chaque changement de sélection (pour la preview XP) */
  onSelectionChange?: (items: NormalizedInventoryItem[]) => void;
  /** IDs présélectionnés (ex. retour arrière depuis /sell) */
  initialSelectedIds?: string[];
  selectable?: boolean;
  allowSteamIdChange?: boolean;
  onSteamIdChange?: (newSteamId: string) => void;
  /** Layout compact type Skinplace pour la page Vendre */
  layout?: 'default' | 'sell';
  /** Masque la barre de sélection sticky (utilisée avec sidebar Vendre) */
  hideSelectionBar?: boolean;
  /** Incrémenter pour vider la sélection depuis le parent */
  selectionResetToken?: number;
}

export function SkinplaceInventoryViewer({ 
  steamId64: profileSteamId64Prop = '',
  linkedSteamIdentity,
  onItemSelect,
  onSelectionChange,
  initialSelectedIds,
  selectable = false,
  allowSteamIdChange = false,
  onSteamIdChange,
  layout = 'default',
  hideSelectionBar = false,
  selectionResetToken = 0,
}: SkinplaceInventoryViewerProps) {
  const isSellLayout = layout === 'sell';
  const profileSteamId64 = (profileSteamId64Prop ?? '').trim();
  const { messages } = useLocale();
  const { selectedCurrency } = useCurrency();
  const { user } = useAuth();
  const bonusRatePercent = user?.bonusRatePercent ?? 0;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<NormalizedInventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NormalizedInventoryItem[]>([]);
  const [convertedSelectedValue, setConvertedSelectedValue] = useState<string>('');
  
  // Steam ID change functionality
  const [showSteamIdInput, setShowSteamIdInput] = useState(false);
  const [customSteamId, setCustomSteamId] = useState(profileSteamId64);
  const [currentSteamId, setCurrentSteamId] = useState(profileSteamId64);
  
  // Filtres
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedExterior, setSelectedExterior] = useState<string>('');
  const [statTrakOnly, setStatTrakOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'rarity' | 'name'>('value_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [purchasableOnly, setPurchasableOnly] = useState(false);
  const [priceMinUsd, setPriceMinUsd] = useState('');
  const [priceMaxUsd, setPriceMaxUsd] = useState('');
  const hasRestoredInitialSelection = useRef(false);

  const { 
    loading, 
    error, 
    getSkinplaceInventory,
    filterTradableItems,
    sortItemsByValue,
    sortItemsByRarity,
    filterBySearch,
    filterByRarity,
    filterByExterior,
    filterByStatTrak,
    calculateInventoryStats,
    formatPriceSync,
    getRarityColor,
    translateSkipReason,
    getSkipReasonCategory,
  } = useSkinplaceInventory({
    onError: (err) => {
      console.error('Erreur Skinplace Inventory:', err);
      const sp = messages.components.skinplace;
      const msg = isInventoryPrivateError(err)
        ? `${sp.error} ${sp.inventoryPrivateTitle}`
        : `${sp.error} ${err}`;
      toast.error(msg);
    },
  });

  const loadInventory = async (steamIdToLoad?: string) => {
    const idToUse = steamIdToLoad || currentSteamId;
    const result = await getSkinplaceInventory(idToUse);
    
    if (result?.success && result.items) {
      setInventory(result.items);
    }
  };

  // Handle Steam ID change
  const handleSteamIdChange = () => {
    const resolved = parseSteamId64FromUserInput(customSteamId);
    if (!resolved || !isValidSteamId64(resolved)) {
      toast.error(messages.settings.steamId.invalidFormat);
      return;
    }
    
    setCurrentSteamId(resolved);
    setCustomSteamId(resolved);
    setShowSteamIdInput(false);
    setSelectedItems([]); // Reset selection when changing Steam ID
    onSteamIdChange?.(resolved);
    loadInventory(resolved);
  };

  // Reset to original Steam ID
  const handleResetSteamId = () => {
    const linked = profileSteamId64;
    setCustomSteamId(linked);
    setCurrentSteamId(linked);
    setShowSteamIdInput(false);
    setSelectedItems([]);
    onSteamIdChange?.(linked);
    if (isValidSteamId64(linked)) {
      loadInventory(linked);
    }
  };

  const handleIdentifierGateSubmit = () => {
    const ig = messages.components.skinplace.identifierGate;
    const resolved = parseSteamId64FromUserInput(customSteamId);
    if (!resolved || !isValidSteamId64(resolved)) {
      toast.error(ig.invalidPaste);
      return;
    }
    setCurrentSteamId(resolved);
    setCustomSteamId(resolved);
    setSelectedItems([]);
    onSteamIdChange?.(resolved);
  };

  // Appliquer les filtres
  useEffect(() => {
    // Partir des items tradables Steam (incluant ceux bloqués par Skinplace)
    let filtered = inventory.filter(item => item.tradable);
    
    // Filtrer par recherche
    filtered = filterBySearch(filtered, searchTerm);
    
    // Filtrer par rareté
    if (selectedRarity) {
      filtered = filterByRarity(filtered, selectedRarity);
    }
    
    // Filtrer par exterior
    if (selectedExterior) {
      filtered = filterByExterior(filtered, selectedExterior);
    }
    
    // Filtrer StatTrak
    if (statTrakOnly) {
      filtered = filterByStatTrak(filtered, true);
    }

    if (purchasableOnly) {
      filtered = filtered.filter(isPurchasable);
    }

    let minBound = parseUsdDollarsToCents(priceMinUsd);
    let maxBound = parseUsdDollarsToCents(priceMaxUsd);
    if (minBound !== null && maxBound !== null && maxBound < minBound) {
      [minBound, maxBound] = [maxBound, minBound];
    }
    if (minBound !== null) {
      filtered = filtered.filter((item) => item.price_centimes >= minBound!);
    }
    if (maxBound !== null) {
      filtered = filtered.filter((item) => item.price_centimes <= maxBound!);
    }
    
    // Trier
    switch (sortBy) {
      case 'value_desc':
        filtered = sortItemsByValue(filtered, false);
        break;
      case 'value_asc':
        filtered = sortItemsByValue(filtered, true);
        break;
      case 'rarity':
        filtered = sortItemsByRarity(filtered);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredItems(filtered);
  }, [inventory, searchTerm, selectedRarity, selectedExterior, statTrakOnly, sortBy, purchasableOnly, priceMinUsd, priceMaxUsd, filterBySearch, filterByRarity, filterByExterior, filterByStatTrak, sortItemsByValue, sortItemsByRarity]);

  useEffect(() => {
    if (isValidSteamId64(currentSteamId)) {
      loadInventory(currentSteamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSteamId]);

  // Sync when le SteamID lié au profil change (ex. après liaison en paramètres)
  useEffect(() => {
    const linked = profileSteamId64;
    if (!linked) return;
    if (linked !== currentSteamId && !showSteamIdInput) {
      setCurrentSteamId(linked);
      setCustomSteamId(linked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSteamId64]);

  // Restaurer la sélection après navigation arrière sur /sell
  useEffect(() => {
    if (
      hasRestoredInitialSelection.current ||
      !initialSelectedIds?.length ||
      inventory.length === 0
    ) {
      return;
    }
    const validIds = initialSelectedIds.filter((id) =>
      inventory.some((item) => item.id === id && item.tradable && !item.skip_reason)
    );
    if (validIds.length === 0) return;

    hasRestoredInitialSelection.current = true;
    setSelectedItems(validIds);
    if (onSelectionChange) {
      onSelectionChange(inventory.filter((item) => validIds.includes(item.id)));
    }
  }, [inventory, initialSelectedIds, onSelectionChange]);

  useEffect(() => {
    if (!selectionResetToken) return;
    setSelectedItems([]);
    onSelectionChange?.([]);
  }, [selectionResetToken, onSelectionChange]);

  const stats = calculateInventoryStats(inventory);
  // Tous les items visibles (tradable Steam), incluant ceux bloqués par Skinplace
  const visibleItems = inventory.filter(item => item.tradable);
  const selectedItemsData = inventory.filter(item => selectedItems.includes(item.id));
  const selectedValue = selectedItemsData.reduce((sum, item) => sum + item.price_centimes, 0);

  // Convertir la valeur sélectionnée dans la devise choisie
  useEffect(() => {
    const convertSelectedValue = async () => {
      if (selectedValue > 0) {
        try {
          const convertedCents = await currencyConverter.convertCents(selectedValue, 'USD', selectedCurrency);
          const formatted = currencyConverter.formatPrice(convertedCents, selectedCurrency);
          setConvertedSelectedValue(formatted);
        } catch (error) {
          console.error('Erreur conversion valeur sélectionnée:', error);
          setConvertedSelectedValue(formatPriceSync(selectedValue));
        }
      } else {
        setConvertedSelectedValue(currencyConverter.formatPrice(0, selectedCurrency));
      }
    };

    convertSelectedValue();
  }, [selectedValue, selectedCurrency, formatPriceSync]);

  // Obtenir les options de filtre uniques
  const availableRarities = Array.from(new Set(visibleItems.map(item => item.rarity))).sort();
  const availableExteriors = Array.from(new Set(visibleItems.map(item => item.exterior).filter(Boolean))).sort();

  const handleItemClick = (item: NormalizedInventoryItem) => {
    if (!selectable || !item.tradable || item.skip_reason) return;

    setSelectedItems(prev => {
      const next = prev.includes(item.id)
        ? prev.filter(id => id !== item.id)
        : [...prev, item.id];
      // Propager en temps réel pour la preview XP
      if (onSelectionChange) {
        const nextData = inventory.filter(i => next.includes(i.id));
        onSelectionChange(nextData);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRarity('');
    setSelectedExterior('');
    setStatTrakOnly(false);
    setSortBy('value_desc');
    setPurchasableOnly(false);
    setPriceMinUsd('');
    setPriceMaxUsd('');
  };

  const purchasableFiltered = filteredItems.filter(isPurchasable);
  const allPurchasableSelected =
    purchasableFiltered.length > 0 &&
    purchasableFiltered.every((item) => selectedItems.includes(item.id));

  const handleToggleSelectAllPurchasable = () => {
    if (allPurchasableSelected) {
      setSelectedItems([]);
      if (onSelectionChange) onSelectionChange([]);
      return;
    }
    setSelectedItems(purchasableFiltered.map((i) => i.id));
    if (onSelectionChange) onSelectionChange(purchasableFiltered);
  };

  const openSupportForItem = (item: NormalizedInventoryItem) => {
    const reason = translateSkipReason(item.skip_reason);
    const template = messages.components.skinplace.blockedItemMessage;
    const prefillMessage = template
      .replace('{name}', item.name)
      .replace('{reason}', reason);
    window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { prefillMessage } }));
  };

  const hasValidSteamId = isValidSteamId64(currentSteamId.trim());
  const customSteamInputLooksValid = Boolean(parseSteamId64FromUserInput(customSteamId));

  if (!hasValidSteamId && !loading) {
    const ig = messages.components.skinplace.identifierGate;
    return (
      <Card className="brand-panel">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5 text-theme-accent" />
            {ig.title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {ig.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="steam-identifier-gate">{ig.label}</Label>
            <Input
              id="steam-identifier-gate"
              placeholder={ig.placeholder}
              value={customSteamId}
              onChange={(e) => setCustomSteamId(e.target.value)}
              className={`font-mono text-sm ${
                customSteamId && !customSteamInputLooksValid
                  ? 'border-destructive/60 focus-visible:ring-destructive/40'
                  : customSteamInputLooksValid
                    ? 'border-green-500/60 focus-visible:ring-green-500/40'
                    : ''
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleIdentifierGateSubmit();
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleIdentifierGateSubmit}
              disabled={!customSteamInputLooksValid}
            >
              {ig.cta}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/settings">{ig.openSettings}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            {messages.components.skinplace.loadingInventory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isPrivateError = isInventoryPrivateError(error);
    const isNotFoundError = error.includes('introuvable') || error.includes('not found');
    
    const sp = messages.components.skinplace;
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg text-destructive">
                {isPrivateError 
                  ? sp.inventoryPrivateTitle
                  : isNotFoundError 
                    ? sp.steamIdNotFound
                    : sp.error}
              </CardTitle>
              <CardDescription className="text-destructive/80">
                {isPrivateError 
                  ? sp.inventoryPrivateDesc
                  : isNotFoundError
                    ? sp.steamIdNotFoundDesc
                    : error}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {isPrivateError && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                  {sp.makePublicStep}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {sp.makePublicDesc}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://steamcommunity.com/my/edit/settings', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {sp.openSteamSettings}
                </Button>
              </div>
            )}
            
            {(isPrivateError || isNotFoundError) && allowSteamIdChange && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {isPrivateError ? '2' : '1'}
                  </span>
                  {sp.useLoginAccount}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {sp.useLoginAccountDesc}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetSteamId}
                    variant="outline"
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {sp.useMainAccount}
                  </Button>
                </div>
                {profileSteamId64 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {sp.mainAccount} : <code className="bg-muted px-1 rounded">{profileSteamId64}</code>
                  </p>
                )}
              </div>
            )}
            
            {(isPrivateError || isNotFoundError) && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {isPrivateError && allowSteamIdChange ? '3' : '2'}
                  </span>
                  {sp.editTradeLink}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {sp.editTradeLinkDesc}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/settings'}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {sp.goToSettings}
                </Button>
              </div>
            )}
            
            {allowSteamIdChange && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {isPrivateError ? '4' : isNotFoundError ? '3' : '1'}
                  </span>
                  {sp.tryOtherSteamId}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {sp.tryOtherSteamIdDesc}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="76561198123456789"
                    value={customSteamId}
                    onChange={(e) => setCustomSteamId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSteamIdChange}
                    disabled={!customSteamId || customSteamId === currentSteamId}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {sp.loadButton}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="bg-background rounded-lg p-4 border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  {isPrivateError && allowSteamIdChange ? '3' : isNotFoundError && allowSteamIdChange ? '2' : '1'}
                </span>
                {sp.retryStep}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {sp.retryDesc}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInventory(currentSteamId)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? sp.loadingButton : sp.retryButton}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{sp.steamIdUsed}: <code className="bg-muted px-1 rounded">{currentSteamId}</code></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={isSellLayout ? 'min-w-0 w-full' : 'space-y-6 pb-24'}>

      {/* Header avec option de changer le Steam ID */}
      {allowSteamIdChange && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {linkedSteamIdentity && currentSteamId === profileSteamId64 && linkedSteamIdentity.avatarUrl ? (
                  <Avatar className="h-11 w-11 border-2 border-primary/30 shrink-0">
                    <AvatarImage src={linkedSteamIdentity.avatarUrl} alt="" />
                    <AvatarFallback className="text-xs">
                      {(linkedSteamIdentity.name || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{messages.components.skinplace.inventoryLoadedFor}</p>
                  {linkedSteamIdentity && currentSteamId === profileSteamId64 && linkedSteamIdentity.name ? (
                    <p className="font-semibold text-sm truncate" title={linkedSteamIdentity.name}>
                      {linkedSteamIdentity.name}
                    </p>
                  ) : null}
                  <p className="font-mono text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {currentSteamId}
                  </p>
                </div>
                {Boolean(profileSteamId64) && currentSteamId !== profileSteamId64 && (
                  <Badge variant="secondary" className="ml-2">
                    {messages.components.skinplace.secondaryAccount}
                  </Badge>
                )}
              </div>
              
              {!showSteamIdInput ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSteamIdInput(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {messages.components.skinplace.changeAccount}
                  </Button>
                  {Boolean(profileSteamId64) && currentSteamId !== profileSteamId64 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSteamId}
                    >
                      {messages.components.skinplace.resetAccount}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 items-center w-full sm:w-auto">
                  <Input
                    placeholder="76561198123456789"
                    value={customSteamId}
                    onChange={(e) => setCustomSteamId(e.target.value)}
                    className={`flex-1 sm:w-64 ${
                      customSteamId && !customSteamInputLooksValid
                        ? 'border-destructive focus-visible:ring-destructive'
                        : customSteamInputLooksValid
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : ''
                    }`}
                  />
                  <Button
                    size="sm"
                    onClick={handleSteamIdChange}
                    disabled={!customSteamId || !customSteamInputLooksValid}
                  >
                    {messages.components.skinplace.loadButton}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSteamIdInput(false);
                      setCustomSteamId(currentSteamId);
                    }}
                  >
                    {messages.components.skinplace.cancelButton}
                  </Button>
                </div>
              )}
            </div>
            
            {showSteamIdInput && customSteamId && !customSteamInputLooksValid && (
              <p className="text-xs text-destructive mt-2">
                {messages.components.skinplace.identifierGate.invalidPaste}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques de l'inventaire */}
      {!isSellLayout && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">{messages.components.skinplace.tradableItems}</p>
                <p className="text-2xl font-bold">{stats.tradableItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{messages.components.skinplace.totalValue}</p>
                <ConvertedPrice 
                  usdCents={stats.totalValueCentimes}
                  className="text-2xl font-bold text-green-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-theme-accent" />
              <div>
                <p className="text-sm text-muted-foreground">{messages.components.skinplace.averageValue}</p>
                <ConvertedPrice 
                  usdCents={stats.averageValueCentimes}
                  className="text-2xl font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">{messages.components.skinplace.statTrak}</p>
                <p className="text-2xl font-bold">{stats.statTrakCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Contrôles et filtres */}
      <Card className={isSellLayout ? 'rounded-b-none shadow-sm py-0 gap-0' : undefined}>
        <CardHeader className={isSellLayout ? 'px-4 py-2.5 pb-1.5' : undefined}>
          <div className="md:flex items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className={`flex items-center gap-2 ${isSellLayout ? 'text-lg' : ''}`}>
                <Package className="h-5 w-5" />
                {messages.components.skinplace.yourInventory}
                {!isSellLayout && (
                  <Badge variant="secondary">{filteredItems.length} {messages.components.skinplace.items}</Badge>
                )}
              </CardTitle>
              {isSellLayout && (
                <p className="text-sm text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span>{stats.tradableItems} {messages.components.skinplace.items}</span>
                  <span aria-hidden>·</span>
                  <ConvertedPrice
                    usdCents={stats.totalValueCentimes}
                    className="font-semibold text-green-600 dark:text-green-400"
                  />
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {selectable && purchasableFiltered.length > 0 && (
                <Button
                  type="button"
                  variant={allPurchasableSelected ? 'outline' : 'ghost'}
                  size="sm"
                  className={allPurchasableSelected ? undefined : 'btn-select-all'}
                  onClick={handleToggleSelectAllPurchasable}
                >
                  {allPurchasableSelected
                    ? messages.components.skinplace.deselectAll
                    : messages.components.skinplace.selectAll}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {messages.components.skinplace.filters}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInventory(currentSteamId)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={`${isSellLayout ? 'px-4 pt-0 pb-2.5 space-y-2' : 'space-y-4'}`}>
          {/* Barre de recherche */}
          <div className={`${isSellLayout ? 'flex flex-col sm:flex-row' : 'md:flex grid'} items-center ${isSellLayout ? 'gap-2' : 'gap-3'}`}>
            <div className="flex-1">
              {!isSellLayout && <Label htmlFor="search">{messages.components.skinplace.search}</Label>}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={messages.components.skinplace.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className={`w-full ${isSellLayout ? 'sm:w-44' : 'sm:w-48'}`}>
              {!isSellLayout && <Label>{messages.components.skinplace.sortBy}</Label>}
              <Select value={sortBy} onValueChange={(value: 'value_desc' | 'value_asc' | 'rarity' | 'name') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value_desc">{messages.components.skinplace.priceDescending}</SelectItem>
                  <SelectItem value="value_asc">{messages.components.skinplace.priceAscending}</SelectItem>
                  <SelectItem value="rarity">{messages.components.skinplace.rarity}</SelectItem>
                  <SelectItem value="name">{messages.components.skinplace.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés - Prix et options */}
          {!isSellLayout && (
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Checkbox Purchasable Only */}
              <div className="flex items-start space-x-3 md:pt-2">
                <Checkbox
                  id="purchasable-only"
                  checked={purchasableOnly}
                  onCheckedChange={(checked) => setPurchasableOnly(checked === true)}
                  className="mt-1"
                />
                <div className="flex flex-col gap-1">
                  <Label htmlFor="purchasable-only" className="text-sm font-medium leading-none cursor-pointer">
                    {messages.components.skinplace.purchasableOnly}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {messages.components.skinplace.purchasableOnlyDesc}
                  </p>
                </div>
              </div>

              {/* Price Range */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  {messages.components.skinplace.priceRange}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={messages.components.skinplace.priceMin}
                    value={priceMinUsd}
                    onChange={(e) => setPriceMinUsd(e.target.value)}
                    className="flex-1"
                    aria-label={messages.components.skinplace.priceMin}
                  />
                  <span className="text-muted-foreground shrink-0 px-1">–</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder={messages.components.skinplace.priceMax}
                    value={priceMaxUsd}
                    onChange={(e) => setPriceMaxUsd(e.target.value)}
                    className="flex-1"
                    aria-label={messages.components.skinplace.priceMax}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {messages.components.skinplace.priceRangeHint}
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Filtres avancés */}
          {showFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 rounded-lg ${isSellLayout ? 'p-3' : 'p-4'}`}>
              <div>
                <Label>{messages.components.skinplace.rarity}</Label>
                <Select value={selectedRarity || "all"} onValueChange={(v) => setSelectedRarity(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={messages.components.skinplace.allRarities} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{messages.components.skinplace.allRarities}</SelectItem>
                    {availableRarities.map(rarity => (
                      <SelectItem key={rarity} value={rarity}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getRarityColor(rarity) }}
                          />
                          {rarity}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{messages.components.skinplace.exterior}</Label>
                <Select value={selectedExterior || "all"} onValueChange={(v) => setSelectedExterior(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={messages.components.skinplace.allExteriors} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{messages.components.skinplace.allExteriors}</SelectItem>
                    {availableExteriors.map(exterior => (
                      <SelectItem key={exterior} value={exterior}>
                        {exterior}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="stattrak"
                  checked={statTrakOnly}
                  onCheckedChange={(checked) => setStatTrakOnly(checked === true)}
                />
                <Label htmlFor="stattrak">{messages.components.skinplace.statTrakOnly}</Label>
              </div>
              
              <div className="md:col-span-3 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  {messages.components.skinplace.resetFilters}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grille des items avec scroll */}
      <Card className={isSellLayout ? 'rounded-t-none border-t-0 -mt-px shadow-sm py-0 gap-0' : undefined}>
        <CardContent className={isSellLayout ? 'px-3 py-2' : 'p-6'}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || selectedRarity || selectedExterior || statTrakOnly || purchasableOnly || priceMinUsd.trim() || priceMaxUsd.trim()
                ? messages.components.skinplace.noItemsFiltered
                : messages.components.skinplace.noTradableItems}
            </div>
          ) : (
            <div className="relative">
              <div className={`${isSellLayout ? 'inventory-container min-h-[360px]' : 'max-h-[600px]'} overflow-y-auto px-1 -mx-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent`}>
                <div className={`grid pb-4 ${isSellLayout ? 'mt-2' : 'mt-6'} ${
                  isSellLayout
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                }`}>
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  const isDisabled = !!item.skip_reason;
                  const skipCategory = getSkipReasonCategory(item.skip_reason);
                  const isOverstock = skipCategory === 'overstock';
                  const isLowPrice = skipCategory === 'low_price';
                  const needsSupport = isDisabled && !isOverstock;

                  // Couleur et libellé du badge selon la catégorie
                  const skipBadgeConfig: Record<string, { label: string; className: string }> = {
                    overstock:      { label: translateSkipReason(item.skip_reason), className: 'bg-gray-500 text-white' },
                    low_price:      { label: translateSkipReason(item.skip_reason), className: 'bg-primary text-primary-foreground' },
                    high_volatility:{ label: translateSkipReason(item.skip_reason), className: 'bg-red-500 text-white' },
                    unliquid:       { label: translateSkipReason(item.skip_reason), className: 'bg-yellow-500 text-white' },
                    trade_lock:     { label: translateSkipReason(item.skip_reason), className: 'bg-blue-500 text-white' },
                    other:          { label: translateSkipReason(item.skip_reason), className: 'bg-destructive text-white' },
                  };
                  const badgeCfg = skipCategory ? skipBadgeConfig[skipCategory] : null;
                  
                  return (
                    <Card
                      key={item.id}
                      className={`transition-all ${
                        !isDisabled ? 'hover:shadow-lg' : ''
                      } ${
                        selectable && !isDisabled ? 'cursor-pointer' : isDisabled ? 'cursor-not-allowed' : ''
                      } ${
                        selectable && isSelected
                          ? 'ring-2 ring-primary bg-theme-accent/5 dark:bg-theme-accent/10'
                          : ''
                      } ${
                        isDisabled ? 'opacity-60 bg-muted/50' : ''
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          {/* Image et badges */}
                          <div className="relative">
                            <SafeImg
                              src={item.icon_url}
                              alt={item.name}
                              className={`w-full h-20 object-contain mx-auto ${
                                isDisabled ? 'grayscale' : ''
                              }`}
                              fallbackClassName={`w-full h-20 ${isDisabled ? 'grayscale' : ''}`}
                              fallbackIcon={<Package className="w-10 h-10 text-muted-foreground" />}
                            />
                            {badgeCfg && (
                              <div className="absolute top-0 right-0">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeCfg.className}`}>
                                  {badgeCfg.label}
                                </span>
                              </div>
                            )}
                            {isDisabled && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded">
                                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Nom */}
                          <div>
                            <h3 className="font-medium text-sm truncate" title={item.name}>
                              {item.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.steam_short_name}
                            </p>
                          </div>
                          
                          {/* Badges de propriétés */}
                          <div className="flex flex-wrap gap-1">
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: getRarityColor(item.rarity),
                                color: 'white'
                              }}
                            >
                              {item.rarity}
                            </Badge>
                            {item.is_stattrak && (
                              <Badge variant="outline" className="text-xs">
                                {messages.components.skinplace.statTrak}
                              </Badge>
                            )}
                            {item.exterior && (
                              <Badge variant="outline" className="text-xs">
                                {item.shorten_exterior}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Prix + sélection */}
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
                                      usdCents={item.price_centimes + Math.round(item.price_centimes * bonusRatePercent / 100)}
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
                                  {messages.components.skinplace.unavailable}
                                </Badge>
                              )}
                            </div>
                            {selectable && isSelected && (
                              <span className="block w-full rounded bg-primary px-1.5 py-0.5 text-center text-[10px] font-medium leading-tight text-white">
                                {messages.components.skinplace.selected}
                              </span>
                            )}
                          </div>

                          {/* Bouton Ask Support : actif sauf pour prix trop bas */}
                          {needsSupport && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isLowPrice}
                              title={isLowPrice ? messages.components.skinplace.askSupportDisabled : undefined}
                              className={`w-full text-xs h-7 ${
                                isLowPrice
                                  ? 'opacity-50 cursor-not-allowed border-muted text-muted-foreground'
                                  : 'border-theme-accent/30 text-theme-accent hover:bg-theme-accent/5 dark:border-theme-accent/40 dark:text-theme-highlight dark:hover:bg-theme-accent/10'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isLowPrice) openSupportForItem(item);
                              }}
                            >
                              {messages.components.skinplace.askSupport}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </div>
              
              {/* Indicateur de scroll si nécessaire */}
              {filteredItems.length > 8 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none flex items-end justify-center pb-1">
                  <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
                    {messages.components.skinplace.scrollForMore}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé de sélection - Fixe en bas */}
      {selectable && selectedItems.length > 0 && !hideSelectionBar && (
        <Card className="bg-theme-accent/5 dark:bg-theme-accent/10 border-theme-accent/20 dark:border-theme-accent/30 sticky bottom-4 z-10 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-lg">
                  {selectedItems.length} {messages.components.skinplace.itemsSelected}
                </h3>
                <p className="text-muted-foreground">
                  {messages.components.skinplace.totalValueLabel} <span className="font-bold text-green-600">{convertedSelectedValue}</span>
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => { setSelectedItems([]); if (onSelectionChange) onSelectionChange([]); }}
                  className="flex-1 sm:flex-none"
                >
                  {messages.components.skinplace.deselectAll}
                </Button>
                <Button
                  onClick={() => {
                    if (selectedItemsData.length > 0 && onItemSelect) {
                      onItemSelect(selectedItemsData); // Passer tous les items sélectionnés
                    }
                  }}
                  disabled={selectedItems.length === 0}
                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                >
                  {messages.components.skinplace.continueWithSelection}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
