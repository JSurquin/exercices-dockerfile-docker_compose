'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  LanguageIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface LegalPage {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn?: string;
  subtitleFr?: string;
  subtitleEn?: string;
  subtitleCn?: string;
  contentFr: string;
  contentEn: string;
  contentCn?: string;
  contactEmail?: string;
  contactPhone?: string;
  version: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LegalPageForm {
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn: string;
  subtitleFr: string;
  subtitleEn: string;
  subtitleCn: string;
  contentFr: string;
  contentEn: string;
  contentCn: string;
  contactEmail: string;
  contactPhone: string;
  isPublished: boolean;
}

const defaultPages = [
  { slug: 'terms', labelFr: 'CGU', labelEn: 'Terms of Service' },
  { slug: 'privacy', labelFr: 'Politique de confidentialité', labelEn: 'Privacy Policy' },
  { slug: 'kyc-policy', labelFr: 'Politique KYC', labelEn: 'KYC Policy' },
  { slug: 'aml-policy', labelFr: 'Politique AML', labelEn: 'AML Policy' },
  { slug: 'payment-cashout', labelFr: 'Paiement & cashout', labelEn: 'Payment & cashout' },
  { slug: 'mentions-legales', labelFr: 'Mentions légales', labelEn: 'Legal notice' },
  { slug: 'skin-sale-terms', labelFr: 'Vente de skins', labelEn: 'Skin sale terms' },
  { slug: 'about', labelFr: 'À propos', labelEn: 'About' },
  { slug: 'press', labelFr: 'Presse', labelEn: 'Press' },
];

const emptyForm: LegalPageForm = {
  slug: '',
  titleFr: '',
  titleEn: '',
  titleCn: '',
  subtitleFr: '',
  subtitleEn: '',
  subtitleCn: '',
  contentFr: '',
  contentEn: '',
  contentCn: '',
  contactEmail: '',
  contactPhone: '',
  isPublished: true,
};

