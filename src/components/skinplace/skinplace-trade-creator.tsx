'use client';

import { useState } from 'react';
import { NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
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
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';

export interface SkinplaceBotInfo {
  name: string;
  avatar: string;
  profile_url: string;
  level: string;
  registration_date: string;
  steamid: string;
}

export interface TradeCreatedData {
  trade_id: string;
  token: string;
  status: string;
  total_value: number;
  net_value: number;
  fees: { cashout_fee: number; network_fee: number };
  expires_at: Date;
  bot: SkinplaceBotInfo | null;
}

interface SkinplaceTradeCreatorProps {
  steamId64: string;
  selectedItems: NormalizedInventoryItem[];
  onTradeCreated?: (tradeData: TradeCreatedData) => void;
}

export function SkinplaceTradeCreator({ 
  steamId64, 
  selectedItems, 
  onTradeCreated 
}: SkinplaceTradeCreatorProps) {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || '');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(user?.tradeLink ? true : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTradeLink, setIsEditingTradeLink] = useState(!user?.tradeLink);

  const validateTradeUrl = (url: string) => {
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const handleSaveTradeLink = async () => {
    if (!isValidUrl || !tradeUrl) {
      toast.error(messages.tradeCreator.invalidTradeLink);
      return;
    }

    setLoading(true);
    try {
      await updateUser({ tradeLink: tradeUrl });
      setIsEditingTradeLink(false);
      toast.success(messages.tradeCreator.tradeLinkSaved);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du Trade Link:', error);
      toast.error(messages.tradeCreator.tradeLinkError);
    } finally {
      setLoading(false);
    }
  };

  const calculateFees = (grossValueCentimes: number) => {
    // Frais de cashout: 0.5% selon les règles CTF (masqués pour l'instant)
    const cashoutFee = Math.round(grossValueCentimes * 0.005);
    // Frais réseau: fixe ou variable selon le mode de paiement
    const networkFee = 200; // 2€ par défaut, à adapter selon le mode de paiement
    
    return {
      cashout_fee: cashoutFee,
      network_fee: networkFee,
      total_fees: networkFee, // On ne compte que les frais réseau pour l'affichage
    };
  };

  const handleCreateTrade = async () => {
    if (!isValidUrl || selectedItems.length === 0) return;

    console.log('🎯 Création du trade avec', selectedItems.length, 'items sélectionnés:');
    selectedItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (${item.assetid}) - ${(item.price_centimes / 100).toFixed(2)} USD`);
    });

    setLoading(true);
    setError(null);

    try {
      // Calculer la valeur brute en centimes
      const grossValueCentimes = getTotalEstimatedValueCentimes();
      const displayFees = calculateFees(grossValueCentimes); // Frais pour l'affichage (sans cashout)
      const netValueCentimes = grossValueCentimes - displayFees.total_fees;

      // Calculer les vrais frais pour l'API (avec cashout)
      const realFees = {
        cashout_fee: Math.round(grossValueCentimes * 0.005), // 0.5% cashout
        network_fee: 200, // 2€ frais réseau
        total_fees: Math.round(grossValueCentimes * 0.005) + 200,
      };
      const realNetValueCentimes = grossValueCentimes - realFees.total_fees;

      if (netValueCentimes <= 0) {
        toast.error(messages.tradeCreator.negativeNetValue);
        return;
      }

      // Créer le trade via notre API Skinplace
      const response = await fetch('/api/skinplace/create-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId64,
          trade_url: tradeUrl,
          items: selectedItems.map(item => ({
            asset_id: item.assetid,
            market_hash_name: item.market_hash_name,
            icon_url: item.icon_url,
            rarity: item.rarity,
            exterior: item.exterior,
            is_stattrak: item.is_stattrak,
            is_souvenir: item.is_souvenir,
            price_centimes: item.price_centimes,
          })),
          gross_value_centimes: grossValueCentimes,
          fees: realFees, // Envoyer les vrais frais à l'API
          net_value_centimes: realNetValueCentimes, // Vraie valeur nette
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du trade');
      }

      const result = await response.json();
      
      if (result.success) {
        const tradeData: TradeCreatedData = {
          trade_id: result.data.trade_id,
          token: result.data.token,
          status: result.data.status,
          total_value: grossValueCentimes,
          net_value: realNetValueCentimes,
          fees: {
            cashout_fee: realFees.cashout_fee,
            network_fee: realFees.network_fee,
          },
          expires_at: new Date(result.data.expires_at),
          bot: result.data.bot || null,
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

  const getTotalEstimatedValueCentimes = () => {
    return selectedItems.reduce((total, item) => total + item.price_centimes, 0);
  };

  const grossValueCentimes = getTotalEstimatedValueCentimes();
  const fees = calculateFees(grossValueCentimes);
  const netValueCentimes = grossValueCentimes - fees.total_fees;

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
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="trade-url">URL de Trade Steam</Label>
              {user?.tradeLink && !isEditingTradeLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingTradeLink(true)}
                >
                  Modifier
                </Button>
              )}
            </div>
            
            {!isEditingTradeLink && user?.tradeLink ? (
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">Trade Link configuré :</p>
                  <p className="text-sm font-mono break-all">{user.tradeLink}</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Trade Link configuré et valide ✓
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="trade-url"
                    placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                    value={tradeUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={isValidUrl === false ? 'border-red-500' : ''}
                  />
                  {isEditingTradeLink && (
                    <div className="flex gap-1">
                      <Button
                        onClick={handleSaveTradeLink}
                        disabled={!isValidUrl || !tradeUrl || loading}
                        size="sm"
                      >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      {user?.tradeLink && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTradeUrl(user.tradeLink || '');
                            setIsValidUrl(user.tradeLink ? true : null);
                            setIsEditingTradeLink(false);
                          }}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
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
                {isValidUrl === true && !isEditingTradeLink && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      URL de trade Steam valide ✓
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTrade}
              disabled={!isValidUrl || selectedItems.length === 0 || loading || netValueCentimes <= 0 || isEditingTradeLink}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
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
                    {item.is_stattrak && (
                      <Badge variant="outline" className="text-xs">ST</Badge>
                    )}
                    {item.is_souvenir && (
                      <Badge variant="outline" className="text-xs">Souvenir</Badge>
                    )}
                  </div>
                  <ConvertedPrice
                    usdCents={item.price_centimes}
                    className="text-green-600 font-medium"
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Calculs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Valeur brute ({selectedItems.length} items)</span>
                <ConvertedPrice usdCents={grossValueCentimes} className="font-medium" />
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  Frais réseau
                </span>
                <span className="flex items-center gap-1">
                  -<ConvertedPrice usdCents={fees.network_fee} />
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Vous recevrez</span>
                <ConvertedPrice
                  usdCents={netValueCentimes}
                  className={netValueCentimes > 0 ? 'text-green-600' : 'text-red-600'}
                />
              </div>

              {netValueCentimes <= 0 && (
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
