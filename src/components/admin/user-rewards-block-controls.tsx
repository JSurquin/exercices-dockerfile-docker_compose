'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale } from '@/components/providers/locale-provider';

type Props = {
  userId: string;
  affiliateRewardsBlocked: boolean;
  xpRewardsBlocked: boolean;
  compact?: boolean;
};

export function UserRewardsBlockControls({
  userId,
  affiliateRewardsBlocked,
  xpRewardsBlocked,
  compact = false,
}: Props) {
  const { messages } = useLocale();
  const t = messages.admin.userRewardsBlock;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [affiliateBlocked, setAffiliateBlocked] = useState(affiliateRewardsBlocked);
  const [xpBlocked, setXpBlocked] = useState(xpRewardsBlocked);
  const [saving, setSaving] = useState<'affiliate' | 'xp' | null>(null);

  const patchFlag = async (field: 'affiliateRewardsBlocked' | 'xpRewardsBlocked', value: boolean) => {
    setSaving(field === 'affiliateRewardsBlocked' ? 'affiliate' : 'xp');
    try {
      const res = await fetch(`/api/admin/users/${userId}/rewards-block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.errorSave);

      if (field === 'affiliateRewardsBlocked') setAffiliateBlocked(data.affiliateRewardsBlocked);
      else setXpBlocked(data.xpRewardsBlocked);

      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'affiliates'] });

      toast({
        title: t.updatedTitle,
        description: value ? t.enabledDesc : t.disabledDesc,
      });
    } catch (e) {
      if (field === 'affiliateRewardsBlocked') setAffiliateBlocked(!value);
      else setXpBlocked(!value);
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4 rounded-lg border border-slate-700 p-4'}>
      {!compact && (
        <div className="flex items-center gap-2 text-amber-400">
          <ShieldAlert className="h-5 w-5" />
          <span className="font-medium text-white">{t.sectionTitle}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label className={compact ? 'text-slate-300 text-sm' : 'text-slate-300'}>{t.affiliateBlockLabel}</Label>
          {!compact && <p className="text-xs text-slate-500">{t.affiliateBlockHelp}</p>}
        </div>
        <div className="flex items-center gap-2">
          {saving === 'affiliate' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <Switch
            checked={affiliateBlocked}
            disabled={saving !== null}
            onCheckedChange={(v) => {
              setAffiliateBlocked(v);
              void patchFlag('affiliateRewardsBlocked', v);
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label className={compact ? 'text-slate-300 text-sm' : 'text-slate-300'}>{t.xpBlockLabel}</Label>
          {!compact && <p className="text-xs text-slate-500">{t.xpBlockHelp}</p>}
        </div>
        <div className="flex items-center gap-2">
          {saving === 'xp' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <Switch
            checked={xpBlocked}
            disabled={saving !== null}
            onCheckedChange={(v) => {
              setXpBlocked(v);
              void patchFlag('xpRewardsBlocked', v);
            }}
          />
        </div>
      </div>
    </div>
  );
}
