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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<NormalizedInventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<NormalizedInventoryItem[]>([]);
  
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
    formatPrice,
    getRarityColor,
  } = useSkinplaceInventory({
    onError: (err) => {
      console.error('Erreur Skinplace Inventory:', err);
      toast.error(`Erreur: ${err}`);
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

  // Obtenir les options de filtre uniques
  const availableRarities = Array.from(new Set(tradableItems.map(item => item.rarity))).sort();
  const availableExteriors = Array.from(new Set(tradableItems.map(item => item.exterior).filter(Boolean))).sort();

  const handleItemClick = (item: NormalizedInventoryItem) => {
    if (!selectable || !item.tradable) return;

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
            Chargement de votre inventaire...
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
              Votre inventaire Steam est privé. 
              <a 
                href="https://steamcommunity.com/my/edit/settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-1"
              >
                Rendez-le public pour continuer
              </a>
            </>
          ) : (
            `Erreur: ${error}`
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques de l'inventaire */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Items tradables</p>
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
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.totalValueCentimes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                <p className="text-2xl font-bold">
                  {formatPrice(stats.averageValueCentimes)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">StatTrak™</p>
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
              Votre inventaire CS2
              <Badge variant="secondary">{filteredItems.length} items</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
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
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher un skin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label>Trier par</Label>
              <Select value={sortBy} onValueChange={(value: 'value' | 'rarity' | 'name') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Prix (décroissant)</SelectItem>
                  <SelectItem value="rarity">Rareté</SelectItem>
                  <SelectItem value="name">Nom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Rareté</Label>
                <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les raretés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les raretés</SelectItem>
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
                    <SelectValue placeholder="Tous les exteriors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les exteriors</SelectItem>
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
                <Label htmlFor="stattrak">StatTrak™ uniquement</Label>
              </div>
              
              <div className="md:col-span-3 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grille des items */}
      <Card>
        <CardContent className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || selectedRarity || selectedExterior || statTrakOnly ? 
                'Aucun item ne correspond aux filtres' : 
                'Aucun item CS2 tradable dans votre inventaire'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                
                return (
                  <Card
                    key={item.id}
                    className={`transition-all hover:shadow-lg ${
                      selectable ? 'cursor-pointer' : ''
                    } ${
                      selectable && isSelected
                        ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950'
                        : ''
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
                            className="w-full h-24 object-contain mx-auto"
                          />
                          {item.skip_reason && (
                            <div className="absolute top-0 right-0">
                              <Badge variant="destructive" className="text-xs">
                                {item.skip_reason}
                              </Badge>
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
                              StatTrak™
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
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(item.price_centimes)}
                          </span>
                          {selectable && isSelected && (
                            <Badge className="bg-orange-500 text-white">
                              Sélectionné
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé de sélection */}
      {selectable && selectedItems.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg">
                  {selectedItems.length} item(s) sélectionné(s)
                </h3>
                <p className="text-muted-foreground">
                  Valeur totale: <span className="font-bold text-green-600">{formatPrice(selectedValue)}</span>
                </p>
              </div>
              <Button
                onClick={() => {
                  if (selectedItemsData.length > 0 && onItemSelect) {
                    onItemSelect(selectedItemsData); // Passer tous les items sélectionnés
                  }
                }}
                disabled={selectedItems.length === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Continuer avec la sélection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
