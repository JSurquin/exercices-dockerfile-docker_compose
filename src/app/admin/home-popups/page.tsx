'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Archive,
  Play,
  Pause,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { PageLoading } from '@/components/ui/page-loading';

type HomePopupStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface HomePopup {
  id: string;
  titleFr: string;
  titleEn: string;
  titleCn: string | null;
  messageFr: string;
  messageEn: string;
  messageCn: string | null;
  ctaUrl: string | null;
  ctaLabelFr: string | null;
  ctaLabelEn: string | null;
  ctaLabelCn: string | null;
  status: HomePopupStatus;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

const emptyForm = {
  titleFr: '',
  titleEn: '',
  titleCn: '',
  messageFr: '',
  messageEn: '',
  messageCn: '',
  ctaUrl: '',
  ctaLabelFr: '',
  ctaLabelEn: '',
  ctaLabelCn: '',
  status: 'DRAFT' as HomePopupStatus,
  priority: 0,
  startsAt: '',
  endsAt: '',
};

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function AdminHomePopupsPage() {
  const { messages } = useLocale();
  const t = messages.admin.homePopups;
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | HomePopupStatus>('all');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.adminHomePopups,
    queryFn: async () => {
      const res = await fetch('/api/admin/home-popups');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ popups: HomePopup[] }>;
    },
  });

  const popups = data?.popups ?? [];
  const filteredPopups = popups.filter(
    (popup) => statusFilter === 'all' || popup.status === statusFilter
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminHomePopups });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (popup: HomePopup) => {
    setEditingId(popup.id);
    setForm({
      titleFr: popup.titleFr,
      titleEn: popup.titleEn,
      titleCn: popup.titleCn ?? '',
      messageFr: popup.messageFr,
      messageEn: popup.messageEn,
      messageCn: popup.messageCn ?? '',
      ctaUrl: popup.ctaUrl ?? '',
      ctaLabelFr: popup.ctaLabelFr ?? '',
      ctaLabelEn: popup.ctaLabelEn ?? '',
      ctaLabelCn: popup.ctaLabelCn ?? '',
      status: popup.status,
      priority: popup.priority,
      startsAt: toDatetimeLocalValue(popup.startsAt),
      endsAt: toDatetimeLocalValue(popup.endsAt),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titleFr.trim() || !form.titleEn.trim() || !form.messageFr.trim() || !form.messageEn.trim()) {
      toast.error(t.errors.required);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        titleFr: form.titleFr.trim(),
        titleEn: form.titleEn.trim(),
        titleCn: form.titleCn.trim() || null,
        messageFr: form.messageFr.trim(),
        messageEn: form.messageEn.trim(),
        messageCn: form.messageCn.trim() || null,
        ctaUrl: form.ctaUrl.trim() || null,
        ctaLabelFr: form.ctaLabelFr.trim() || null,
        ctaLabelEn: form.ctaLabelEn.trim() || null,
        ctaLabelCn: form.ctaLabelCn.trim() || null,
        status: form.status,
        priority: form.priority,
        startsAt: fromDatetimeLocalValue(form.startsAt),
        endsAt: fromDatetimeLocalValue(form.endsAt),
      };

      const res = await fetch(
        editingId ? `/api/admin/home-popups/${editingId}` : '/api/admin/home-popups',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        toast.error(t.errors.save);
        return;
      }

      toast.success(editingId ? t.updateSuccess : t.createSuccess);
      setDialogOpen(false);
      invalidate();
    } catch {
      toast.error(t.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: HomePopupStatus) => {
    try {
      const res = await fetch(`/api/admin/home-popups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error(t.errors.save);
        return;
      }
      toast.success(t.statusUpdated);
      invalidate();
    } catch {
      toast.error(t.errors.save);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/admin/home-popups/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error(t.errors.delete);
        return;
      }
      toast.success(t.deleteSuccess);
      invalidate();
    } catch {
      toast.error(t.errors.delete);
    }
  };

  const statusBadge = (status: HomePopupStatus) => {
    if (status === 'ACTIVE') {
      return <Badge className="bg-theme-success/20 text-theme-success">{t.status.active}</Badge>;
    }
    if (status === 'ARCHIVED') {
      return <Badge variant="secondary">{t.status.archived}</Badge>;
    }
    return <Badge variant="outline">{t.status.draft}</Badge>;
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Megaphone className="h-7 w-7 text-theme-accent" />
            {t.title}
          </h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t.add}
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
        <TabsList>
          <TabsTrigger value="all">{t.filters.all}</TabsTrigger>
          <TabsTrigger value="ACTIVE">{t.filters.active}</TabsTrigger>
          <TabsTrigger value="DRAFT">{t.filters.draft}</TabsTrigger>
          <TabsTrigger value="ARCHIVED">{t.filters.archived}</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.listTitle}</CardTitle>
              <CardDescription>{t.listDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredPopups.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                filteredPopups.map((popup) => (
                  <div
                    key={popup.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{popup.titleFr}</h3>
                        {statusBadge(popup.status)}
                        <Badge variant="outline">{t.priority}: {popup.priority}</Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{popup.messageFr}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.createdAt}{' '}
                        {format(new Date(popup.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                        {popup.startsAt && (
                          <> · {t.from} {format(new Date(popup.startsAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</>
                        )}
                        {popup.endsAt && (
                          <> · {t.to} {format(new Date(popup.endsAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(popup)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        {t.edit}
                      </Button>
                      {popup.status !== 'ACTIVE' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(popup.id, 'ACTIVE')}>
                          <Play className="mr-1 h-3.5 w-3.5" />
                          {t.activate}
                        </Button>
                      )}
                      {popup.status === 'ACTIVE' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(popup.id, 'DRAFT')}>
                          <Pause className="mr-1 h-3.5 w-3.5" />
                          {t.deactivate}
                        </Button>
                      )}
                      {popup.status !== 'ARCHIVED' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(popup.id, 'ARCHIVED')}>
                          <Archive className="mr-1 h-3.5 w-3.5" />
                          {t.archive}
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(popup.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t.delete}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t.editPopup : t.createPopup}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.fields.titleFr}</Label>
                <Input value={form.titleFr} onChange={(e) => setForm({ ...form, titleFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.titleEn}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.fields.titleCn}</Label>
              <Input value={form.titleCn} onChange={(e) => setForm({ ...form, titleCn: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.fields.messageFr}</Label>
                <Textarea rows={4} value={form.messageFr} onChange={(e) => setForm({ ...form, messageFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.messageEn}</Label>
                <Textarea rows={4} value={form.messageEn} onChange={(e) => setForm({ ...form, messageEn: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.fields.messageCn}</Label>
              <Textarea rows={3} value={form.messageCn} onChange={(e) => setForm({ ...form, messageCn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t.fields.ctaUrl}</Label>
              <Input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t.fields.ctaLabelFr}</Label>
                <Input value={form.ctaLabelFr} onChange={(e) => setForm({ ...form, ctaLabelFr: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.ctaLabelEn}</Label>
                <Input value={form.ctaLabelEn} onChange={(e) => setForm({ ...form, ctaLabelEn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.ctaLabelCn}</Label>
                <Input value={form.ctaLabelCn} onChange={(e) => setForm({ ...form, ctaLabelCn: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t.fields.status}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as HomePopupStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">{t.status.draft}</SelectItem>
                    <SelectItem value="ACTIVE">{t.status.active}</SelectItem>
                    <SelectItem value="ARCHIVED">{t.status.archived}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.fields.priority}</Label>
                <Input type="number" min={0} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.fields.startsAt}</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.endsAt}</Label>
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
