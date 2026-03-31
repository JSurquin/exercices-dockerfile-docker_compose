'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSkinplace } from '@/hooks/use-skinplace';
import { SkinplaceInventoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, DollarSign } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface InventoryViewerProps {
  steamId: string;
  onItemSelect?: (item: SkinplaceInventoryItem) => void;
  selectable?: boolean;
}

export function InventoryViewer({ 
  steamId, 
  onItemSelect, 
  selectable = false 
}: InventoryViewerProps) {
  const { messages } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { 
    loading, 
    error, 
    getInventory 
  } = useSkinplace({
    onError: (err) => console.error('Erreur Skinplace:', err),
  });

  const [inventory, setInventory] = useState<SkinplaceInventoryItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  const loadInventory = useCallback(async () => {
    const result = await getInventory(steamId);
    if (result?.success && result.data) {
      setInventory(result.data.items);
      setTotalValue(result.data.total_value);
    }
  }, [steamId, getInventory]);

  useEffect(() => {
    if (steamId) {
      void loadInventory();
    }
  }, [steamId, loadInventory]);

  const filteredItems = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market_hash_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemClick = (item: SkinplaceInventoryItem) => {
    if (!selectable) return;

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
                Chargement de l&apos;inventaire...
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
        <AlertDescription>
          Erreur lors du chargement de l&apos;inventaire: {error.error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Inventaire Steam
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
                placeholder={messages.components.skinplace.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Valeur totale</div>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(totalValue)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Aucun item trouvé' : 'Inventaire vide'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectable && selectedItems.includes(item.id)
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                    : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.icon_url}
                      alt={item.name}
                      className="w-16 h-16 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.market_hash_name}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRarityColor(item.rarity)} text-white`}
                        >
                          {item.rarity}
                        </Badge>
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
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(item.price)}
                        </span>
                        {selectable && selectedItems.includes(item.id) && (
                          <Badge className="bg-blue-500 text-white">
                            Sélectionné
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {selectable && selectedItems.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedItems.length} item(s) sélectionné(s)
              </span>
              <Button
                onClick={() => {
                  const selectedItemsData = inventory.filter(item => 
                    selectedItems.includes(item.id)
                  );
                  onItemSelect?.(selectedItemsData[0]); // Pour l'exemple, on prend le premier
                }}
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
