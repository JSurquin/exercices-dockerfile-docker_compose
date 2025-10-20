'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GiveawayAdmin } from '@/components/admin/giveaway-admin';
import { useGiveaways, GiveawayWithEntries } from '@/hooks/use-giveaways';
import { useLocale } from '@/components/providers/locale-provider';
import {
  GiftIcon,
  PlusIcon,
  TrophyIcon,
  TicketIcon,
  CalendarIcon,
  UserGroupIcon,
  TrashIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface CreateGiveawayForm {
  title: string;
  description: string;
  prize: string;
  ticketPrice: number;
  maxTickets: number;
  durationMinutes: number;
}

export default function AdminGiveawaysPage() {
  const { giveaways, loading, createGiveaway, drawGiveaway, refetch } = useGiveaways();
  const { messages } = useLocale();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('list');
  const [form, setForm] = useState<CreateGiveawayForm>({
    title: '',
    description: '',
    prize: '',
    ticketPrice: 5,
    maxTickets: 100,
    durationMinutes: 60,
  });

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.description || !form.prize) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsCreating(true);
      
      const endDate = new Date();
      endDate.setMinutes(endDate.getMinutes() + form.durationMinutes);

      await createGiveaway({
        title: form.title,
        description: form.description,
        prize: form.prize,
        ticketPrice: form.ticketPrice,
        maxTickets: form.maxTickets,
        endDate: endDate.toISOString(),
      });

      // Reset form
      setForm({
        title: '',
        description: '',
        prize: '',
        ticketPrice: 5,
        maxTickets: 100,
        durationMinutes: 60,
      });

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
      toast.success(`Tirage effectué ! Gagnant: ${result.winner?.steamUsername || result.winner?.id || 'Inconnu'}`);
    } catch (error) {
      console.error('Erreur lors du tirage:', error);
    }
  };

  const handleDeleteGiveaway = async (giveawayId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce giveaway ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/giveaways/${giveawayId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast.success('Giveaway supprimé avec succès');
      refetch();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
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
          <h1 className="text-3xl font-bold mb-4">
            <GiftIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Administration des Giveaways
          </h1>
          <p className="text-muted-foreground">
            Gérez les giveaways, créez de nouveaux concours et effectuez les tirages.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giveaways Actifs</p>
                  <p className="text-2xl font-bold">{activeGiveaways.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <GiftIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giveaways Terminés</p>
                  <p className="text-2xl font-bold">{endedGiveaways.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-bold">
                    {giveaways.reduce((total, g) => total + (g.entries?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Liste des Giveaways</TabsTrigger>
            <TabsTrigger value="create">Créer un Giveaway</TabsTrigger>
            <TabsTrigger value="manage">Gestion Automatique</TabsTrigger>
          </TabsList>

          {/* Liste des Giveaways */}
          <TabsContent value="list">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Tous les Giveaways</h2>
                <Button onClick={() => refetch()} disabled={loading}>
                  {loading ? 'Chargement...' : 'Actualiser'}
                </Button>
              </div>

              {loading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p>Chargement des giveaways...</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {giveaways.map((giveaway) => (
                    <Card key={giveaway.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{giveaway.title}</h3>
                              <Badge 
                                variant={giveaway.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className={giveaway.status === 'ACTIVE' ? 'bg-green-500' : ''}
                              >
                                {giveaway.status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{giveaway.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Prix:</span>
                                <p className="font-medium">{giveaway.prize}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Prix ticket:</span>
                                <p className="font-medium">{giveaway.ticketPrice} tickets</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Participants:</span>
                                <p className="font-medium">{giveaway.entries?.length || 0}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tickets vendus:</span>
                                <p className="font-medium">{giveaway.soldTickets} / {giveaway.maxTickets}</p>
                              </div>
                            </div>

                            {giveaway.status === 'ENDED' && giveaway.winnerId && (
                              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  <TrophyIcon className="w-4 h-4 inline mr-1" />
                                  Gagnant: {giveaway.winnerId.slice(-6)}
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
                                Tirer maintenant
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => handleDeleteGiveaway(giveaway.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {giveaways.length === 0 && (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">Aucun giveaway</h3>
                        <p className="text-muted-foreground mb-6">
                          Créez votre premier giveaway pour commencer.
                        </p>
                        <Button onClick={() => setSelectedTab('create')}>
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Créer un giveaway
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
            <Card>
              <CardHeader>
                <CardTitle>Créer un nouveau Giveaway</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGiveaway} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={form.title}
                          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Ex: AK-47 Redline Giveaway"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="prize">Prix à gagner *</Label>
                        <Input
                          id="prize"
                          value={form.prize}
                          onChange={(e) => setForm(prev => ({ ...prev, prize: e.target.value }))}
                          placeholder="Ex: AK-47 | Redline (Field-Tested)"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="ticketPrice">Prix par ticket</Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          min="1"
                          value={form.ticketPrice}
                          onChange={(e) => setForm(prev => ({ ...prev, ticketPrice: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="maxTickets">Nombre maximum de tickets</Label>
                        <Input
                          id="maxTickets"
                          type="number"
                          min="1"
                          value={form.maxTickets}
                          onChange={(e) => setForm(prev => ({ ...prev, maxTickets: parseInt(e.target.value) || 1 }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration">Durée (en minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={form.durationMinutes}
                          onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 1 }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Le giveaway se terminera automatiquement après cette durée
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={messages.admin?.giveaways?.descriptionPlaceholder || "Décrivez le giveaway et le prix à gagner..."}
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
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      {isCreating ? 'Création...' : 'Créer le giveaway'}
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Informations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-semibold mb-2">Fonctionnement automatique :</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Les giveaways se terminent automatiquement à leur date d&apos;expiration</li>
                        <li>• Utilisez le bouton {"Effectuer le tirage automatique"} pour traiter les giveaways expirés</li>
                        <li>• Le tirage est basé sur un algorithme pondéré (plus de tickets = plus de chances)</li>
                        <li>• Chaque tirage génère un seed cryptographique pour la transparence</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Gestion manuelle :</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Vous pouvez forcer le tirage d&apos;un giveaway actif depuis la liste</li>
                        <li>• Les giveaways peuvent être supprimés (attention : action irréversible)</li>
                        <li>• Les participants sont automatiquement notifiés des résultats</li>
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