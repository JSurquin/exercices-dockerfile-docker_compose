'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserCog, X, Loader2 } from 'lucide-react';
import { authClient } from '~/lib/auth-client';
import { useLocale } from '@/components/providers/locale-provider';

export function ImpersonationBanner() {
  const { data: session } = authClient.useSession();
  const { messages } = useLocale();
  const t = messages.admin.impersonationBanner;
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impersonatedBy = (session?.session as { impersonatedBy?: string } | undefined)?.impersonatedBy;

  if (!impersonatedBy) return null;

  const username = session?.user?.name ?? session?.user?.email ?? '…';

  const handleStop = async () => {
    setStopping(true);
    setError(null);
    try {
      const { error: stopError } = await authClient.admin.stopImpersonating();
      if (stopError) {
        setError(t.stopError);
        return;
      }
      window.location.href = '/admin/dashboard?tab=users';
    } catch {
      setError(t.stopError);
    } finally {
      setStopping(false);
    }
  };

  return (
    <>
      {/* Espaceur dans le flux normal — pousse le header sticky vers le bas */}
      <div className="h-10 w-full shrink-0" aria-hidden />
      {/* Bandeau fixe au-dessus de tout (z > header z-50) */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex h-10 items-center justify-between gap-3 bg-primary px-4 text-white shadow-lg">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserCog className="h-4 w-4 shrink-0" />
          <span>{t.message.replace('{name}', username)}</span>
          {error && (
            <span className="ml-2 rounded bg-primary/60 px-2 py-0.5 text-xs">
              {error}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStop}
          disabled={stopping}
          className="shrink-0 border-white/40 bg-transparent text-white hover:bg-primary/90 hover:text-white"
        >
          {stopping ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {t.stopping}
            </>
          ) : (
            <>
              <X className="mr-1 h-3 w-3" />
              {t.stop}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
