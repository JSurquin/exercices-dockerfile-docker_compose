'use client';

import { useState, useEffect } from 'react';
import { useSkinplaceInventory, NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  RefreshCw, 
  DollarSign, 
  Package, 
  AlertCircle, 
  Filter,
  TrendingUp,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { useCurrency } from '@/components/providers/currency-provider';
import { currencyConverter } from '@/lib/currency-converter';

interface SkinplaceInventoryViewerProps {
  steamId64: string;
  onItemSelect?: (items: NormalizedInventoryItem[]) => void;
  selectable?: boolean;
}

export function SkinplaceInventoryViewer({ 
  steamId64, 
  onItemSelect, 
  selectable = false 
}: SkinplaceInventoryViewerProps) {
  const { messages } = useLocale();
  const { selectedCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<NormalizedInventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NormalizedInventoryItem[]>([]);
  const [convertedSelectedValue, setConvertedSelectedValue] = useState<string>('');
  
  // Filtres
  const [selectedRarity, setSelectedRarity] = useState<string>('');
  const [selectedExterior, setSelectedExterior] = useState<string>('');
  const [statTrakOnly, setStatTrakOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'rarity' | 'name'>('value');
  const [showFilters, setShowFilters] = useState(false);
  
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
  } = useSkinplaceInventory({
    onError: (err) => {
      console.error('Erreur Skinplace Inventory:', err);
      toast.error(`${messages.components.skinplace.error} ${err}`);
    },
  });

  const loadInventory = async () => {
    console.log('Chargement inventaire Skin.place pour:', steamId64);
    const result = await getSkinplaceInventory(steamId64);
    
    if (result?.success && result.items) {
      setInventory(result.items);
      console.log(`Inventaire chargé: ${result.items.length} items, ${result.tradable_count} tradables`);
    }
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
    
    // Ne garder que les items tradables
    filtered = filterTradableItems(filtered);
    
    // Trier
    switch (sortBy) {
      case 'value':
        filtered = sortItemsByValue(filtered, false); // Du plus cher au moins cher
        break;
      case 'rarity':
        filtered = sortItemsByRarity(filtered);
        break;
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    setFilteredItems(filtered);
  }, [inventory, searchTerm, selectedRarity, selectedExterior, statTrakOnly, sortBy, filterBySearch, filterByRarity, filterByExterior, filterByStatTrak, filterTradableItems, sortItemsByValue, sortItemsByRarity]);

  useEffect(() => {
    if (steamId64) {
      loadInventory();
    }
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
    setSortBy('value');
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
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error === 'Inventaire privé ou inaccessible' ? (
            <>
              {messages.components.skinplace.inventoryPrivate} 
              <a 
                href="https://steamcommunity.com/my/edit/settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                {messages.components.skinplace.makePublic}
              </a>
            </>
          ) : (
            `${messages.components.skinplace.error} ${error}`
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-24">

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
            <div className="flex items-center gap-2">
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
                onClick={loadInventory}
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
            
            <div className="w-48">
              <Label>{messages.components.skinplace.sortBy}</Label>
              <Select value={sortBy} onValueChange={(value: 'value' | 'rarity' | 'name') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">{messages.components.skinplace.priceDescending}</SelectItem>
                  <SelectItem value="rarity">{messages.components.skinplace.rarity}</SelectItem>
                  <SelectItem value="name">{messages.components.skinplace.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>{messages.components.skinplace.rarity}</Label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder={messages.components.skinplace.allRarities} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{messages.components.skinplace.allRarities}</SelectItem>
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
                <Label>Exterior</Label>
                <Select value={selectedExterior} onValueChange={setSelectedExterior}>
                  <SelectTrigger>
                    <SelectValue placeholder={messages.components.skinplace.allExteriors} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{messages.components.skinplace.allExteriors}</SelectItem>
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
              {searchTerm || selectedRarity || selectedExterior || statTrakOnly ? 
                messages.components.skinplace.noItemsFiltered : 
                messages.components.skinplace.noTradableItems
              }
            </div>
          ) : (
            <div className="relative">
              <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  const isDisabled = !!item.skip_reason;
                  
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
                            {item.skip_reason && (
                              <div className="absolute top-0 right-0">
                                <Badge variant="destructive" className="text-xs">
                                  {translateSkipReason(item.skip_reason)}
                                </Badge>
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
                          
                          {/* Prix */}
                          <div className="flex items-center justify-between">
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
                            {isDisabled && (
                              <Badge variant="secondary" className="text-xs">
                                {messages.components.skinplace.unavailable}
                              </Badge>
                            )}
                          </div>
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
