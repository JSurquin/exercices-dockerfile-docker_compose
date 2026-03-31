'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSteamInventory, SteamInventoryItem } from '@/hooks/use-steam-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, DollarSign, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';

interface SteamInventoryViewerProps {
  steamId64: string;
  onItemSelect?: (item: SteamInventoryItem) => void;
  selectable?: boolean;
}

export function SteamInventoryViewer({ 
  steamId64, 
  onItemSelect, 
  selectable = false 
}: SteamInventoryViewerProps) {
  const { messages } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [inventory, setInventory] = useState<SteamInventoryItem[]>([]);
  const [estimatingPrices, setEstimatingPrices] = useState(false);
  
  const { 
    loading, 
    error, 
    getSteamInventory,
    estimateItemsPrices,
    enrichItems,
    isTradableAndMarketable
  } = useSteamInventory({
    onError: (err) => {
      console.error('Erreur Steam Inventory:', err);
      toast.error(`Erreur: ${err}`);
    },
  });

  const loadInventory = useCallback(async () => {
    console.log('loadInventory');
    console.log('steamId64', steamId64);
    const result = await getSteamInventory(steamId64);
    console.log('result', result);
    if (result?.success && result.items) {
      const enrichedItems = enrichItems(result.items);
      setInventory(enrichedItems);

      const tradableItems = enrichedItems.filter(isTradableAndMarketable);
      if (tradableItems.length > 0) {
        setEstimatingPrices(true);
        const priceResult = await estimateItemsPrices(tradableItems);
        if (priceResult?.items) {
          const updatedItems = enrichedItems.map(item => ({
            ...item,
            estimated_price: priceResult.items[item.market_hash_name as keyof typeof priceResult.items] || 0,
          }));
          setInventory(updatedItems as unknown as SteamInventoryItem[]);
        }
        setEstimatingPrices(false);
      }
    }
  }, [
    steamId64,
    getSteamInventory,
    enrichItems,
    estimateItemsPrices,
    isTradableAndMarketable,
  ]);

  useEffect(() => {
    if (steamId64) {
      void loadInventory();
    }
  }, [steamId64, loadInventory]);

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market_hash_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tradableItems = filteredItems.filter(isTradableAndMarketable);
  const totalEstimatedValue = tradableItems.reduce((sum, item) => sum + (item.estimated_price || 0), 0);

  const handleItemClick = (item: SteamInventoryItem) => {
    if (!selectable || !isTradableAndMarketable(item)) return;

    if (selectedItems.includes(item.id)) {
      setSelectedItems(prev => prev.filter(id => id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, item.id]);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + '€';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'Consumer Grade': 'bg-gray-500',
      'Industrial Grade': 'bg-blue-500',
      'Mil-Spec Grade': 'bg-purple-500',
      'Restricted': 'bg-pink-500',
      'Classified': 'bg-orange-500',
      'Covert': 'bg-red-500',
      'Contraband': 'bg-yellow-500',
    };
    return colors[rarity] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Chargement de votre inventaire Steam...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Votre inventaire CS2
            {estimatingPrices && (
              <Badge variant="secondary" className="ml-2">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Estimation des prix...
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInventory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={messages.components.steam.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              {tradableItems.length} items vendables
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(totalEstimatedValue)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Aucun item trouvé' : 'Aucun item CS2 dans votre inventaire'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isItemTradable = isTradableAndMarketable(item);
              const isSelected = selectedItems.includes(item.id);
              
              return (
                <Card
                  key={item.id}
                  className={`transition-all hover:shadow-md ${
                    !isItemTradable 
                      ? 'opacity-50 cursor-not-allowed' 
                      : selectable 
                        ? 'cursor-pointer' 
                        : ''
                  } ${
                    selectable && isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                      : ''
                  }`}
                  onClick={() => isItemTradable && handleItemClick(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img
                          src={item.icon_url}
                          alt={item.name}
                          className="w-16 h-16 object-contain"
                        />
                        {!isItemTradable && (
                          <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.market_hash_name}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.rarity && (
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getRarityColor(item.rarity)} text-white`}
                            >
                              {item.rarity}
                            </Badge>
                          )}
                          {item.stat_trak && (
                            <Badge variant="outline" className="text-xs">
                              StatTrak™
                            </Badge>
                          )}
                          {item.exterior && (
                            <Badge variant="outline" className="text-xs">
                              {item.exterior}
                            </Badge>
                          )}
                          {!isItemTradable && (
                            <Badge variant="destructive" className="text-xs">
                              Non tradable
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          {item.estimated_price && item.estimated_price > 0 ? (
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(item.estimated_price)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {estimatingPrices ? 'Estimation...' : 'Prix non disponible'}
                            </span>
                          )}
                          {selectable && isSelected && (
                            <Badge className="bg-blue-500 text-white">
                              Sélectionné
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {selectable && selectedItems.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  {selectedItems.length} item(s) sélectionné(s)
                </span>
                <div className="text-sm text-muted-foreground">
                  Valeur estimée: {formatPrice(
                    inventory
                      .filter(item => selectedItems.includes(item.id))
                      .reduce((sum, item) => sum + (item.estimated_price || 0), 0)
                  )}
                </div>
              </div>
              <Button
                onClick={() => {
                  const selectedItemsData = inventory.filter(item => 
                    selectedItems.includes(item.id)
                  );
                  if (selectedItemsData.length > 0) {
                    onItemSelect?.(selectedItemsData[0]); // Pour l'exemple, on prend le premier
                  }
                }}
                disabled={selectedItems.length === 0}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