export default function AdminLegalPagesPage() {
  const { messages } = useLocale();
  const t = messages.admin.legalPages;
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fr');
  const [form, setForm] = useState<LegalPageForm>(emptyForm);
  const [changeReason, setChangeReason] = useState('');

  const { data: legalPages = [], isLoading: loading, refetch } = useQuery({
    queryKey: queryKeys.adminLegalPages,
    queryFn: async () => {
      const response = await fetch('/api/admin/legal-pages');
      if (!response.ok) return [];
      const data = await response.json();
      return data.pages ?? [];
    },
  });
  const pages = legalPages;

  // Ouvrir le dialog pour créer/éditer
  const openEditDialog = (page?: LegalPage) => {
    if (page) {
      setEditMode('edit');
      setSelectedPage(page);
      setForm({
        slug: page.slug,
        titleFr: page.titleFr,
        titleEn: page.titleEn,
        titleCn: page.titleCn || '',
        subtitleFr: page.subtitleFr || '',
        subtitleEn: page.subtitleEn || '',
        subtitleCn: page.subtitleCn || '',
        contentFr: page.contentFr,
        contentEn: page.contentEn,
        contentCn: page.contentCn || '',
        contactEmail: page.contactEmail || '',
        contactPhone: page.contactPhone || '',
        isPublished: page.isPublished,
      });
    } else {
      setEditMode('create');
      setSelectedPage(null);
      setForm(emptyForm);
    }
    setChangeReason('');
    setDialogOpen(true);
  };

  // Traduction automatique
  const handleTranslate = async (sourceLang: 'fr' | 'en' | 'cn', targetLang: 'fr' | 'en' | 'cn') => {
    const langNames: Record<string, string> = {
      fr: 'Français',
      en: 'English',
      cn: '中文'
    };

    // Récupérer le contenu source selon la langue
    const getSourceContent = (lang: string) => {
      switch (lang) {
        case 'fr': return { title: form.titleFr, subtitle: form.subtitleFr, content: form.contentFr };
        case 'en': return { title: form.titleEn, subtitle: form.subtitleEn, content: form.contentEn };
        case 'cn': return { title: form.titleCn, subtitle: form.subtitleCn, content: form.contentCn };
        default: return { title: '', subtitle: '', content: '' };
      }
    };

    const source = getSourceContent(sourceLang);

    if (!source.title || !source.content) {
      toast.error(`${t.toasts.translateFillFirst} ${langNames[sourceLang]}`);
      return;
    }

    try {
      setTranslating(true);
      const response = await fetch('/api/admin/legal-pages/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: source.title,
          subtitle: source.subtitle,
          content: source.content,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.toasts.translateError);
      }

      const data = await response.json();
      const { translation } = data;

      setForm(prev => {
        const updates: Partial<LegalPageForm> = {};
        if (targetLang === 'fr') {
          updates.titleFr = translation.title;
          updates.subtitleFr = translation.subtitle || '';
          updates.contentFr = translation.content;
        } else if (targetLang === 'en') {
          updates.titleEn = translation.title;
          updates.subtitleEn = translation.subtitle || '';
          updates.contentEn = translation.content;
        } else if (targetLang === 'cn') {
          updates.titleCn = translation.title;
          updates.subtitleCn = translation.subtitle || '';
          updates.contentCn = translation.content;
        }
        return { ...prev, ...updates };
      });

      toast.success(t.toasts.translateSuccess.replace('{{lang}}', langNames[targetLang]));
      setActiveTab(targetLang);
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error.message || t.toasts.translateError);
    } finally {
      setTranslating(false);
    }
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!form.slug || !form.titleFr || !form.titleEn || !form.contentFr || !form.contentEn) {
      toast.error(t.toasts.missingFields);
      return;
    }

    try {
      setSaving(true);
      const url = editMode === 'create' 
        ? '/api/admin/legal-pages' 
        : `/api/admin/legal-pages/${form.slug}`;
      
      const method = editMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          changeReason: editMode === 'edit' ? changeReason : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.toasts.saveError);
      }

      toast.success(editMode === 'create' ? t.toasts.created : t.toasts.updated);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLegalPages });
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || t.toasts.saveError);
    } finally {
      setSaving(false);
    }
  };

  // Supprimer
  const handleDelete = async (slug: string) => {
    if (!confirm(t.toasts.deleteConfirm)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/legal-pages/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t.toasts.deleteError);
      }

      toast.success(t.toasts.deleted);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLegalPages });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t.toasts.deleteError);
    }
  };

  // Toggle publication
  const handleTogglePublish = async (page: LegalPage) => {
    try {
      const response = await fetch(`/api/admin/legal-pages/${page.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !page.isPublished,
          changeReason: page.isPublished ? t.list.published : t.list.draft,
        }),
      });

      if (!response.ok) {
        throw new Error(t.toasts.updateError);
      }

      toast.success(page.isPublished ? t.toasts.unpublished : t.toasts.published);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLegalPages });
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error(t.toasts.updateError);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-theme-accent to-primary bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.adminLegalPages })}
              disabled={loading}
              className="border-slate-600"
            >
              <ArrowPathIcon className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.refresh}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => openEditDialog()}
              className="bg-cta-gradient hover:brightness-110"
            >
              <PlusIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t.newPage}</span>
              <span className="sm:hidden">{t.create}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Alert info */}
      <Alert className="border-blue-500/50 bg-blue-500/10">
        <LanguageIcon className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          <strong>{t.autoTranslateTitle}</strong> {t.autoTranslateInfo}
        </AlertDescription>
      </Alert>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.stats.published}</p>
                <p className="text-xl font-bold text-white">
                  {pages.filter((p: LegalPage) => p.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <ArchiveBoxIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.stats.unpublished}</p>
                <p className="text-xl font-bold text-white">
                  {pages.filter((p: LegalPage) => !p.isPublished).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.stats.total}</p>
                <p className="text-xl font-bold text-white">{pages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <LanguageIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{t.stats.languages}</p>
                <p className="text-xl font-bold text-white">FR / EN</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-theme-highlight" />
              {t.list.title}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {t.list.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="w-8 h-8 text-theme-highlight animate-spin" />
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h3 className="text-xl font-semibold mb-2 text-white">{t.list.empty}</h3>
                <p className="text-slate-400 mb-6">
                  {t.list.emptyDesc}
                </p>
                <Button onClick={() => openEditDialog()}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  {t.list.createFirst}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pages.map((page: LegalPage) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-theme-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-white">{page.titleFr}</h3>
                        <Badge variant="outline" className="text-xs">
                          /{page.slug}
                        </Badge>
                        {page.isPublished ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            {t.list.published}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            {t.list.draft}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {page.titleEn} • Version {page.version}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {t.list.updatedAt} {new Date(page.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                        className="text-slate-400 hover:text-white"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(page)}
                        className="text-slate-400 hover:text-white"
                      >
                        {page.isPublished ? (
                          <ArchiveBoxIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(page)}
                        className="text-slate-400 hover:text-theme-highlight"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(page.slug)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Suggested pages */}
      {pages.length < defaultPages.length && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t.suggested.title}</CardTitle>
            <CardDescription className="text-slate-400">
              {t.suggested.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defaultPages
                .filter(dp => !pages.some((p: LegalPage) => p.slug === dp.slug))
                .map((dp) => (
                  <Button
                    key={dp.slug}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setForm({
                        ...emptyForm,
                        slug: dp.slug,
                        titleFr: dp.labelFr,
                        titleEn: dp.labelEn,
                      });
                      setEditMode('create');
                      setDialogOpen(true);
                    }}
                    className="border-slate-600 hover:border-theme-accent/50"
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    {dp.labelFr}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editMode === 'create' ? t.dialog.createTitle : `${t.dialog.editTitle} ${selectedPage?.titleFr}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Slug and metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">{t.dialog.slugLabel}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  placeholder={t.dialog.slugPlaceholder}
                  disabled={editMode === 'edit'}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500">{t.dialog.slugUrl} /{form.slug || 'slug'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-200">{t.dialog.contactEmail}</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder={t.dialog.contactEmailPlaceholder}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200">{t.dialog.contactPhone}</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder={t.dialog.contactPhonePlaceholder}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={form.isPublished}
                onCheckedChange={(checked: boolean) => setForm(prev => ({ ...prev, isPublished: checked }))}
              />
              <Label htmlFor="published" className="text-slate-200">
                {t.dialog.publishSwitch}
              </Label>
            </div>

            <Separator className="bg-slate-700" />

            {/* Content tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <TabsList className="bg-slate-800">
                  <TabsTrigger value="fr" className="data-[state=active]:bg-primary">
                    🇫🇷 Français
                  </TabsTrigger>
                  <TabsTrigger value="en" className="data-[state=active]:bg-primary">
                    🇬🇧 English
                  </TabsTrigger>
                  <TabsTrigger value="cn" className="data-[state=active]:bg-primary">
                    🇨🇳 中文
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('fr', 'en')}
                    disabled={translating || !form.titleFr || !form.contentFr}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    FR → EN
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('fr', 'cn')}
                    disabled={translating || !form.titleFr || !form.contentFr}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    FR → 中文
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('en', 'fr')}
                    disabled={translating || !form.titleEn || !form.contentEn}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    EN → FR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('en', 'cn')}
                    disabled={translating || !form.titleEn || !form.contentEn}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    EN → 中文
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('cn', 'fr')}
                    disabled={translating || !form.titleCn || !form.contentCn}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    中文 → FR
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslate('cn', 'en')}
                    disabled={translating || !form.titleCn || !form.contentCn}
                    className="border-slate-600"
                  >
                    <LanguageIcon className={`w-4 h-4 mr-1 ${translating ? 'animate-pulse' : ''}`} />
                    中文 → EN
                  </Button>
                </div>
              </div>

              <TabsContent value="fr" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.titleLabel}</Label>
                  <Input
                    value={form.titleFr}
                    onChange={(e) => setForm(prev => ({ ...prev, titleFr: e.target.value }))}
                    placeholder={t.dialog.titlePlaceholderFr}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.subtitleLabel}</Label>
                  <Input
                    value={form.subtitleFr}
                    onChange={(e) => setForm(prev => ({ ...prev, subtitleFr: e.target.value }))}
                    placeholder={t.dialog.subtitlePlaceholderFr}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.contentLabel}</Label>
                  <Textarea
                    value={form.contentFr}
                    onChange={(e) => setForm(prev => ({ ...prev, contentFr: e.target.value }))}
                    placeholder={t.dialog.contentPlaceholderFr}
                    rows={15}
                    className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.titleLabel}</Label>
                  <Input
                    value={form.titleEn}
                    onChange={(e) => setForm(prev => ({ ...prev, titleEn: e.target.value }))}
                    placeholder={t.dialog.titlePlaceholderEn}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.subtitleLabel}</Label>
                  <Input
                    value={form.subtitleEn}
                    onChange={(e) => setForm(prev => ({ ...prev, subtitleEn: e.target.value }))}
                    placeholder={t.dialog.subtitlePlaceholderEn}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.contentLabel}</Label>
                  <Textarea
                    value={form.contentEn}
                    onChange={(e) => setForm(prev => ({ ...prev, contentEn: e.target.value }))}
                    placeholder={t.dialog.contentPlaceholderEn}
                    rows={15}
                    className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="cn" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.titleLabel}</Label>
                  <Input
                    value={form.titleCn}
                    onChange={(e) => setForm(prev => ({ ...prev, titleCn: e.target.value }))}
                    placeholder={t.dialog.titlePlaceholderCn}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.subtitleLabel}</Label>
                  <Input
                    value={form.subtitleCn}
                    onChange={(e) => setForm(prev => ({ ...prev, subtitleCn: e.target.value }))}
                    placeholder={t.dialog.subtitlePlaceholderCn}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">{t.dialog.contentLabel}</Label>
                  <Textarea
                    value={form.contentCn}
                    onChange={(e) => setForm(prev => ({ ...prev, contentCn: e.target.value }))}
                    placeholder={t.dialog.contentPlaceholderCn}
                    rows={15}
                    className="bg-slate-800 border-slate-600 text-white font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Change reason (edit mode) */}
            {editMode === 'edit' && (
              <div className="space-y-2">
                <Label className="text-slate-200">{t.dialog.changeReason}</Label>
                <Input
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder={t.dialog.changeReasonPlaceholder}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500">
                  {t.dialog.changeReasonHelp}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {t.dialog.requiredFields}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-600"
              >
                {t.dialog.cancel}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-cta-gradient hover:brightness-110"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    {t.dialog.saving}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {editMode === 'create' ? t.dialog.createBtn : t.dialog.save}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

