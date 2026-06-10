"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { isValidSteamId64 } from "@/lib/steam-id";

interface ConnectedSteamAccountCardProps {
  compact?: boolean;
}

export function ConnectedSteamAccountCard({ compact = false }: ConnectedSteamAccountCardProps) {
  const { user } = useAuth();
  const { messages } = useLocale();
  const t = messages.sellPage.steamAccount;

  if (!user) return null;

  const hasSteamId = isValidSteamId64(user.steamId64);

  return (
    <Card className={compact ? "border-border/60 bg-muted/20" : "border-border/60 bg-muted/20"}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className={`flex items-start ${compact ? "gap-3" : "gap-2.5"}`}>
          <Avatar className={`${compact ? "h-12 w-12" : "h-12 w-12"} border-2 border-border shrink-0`}>
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt="" />
            ) : null}
            <AvatarFallback className="text-sm">
              {(user.username || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`font-medium uppercase tracking-wide text-muted-foreground ${compact ? "text-sm" : "text-xs"}`}>
                {t.label}
              </p>
              <Lock className="h-3 w-3 text-muted-foreground/70 shrink-0" aria-hidden />
            </div>
            <p className="font-semibold truncate text-base" title={user.username}>
              {user.username}
            </p>
            {hasSteamId ? (
              <p className={`font-mono text-muted-foreground truncate mt-0.5 ${compact ? "text-xs" : "text-[11px]"}`}>
                {user.steamId64}
              </p>
            ) : (
              <p className={`text-muted-foreground mt-0.5 ${compact ? "text-xs" : "text-[11px]"}`}>{t.noSteamId}</p>
            )}
            {!compact && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.hint}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
