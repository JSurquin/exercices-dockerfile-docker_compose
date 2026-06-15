'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { Ban, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, zhCN } from 'date-fns/locale';

interface UserBanManagementProps {
  userId: string;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  onUpdate?: () => void;
}

export function UserBanManagement({
  userId,
  banned,
  banReason,
  banExpires,
  onUpdate,
}: UserBanManagementProps) {
  const { toast } = useToast();
  const { locale, messages } = useLocale();
  const t = messages.admin.userBanManagement;
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  const getDateFnsLocale = () => {
    switch (locale) {
      case 'en':
        return enUS;
      case 'cn':
        return zhCN;
      default:
        return fr;
    }
  };

  const handleBan = async () => {
    if (!reason.trim()) {
      toast({ title: t.errorTitle, description: t.reasonRequired, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason.trim(),
          banExpires: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorTitle);

      toast({ title: t.banSuccessTitle, description: t.banSuccessDesc });
      setReason('');
      setExpiresAt('');
      onUpdate?.();
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorTitle);

      toast({ title: t.unbanSuccessTitle, description: t.unbanSuccessDesc });
      onUpdate?.();
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isActiveBan = banned && (!banExpires || new Date(banExpires) > new Date());

  return (
    <Card className={`bg-slate-800/30 border-slate-700 ${isActiveBan ? 'border-red-500/40' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Ban className={`h-5 w-5 ${isActiveBan ? 'text-red-400' : 'text-slate-500'}`} />
          {t.sectionTitle}
          {isActiveBan && (
            <Badge variant="destructive" className="ml-2">
              {t.bannedBadge}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActiveBan && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 space-y-1">
            <p>{t.currentBanReason.replace('{reason}', banReason || t.noReason)}</p>
            {banExpires && (
              <p className="text-xs text-red-300/80">
                {t.expiresAt.replace(
                  '{date}',
                  format(new Date(banExpires), 'dd/MM/yyyy HH:mm', { locale: getDateFnsLocale() })
                )}
              </p>
            )}
            {!banExpires && <p className="text-xs text-red-300/80">{t.permanentBan}</p>}
          </div>
        )}

        {!isActiveBan ? (
          <>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.reasonLabel}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
                className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">{t.expiresLabel}</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">{t.expiresHelp}</p>
            </div>
            <Button
              onClick={handleBan}
              disabled={loading}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <Ban className="h-4 w-4 mr-2" />
              {loading ? t.processing : t.banButton}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleUnban}
            disabled={loading}
            variant="outline"
            className="border-green-600/50 text-green-400 hover:bg-green-500/10 w-full sm:w-auto"
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            {loading ? t.processing : t.unbanButton}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
