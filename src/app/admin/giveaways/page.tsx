'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveawayAdmin } from '@/components/admin/giveaway-admin';
import { useGiveaways } from '@/hooks/use-giveaways';
import { useLocale } from '@/components/providers/locale-provider';
import Image from 'next/image';
import {
  GiftIcon,
  PlusIcon,
  TrophyIcon,
  UserGroupIcon,
  TrashIcon,
  PlayIcon,
  PowerIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface SkinItem {
  steam_market_hash_name: string;
  icon_url: string | null;
  price: number | null;
  rarity: string | null;
  rarity_color: string | null;
  exterior: string | null;
  item_type: string | null;
  phase: string | null;
}

interface CreateGiveawayForm {
  title: string;
  description: string;
  prize: string;
  prizeImageUrl: string;
  steamMarketHashName: string;
  ticketPrice: number;
  maxTickets: number;
  durationMinutes: number;
  rewardValueCents: number;
  durationType: string;
  winnerCount: number;
  maxEntriesPerUser: string;
  isPrivate: boolean;
  requiredAffiliateCode: string;
}

export default function AdminGiveawaysPage() {
  const { giveaways, loading, createGiveaway, drawGiveaway, refetch } = useGiveaways();
  const { messages } = useLocale();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');
  const [giveawaysEnabled, setGiveawaysEnabled] = useState(true);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [form, setForm] = useState<CreateGiveawayForm>({
    title: '',
    description: '',
    prize: '',
    prizeImageUrl: '',
    steamMarketHashName: '',
    ticketPrice: 100,
    maxTickets: 10000,
    isPrivate: false,
    requiredAffiliateCode: '',
    durationMinutes: 60,
    rewardValueCents: 0,
    durationType: 'WEEKLY',
    winnerCount: 1,
    maxEntriesPerUser: '',
  });

  const [skinSearch, setSkinSearch] = useState('');
  const [skinResults, setSkinResults] = useState<SkinItem[]>([]);
  const [skinSearchLoading, setSkinSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState<SkinItem | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchSkins = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSkinResults([]);
      setShowDropdown(false);
      return;
    }
    setSkinSearchLoading(true);
    try {
      const res = await fetch(
        `/api/admin/skinplace-items-search?search=${encodeURIComponent(q)}&limit=20`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setSkinResults(data.items ?? []);
      setShowDropdown(true);
    } catch {
      setSkinResults([]);
    } finally {
      setSkinSearchLoading(false);
    }
  }, []);

  const handleSkinSearchChange = (v: string) => {
    setSkinSearch(v);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => searchSkins(v), 400);
  };

  const handleSelectSkin = (skin: SkinItem) => {
    setSelectedSkin(skin);
    setSkinSearch(skin.steam_market_hash_name);
    setShowDropdown(false);
    setForm((prev) => ({
      ...prev,
      prize: skin.steam_market_hash_name,
      prizeImageUrl: skin.icon_url ?? '',
      steamMarketHashName: skin.steam_market_hash_name,
      rewardValueCents: skin.price != null ? Math.round(skin.price * 100) : prev.rewardValueCents,
    }));
  };

  const handleClearSkin = () => {
    setSelectedSkin(null);
    setSkinSearch('');
    setSkinResults([]);
    setShowDropdown(false);
    setForm((prev) => ({ ...prev, prize: '', prizeImageUrl: '', steamMarketHashName: '' }));
  };

  useEffect(() => {
    fetch('/api/admin/giveaways-settings')
      .then(r => r.json())
      .then(d => setGiveawaysEnabled(d.enabled ?? true))
      .catch(() => {});
  }, []);

  const handleToggleGiveaways = async (enabled: boolean) => {
    setTogglingEnabled(true);
    try {
      const res = await fetch('/api/admin/giveaways-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
      setGiveawaysEnabled(enabled);
      toast.success(enabled ? messages.admin.giveaways.toasts.pageEnabled : messages.admin.giveaways.toasts.pageDisabled);
    } catch {
      toast.error(messages.admin.giveaways.toasts.updateError);
    } finally {
      setTogglingEnabled(false);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const prizeValue = selectedSkin?.steam_market_hash_name || form.prize;
    if (!form.title || !form.description || !prizeValue) {
      toast.error(messages.admin.giveaways.create.errorRequired);
      return;
    }
    if (!form.prize && selectedSkin) {
      form.prize = selectedSkin.steam_market_hash_name;
    }

    try {
      setIsCreating(true);
      
      const endDate = new Date();
      endDate.setMinutes(endDate.getMinutes() + form.durationMinutes);

      const maxEu = form.maxEntriesPerUser.trim();
      await createGiveaway({
        title: form.title,
        description: form.description,
        prize: form.prize,
        prizeImageUrl: form.prizeImageUrl || null,
        steamMarketHashName: form.steamMarketHashName || null,
        ticketPrice: form.ticketPrice,
        maxTickets: form.maxTickets,
        endDate: endDate.toISOString(),
        rewardValueCents: form.rewardValueCents,
        durationType: form.durationType,
        winnerCount: form.winnerCount,
        maxEntriesPerUser: maxEu ? parseInt(maxEu, 10) : null,
        isPrivate: form.isPrivate,
        requiredAffiliateCode: form.isPrivate && form.requiredAffiliateCode.trim()
          ? form.requiredAffiliateCode.trim()
          : null,
      });

      setForm({
        title: '',
        description: '',
        prize: '',
        prizeImageUrl: '',
        steamMarketHashName: '',
        ticketPrice: 100,
        maxTickets: 10000,
        isPrivate: false,
        requiredAffiliateCode: '',
        durationMinutes: 60,
        rewardValueCents: 0,
        durationType: 'WEEKLY',
        winnerCount: 1,
        maxEntriesPerUser: '',
      });
      setSelectedSkin(null);
      setSkinSearch('');

      setSelectedTab('list');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleManualDraw = async (giveawayId: string) => {
    try {
      const result = await drawGiveaway(giveawayId);
      const names =
        result.winners
          ?.map((w) => w.user?.steamUsername || w.userId.slice(-8))
          .join(', ') ||
        result.winner?.steamUsername ||
        result.winner?.id ||
        '?';
      toast.success(`${messages.admin.giveaways.toasts.drawSuccess} ${names}`);
    } catch (error) {
      console.error('Erreur lors du tirage:', error);
    }
  };

  const handleDeleteGiveaway = async (giveawayId: string) => {
    if (!confirm(messages.admin.giveaways.confirmDelete)) {
      return;
    }

    try {
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(messages.admin.giveaways.toasts.deleteError);
      }

      toast.success(messages.admin.giveaways.toasts.deleteSuccess);
      refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(messages.admin.giveaways.toasts.deleteError);
    }
  };

  const activeGiveaways = giveaways.filter(g => g.status === 'ACTIVE');
  const endedGiveaways = giveaways.filter(g => g.status === 'ENDED');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4 text-white">
                <GiftIcon className="w-8 h-8 inline-block mr-2 text-orange-500" />
                {messages.admin.giveaways.title}
              </h1>
              <p className="text-slate-400">
                {messages.admin.giveaways.subtitle}
              </p>
            </div>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <PowerIcon className={`w-5 h-5 ${giveawaysEnabled ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{messages.admin.giveaways.page.pageGiveaways}</p>
                    <p className="text-xs text-slate-400">
                      {giveawaysEnabled ? messages.admin.giveaways.page.visibleToPlayers : messages.admin.giveaways.page.hiddenFromPlayers}
                    </p>
                  </div>
                  <Switch
                    checked={giveawaysEnabled}
                    onCheckedChange={handleToggleGiveaways}
                    disabled={togglingEnabled}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.giveaways.stats.active}</p>
                  <p className="text-2xl font-bold text-white">{activeGiveaways.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <GiftIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.giveaways.stats.ended}</p>
                  <p className="text-2xl font-bold text-white">{endedGiveaways.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{messages.admin.giveaways.stats.totalParticipants}</p>
                  <p className="text-2xl font-bold text-white">
                    {giveaways.reduce((total, g) => total + (g.entries?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              {messages.admin.giveaways.tabs.list}
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              {messages.admin.giveaways.tabs.create}
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              {messages.admin.giveaways.tabs.manage}
            </TabsTrigger>
          </TabsList>

          {/* Liste des Giveaways */}
          <TabsContent value="list">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">{messages.admin.giveaways.list.title}</h2>
                <Button onClick={() => refetch()} disabled={loading}>
                  {loading ? messages.admin.giveaways.list.loading : messages.admin.giveaways.list.refresh}
                </Button>
              </div>

              {loading ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-300">{messages.admin.giveaways.list.loading}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {giveaways.map((giveaway) => (
                    <Card key={giveaway.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {giveaway.prizeImageUrl && (
                                <Image
                                  src={giveaway.prizeImageUrl}
                                  alt={giveaway.prize}
                                  width={52}
                                  height={38}
                                  className="object-contain rounded shrink-0"
                                  unoptimized
                                />
                              )}
                              <h3 className="text-lg font-semibold">{giveaway.title}</h3>
                              <Badge 
                                variant={giveaway.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className={giveaway.status === 'ACTIVE' ? 'bg-green-500' : ''}
                              >
                                {giveaway.status}
                              </Badge>
                              {giveaway.isPrivate && (
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                                  {messages.admin.giveaways.list.private} · {giveaway.requiredAffiliateCode}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3">{giveaway.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">{messages.admin.giveaways.list.price}</span>
                                <p className="font-medium">{giveaway.prize}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{messages.admin.giveaways.list.entryPrice}</span>
                                <p className="font-medium">{giveaway.ticketPrice} {messages.admin.giveaways.list.fragments}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{messages.admin.giveaways.list.participants}</span>
                                <p className="font-medium">{giveaway.entries?.length || 0}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{messages.admin.giveaways.list.entries}</span>
                                <p className="font-medium">{giveaway.soldTickets} / {giveaway.maxTickets}</p>
                              </div>
                            </div>

                            {giveaway.status === 'ENDED' && giveaway.winnerId && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  <TrophyIcon className="w-4 h-4 inline mr-1" />
                                  {messages.admin.giveaways.list.winner} {giveaway.winnerId.slice(-6)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col space-y-2 ml-4">
                            {giveaway.status === 'ACTIVE' && (
                              <Button
                                onClick={() => handleManualDraw(giveaway.id)}
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                <PlayIcon className="w-4 h-4 mr-1" />
                                {messages.admin.giveaways.list.drawNow}
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => handleDeleteGiveaway(giveaway.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              {messages.admin.giveaways.list.delete}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {giveaways.length === 0 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-8 text-center">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                        <h3 className="text-xl font-semibold mb-2 text-white">{messages.admin.giveaways.list.noGiveaways}</h3>
                        <p className="text-slate-400 mb-6">
                          {messages.admin.giveaways.list.noGiveawaysDesc}
                        </p>
                        <Button onClick={() => setSelectedTab('create')}>
                          <PlusIcon className="w-4 h-4 mr-2" />
                          {messages.admin.giveaways.list.createGiveaway}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Créer un Giveaway */}
          <TabsContent value="create">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{messages.admin.giveaways.create.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGiveaway} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">{messages.admin.giveaways.form.titleLabel}</Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder={messages.admin.giveaways.create.titlePlaceholder}
                          required
                        />
                      </div>

                      <div>
                        <Label>{messages.admin.giveaways.form.prizeLabel}</Label>
                        {selectedSkin ? (
                          <div className="flex items-center gap-3 mt-1 p-3 rounded-md border border-orange-500/60 bg-slate-700/50">
                            {selectedSkin.icon_url && (
                              <Image
                                src={selectedSkin.icon_url}
                                alt={selectedSkin.steam_market_hash_name}
                                width={56}
                                height={40}
                                className="object-contain rounded shrink-0"
                                unoptimized
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{selectedSkin.steam_market_hash_name}</p>
                              <p className="text-xs text-slate-400">
                                {selectedSkin.price != null ? `~${selectedSkin.price.toFixed(2)} $` : messages.admin.giveaways.form.priceUnknown}
                                {selectedSkin.exterior ? ` · ${selectedSkin.exterior}` : ''}
                                {selectedSkin.rarity ? ` · ${selectedSkin.rarity}` : ''}
                              </p>
                            </div>
                            <button type="button" onClick={handleClearSkin} className="text-slate-400 hover:text-red-400 shrink-0">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative mt-1" ref={dropdownRef}>
                            <div className="relative">
                              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <Input
                                className="pl-9"
                                placeholder={messages.admin.giveaways.form.prizeSearchPlaceholder}
                                value={skinSearch}
                                onChange={(e) => handleSkinSearchChange(e.target.value)}
                                onFocus={() => skinResults.length > 0 && setShowDropdown(true)}
                                autoComplete="off"
                              />
                              {skinSearchLoading && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
                              )}
                            </div>
                            {showDropdown && skinResults.length > 0 && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-slate-600 bg-slate-800 shadow-xl max-h-72 overflow-y-auto">
                                {skinResults.map((skin) => (
                                  <button
                                    key={skin.steam_market_hash_name}
                                    type="button"
                                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                                    onClick={() => handleSelectSkin(skin)}
                                  >
                                    {skin.icon_url ? (
                                      <Image
                                        src={skin.icon_url}
                                        alt={skin.steam_market_hash_name}
                                        width={48}
                                        height={34}
                                        className="object-contain rounded shrink-0"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-12 h-8 bg-slate-700 rounded shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm truncate">{skin.steam_market_hash_name}</p>
                                      <p className="text-xs text-slate-400">
                                        {skin.price != null ? `~${skin.price.toFixed(2)} $` : '—'}
                                        {skin.exterior ? ` · ${skin.exterior}` : ''}
                                        {skin.rarity_color ? (
                                          <span
                                            className="ml-1 inline-block w-2 h-2 rounded-full"
                                            style={{ background: `#${skin.rarity_color}` }}
                                          />
                                        ) : null}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {!selectedSkin && (
                          <p className="text-xs text-slate-400 mt-1">
                            {messages.admin.giveaways.form.prizeManualHint}
                          </p>
                        )}
                        {!selectedSkin && (
                          <Input
                            className="mt-1"
                            placeholder={messages.admin.giveaways.form.prizeManualPlaceholder}
                            value={form.prize}
                            onChange={(e) => setForm((prev) => ({ ...prev, prize: e.target.value }))}
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="ticketPrice">{messages.admin.giveaways.form.entryPriceLabel}</Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          min="1"
                          value={form.ticketPrice}
                          onChange={(e) => setForm(prev => ({ ...prev, ticketPrice: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rewardValueCents">{messages.admin.giveaways.form.rewardValueLabel}</Label>
                        <Input
                          id="rewardValueCents"
                          type="number"
                          min="0"
                          value={form.rewardValueCents}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, rewardValueCents: parseInt(e.target.value, 10) || 0 }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="maxTickets">{messages.admin.giveaways.form.maxTicketsLabel}</Label>
                        <Input
                          id="maxTickets"
                          type="number"
                          min="1"
                          value={form.maxTickets}
                          onChange={(e) => setForm(prev => ({ ...prev, maxTickets: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="winnerCount">{messages.admin.giveaways.form.winnerCountLabel}</Label>
                        <Input
                          id="winnerCount"
                          type="number"
                          min="1"
                          value={form.winnerCount}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, winnerCount: parseInt(e.target.value, 10) || 1 }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="durationType">{messages.admin.giveaways.form.durationTypeLabel}</Label>
                        <select
                          id="durationType"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={form.durationType}
                          onChange={(e) => setForm((prev) => ({ ...prev, durationType: e.target.value }))}
                        >
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="CUSTOM">Custom</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="maxEntriesPerUser">{messages.admin.giveaways.form.maxEntriesPerUserLabel}</Label>
                        <Input
                          id="maxEntriesPerUser"
                          type="number"
                          min="1"
                          placeholder={messages.admin.giveaways.form.maxEntriesPlaceholder}
                          value={form.maxEntriesPerUser}
                          onChange={(e) => setForm((prev) => ({ ...prev, maxEntriesPerUser: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration">{messages.admin.giveaways.form.durationLabel}</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={form.durationMinutes}
                          onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 1 }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {messages.admin.giveaways.form.durationHelp}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Accès privé affilié */}
                  <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-purple-300 font-semibold">{messages.admin.giveaways.form.privateTitle}</Label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {messages.admin.giveaways.form.privateDescription}
                        </p>
                      </div>
                      <Switch
                        checked={form.isPrivate}
                        onCheckedChange={(v) => setForm((prev) => ({ ...prev, isPrivate: v, requiredAffiliateCode: v ? prev.requiredAffiliateCode : '' }))}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </div>
                    {form.isPrivate && (
                      <div>
                        <Label htmlFor="requiredAffiliateCode">{messages.admin.giveaways.form.affiliateCodeLabel}</Label>
                        <Input
                          id="requiredAffiliateCode"
                          placeholder={messages.admin.giveaways.form.affiliateCodePlaceholder}
                          value={form.requiredAffiliateCode}
                          onChange={(e) => setForm((prev) => ({ ...prev, requiredAffiliateCode: e.target.value }))}
                          className="mt-1 font-mono"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {messages.admin.giveaways.form.affiliateCodeHint}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">{messages.admin.giveaways.form.descriptionLabel}</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={messages.admin.giveaways.descriptionPlaceholder}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedTab('list')}
                    >
                      {messages.admin.giveaways.form.cancel}
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      {isCreating ? messages.admin.giveaways.form.creating : messages.admin.giveaways.form.create}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion Automatique */}
          <TabsContent value="manage">
            <div className="space-y-6">
              <GiveawayAdmin />
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{messages.admin.giveaways.info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">{messages.admin.giveaways.info.autoTitle}</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• {messages.admin.giveaways.info.autoPoint1}</li>
                        <li>• {messages.admin.giveaways.info.autoPoint2}</li>
                        <li>• {messages.admin.giveaways.info.autoPoint3}</li>
                        <li>• {messages.admin.giveaways.info.autoPoint4}</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">{messages.admin.giveaways.info.manualTitle}</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• {messages.admin.giveaways.info.manualPoint1}</li>
                        <li>• {messages.admin.giveaways.info.manualPoint2}</li>
                        <li>• {messages.admin.giveaways.info.manualPoint3}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}