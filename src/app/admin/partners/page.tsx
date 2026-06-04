'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { getYoutubeThumbnailUrl } from '@/lib/youtube';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Heart,
  Plus,
  Pencil,
  Trash2,
  Video,
  Users,
  GripVertical,
} from 'lucide-react';

interface PartnerVideo {
  id: string;
  youtubeVideoUrl: string;
  youtubeVideoId: string;
  creatorName: string;
  subscriberCount: string | null;
  avatarUrl: string | null;
  youtubeChannelUrl: string | null;
  twitterUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface PartnerLogo {
  id: string;
  name: string;
  logoUrl: string;
  profileUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyVideoForm = {
  youtubeVideoUrl: '',
  creatorName: '',
  subscriberCount: '',
  avatarUrl: '',
  youtubeChannelUrl: '',
  twitterUrl: '',
  sortOrder: 0,
  isActive: true,
};

const emptyLogoForm = {
  name: '',
  logoUrl: '',
  profileUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminPartnersPage() {
  const { messages } = useLocale();
  const t = messages.admin.partners;
  const queryClient = useQueryClient();

  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingLogoId, setEditingLogoId] = useState<string | null>(null);
  const [videoForm, setVideoForm] = useState(emptyVideoForm);
  const [logoForm, setLogoForm] = useState(emptyLogoForm);
  const [saving, setSaving] = useState(false);

  const { data: videosData, isLoading: videosLoading } = useQuery({
    queryKey: queryKeys.adminPartnerVideos,
    queryFn: async () => {
      const res = await fetch('/api/admin/partners/videos');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ videos: PartnerVideo[] }>;
    },
  });

  const { data: logosData, isLoading: logosLoading } = useQuery({
    queryKey: queryKeys.adminPartnerLogos,
    queryFn: async () => {
      const res = await fetch('/api/admin/partners/logos');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ logos: PartnerLogo[] }>;
    },
  });

  const videos = videosData?.videos ?? [];
  const logos = logosData?.logos ?? [];

  const openCreateVideo = () => {
    setEditingVideoId(null);
    setVideoForm(emptyVideoForm);
    setVideoDialogOpen(true);
  };

  const openEditVideo = (video: PartnerVideo) => {
    setEditingVideoId(video.id);
    setVideoForm({
      youtubeVideoUrl: video.youtubeVideoUrl,
      creatorName: video.creatorName,
      subscriberCount: video.subscriberCount ?? '',
      avatarUrl: video.avatarUrl ?? '',
      youtubeChannelUrl: video.youtubeChannelUrl ?? '',
      twitterUrl: video.twitterUrl ?? '',
      sortOrder: video.sortOrder,
      isActive: video.isActive,
    });
    setVideoDialogOpen(true);
  };

  const openCreateLogo = () => {
    setEditingLogoId(null);
    setLogoForm(emptyLogoForm);
    setLogoDialogOpen(true);
  };

  const openEditLogo = (logo: PartnerLogo) => {
    setEditingLogoId(logo.id);
    setLogoForm({
      name: logo.name,
      logoUrl: logo.logoUrl,
      profileUrl: logo.profileUrl ?? '',
      sortOrder: logo.sortOrder,
      isActive: logo.isActive,
    });
    setLogoDialogOpen(true);
  };

  const saveVideo = async () => {
    if (!videoForm.youtubeVideoUrl || !videoForm.creatorName) {
      toast.error(t.errors.required);
      return;
    }
    setSaving(true);
    try {
      const url = editingVideoId
        ? `/api/admin/partners/videos/${editingVideoId}`
        : '/api/admin/partners/videos';
      const res = await fetch(url, {
        method: editingVideoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.errors.save);
        return;
      }
      toast.success(editingVideoId ? t.videos.updateSuccess : t.videos.createSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPartnerVideos });
      setVideoDialogOpen(false);
    } catch {
      toast.error(t.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const saveLogo = async () => {
    if (!logoForm.name || !logoForm.logoUrl) {
      toast.error(t.errors.required);
      return;
    }
    setSaving(true);
    try {
      const url = editingLogoId
        ? `/api/admin/partners/logos/${editingLogoId}`
        : '/api/admin/partners/logos';
      const res = await fetch(url, {
        method: editingLogoId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logoForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t.errors.save);
        return;
      }
      toast.success(editingLogoId ? t.logos.updateSuccess : t.logos.createSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPartnerLogos });
      setLogoDialogOpen(false);
    } catch {
      toast.error(t.errors.save);
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm(t.videos.deleteConfirm)) return;
    const res = await fetch(`/api/admin/partners/videos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(t.videos.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPartnerVideos });
    } else {
      toast.error(t.errors.delete);
    }
  };

  const deleteLogo = async (id: string) => {
    if (!confirm(t.logos.deleteConfirm)) return;
    const res = await fetch(`/api/admin/partners/logos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(t.logos.deleteSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminPartnerLogos });
    } else {
      toast.error(t.errors.delete);
    }
  };

