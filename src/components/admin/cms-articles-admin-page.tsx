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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { isPressCoverageArticle } from '@/lib/press-article-content';
import {
  HELP_CATEGORY_KEYS,
  formatViewCount,
  type HelpCategoryKey,
} from '@/lib/help-articles-config';

export interface CmsArticleRecord {
  id: string;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn?: string | null;
  subtitleFr?: string | null;
  subtitleEn?: string | null;
  subtitleCn?: string | null;
  summaryFr?: string | null;
  summaryEn?: string | null;
  summaryCn?: string | null;
  contentFr: string;
  contentEn: string;
  contentCn?: string | null;
  category?: string | null;
  sourceName?: string | null;
  externalUrl?: string | null;
  publishedAt?: string;
  isPublished: boolean;
  sortOrder?: number;
  updatedAt: string;
  source?: 'static' | 'cms';
  categoryKey?: HelpCategoryKey;
  viewCount?: number;
  helpfulYes?: number;
  helpfulNo?: number;
  helpfulPercent?: number | null;
}

interface CmsArticleForm {
  slug: string;
  titleFr: string;
  titleEn: string;
  titleCn: string;
  subtitleFr: string;
  subtitleEn: string;
  subtitleCn: string;
  summaryFr: string;
  summaryEn: string;
  summaryCn: string;
  contentFr: string;
  contentEn: string;
  contentCn: string;
  category: string;
  sourceName: string;
  externalUrl: string;
  publishedAt: string;
  isPublished: boolean;
  sortOrder: number;
}

type PressArticleType = 'release' | 'coverage';

interface CmsArticlesAdminPageProps {
  kind: 'help' | 'press';
  apiBase: string;
  queryKey: readonly string[];
  publicPathPrefix: string;
  title: string;
  subtitle: string;
  suggestedSlugs?: Array<{ slug: string; label: string }>;
}

const emptyForm: CmsArticleForm = {
  slug: '',
  titleFr: '',
  titleEn: '',
  titleCn: '',
  subtitleFr: '',
  subtitleEn: '',
  subtitleCn: '',
  summaryFr: '',
  summaryEn: '',
  summaryCn: '',
  contentFr: '',
  contentEn: '',
  contentCn: '',
  category: '',
  sourceName: '',
  externalUrl: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  isPublished: true,
  sortOrder: 0,
};

