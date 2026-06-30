"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { isValidSteamId64 } from "@/lib/steam-id";

interface ConnectedSteamAccountCardProps {
  compact?: boolean;
  embedded?: boolean;
}

function truncateSteamId(steamId64: string): string {
  if (steamId64.length <= 14) return steamId64;
  return `${steamId64.slice(0, 8)}…${steamId64.slice(-4)}`;
}

export function ConnectedSteamAccountCard({
  compact = false,
  embedded = false,
}: ConnectedSteamAccountCardProps) {
  const { user } = useAuth();
  const { messages } = useLocale();
  const t = messages.sellPage.steamAccount;

  if (!user) return null;

  const hasSteamId = isValidSteamId64(user.steamId64);

  if (embedded || compact) {
    const row = (
      <div className="flex items-center gap-2 min-w-0">
        <Avatar
          className={`${embedded ? "h-6 w-6" : "h-7 w-7"} border border-border shrink-0`}
        >
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt="" />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {(user.username || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <p className="font-semibold truncate text-sm" title={user.username}>
                {user.username}
              </p>
              {hasSteamId ? (
                <>
                  <span className="text-muted-foreground/40 shrink-0" aria-hidden>
                    ·
                  </span>
                  <p
                    className="font-mono text-[10px] text-muted-foreground/70 truncate"
                    title={user.steamId64}
                  >
                    {embedded ? truncateSteamId(user.steamId64) : user.steamId64}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground truncate">{t.noSteamId}</p>
              )}
            </div>

        <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" aria-hidden />
      </div>
    );

    if (embedded) return row;

    return (
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="px-2 py-1.5">{row}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-2.5">
          <Avatar className="h-12 w-12 border-2 border-border shrink-0">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt="" />
            ) : null}
            <AvatarFallback className="text-sm">
              {(user.username || "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-medium uppercase tracking-wide text-muted-foreground text-xs">
                {t.label}
              </p>
              <Lock className="h-3 w-3 text-muted-foreground/70 shrink-0" aria-hidden />
            </div>
            <p className="font-semibold truncate text-base" title={user.username}>
              {user.username}
            </p>
            {hasSteamId ? (
              <p className="font-mono text-muted-foreground truncate mt-0.5 text-[11px]">
                {user.steamId64}
              </p>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-[11px]">{t.noSteamId}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t.hint}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
