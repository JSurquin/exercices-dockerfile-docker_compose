"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
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

export default function SteamIdConfig() {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [steamId, setSteamId] = useState(user?.steamId64 || '');
  const [isValidId, setIsValidId] = useState<boolean | null>(
    user?.steamId64 ? validateSteamId64(user.steamId64) : null
  );
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(!user?.steamId64);

  function validateSteamId64(id: string): boolean {
    const steamId64Regex = /^7656119[0-9]{10}$/;
    return steamId64Regex.test(id);
  }

  const handleIdChange = (id: string) => {
    setSteamId(id);
    setIsValidId(id ? validateSteamId64(id) : null);
  };

  const handleSave = async () => {
    if (!isValidId || !steamId) {
      toast.error("Format de Steam ID64 invalide");
      return;
    }

    setLoading(true);
    try {
      await updateUser({ steamId64: steamId });
      toast.success("Steam ID mis à jour avec succès");
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du Steam ID:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSteamId('');
    setIsValidId(null);
  };

  const copyExampleId = () => {
    const exampleId = "76561198123456789";
    navigator.clipboard.writeText(exampleId);
    toast.success("Exemple copié dans le presse-papiers");
  };

  const openSteamIdFinder = () => {
    window.open('https://steamid.io/', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Steam ID64</span>
          {user?.steamId64 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configuré
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {showInstructions && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Comment trouver votre Steam ID64 ?
                </h4>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Méthode 1 - Via Steam :</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Ouvrez Steam et allez dans votre profil</li>
                    <li>Cliquez sur &quot;Modifier le profil&quot;</li>
                    <li>Dans l&apos;URL, votre Steam ID64 apparaît après /profiles/</li>
                  </ol>
                  <p><strong>Méthode 2 - Via un outil en ligne :</strong></p>
                  <p>Utilisez votre nom d&apos;utilisateur Steam ou l&apos;URL de votre profil</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSteamIdFinder}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Trouver mon Steam ID
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyExampleId}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier exemple
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration du Steam ID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="steam-id">Steam ID64</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? "Masquer les instructions" : "Voir les instructions"}
            </Button>
          </div>
          
          <Input
            id="steam-id"
            placeholder="76561198123456789"
            value={steamId}
            onChange={(e) => handleIdChange(e.target.value)}
            className={isValidId === false ? 'border-red-500' : isValidId === true ? 'border-green-500' : ''}
          />

          {/* Validation feedback */}
          {isValidId === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Format de Steam ID64 invalide. Le Steam ID64 doit commencer par 7656119 et contenir 17 chiffres au total.
              </AlertDescription>
            </Alert>
          )}

          {isValidId === true && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Steam ID64 valide ! Vous pouvez maintenant utiliser toutes les fonctionnalités liées à Steam.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Steam ID */}
          {user?.steamId64 && user.steamId64 !== steamId && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Steam ID64 actuel :</p>
              <p className="text-xs text-muted-foreground font-mono">
                {user.steamId64}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSave}
            disabled={loading || !isValidId || !steamId || steamId === user?.steamId64}
            className="flex items-center space-x-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{loading ? "Sauvegarde..." : "Sauvegarder"}</span>
          </Button>
          
          {steamId && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Effacer
            </Button>
          )}
        </div>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pourquoi le Steam ID64 ?</strong> Il est nécessaire pour accéder à votre inventaire Steam 
            et effectuer des transactions. Si vous vous connectez via Discord, vous devez le saisir manuellement.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
