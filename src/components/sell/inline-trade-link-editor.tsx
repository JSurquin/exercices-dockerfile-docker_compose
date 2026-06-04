"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { toast } from "sonner";
import { parseSteamId64FromUserInput } from "@/lib/steam-id";

interface InlineTradeLinkEditorProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export default function InlineTradeLinkEditor({ onSuccess, compact = false }: InlineTradeLinkEditorProps) {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [isExpanded, setIsExpanded] = useState(!user?.tradeLink); // Déplié par défaut si pas de Trade Link
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || '');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(
    user?.tradeLink ? validateTradeUrl(user.tradeLink) : null
  );
  const [loading, setLoading] = useState(false);
  const [extractedSteamId, setExtractedSteamId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tradeLink) {
      setTradeUrl(user.tradeLink);
      const isValid = validateTradeUrl(user.tradeLink);
      setIsValidUrl(isValid);
      if (isValid) {
        const steamId = parseSteamId64FromUserInput(user.tradeLink);
        setExtractedSteamId(steamId);
      }
    }
  }, [user?.tradeLink]);

  function validateTradeUrl(url: string): boolean {
    // Accepte avec ou sans / après "new" (Steam peut renvoyer les deux formats)
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/?\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  }

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    const isValid = url ? validateTradeUrl(url) : null;
    setIsValidUrl(isValid);
    if (isValid && url) {
      const steamId = parseSteamId64FromUserInput(url);
      setExtractedSteamId(steamId);
    } else {
      setExtractedSteamId(null);
    }
  };

  const handleSave = async () => {
    if (!isValidUrl || !tradeUrl) {
      toast.error(messages.settings.tradeLink.invalidFormat);
      return;
    }

    setLoading(true);
    try {
      await updateUser({ tradeLink: tradeUrl });
      toast.success(messages.settings.tradeLink.savedSuccess);
      setIsExpanded(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du Trade Link:', error);
      toast.error(messages.settings.tradeLink.saveError);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTradeUrl('');
    setIsValidUrl(null);
    setExtractedSteamId(null);
  };

  const openSteamTradeUrl = () => {
    window.open('https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url', '_blank');
  };

  const sellTradeLink = messages.sellPage.tradeLinkSection;

  return (
    <Card className="border-theme-accent/40 bg-theme-accent/5 shadow-sm">
      <CardContent className={compact ? "p-3" : "p-4 sm:p-5"}>
        {/* Header - Always visible */}
        <div className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row sm:items-start"} justify-between gap-2 mb-2`}>
          <div className="flex items-start gap-2 min-w-0">
            <div className={`${compact ? "p-1.5" : "p-2"} rounded-lg bg-theme-accent/15 shrink-0`}>
              <Link className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-theme-accent`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
                  {user?.tradeLink
                    ? messages.settings.tradeLink.title
                    : messages.settings.tradeLink.configureTradeLinkTitle}
                </h3>
                {user?.tradeLink && !isExpanded && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {sellTradeLink.description}
              </p>
            </div>
          </div>
          <Button
            variant={user?.tradeLink && !isExpanded ? "default" : "outline"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`shrink-0 flex items-center gap-1 w-full ${compact ? "" : "sm:w-auto"} ${
              user?.tradeLink && !isExpanded
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            }`}
          >
            {isExpanded ? (
              <>
                {messages.settings.tradeLink.hide} <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                {user?.tradeLink ? messages.settings.tradeLink.modify : messages.settings.tradeLink.configure}{" "}
                {!user?.tradeLink && <ChevronDown className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>

        {/* Current Trade Link Summary - When collapsed */}
        {!isExpanded && user?.tradeLink && (
          <div className="mt-3 rounded-md border border-theme-accent/20 bg-background/60 px-3 py-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {messages.settings.tradeLink.currentTradeLink}
            </p>
            <p className="text-xs font-mono truncate text-foreground/80" title={user.tradeLink}>
              {user.tradeLink}
            </p>
            {extractedSteamId && (
              <p className="text-xs text-muted-foreground">
                {sellTradeLink.inventoryFromTradeLink}{" "}
                <code className="bg-muted px-1 rounded">{extractedSteamId}</code>
              </p>
            )}
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 mt-4">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {messages.settings.tradeLink.howToGetTitle}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    {messages.settings.tradeLink.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSteamTradeUrl}
                    className="mt-2"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {messages.settings.tradeLink.openSteam}
                  </Button>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Label htmlFor="trade-url-inline" className="text-sm">
                {messages.settings.tradeLink.urlLabel}
              </Label>
              <Input
                id="trade-url-inline"
                placeholder={messages.settings.tradeLink.placeholder}
                value={tradeUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={
                  isValidUrl === false 
                    ? 'border-red-500' 
                    : isValidUrl === true 
                    ? 'border-green-500' 
                    : ''
                }
              />

              {/* Validation feedback */}
              {isValidUrl === false && (
                <Alert variant="destructive" className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    {messages.settings.tradeLink.invalidFormatDesc}
                  </AlertDescription>
                </Alert>
              )}

              {isValidUrl === true && (
                <Alert className="py-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                    {messages.settings.tradeLink.validFormat}
                  </AlertDescription>
                </Alert>
              )}

              {/* Extracted Steam ID */}
              {extractedSteamId && isValidUrl && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                    {messages.settings.tradeLink.extractedSteamIdTitle}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded mt-1">
                    {extractedSteamId}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {messages.settings.tradeLink.extractedSteamIdDesc}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={loading || !isValidUrl || !tradeUrl || tradeUrl === user?.tradeLink}
                size="sm"
                className="flex-1"
              >
                {loading && <RefreshCw className="w-3 h-3 animate-spin mr-2" />}
                <span>{loading ? messages.settings.tradeLink.saving : messages.settings.tradeLink.save}</span>
              </Button>
              
              {tradeUrl && !user?.tradeLink && (
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={loading}
                  size="sm"
                >
                  {messages.settings.tradeLink.clear}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
