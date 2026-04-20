"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  CheckCircle, 
  Copy,
  Info,
  Lock
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { toast } from "sonner";

export default function SteamIdConfig() {
  const { user } = useAuth();
  const { messages } = useLocale();

  const copySteamId = () => {
    if (user?.steamId64) {
      navigator.clipboard.writeText(user.steamId64);
      toast.success(messages.settings.steamId.copied);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>{messages.settings.steamId.accountLoginTitle}</span>
          {user?.steamId64 && (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
              <CheckCircle className="w-3 h-3 mr-1" />
              {messages.settings.steamId.verified}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Affichage en lecture seule du Steam ID */}
        <div className="space-y-3">
          <Label htmlFor="steam-id">{messages.settings.steamId.labelLogin}</Label>
          
          <div className="flex items-center gap-2">
            <Input
              id="steam-id"
              value={user?.steamId64 || ''}
              disabled
              className="font-mono bg-muted cursor-not-allowed"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copySteamId}
              title={messages.settings.steamId.copySteamId}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Info sur le Steam ID */}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>{messages.settings.steamId.lockedTitle}</strong> {messages.settings.steamId.lockedDescription}
            <br /><br />
            {messages.settings.steamId.lockedSubDescription}
          </AlertDescription>
        </Alert>

        {/* Info complémentaire */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>
                <strong>{messages.settings.steamId.infoTitle}</strong>
              </p>
              <p>
                {messages.settings.steamId.infoText1}
              </p>
              <p>
                {messages.settings.steamId.infoText2}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
