"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  RefreshCw,
  Info
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { toast } from "sonner";
import { parseSteamId64FromUserInput } from "@/lib/steam-id";

export default function TradeLinkConfig() {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [tradeUrl, setTradeUrl] = useState(user?.tradeLink || '');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(
    user?.tradeLink ? validateTradeUrl(user.tradeLink) : null
  );
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!user?.tradeLink);
  const [extractedSteamId, setExtractedSteamId] = useState<string | null>(null);

  // Synchroniser avec les données utilisateur
  useEffect(() => {
    if (user?.tradeLink) {
      setTradeUrl(user.tradeLink);
      const isValid = validateTradeUrl(user.tradeLink);
      setIsValidUrl(isValid);
      setShowInstructions(false);
      
      // Extraire le SteamID du trade link existant
      if (isValid) {
        const steamId = parseSteamId64FromUserInput(user.tradeLink);
        setExtractedSteamId(steamId);
      }
    } else {
      setTradeUrl('');
      setIsValidUrl(null);
      setShowInstructions(true);
      setExtractedSteamId(null);
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
    
    // Extraire le SteamID du trade link
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
      // On sauvegarde UNIQUEMENT le Trade Link
      // Le Steam ID sera extrait à la volée quand nécessaire
      await updateUser({ tradeLink: tradeUrl });
      
      toast.success(messages.settings.tradeLink.savedSuccess);
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

  const handleRemoveTradeLink = async () => {
    if (!user?.tradeLink) return;
    
    setLoading(true);
    try {
      await updateUser({ tradeLink: '' });
      setTradeUrl('');
      setIsValidUrl(null);
      setExtractedSteamId(null);
      toast.success(messages.settings.tradeLink.deleteSuccess);
    } catch (error) {
      console.error('Erreur lors de la suppression du Trade Link:', error);
      toast.error(messages.settings.tradeLink.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const copyExampleUrl = () => {
    const exampleUrl = "https://steamcommunity.com/tradeoffer/new/?partner=123456789&token=AbCdEfGh";
    navigator.clipboard.writeText(exampleUrl);
    toast.success(messages.settings.tradeLink.copiedToClipboard);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Link className="w-5 h-5" />
          <span>{messages.settings.tradeLink.title}</span>
          {user?.tradeLink && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {messages.settings.tradeLink.configured}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {showInstructions && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Link className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  {messages.settings.tradeLink.howToGetTitle}
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  {messages.settings.tradeLink.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {messages.settings.tradeLink.openSteam}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyExampleUrl}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {messages.settings.tradeLink.copyExample}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration du Trade Link */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="trade-url">{messages.settings.tradeLink.urlLabel}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? messages.settings.tradeLink.hideInstructions : messages.settings.tradeLink.showInstructions}
            </Button>
          </div>
          
          <Input
            id="trade-url"
            placeholder={messages.settings.tradeLink.placeholder}
            value={tradeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={isValidUrl === false ? 'border-red-500' : isValidUrl === true ? 'border-green-500' : ''}
          />

          {/* Validation feedback */}
          {isValidUrl === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {messages.settings.tradeLink.invalidFormatDesc}
              </AlertDescription>
            </Alert>
          )}

          {isValidUrl === true && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {messages.settings.tradeLink.validFormat}
              </AlertDescription>
            </Alert>
          )}

          {/* Extracted Steam ID Display */}
          {extractedSteamId && isValidUrl && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {messages.settings.tradeLink.extractedSteamIdTitle}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">
                    {extractedSteamId}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {messages.settings.tradeLink.extractedSteamIdDesc}
                  </p>
                  {user?.steamId64 && extractedSteamId !== user.steamId64 && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>{messages.settings.tradeLink.noteLabel}</strong> {messages.settings.tradeLink.differentAccountWarning} 
                        (<code className="bg-muted px-1 rounded">{user.steamId64}</code>).
                        {messages.settings.tradeLink.differentAccountNormal}
                        <br /><br />
                        <strong>{messages.settings.tradeLink.importantLabel}</strong> {messages.settings.tradeLink.inventoryPublicWarning}
                      </AlertDescription>
                    </Alert>
                  )}
                  {user?.steamId64 && extractedSteamId === user.steamId64 && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                      {messages.settings.tradeLink.sameAccountSuccess}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Trade Link */}
          {user?.tradeLink && user.tradeLink !== tradeUrl && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">{messages.settings.tradeLink.currentTradeLink}</p>
              <p className="text-xs text-muted-foreground break-all">
                {user.tradeLink}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={loading || !isValidUrl || !tradeUrl || tradeUrl === user?.tradeLink}
            className="flex items-center justify-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{loading ? messages.settings.tradeLink.saving : messages.settings.tradeLink.save}</span>
          </Button>
          
          {tradeUrl && !user?.tradeLink && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              {messages.settings.tradeLink.clear}
            </Button>
          )}
          
          {user?.tradeLink && (
            <Button
              variant="destructive"
              onClick={handleRemoveTradeLink}
              disabled={loading}
              className="flex items-center justify-center space-x-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{messages.settings.tradeLink.deleteButton}</span>
            </Button>
          )}
        </div>

        {user?.tradeLink && user.steamId64 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>{messages.settings.tradeLink.tipLabel}</strong> {messages.settings.tradeLink.deleteTipText} 
              (<code className="bg-muted px-1 rounded">{user.steamId64}</code>) {messages.settings.tradeLink.deleteTipText2}
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{messages.settings.tradeLink.warningTitle}</strong> {messages.settings.tradeLink.warningText}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
