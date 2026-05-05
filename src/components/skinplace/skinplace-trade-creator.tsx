'use client';

import { useState, useEffect, useRef } from 'react';
import { NormalizedInventoryItem } from '@/hooks/use-skinplace-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeImg } from '@/components/ui/safe-image';
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
  AlertTriangle,
  Gift,
  Loader2,
  Plus,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { ConvertedPrice } from '@/components/ui/converted-price';
import { usePlatformSettings } from '@/hooks/use-platform-settings';
import {
  AFFILIATE_SELL_PROMO_FRAGMENTS,
  AFFILIATE_SELL_PROMO_GROSS_RATE,
  computeSellPromoBonusCents,
} from '@/lib/affiliate-sell-promo';

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
  const { data: platformSettings } = usePlatformSettings();
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || '');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(user?.tradeLink ? true : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTradeLink, setIsEditingTradeLink] = useState(!user?.tradeLink);
  const [promoInput, setPromoInput] = useState('');
  const [promoState, setPromoState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [promoErrorCode, setPromoErrorCode] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const promoAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = promoInput.trim();
    if (!trimmed) {
      setPromoState('idle');
      setPromoErrorCode(null);
      setAppliedPromoCode(null);
      return;
    }

    const timer = setTimeout(async () => {
      promoAbortRef.current?.abort();
      const ctrl = new AbortController();
      promoAbortRef.current = ctrl;
      setPromoState('checking');
      setPromoErrorCode(null);
      try {
        const res = await fetch(
          `/api/affiliate/validate-sell-promo?code=${encodeURIComponent(trimmed)}`,
          { signal: ctrl.signal, credentials: 'include' }
        );
        const data = (await res.json()) as {
          valid?: boolean;
          code?: string;
          error?: string;
        };
        if (ctrl.signal.aborted) return;
        if (data.valid && data.code) {
          setPromoState('valid');
          setAppliedPromoCode(data.code);
        } else {
          setPromoState('invalid');
          setAppliedPromoCode(null);
          setPromoErrorCode(data.error ?? 'invalid');
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setPromoState('invalid');
        setAppliedPromoCode(null);
        setPromoErrorCode('invalid');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [promoInput]);

  const validateTradeUrl = (url: string) => {
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
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

  /** Frais déduits du trade : cashout uniquement. Les frais prestataire sont au retrait (/payout). */
  const calculateFees = (grossValueCentimes: number) => {
    const cashoutRate = platformSettings?.cashoutFeeRate ?? 0.005;
    const indicativePayoutFeesCentimes = platformSettings?.networkFeeCentimes ?? 200;
    const cashoutFee = Math.round(grossValueCentimes * cashoutRate);

    return {
      cashout_fee: cashoutFee,
      indicative_payout_fees_centimes: indicativePayoutFeesCentimes,
      net_credited_centimes: grossValueCentimes - cashoutFee,
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
      
      // Vérifier le minimum de 100 centimes (1 euro)
      if (grossValueCentimes < 100) {
        const currentValue = `${(grossValueCentimes / 100).toFixed(2)} €`;
        toast.error(messages.tradeCreator.minimumTradeValue.replace('{current}', currentValue));
        setLoading(false);
        return;
      }
      
      const fees = calculateFees(grossValueCentimes);
      const promoBonus = appliedPromoCode
        ? computeSellPromoBonusCents(grossValueCentimes)
        : 0;
      const netValueCentimes = fees.net_credited_centimes + promoBonus;

      if (fees.net_credited_centimes <= 0) {
        toast.error(messages.tradeCreator.negativeNetValue);
        return;
      }
      if (netValueCentimes <= 0) {
        toast.error(messages.tradeCreator.negativeNetValue);
        return;
      }

      const trimmedPromo = promoInput.trim();
      if (trimmedPromo && promoState !== 'valid') {
        toast.error(messages.tradeCreator.promoMustBeValid);
        return;
      }

      // Payload minimal : seuls les asset_id sont envoyés.
      // Les prix/fees sont recalculés intégralement côté serveur.
      const response = await fetch('/api/skinplace/create-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steam_id: steamId64,
          trade_url: tradeUrl,
          affiliate_promo_code: appliedPromoCode ?? undefined,
          items: selectedItems.map(item => ({
            asset_id: item.assetid,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la création du trade');
      }

      // Vérifier si le prix serveur diffère de l'estimation affichée au client
      const serverGross = result.data.gross_value_centimes;
      if (Math.abs(serverGross - grossValueCentimes) > 1) {
        toast.warning(
          `Le prix a été mis à jour par le serveur : ${(serverGross / 100).toFixed(2)} $ au lieu de ${(grossValueCentimes / 100).toFixed(2)} $. Le trade a été créé avec le prix vérifié.`
        );
      }

      const tradeData: TradeCreatedData = {
        trade_id: result.data.trade_id,
        token: result.data.token,
        status: result.data.status,
        total_value: serverGross,
        net_value: result.data.net_value_centimes,
        fees: {
          cashout_fee: result.data.fees.cashout_fee,
          network_fee: result.data.fees.network_fee,
        },
        expires_at: new Date(result.data.expires_at),
        bot: result.data.bot || null,
      };
      
      onTradeCreated?.(tradeData);
      toast.success(messages.tradeCreator.tradeCreatedSuccess);

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
  const promoBonusPreview = appliedPromoCode
    ? computeSellPromoBonusCents(grossValueCentimes)
    : 0;
  const vipBonusPreview = Math.round(grossValueCentimes * (user?.bonusRatePercent ?? 0) / 100);
  const netValueCentimes = fees.net_credited_centimes + promoBonusPreview + vipBonusPreview;
  const cashoutPercentDisplay = ((platformSettings?.cashoutFeeRate ?? 0.005) * 100).toFixed(2);
  const promoPercentLabel = (AFFILIATE_SELL_PROMO_GROSS_RATE * 100).toFixed(1);
  const trimmedPromoInput = promoInput.trim();
  const promoBlocksSubmit =
    Boolean(trimmedPromoInput) && promoState !== 'valid';

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

          <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.06] dark:bg-orange-950/20 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Gift className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium">{messages.tradeCreator.promoSectionTitle}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {messages.tradeCreator.promoSectionDescription
                    .replace('{percent}', promoPercentLabel)
                    .replace('{fragments}', String(AFFILIATE_SELL_PROMO_FRAGMENTS))}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="affiliate-promo-code">{messages.tradeCreator.promoInputLabel}</Label>
              <div className="relative">
                <Input
                  id="affiliate-promo-code"
                  placeholder={messages.tradeCreator.promoPlaceholder}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="pr-10"
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {promoState === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : promoState === 'valid' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : promoState === 'invalid' && trimmedPromoInput ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
              {promoState === 'valid' && (
                <p className="text-xs text-green-600 dark:text-green-400">{messages.tradeCreator.promoAccepted}</p>
              )}
              {promoState === 'invalid' && promoErrorCode && (
                <p className="text-xs text-destructive">
                  {promoErrorCode === 'self'
                    ? messages.tradeCreator.promoErrorSelf
                    : promoErrorCode === 'other_affiliate'
                      ? messages.tradeCreator.promoErrorOtherAffiliate
                      : promoErrorCode === 'unauthorized'
                        ? messages.tradeCreator.promoErrorUnauthorized
                        : messages.tradeCreator.promoErrorInvalid}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTrade}
              disabled={
                !isValidUrl ||
                selectedItems.length === 0 ||
                loading ||
                netValueCentimes <= 0 ||
                isEditingTradeLink ||
                promoBlocksSubmit ||
                grossValueCentimes < 100
              }
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
          
          {grossValueCentimes > 0 && grossValueCentimes < 100 && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {messages.tradeCreator.minimumTradeValueAlert}
              </AlertDescription>
            </Alert>
          )}
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
                <span className="text-sm">{messages.tradeCreator.grossValue.replace('{count}', selectedItems.length.toString())}</span>
                <ConvertedPrice usdCents={grossValueCentimes} className="font-medium" />
              </div>
              
              <div className="flex items-center justify-between text-sm text-red-500">
                <span className="flex items-center gap-1">
                  <Minus className="h-3 w-3" />
                  {messages.tradeCreator.cashoutFeesLabel.replace("{percent}", cashoutPercentDisplay)}
                </span>
                <span className="flex items-center gap-1">
                  -<ConvertedPrice usdCents={fees.cashout_fee} />
                </span>
              </div>

              {promoBonusPreview > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {messages.tradeCreator.promoBonusLine.replace('{percent}', promoPercentLabel)}
                  </span>
                  <span className="flex items-center gap-1">
                    +<ConvertedPrice usdCents={promoBonusPreview} />
                  </span>
                </div>
              )}

              {vipBonusPreview > 0 && (
                <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Bonus {user?.userTag || 'VIP'} (+{user?.bonusRatePercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    +<ConvertedPrice usdCents={vipBonusPreview} />
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between text-base font-bold">
                <span>{messages.tradeCreator.youReceive}</span>
                <ConvertedPrice
                  usdCents={netValueCentimes}
                  className={netValueCentimes > 0 ? 'text-green-600' : 'text-red-600'}
                />
              </div>

              <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground border border-dashed border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20 rounded-md p-2 mt-1">
                <span className="text-left">{messages.tradeCreator.payoutFeesIndicativeLine}</span>
                <span className="shrink-0 font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                  ~<ConvertedPrice usdCents={fees.indicative_payout_fees_centimes} />
                </span>
              </div>

              {netValueCentimes <= 0 && (
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
