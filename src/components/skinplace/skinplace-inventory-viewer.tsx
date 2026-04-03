'use client';

import { useState, useEffect } from 'react';
import { useSkinplaceInventory, NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { useCurrency } from '@/components/providers/currency-provider';
import { currencyConverter } from '@/lib/currency-converter';

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
  steamId64: string;
  /** Identité Steam du compte MoonSkin (affichée seulement si currentSteamId === steamId64) */
  linkedSteamIdentity?: { name: string; avatarUrl: string };
  onItemSelect?: (items: NormalizedInventoryItem[]) => void;
  selectable?: boolean;
  allowSteamIdChange?: boolean;
  onSteamIdChange?: (newSteamId: string) => void;
}

export function SkinplaceInventoryViewer({ 
  steamId64,
  linkedSteamIdentity,
  onItemSelect, 
  selectable = false,
  allowSteamIdChange = false,
  onSteamIdChange
}: SkinplaceInventoryViewerProps) {
  const { messages } = useLocale();
  const { selectedCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<NormalizedInventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NormalizedInventoryItem[]>([]);
  const [convertedSelectedValue, setConvertedSelectedValue] = useState<string>('');
  
  // Steam ID change functionality
  const [showSteamIdInput, setShowSteamIdInput] = useState(false);
  const [customSteamId, setCustomSteamId] = useState(steamId64);
  const [currentSteamId, setCurrentSteamId] = useState(steamId64);
  
  // Filtres
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedExterior, setSelectedExterior] = useState<string>('');
  const [statTrakOnly, setStatTrakOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'rarity' | 'name'>('value_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [purchasableOnly, setPurchasableOnly] = useState(false);
  const [priceMinUsd, setPriceMinUsd] = useState('');
  const [priceMaxUsd, setPriceMaxUsd] = useState('');
  
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
      toast.error(`${messages.components.skinplace.error} ${err}`);
    },
  });

  const loadInventory = async (steamIdToLoad?: string) => {
    const idToUse = steamIdToLoad || currentSteamId;
    console.log('Chargement inventaire Skin.place pour:', idToUse);
    const result = await getSkinplaceInventory(idToUse);
    
    if (result?.success && result.items) {
      setInventory(result.items);
      console.log(`Inventaire chargé: ${result.items.length} items, ${result.tradable_count} tradables`);
    }
  };

  // Validate Steam ID format
  const validateSteamId64 = (id: string): boolean => {
    const steamId64Regex = /^7656119[0-9]{10}$/;
    return steamId64Regex.test(id);
  };

  // Handle Steam ID change
  const handleSteamIdChange = () => {
    if (!validateSteamId64(customSteamId)) {
      toast.error(messages.settings?.steamId?.invalidFormat || 'Format Steam ID invalide');
      return;
    }
    
    setCurrentSteamId(customSteamId);
    setShowSteamIdInput(false);
    setSelectedItems([]); // Reset selection when changing Steam ID
    onSteamIdChange?.(customSteamId);
    loadInventory(customSteamId);
  };

  // Reset to original Steam ID
  const handleResetSteamId = () => {
    setCustomSteamId(steamId64);
    setCurrentSteamId(steamId64);
    setShowSteamIdInput(false);
    setSelectedItems([]);
    onSteamIdChange?.(steamId64);
    loadInventory(steamId64);
  };

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...inventory];
    
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
    
    // Ne garder que les items tradables
    filtered = filterTradableItems(filtered);
    
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
  }, [inventory, searchTerm, selectedRarity, selectedExterior, statTrakOnly, sortBy, purchasableOnly, priceMinUsd, priceMaxUsd, filterBySearch, filterByRarity, filterByExterior, filterByStatTrak, filterTradableItems, sortItemsByValue, sortItemsByRarity]);

  useEffect(() => {
    if (currentSteamId) {
      loadInventory(currentSteamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSteamId]);

  // Sync when steamId64 prop changes
  useEffect(() => {
    if (steamId64 !== currentSteamId && !showSteamIdInput) {
      setCurrentSteamId(steamId64);
      setCustomSteamId(steamId64);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steamId64]);

  const stats = calculateInventoryStats(inventory);
  const tradableItems = filterTradableItems(inventory);
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
  const availableRarities = Array.from(new Set(tradableItems.map(item => item.rarity))).sort();
  const availableExteriors = Array.from(new Set(tradableItems.map(item => item.exterior).filter(Boolean))).sort();

  const handleItemClick = (item: NormalizedInventoryItem) => {
    if (!selectable || !item.tradable || item.skip_reason) return;

    if (selectedItems.includes(item.id)) {
      setSelectedItems(prev => prev.filter(id => id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item.id]);
    }
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

  const handleSelectAllPurchasable = () => {
    setSelectedItems(filteredItems.filter(isPurchasable).map((i) => i.id));
  };

  const openSupportForItem = (item: NormalizedInventoryItem) => {
    const reason = translateSkipReason(item.skip_reason);
    const template = messages.components?.skinplace?.blockedItemMessage
      ?? "Mon skin {name} est bloqué ({reason}), pouvez-vous m'aider ?";
    const prefillMessage = template
      .replace('{name}', item.name)
      .replace('{reason}', reason);
    window.dispatchEvent(new CustomEvent('open-support-chat', { detail: { prefillMessage } }));
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const isPrivateError = error === 'Inventaire privé ou inaccessible';
    const isNotFoundError = error.includes('introuvable') || error.includes('not found');
    
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
                  ? (messages.components?.skinplace?.inventoryPrivate || 'Inventaire privé') 
                  : isNotFoundError 
                    ? 'Steam ID introuvable'
                    : (messages.components?.skinplace?.error || 'Erreur')}
              </CardTitle>
              <CardDescription className="text-destructive/80">
                {isPrivateError 
                  ? 'Votre inventaire Steam doit être public pour être chargé'
                  : isNotFoundError
                    ? 'Le Steam ID spécifié ne correspond à aucun compte'
                    : error}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Solutions proposées */}
          <div className="space-y-3">
            {isPrivateError && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                  Rendez votre inventaire public
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Allez dans les paramètres de confidentialité Steam et définissez votre inventaire comme &quot;Public&quot;.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://steamcommunity.com/my/edit/settings', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir les paramètres Steam
                </Button>
              </div>
            )}
            
            {(isPrivateError || isNotFoundError) && allowSteamIdChange && (
              <div className="bg-background rounded-lg p-4 border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                    {isPrivateError ? '2' : '1'}
                  </span>
                  Essayer un autre Steam ID
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Si vous avez plusieurs comptes Steam, vous pouvez charger l&apos;inventaire d&apos;un autre compte.
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
                    Charger
                  </Button>
                </div>
              </div>
            )}
            
            <div className="bg-background rounded-lg p-4 border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                  {isPrivateError && allowSteamIdChange ? '3' : isNotFoundError && allowSteamIdChange ? '2' : '1'}
                </span>
                Réessayer
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Parfois Steam peut être temporairement indisponible. Essayez de recharger.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInventory(currentSteamId)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Chargement...' : 'Réessayer'}
              </Button>
            </div>
          </div>

          {/* Info Steam ID actuel */}
          <div className="flex items-center gap-2 pt-2 border-t text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Steam ID utilisé: <code className="bg-muted px-1 rounded">{currentSteamId}</code></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-24">

      {/* Header avec option de changer le Steam ID */}
      {allowSteamIdChange && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {linkedSteamIdentity && currentSteamId === steamId64 && linkedSteamIdentity.avatarUrl ? (
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
                  <p className="text-sm text-muted-foreground">Inventaire chargé pour</p>
                  {linkedSteamIdentity && currentSteamId === steamId64 && linkedSteamIdentity.name ? (
                    <p className="font-semibold text-sm truncate" title={linkedSteamIdentity.name}>
                      {linkedSteamIdentity.name}
                    </p>
                  ) : null}
                  <p className="font-mono text-xs sm:text-sm font-medium text-muted-foreground truncate">
                    {currentSteamId}
                  </p>
                </div>
                {currentSteamId !== steamId64 && (
                  <Badge variant="secondary" className="ml-2">
                    Compte secondaire
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
                    Changer de compte
                  </Button>
                  {currentSteamId !== steamId64 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetSteamId}
                    >
                      Réinitialiser
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
                      customSteamId && !validateSteamId64(customSteamId) 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : customSteamId && validateSteamId64(customSteamId)
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : ''
                    }`}
                  />
                  <Button
                    size="sm"
                    onClick={handleSteamIdChange}
                    disabled={!customSteamId || !validateSteamId64(customSteamId)}
                  >
                    Charger
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSteamIdInput(false);
                      setCustomSteamId(currentSteamId);
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </div>
            
            {showSteamIdInput && customSteamId && !validateSteamId64(customSteamId) && (
              <p className="text-xs text-destructive mt-2">
                Le Steam ID doit être au format 64-bit (commence par 7656119 suivi de 10 chiffres)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques de l'inventaire */}
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
              <TrendingUp className="h-5 w-5 text-orange-500" />
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

      {/* Contrôles et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {messages.components.skinplace.yourInventory}
              <Badge variant="secondary">{filteredItems.length} {messages.components.skinplace.items}</Badge>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {selectable && filteredItems.some(isPurchasable) && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAllPurchasable}
                >
                  {messages.components.skinplace.selectAll}
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
        
        <CardContent className="space-y-4">
          {/* Barre de recherche */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">{messages.components.skinplace.search}</Label>
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
            
            <div className="w-full sm:w-48">
              <Label>{messages.components.skinplace.sortBy}</Label>
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

          <div className="flex flex-col gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex items-center space-x-2 sm:pt-0.5">
              <Checkbox
                id="purchasable-only"
                checked={purchasableOnly}
                onCheckedChange={(checked) => setPurchasableOnly(checked === true)}
              />
              <Label htmlFor="purchasable-only" className="text-sm font-normal leading-snug cursor-pointer">
                {messages.components.skinplace.purchasableOnly}
              </Label>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[260px]">
              <Label className="text-sm">{messages.components.skinplace.priceRange}</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={messages.components.skinplace.priceMin}
                  value={priceMinUsd}
                  onChange={(e) => setPriceMinUsd(e.target.value)}
                  className="min-w-[6rem] flex-1 sm:max-w-[8rem]"
                  aria-label={messages.components.skinplace.priceMin}
                />
                <span className="text-muted-foreground shrink-0">–</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={messages.components.skinplace.priceMax}
                  value={priceMaxUsd}
                  onChange={(e) => setPriceMaxUsd(e.target.value)}
                  className="min-w-[6rem] flex-1 sm:max-w-[8rem]"
                  aria-label={messages.components.skinplace.priceMax}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {messages.components.skinplace.priceRangeHint}
              </p>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
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
      <Card>
        <CardContent className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || selectedRarity || selectedExterior || statTrakOnly || purchasableOnly || priceMinUsd.trim() || priceMaxUsd.trim()
                ? messages.components.skinplace.noItemsFiltered
                : messages.components.skinplace.noTradableItems}
            </div>
          ) : (
            <div className="relative">
              <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  const isDisabled = !!item.skip_reason;
                  const skipCategory = getSkipReasonCategory(item.skip_reason);
                  const isOverstock = skipCategory === 'overstock';
                  const needsSupport = isDisabled && !isOverstock;

                  // Couleur et libellé du badge selon la catégorie
                  const skipBadgeConfig: Record<string, { label: string; className: string }> = {
                    overstock:      { label: translateSkipReason(item.skip_reason), className: 'bg-gray-500 text-white' },
                    low_price:      { label: translateSkipReason(item.skip_reason), className: 'bg-orange-500 text-white' },
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
                          ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950'
                          : ''
                      } ${
                        isDisabled ? 'opacity-60 bg-muted/50' : ''
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Image et badges */}
                          <div className="relative">
                            <img
                              src={item.icon_url}
                              alt={item.name}
                              className={`w-full h-24 object-contain mx-auto ${
                                isDisabled ? 'grayscale' : ''
                              }`}
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
                          
                          {/* Prix + actions */}
                          <div className="flex items-center justify-between gap-2">
                            <ConvertedPrice 
                              usdCents={item.price_centimes}
                              className={`text-lg font-bold ${
                                isDisabled ? 'text-muted-foreground' : 'text-green-600'
                              }`}
                              showOriginal={false}
                            />
                            {selectable && isSelected && (
                              <Badge className="bg-orange-500 text-white">
                                {messages.components.skinplace.selected}
                              </Badge>
                            )}
                            {isOverstock && (
                              <Badge variant="secondary" className="text-xs">
                                {messages.components.skinplace.unavailable}
                              </Badge>
                            )}
                          </div>

                          {/* Bouton Ask Support pour low_price, high_price, unliquid */}
                          {needsSupport && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSupportForItem(item);
                              }}
                            >
                              {messages.components?.skinplace?.askSupport ?? 'Ask support'}
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
      {selectable && selectedItems.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 sticky bottom-4 z-10 shadow-lg">
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
                  onClick={() => setSelectedItems([])}
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
                  className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none"
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
