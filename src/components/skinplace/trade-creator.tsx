'use client';

import { useState } from 'react';
import { useSkinplace } from '@/hooks/use-skinplace';
import { SkinplaceInventoryItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Handshake
} from 'lucide-react';

interface TradeCreatorProps {
  steamId: string;
  selectedItems: SkinplaceInventoryItem[];
  onTradeCreated?: (tradeData: { trade_id: string; token: string; status: string; total_value: number; expires_at: Date }) => void;
}

export function TradeCreator({ 
  steamId, 
  selectedItems, 
  onTradeCreated 
}: TradeCreatorProps) {
  const [tradeUrl, setTradeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [tradeData, setTradeData] = useState<{ trade_id: string; token: string; status: string; total_value: number; expires_at: Date } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const { 
    loading, 
    error, 
    createTrade, 
    getTradeStatus 
  } = useSkinplace({
    onError: (err) => console.error('Erreur Skinplace:', err),
  });

  const validateTradeUrl = (url: string) => {
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const handleCreateTrade = async () => {
    if (!isValidUrl || selectedItems.length === 0) return;

    const result = await createTrade(
      steamId,
      selectedItems.map(item => item.id),
      tradeUrl
    );

    if (result?.success) {
      setTradeData(result.data);
      onTradeCreated?.(result.data);
    }
  };

  const checkTradeStatus = async () => {
    if (!tradeData?.token) return;

    setIsCheckingStatus(true);
    const result = await getTradeStatus(tradeData.token);
    setIsCheckingStatus(false);

    if (result?.success) {
      setTradeData(result.data);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2) + '€';
  };

  const getTotalValue = () => {
    return selectedItems.reduce((total, item) => total + item.price, 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';
      case 'declined':
        return 'Refusé';
      case 'expired':
        return 'Expiré';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration du trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            Créer un trade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="trade-url">URL du Trade Steam</Label>
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
                  <AlertDescription>
                    URL de trade Steam invalide. Format attendu: 
                    https://steamcommunity.com/tradeoffer/new/?partner=...&token=...
                  </AlertDescription>
                </Alert>
              )}
              {isValidUrl === true && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    URL de trade Steam valide
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTrade}
              disabled={!isValidUrl || selectedItems.length === 0 || loading}
              className="flex-1"
            >
              {loading ? 'Création...' : 'Créer le trade'}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://steamcommunity.com/tradeoffer/new/', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résumé des items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Résumé du trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} item(s) sélectionné(s)
              </span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(getTotalValue())}
              </span>
            </div>

            <Separator />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="text-green-600 font-medium">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statut du trade */}
      {tradeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(tradeData.status)}
              Statut du trade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID du trade:</span>
                <p className="font-mono">{tradeData.trade_id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Token:</span>
                <p className="font-mono truncate">{tradeData.token}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Statut:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(tradeData.status)}
                  <span>{getStatusText(tradeData.status)}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Expire le:</span>
                <p>{new Date(tradeData.expires_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Valeur totale:</span>
                <span className="ml-2 text-lg font-bold text-green-600">
                  {formatPrice(tradeData.total_value)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkTradeStatus}
                disabled={isCheckingStatus}
              >
                {isCheckingStatus ? 'Vérification...' : 'Actualiser'}
              </Button>
            </div>

            {tradeData.status === 'accepted' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Le trade a été accepté ! Les items sont maintenant en cours de traitement.
                </AlertDescription>
              </Alert>
            )}

            {tradeData.status === 'declined' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Le trade a été refusé. Veuillez créer un nouveau trade.
                </AlertDescription>
              </Alert>
            )}

            {tradeData.status === 'expired' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Le trade a expiré. Veuillez créer un nouveau trade.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur: {error.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
