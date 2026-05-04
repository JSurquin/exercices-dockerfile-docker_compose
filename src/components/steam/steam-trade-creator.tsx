'use client';

import { useState } from 'react';
import { SteamInventoryItem } from '@/hooks/use-steam-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeImg } from '@/components/ui/safe-image';
import { Package } from 'lucide-react';
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
import { useLocale } from '@/components/providers/locale-provider';
import { usePlatformSettings } from '@/hooks/use-platform-settings';
import { useAuth } from '@/components/providers/auth-provider';

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
  const { user } = useAuth();
  const { messages } = useLocale();
  const { data: platformSettings } = usePlatformSettings();
  const [tradeUrl, setTradeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateTradeUrl = (url: string) => {
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const calculateFees = (grossValue: number) => {
    const cashoutRate = platformSettings?.cashoutFeeRate ?? 0.005;
    const indicativePayoutFeesCentimes = platformSettings?.networkFeeCentimes ?? 200;
    const cashoutFee = Math.round(grossValue * cashoutRate);

    return {
      cashout_fee: cashoutFee,
      indicative_payout_fees_centimes: indicativePayoutFeesCentimes,
      net_credited_centimes: grossValue - cashoutFee,
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
      const netValue = fees.net_credited_centimes;

      if (netValue <= 0) {
        toast.error(messages.tradeCreator.negativeNetValue);
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
          fees: {
            cashout_fee: fees.cashout_fee,
            network_fee: 0,
            total_fees: fees.cashout_fee,
          },
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
            network_fee: 0,
          },
          expires_at: new Date(result.data.expires_at),
        };
        
        onTradeCreated?.(tradeData);
        toast.success(messages.tradeCreator.tradeCreatedSuccess);
      } else {
        throw new Error(result.error || messages.tradeCreator.tradeCreationError);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(errorMessage || messages.tradeCreator.tradeCreationError);
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
  const vipBonusPreview = Math.round(grossValue * (user?.bonusRatePercent ?? 0) / 100);
  const netValue = fees.net_credited_centimes + vipBonusPreview;
  const cashoutPercentDisplay = ((platformSettings?.cashoutFeeRate ?? 0.005) * 100).toFixed(2);

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
                    <SafeImg
                      src={item.icon_url} 
                      alt={item.name}
                      className="w-8 h-8 object-contain"
                      fallbackClassName="w-8 h-8"
                      fallbackIcon={<Package className="w-4 h-4" />}
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
                <span className="text-sm">{messages.tradeCreator.grossValue.replace('{count}', selectedItems.length.toString())}</span>
                <span className="font-medium">{formatPrice(grossValue)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  {messages.tradeCreator.cashoutFeesLabel.replace("{percent}", cashoutPercentDisplay)}
                </span>
                <span>-{formatPrice(fees.cashout_fee)}</span>
              </div>

              {vipBonusPreview > 0 && (
                <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    + Bonus {user?.userTag || 'VIP'} (+{user?.bonusRatePercent}%)
                  </span>
                  <span>+{formatPrice(vipBonusPreview)}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground border border-dashed border-muted-foreground/25 rounded-md p-2">
                <span className="text-left">{messages.tradeCreator.payoutFeesIndicativeLine}</span>
                <span className="shrink-0 font-medium text-foreground/80 tabular-nums">
                  ~{formatPrice(fees.indicative_payout_fees_centimes)}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>{messages.tradeCreator.youReceive}</span>
                <span className={netValue > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPrice(netValue)}
                </span>
              </div>

              {netValue <= 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {messages.tradeCreator.negativeNetAlert}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <p className="text-xs text-muted-foreground px-1">{messages.tradeCreator.tradeFeesFootnote}</p>

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
