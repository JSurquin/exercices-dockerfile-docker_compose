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
  AlertTriangle,
  Gift,
  Loader2,
  Plus,
  Package,
  Mail,
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
import { parseApiJson } from '@/lib/parse-api-json';
import { MAX_SKINPLACE_TRADE_ITEMS } from '@/lib/trade-limits';

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
  const { user, updateUser, refreshUser } = useAuth();
  const { messages } = useLocale();
  const { data: platformSettings } = usePlatformSettings();
  const isMerchant = user?.userTag === 'MERCHANT';
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || '');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(user?.tradeLink ? true : null);
  const [emailInput, setEmailInput] = useState(user?.contactEmail || '');
  const [isValidEmail, setIsValidEmail] = useState<boolean | null>(user?.contactEmail ? true : null);
  const [isEditingEmail, setIsEditingEmail] = useState(!user?.contactEmail);
  const [emailSaving, setEmailSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTradeLink, setIsEditingTradeLink] = useState(!user?.tradeLink);
  const [promoInput, setPromoInput] = useState('');
  const [promoState, setPromoState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [promoErrorCode, setPromoErrorCode] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoWillReplace, setPromoWillReplace] = useState(false);
  const [promoAffiliateName, setPromoAffiliateName] = useState<string | null>(null);
  const promoAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!user || isEditingEmail) return;

    const resolved = user.contactEmail?.trim() ?? '';
    if (resolved) {
      setEmailInput(resolved);
      setIsValidEmail(true);
      setIsEditingEmail(false);
    }
  }, [user?.id, user?.contactEmail, isEditingEmail]);

  useEffect(() => {
    if (isMerchant) {
      setPromoState('idle');
      setPromoErrorCode(null);
      setAppliedPromoCode(null);
      setPromoWillReplace(false);
      setPromoAffiliateName(null);
      return;
    }

    const trimmed = promoInput.trim();
    if (!trimmed) {
      setPromoState('idle');
      setPromoErrorCode(null);
      setAppliedPromoCode(null);
      setPromoWillReplace(false);
      setPromoAffiliateName(null);
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
        const data = await parseApiJson<{
          valid?: boolean;
          code?: string;
          error?: string;
          alreadyLinked?: boolean;
          alreadyLinkedToOther?: boolean;
          attached?: boolean;
          affiliateName?: string;
        }>(res, messages.tradeCreator.invalidServerResponse);
        if (ctrl.signal.aborted) return;
        if (data.valid && data.code) {
          setPromoState('valid');
          setAppliedPromoCode(data.code);
          setPromoWillReplace(!!data.alreadyLinkedToOther);
          setPromoAffiliateName(data.affiliateName ?? null);
        } else {
          setPromoState('invalid');
          setAppliedPromoCode(null);
          setPromoWillReplace(false);
          setPromoAffiliateName(null);
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
  }, [promoInput, isMerchant]);

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleEmailChange = (value: string) => {
    setEmailInput(value);
    setIsValidEmail(value ? validateEmail(value) : null);
  };

  const saveContactEmail = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed || !validateEmail(trimmed)) {
      toast.error(messages.tradeCreator.contactEmailInvalid);
      throw new Error('invalid email');
    }

    if (user?.contactEmail === trimmed) {
      setIsEditingEmail(false);
      return;
    }

    setEmailSaving(true);
    try {
      const res = await fetch('/api/user/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await parseApiJson<{ error?: string }>(
        res,
        messages.tradeCreator.invalidServerResponse
      );
      if (!res.ok) {
        throw new Error(data.error ?? messages.tradeCreator.contactEmailError);
      }
      await refreshUser();
      setIsEditingEmail(false);
      toast.success(messages.tradeCreator.contactEmailSaved);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      await saveContactEmail();
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid email') return;
      toast.error(
        error instanceof Error ? error.message : messages.tradeCreator.contactEmailError
      );
    }
  };

  const ensureContactEmail = async () => {
    if (user?.contactEmail && !isEditingEmail) return;
    try {
      await saveContactEmail();
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid email') {
        toast.error(messages.tradeCreator.contactEmailRequired);
      }
      throw error;
    }
  };

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

  /** Aucun frais à la vente, les frais s'appliquent uniquement au retrait (/payout). */
  const calculateFees = (grossValueCentimes: number) => {
    const indicativePayoutFeesCentimes = platformSettings?.networkFeeCentimes ?? 200;

    return {
      cashout_fee: 0,
      indicative_payout_fees_centimes: indicativePayoutFeesCentimes,
      net_credited_centimes: grossValueCentimes,
    };
  };

  const handleCreateTrade = async () => {
    if (!isValidUrl || selectedItems.length === 0) return;

    if (selectedItems.length > MAX_SKINPLACE_TRADE_ITEMS) {
      toast.error(
        messages.components.skinplace.selectionLimitReached.replace(
          '{max}',
          String(MAX_SKINPLACE_TRADE_ITEMS),
        ),
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ensureContactEmail();

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
          affiliate_promo_code: isMerchant ? undefined : appliedPromoCode ?? undefined,
          items: selectedItems.map(item => ({
            asset_id: item.assetid,
          })),
        }),
      });

      const result = await parseApiJson<{
        success?: boolean;
        error?: string;
        data?: {
          trade_id: string;
          token: string;
          status: string;
          gross_value_centimes: number;
          net_value_centimes: number;
          fees: { cashout_fee: number; network_fee: number };
          expires_at: string | null;
          bot?: SkinplaceBotInfo | null;
          affiliateSwitch?: { attached?: boolean; affiliateName?: string };
        };
      }>(response, messages.tradeCreator.invalidServerResponse);

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || messages.tradeCreator.tradeCreationError);
      }

      const tradePayload = result.data;

      // Vérifier si le prix serveur diffère de l'estimation affichée au client
      const serverGross = tradePayload.gross_value_centimes;
      if (Math.abs(serverGross - grossValueCentimes) > 1) {
        toast.warning(
          messages.tradeCreator.priceUpdatedByServer
            .replace('{server}', (serverGross / 100).toFixed(2))
            .replace('{client}', (grossValueCentimes / 100).toFixed(2))
        );
      }

      const tradeData: TradeCreatedData = {
        trade_id: tradePayload.trade_id,
        token: tradePayload.token,
        status: tradePayload.status,
        total_value: serverGross,
        net_value: tradePayload.net_value_centimes,
        fees: {
          cashout_fee: tradePayload.fees.cashout_fee,
          network_fee: tradePayload.fees.network_fee,
        },
        expires_at: new Date(tradePayload.expires_at ?? Date.now()),
        bot: tradePayload.bot || null,
      };
      
      onTradeCreated?.(tradeData);
      toast.success(messages.tradeCreator.tradeCreatedSuccess);

      const switchInfo = tradePayload.affiliateSwitch;
      if (switchInfo?.attached && switchInfo?.affiliateName) {
        toast.success(
          messages.tradeCreator.promoAffiliateUpdated.replace(
            '{name}',
            switchInfo.affiliateName
          )
        );
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : messages.tradeCreator.errorUnknown;
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
  const promoPercentLabel = (AFFILIATE_SELL_PROMO_GROSS_RATE * 100).toFixed(1);
  const trimmedPromoInput = promoInput.trim();
  const promoBlocksSubmit =
    Boolean(trimmedPromoInput) && promoState !== 'valid';
  const hasValidContactEmail = Boolean(
    (user?.contactEmail && !isEditingEmail) ||
      (emailInput.trim() && isValidEmail === true)
  );
  const emailBlocksSubmit = !hasValidContactEmail;

  return (
    <div className="space-y-6">
      {/* Configuration du trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            {messages.tradeCreator.createYourSale}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="trade-url">{messages.tradeCreator.tradeUrlLabel}</Label>
              {user?.tradeLink && !isEditingTradeLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingTradeLink(true)}
                >
                  {messages.tradeCreator.tradeUrlModify}
                </Button>
              )}
            </div>
            
            {!isEditingTradeLink && user?.tradeLink ? (
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">{messages.tradeCreator.tradeLinkConfigured}</p>
                  <p className="text-sm font-mono break-all">{user.tradeLink}</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {messages.tradeCreator.tradeLinkValid}
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
                        {loading ? messages.tradeCreator.tradeUrlSaving : messages.tradeCreator.tradeUrlSave}
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
                          {messages.tradeCreator.tradeUrlCancel}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                {isValidUrl === false && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {messages.tradeCreator.tradeUrlInvalid}
                      <a 
                        href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline ml-1"
                      >
                        {messages.tradeCreator.tradeUrlGetHere}
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
                {isValidUrl === true && !isEditingTradeLink && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {messages.tradeCreator.tradeUrlValid}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="contact-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {messages.tradeCreator.contactEmailLabel}
              </Label>
              {user?.contactEmail && !isEditingEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingEmail(true)}
                >
                  {messages.tradeCreator.contactEmailModify}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {messages.tradeCreator.contactEmailHelp}
            </p>

            {!isEditingEmail && user?.contactEmail ? (
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-1">
                    {messages.tradeCreator.contactEmailConfigured}
                  </p>
                  <p className="text-sm font-mono break-all">{user.contactEmail}</p>
                </div>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {messages.tradeCreator.contactEmailValid}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder={messages.tradeCreator.contactEmailPlaceholder}
                    value={emailInput}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={isValidEmail === false ? 'border-red-500' : ''}
                    autoComplete="email"
                  />
                  {isEditingEmail && user?.contactEmail && (
                    <div className="flex gap-1">
                      <Button
                        onClick={handleSaveEmail}
                        disabled={!isValidEmail || !emailInput.trim() || emailSaving}
                        size="sm"
                      >
                        {emailSaving
                          ? messages.tradeCreator.contactEmailSaving
                          : messages.tradeCreator.contactEmailSave}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailInput(user.contactEmail || '');
                          setIsValidEmail(user.contactEmail ? true : null);
                          setIsEditingEmail(false);
                        }}
                      >
                        {messages.tradeCreator.contactEmailCancel}
                      </Button>
                    </div>
                  )}
                </div>

                {isValidEmail === false && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {messages.tradeCreator.contactEmailInvalid}
                    </AlertDescription>
                  </Alert>
                )}
                {isValidEmail === true && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {messages.tradeCreator.contactEmailValid}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-theme-accent/25 bg-theme-accent/5 dark:bg-theme-accent/10 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Gift className="h-5 w-5 text-theme-accent shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-medium">{messages.tradeCreator.promoSectionTitle}</p>
                {isMerchant ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {messages.tradeCreator.promoMerchantNotice}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {messages.tradeCreator.promoSectionDescription
                        .replace('{percent}', promoPercentLabel)
                        .replace('{fragments}', String(AFFILIATE_SELL_PROMO_FRAGMENTS))}
                    </p>
                    <div className="space-y-2 pt-2">
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
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {promoWillReplace && promoAffiliateName
                            ? messages.tradeCreator.promoWillReplace.replace('{name}', promoAffiliateName)
                            : messages.tradeCreator.promoAccepted}
                        </p>
                      )}
                      {promoState === 'invalid' && promoErrorCode && (
                        <p className="text-xs text-destructive">
                          {promoErrorCode === 'self'
                            ? messages.tradeCreator.promoErrorSelf
                            : promoErrorCode === 'unauthorized'
                              ? messages.tradeCreator.promoErrorUnauthorized
                              : messages.tradeCreator.promoErrorInvalid}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateTrade}
              disabled={
                !isValidUrl ||
                selectedItems.length === 0 ||
                loading ||
                emailSaving ||
                netValueCentimes <= 0 ||
                isEditingTradeLink ||
                emailBlocksSubmit ||
                promoBlocksSubmit ||
                grossValueCentimes < 100
              }
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? messages.tradeCreator.creatingButton : messages.tradeCreator.createSaleButton}
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
            {messages.tradeCreator.paymentCalcTitle}
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
                <div className="flex items-center justify-between text-sm text-theme-highlight">
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {messages.tradeCreator.vipBonus
                      .replace('{tag}', user?.userTag || 'VIP')
                      .replace('{percent}', String(user?.bonusRatePercent))}
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

              <div className="rounded-lg border border-dashed brand-panel-dashed p-3 space-y-2 mt-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {messages.tradeCreator.tradeFeesFootnote}
                </p>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{messages.tradeCreator.payoutFeesIndicativeLine}</span>
                  <span className="shrink-0 font-medium text-theme-highlight tabular-nums">
                    ~<ConvertedPrice usdCents={fees.indicative_payout_fees_centimes} />
                  </span>
                </div>
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

            <div className="flex items-start gap-3 rounded-lg border brand-panel p-3.5">
              <Clock className="h-5 w-5 shrink-0 text-theme-accent mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {messages.tradeCreator.paymentDelayTitle}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {messages.tradeCreator.paymentDelayDetail}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {messages.tradeCreator.errorPrefix}: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
