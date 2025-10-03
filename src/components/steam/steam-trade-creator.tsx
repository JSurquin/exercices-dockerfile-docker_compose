'use client';

import { useState } from 'react';
import { SteamInventoryItem } from '@/hooks/use-steam-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Handshake,
  Calculator,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface SteamTradeCreatorProps {
  steamId64: string;
  selectedItems: SteamInventoryItem[];
  onTradeCreated?: (tradeData: { 
    trade_id: string; 
    token: string; 
    status: string; 
    total_value: number; 
    net_value: number;
    fees: {
      cashout_fee: number;
      network_fee: number;
    };
    expires_at: Date;
  }) => void;
}

export function SteamTradeCreator({ 
  steamId64, 
  selectedItems, 
  onTradeCreated 
}: SteamTradeCreatorProps) {
  const [tradeUrl, setTradeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTradeUrl = (url: string) => {
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const calculateFees = (grossValue: number) => {
    // Frais de cashout: 0.5% selon les règles CTF
    const cashoutFee = Math.round(grossValue * 0.005);
    // Frais réseau: fixe ou variable selon le mode de paiement
    const networkFee = 200; // 2€ par défaut, à adapter selon le mode de paiement
    
    return {
      cashout_fee: cashoutFee,
      network_fee: networkFee,
      total_fees: cashoutFee + networkFee,
    };
  };

  const handleCreateTrade = async () => {
    if (!isValidUrl || selectedItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Calculer la valeur brute
      const grossValue = getTotalEstimatedValue();
      const fees = calculateFees(grossValue);
      const netValue = grossValue - fees.total_fees;

      if (netValue <= 0) {
        toast.error('La valeur nette après frais doit être positive');
        return;
      }

      // Créer le trade via notre API
      const response = await fetch('/api/steam/create-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId64,
          trade_url: tradeUrl,
          items: selectedItems.map(item => ({
            asset_id: item.assetid,
            icon_url: item.icon_url,
            rarity: item.rarity,
            class_id: item.classid,
            instance_id: item.instanceid,
            market_hash_name: item.market_hash_name,
            estimated_price: item.estimated_price || 0,
          })),
          gross_value: grossValue,
          fees: fees,
          net_value: netValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du trade');
      }

      const result = await response.json();
      
      if (result.success) {
        const tradeData = {
          trade_id: result.data.trade_id,
          token: result.data.token,
          status: result.data.status,
          total_value: grossValue,
          net_value: netValue,
          fees: {
            cashout_fee: fees.cashout_fee,
            network_fee: fees.network_fee,
          },
          expires_at: new Date(result.data.expires_at),
        };
        
        onTradeCreated?.(tradeData);
        toast.success('Trade créé avec succès !');
      } else {
        throw new Error(result.error || 'Erreur lors de la création du trade');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + '€';
  };

  const getTotalEstimatedValue = () => {
    return selectedItems.reduce((total, item) => total + (item.estimated_price || 0), 0);
  };

  const grossValue = getTotalEstimatedValue();
  const fees = calculateFees(grossValue);
  const netValue = grossValue - fees.total_fees;

  return (
    <div className="space-y-6">
      {/* Configuration du trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Créer votre vente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="trade-url">URL de Trade Steam</Label>
            <div className="space-y-2">
              <Input
                id="trade-url"
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                value={tradeUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={isValidUrl === false ? 'border-red-500' : ''}
              />
              {isValidUrl === false && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    URL de trade Steam invalide. 
                    <a 
                      href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline ml-1"
                    >
                      Obtenez votre URL ici
                    </a>
                  </AlertDescription>
                </Alert>
              )}
              {isValidUrl === true && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    URL de trade Steam valide ✓
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTrade}
              disabled={!isValidUrl || selectedItems.length === 0 || loading || netValue <= 0}
              className="flex-1"
            >
              {loading ? 'Création en cours...' : 'Créer la vente'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calcul des prix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcul de votre paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Items sélectionnés */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img 
                      src={item.icon_url} 
                      alt={item.name}
                      className="w-8 h-8 object-contain"
                    />
                    <span className="truncate">{item.name}</span>
                    {item.stat_trak && (
                      <Badge variant="outline" className="text-xs">ST</Badge>
                    )}
                  </div>
                  <span className="text-green-600 font-medium">
                    {formatPrice(item.estimated_price || 0)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Calculs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Valeur brute ({selectedItems.length} items)</span>
                <span className="font-medium">{formatPrice(grossValue)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  Frais de cashout (0,5%)
                </span>
                <span>-{formatPrice(fees.cashout_fee)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  Frais réseau
                </span>
                <span>-{formatPrice(fees.network_fee)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Vous recevrez</span>
                <span className={netValue > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPrice(netValue)}
                </span>
              </div>

              {netValue <= 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    La valeur nette est négative ou nulle. Sélectionnez des items de plus grande valeur.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded">
              <p className="mb-1">ℹ️ <strong>Délai de paiement :</strong> 7 jours (Trade Hold Steam)</p>
              <p>Le paiement sera automatiquement effectué après validation du trade par Steam.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