  const previewVideoId = videoForm.youtubeVideoUrl.match(/[a-zA-Z0-9_-]{11}/)?.[0];

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-xl bg-theme-accent/20 p-3">
            <Heart className="h-8 w-8 text-theme-highlight" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t.title}</h1>
            <p className="text-slate-400">{t.subtitle}</p>
          </div>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              {t.tabs.videos}
            </TabsTrigger>
            <TabsTrigger value="logos" className="gap-2">
              <Users className="h-4 w-4" />
              {t.tabs.logos}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">{t.videos.title}</CardTitle>
                  <CardDescription className="text-slate-400">{t.videos.description}</CardDescription>
                </div>
                <Button onClick={openCreateVideo} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.videos.add}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {videosLoading ? (
                  <PageLoading variant="compact" message={t.loading} className="py-8" />
                ) : videos.length === 0 ? (
                  <p className="text-slate-400">{t.videos.empty}</p>
                ) : (
                  videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={getYoutubeThumbnailUrl(video.youtubeVideoId, 'hq')}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">{video.creatorName}</span>
                          {!video.isActive && (
                            <Badge variant="outline" className="border-slate-500 text-slate-400">
                              {t.inactive}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">
                            <GripVertical className="mr-1 inline h-3 w-3" />
                            {t.order}: {video.sortOrder}
                          </span>
                        </div>
                        <p className="truncate text-sm text-slate-400">{video.youtubeVideoUrl}</p>
                        {video.subscriberCount && (
                          <p className="text-xs text-slate-500">{video.subscriberCount}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditVideo(video)}
                          className="border-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVideo(video.id)}
                          className="border-red-900/50 text-red-400 hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logos">
            <Card className="border-slate-700 bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">{t.logos.title}</CardTitle>
                  <CardDescription className="text-slate-400">{t.logos.description}</CardDescription>
                </div>
                <Button onClick={openCreateLogo} className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.logos.add}
                </Button>
              </CardHeader>
              <CardContent>
                {logosLoading ? (
                  <PageLoading variant="compact" message={t.loading} className="py-8" />
                ) : logos.length === 0 ? (
                  <p className="text-slate-400">{t.logos.empty}</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {logos.map((logo) => (
                      <div
                        key={logo.id}
                        className="flex items-center gap-4 rounded-lg border border-slate-700 bg-slate-800/50 p-4"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logo.logoUrl} alt={logo.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{logo.name}</p>
                          <p className="text-xs text-slate-500">
                            {t.order}: {logo.sortOrder}
                            {!logo.isActive && ` · ${t.inactive}`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLogo(logo)}
                            className="border-slate-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteLogo(logo.id)}
                            className="border-red-900/50 text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-700 bg-slate-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingVideoId ? t.videos.edit : t.videos.add}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.videos.fields.youtubeUrl}</Label>
              <Input
                value={videoForm.youtubeVideoUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, youtubeVideoUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="border-slate-600 bg-slate-800"
              />
            </div>
            {previewVideoId && (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={getYoutubeThumbnailUrl(previewVideoId)}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t.videos.fields.creatorName}</Label>
              <Input
                value={videoForm.creatorName}
                onChange={(e) => setVideoForm((f) => ({ ...f, creatorName: e.target.value }))}
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.videos.fields.subscriberCount}</Label>
              <Input
                value={videoForm.subscriberCount}
                onChange={(e) => setVideoForm((f) => ({ ...f, subscriberCount: e.target.value }))}
                placeholder="17.2k"
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.videos.fields.avatarUrl}</Label>
              <Input
                value={videoForm.avatarUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://..."
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.videos.fields.youtubeChannelUrl}</Label>
              <Input
                value={videoForm.youtubeChannelUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, youtubeChannelUrl: e.target.value }))}
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.videos.fields.twitterUrl}</Label>
              <Input
                value={videoForm.twitterUrl}
                onChange={(e) => setVideoForm((f) => ({ ...f, twitterUrl: e.target.value }))}
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.order}</Label>
              <Input
                type="number"
                min={0}
                value={videoForm.sortOrder}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                }
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={videoForm.isActive}
                onCheckedChange={(v) => setVideoForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>{t.active}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)} className="border-slate-600">
              {t.cancel}
            </Button>
            <Button onClick={saveVideo} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLogoId ? t.logos.edit : t.logos.add}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.logos.fields.name}</Label>
              <Input
                value={logoForm.name}
                onChange={(e) => setLogoForm((f) => ({ ...f, name: e.target.value }))}
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.logos.fields.logoUrl}</Label>
              <Input
                value={logoForm.logoUrl}
                onChange={(e) => setLogoForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
                className="border-slate-600 bg-slate-800"
              />
            </div>
            {logoForm.logoUrl && (
              <div className="mx-auto h-16 w-16 overflow-hidden rounded-full">
                <img src={logoForm.logoUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t.logos.fields.profileUrl}</Label>
              <Input
                value={logoForm.profileUrl}
                onChange={(e) => setLogoForm((f) => ({ ...f, profileUrl: e.target.value }))}
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.order}</Label>
              <Input
                type="number"
                min={0}
                value={logoForm.sortOrder}
                onChange={(e) =>
                  setLogoForm((f) => ({ ...f, sortOrder: parseInt(e.target.value, 10) || 0 }))
                }
                className="border-slate-600 bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={logoForm.isActive}
                onCheckedChange={(v) => setLogoForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>{t.active}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoDialogOpen(false)} className="border-slate-600">
              {t.cancel}
            </Button>
            <Button onClick={saveLogo} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