export function CmsArticlesAdminPage({
  kind,
  apiBase,
  queryKey,
  publicPathPrefix,
  title,
  subtitle,
  suggestedSlugs = [],
}: CmsArticlesAdminPageProps) {
  const { messages } = useLocale();
  const t = messages.admin.legalPages;
  const helpT = messages.admin.helpArticles;
  const pressT = messages.admin.pressArticles;
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fr');
  const [articleType, setArticleType] = useState<PressArticleType>('release');
  const [form, setForm] = useState<CmsArticleForm>(emptyForm);

  const { data: articles = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(apiBase);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.articles ?? []) as CmsArticleRecord[];
    },
  });

  const groupedHelpArticles =
    kind === 'help'
      ? HELP_CATEGORY_KEYS.map((categoryKey) => ({
          categoryKey,
          label: messages.help.categories[categoryKey],
          articles: articles.filter(
            (a) => (a.categoryKey ?? a.category) === categoryKey,
          ),
        })).filter((g) => g.articles.length > 0)
      : [];

  const topViewedSlugs =
    kind === 'help'
      ? [...articles]
          .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
          .slice(0, 3)
          .map((a) => a.slug)
      : [];

  const renderArticleRow = (article: CmsArticleRecord) => (
    <div
      key={article.id}
      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-theme-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1">
          <h3 className="font-semibold text-white">{article.titleFr}</h3>
          <Badge variant="outline" className="text-xs">
            {publicPathPrefix}/{article.slug}
          </Badge>
          {article.isPublished ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">{t.list.published}</Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">{t.list.draft}</Badge>
          )}
          {kind === 'help' && article.source === 'static' ? (
            <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/50">{helpT.builtIn}</Badge>
          ) : null}
          {kind === 'help' && topViewedSlugs.includes(article.slug) ? (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">{helpT.popular}</Badge>
          ) : null}
          {kind === 'press' && isPressCoverageArticle(article.externalUrl) ? (
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">{pressT.formTypeCoverage}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-slate-400 truncate">{article.titleEn}</p>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
          <span className="flex items-center">
            <ClockIcon className="w-3 h-3 mr-1" />
            {t.list.updatedAt} {new Date(article.updatedAt).toLocaleDateString('fr-FR')}
          </span>
          {kind === 'help' && article.viewCount != null ? (
            <>
              <span className="flex items-center">
                <EyeIcon className="w-3 h-3 mr-1" />
                {formatViewCount(article.viewCount)} {helpT.views}
              </span>
              {article.helpfulPercent != null ? (
                <span className="text-green-400/80">
                  {article.helpfulPercent}% {helpT.helpful}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`${publicPathPrefix}/${article.slug}`, '_blank')}
          className="text-slate-400 hover:text-white"
        >
          <EyeIcon className="w-4 h-4" />
        </Button>
        {kind === 'help' && article.source === 'static' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditMode('create');
              setForm({
                ...emptyForm,
                slug: article.slug,
                titleFr: article.titleFr,
                titleEn: article.titleEn,
                contentFr: article.contentFr,
                contentEn: article.contentEn,
                category: article.categoryKey ?? article.category ?? '',
                sortOrder: article.sortOrder ?? 0,
              });
              setDialogOpen(true);
            }}
            className="text-slate-400 hover:text-theme-highlight"
            title="Migrer vers CMS"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTogglePublish(article)}
              className="text-slate-400 hover:text-white"
            >
              {article.isPublished ? (
                <ArchiveBoxIcon className="w-4 h-4" />
              ) : (
                <CheckCircleIcon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(article)}
              className="text-slate-400 hover:text-theme-highlight"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(article.slug)}
              className="text-slate-400 hover:text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const openEditDialog = (article?: CmsArticleRecord) => {
    if (article) {
      setEditMode('edit');
      setArticleType(isPressCoverageArticle(article.externalUrl) ? 'coverage' : 'release');
      setForm({
        slug: article.slug,
        titleFr: article.titleFr,
        titleEn: article.titleEn,
        titleCn: article.titleCn || '',
        subtitleFr: article.subtitleFr || '',
        subtitleEn: article.subtitleEn || '',
        subtitleCn: article.subtitleCn || '',
        summaryFr: article.summaryFr || '',
        summaryEn: article.summaryEn || '',
        summaryCn: article.summaryCn || '',
        contentFr: article.contentFr,
        contentEn: article.contentEn,
        contentCn: article.contentCn || '',
        category: article.category || '',
        sourceName: article.sourceName || '',
        externalUrl: article.externalUrl || '',
        publishedAt: article.publishedAt
          ? new Date(article.publishedAt).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        isPublished: article.isPublished,
        sortOrder: article.sortOrder ?? 0,
      });
    } else {
      setEditMode('create');
      setArticleType('release');
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.titleFr || !form.titleEn) {
      toast.error(t.toasts.missingFields);
      return;
    }

    if (kind === 'press' && articleType === 'coverage') {
      if (!form.sourceName.trim() || !form.externalUrl.trim()) {
        toast.error(pressT.missingCoverageFields);
        return;
      }
    } else if (!form.contentFr || !form.contentEn) {
      toast.error(t.toasts.missingFields);
      return;
    }

    const payload =
      kind === 'press' && articleType === 'coverage'
        ? { ...form, contentFr: form.contentFr || form.summaryFr, contentEn: form.contentEn || form.summaryEn }
        : form;

    try {
      setSaving(true);
      const url = editMode === 'create' ? apiBase : `${apiBase}/${form.slug}`;
      const method = editMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t.toasts.saveError);
      }

      toast.success(editMode === 'create' ? t.toasts.created : t.toasts.updated);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t.toasts.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(t.toasts.deleteConfirm)) return;

    try {
      const response = await fetch(`${apiBase}/${slug}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(t.toasts.deleteError);
      toast.success(t.toasts.deleted);
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error(t.toasts.deleteError);
    }
  };

  const handleTogglePublish = async (article: CmsArticleRecord) => {
    try {
      const response = await fetch(`${apiBase}/${article.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });
      if (!response.ok) throw new Error(t.toasts.updateError);
      toast.success(article.isPublished ? t.toasts.unpublished : t.toasts.published);
      queryClient.invalidateQueries({ queryKey });
    } catch {
      toast.error(t.toasts.updateError);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-theme-accent to-primary bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey })}
              disabled={loading}
              className="border-slate-600"
            >
              <ArrowPathIcon className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.refresh}</span>
            </Button>
            <Button size="sm" onClick={() => openEditDialog()} className="bg-cta-gradient hover:brightness-110">
              <PlusIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{kind === 'press' ? pressT.newArticle : t.newPage}</span>
              <span className="sm:hidden">{t.create}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-theme-highlight" />
            {t.list.title}
          </CardTitle>
          <CardDescription className="text-slate-400">{t.list.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <ArrowPathIcon className="w-8 h-8 text-theme-highlight animate-spin" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-semibold mb-2 text-white">{t.list.empty}</h3>
              <p className="text-slate-400 mb-6">{t.list.emptyDesc}</p>
              <Button onClick={() => openEditDialog()}>
                <PlusIcon className="w-4 h-4 mr-2" />
                {t.list.createFirst}
              </Button>
            </div>
          ) : kind === 'help' ? (
            <div className="space-y-6">
              {groupedHelpArticles.map((group) => (
                <div key={group.categoryKey}>
                  <h3 className="text-sm font-semibold text-theme-highlight uppercase tracking-wide mb-3">
                    {group.label}
                    <span className="ml-2 text-slate-500 font-normal normal-case">
                      ({group.articles.length})
                    </span>
                  </h3>
                  <div className="space-y-3">{group.articles.map(renderArticleRow)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => renderArticleRow(article))}
            </div>
          )}
        </CardContent>
      </Card>

      {suggestedSlugs.length > 0 && articles.length < suggestedSlugs.length && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{t.suggested.title}</CardTitle>
            <CardDescription className="text-slate-400">{t.suggested.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedSlugs
                .filter((item) => !articles.some((a) => a.slug === item.slug))
                .map((item) => (
                  <Button
                    key={item.slug}
                    variant="outline"
                    size="sm"
                    className="border-slate-600"
                    onClick={() => {
                      setEditMode('create');
                      setForm({ ...emptyForm, slug: item.slug, titleFr: item.label, titleEn: item.label });
                      setDialogOpen(true);
                    }}
                  >
                    <PlusIcon className="w-3 h-3 mr-1" />
                    {item.label}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editMode === 'create' ? t.dialog.createTitle : t.dialog.editTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {kind === 'press' && (
              <div className="space-y-2">
                <Label>Type d&apos;article</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={articleType === 'release' ? 'default' : 'outline'}
                    className={articleType === 'release' ? 'bg-cta-gradient' : 'border-slate-600'}
                    onClick={() => setArticleType('release')}
                  >
                    {pressT.formTypeRelease}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={articleType === 'coverage' ? 'default' : 'outline'}
                    className={articleType === 'coverage' ? 'bg-cta-gradient' : 'border-slate-600'}
                    onClick={() => setArticleType('coverage')}
                  >
                    {pressT.formTypeCoverage}
                  </Button>
                </div>
                {articleType === 'coverage' ? (
                  <p className="text-xs text-slate-400">{pressT.formTypeCoverageHint}</p>
                ) : null}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  disabled={editMode === 'edit'}
                  placeholder="scam"
                  className="bg-slate-800 border-slate-600"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {publicPathPrefix}/{form.slug || '...'}
                </p>
              </div>
              {kind === 'help' ? (
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                  >
                    <option value="">{helpT.categoryPlaceholder}</option>
                    {HELP_CATEGORY_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {messages.help.categories[key]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="publishedAt">Date de publication</Label>
                  <Input
                    id="publishedAt"
                    type="date"
                    value={form.publishedAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              )}
            </div>

            {kind === 'press' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sourceName">
                    Source / média {articleType === 'coverage' ? '*' : ''}
                  </Label>
                  <Input
                    id="sourceName"
                    value={form.sourceName}
                    onChange={(e) => setForm((prev) => ({ ...prev, sourceName: e.target.value }))}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
                <div>
                  <Label htmlFor="externalUrl">
                    Lien article original {articleType === 'coverage' ? '*' : ''}
                  </Label>
                  <Input
                    id="externalUrl"
                    value={form.externalUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
                    placeholder="https://..."
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-800">
                <TabsTrigger value="fr">FR</TabsTrigger>
                <TabsTrigger value="en">EN</TabsTrigger>
                <TabsTrigger value="cn">CN</TabsTrigger>
              </TabsList>

              {(['fr', 'en', 'cn'] as const).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-3 mt-4">
                  <div>
                    <Label>Titre ({lang.toUpperCase()})</Label>
                    <Input
                      value={form[`title${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [`title${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]: e.target.value,
                        }))
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>{kind === 'press' ? 'Résumé' : 'Sous-titre'} ({lang.toUpperCase()})</Label>
                    <Input
                      value={
                        kind === 'press'
                          ? form[`summary${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]
                          : form[`subtitle${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]
                      }
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [kind === 'press'
                            ? `summary${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`
                            : `subtitle${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]: e.target.value,
                        }))
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>
                      Contenu Markdown ({lang.toUpperCase()})
                      {kind === 'press' && articleType === 'coverage' ? ` — ${pressT.contentOptional}` : ''}
                    </Label>
                    <Textarea
                      value={form[`content${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [`content${lang === 'fr' ? 'Fr' : lang === 'en' ? 'En' : 'Cn'}`]: e.target.value,
                        }))
                      }
                      rows={12}
                      className="bg-slate-800 border-slate-600 font-mono text-sm"
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
              />
              <Label htmlFor="isPublished">{t.list.published}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-slate-600">
              {t.dialog.cancel}
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving} className="bg-cta-gradient">
              {saving ? t.dialog.saving : t.dialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
