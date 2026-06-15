'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { Ban, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS, zhCN } from 'date-fns/locale';
import { PageLoading } from '@/components/ui/page-loading';

interface BlockedIpEntry {
  id: string;
  ipAddress: string;
  reason: string;
  createdBy: string;
  expiresAt: string | null;
  createdAt: string;
}

export function BlockedIpsManagement() {
  const { toast } = useToast();
  const { locale, messages } = useLocale();
  const t = messages.admin.blockedIps;
  const queryClient = useQueryClient();
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'blocked-ips'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blocked-ips');
      if (!res.ok) throw new Error(t.loadError);
      return res.json() as Promise<{ blockedIps: BlockedIpEntry[] }>;
    },
  });

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

  const handleBlock = async () => {
    if (!ipAddress.trim() || !reason.trim()) {
      toast({ title: t.errorTitle, description: t.invalidInput, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/blocked-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: ipAddress.trim(),
          reason: reason.trim(),
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.errorTitle);

      toast({ title: t.blockSuccessTitle, description: t.blockSuccessDesc });
      setIpAddress('');
      setReason('');
      setExpiresAt('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-ips'] });
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blocked-ips/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.errorTitle);

      toast({ title: t.unblockSuccessTitle, description: t.unblockSuccessDesc });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'blocked-ips'] });
    } catch (e) {
      toast({
        title: t.errorTitle,
        description: e instanceof Error ? e.message : t.errorSave,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const blockedIps = data?.blockedIps ?? [];

  if (isLoading) {
    return <PageLoading variant="compact" message={t.loading} className="min-h-[30vh]" />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            {t.blockTitle}
          </CardTitle>
          <CardDescription className="text-slate-400">{t.blockDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-slate-300">{t.ipLabel}</Label>
            <Input
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder={t.ipPlaceholder}
              className="bg-slate-700 border-slate-600 text-white"
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
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-300">{t.reasonLabel}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.reasonPlaceholder}
              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleBlock} disabled={submitting} variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              {submitting ? t.processing : t.blockButton}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">{t.listTitle}</CardTitle>
            <CardDescription className="text-slate-400">
              {blockedIps.length} {t.entriesFound}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-600">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.table.ip}</TableHead>
                  <TableHead>{t.table.reason}</TableHead>
                  <TableHead>{t.table.expires}</TableHead>
                  <TableHead>{t.table.created}</TableHead>
                  <TableHead className="text-right">{t.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedIps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      {t.noEntries}
                    </TableCell>
                  </TableRow>
                ) : (
                  blockedIps.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{entry.ipAddress}</code>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">{entry.reason}</TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {entry.expiresAt
                          ? format(new Date(entry.expiresAt), 'dd/MM/yyyy HH:mm', {
                              locale: getDateFnsLocale(),
                            })
                          : t.permanent}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {format(new Date(entry.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: getDateFnsLocale(),
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === entry.id}
                          onClick={() => handleUnblock(entry.id)}
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingId === entry.id ? t.processing : t.unblockButton}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
