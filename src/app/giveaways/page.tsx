'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { mockGiveaways, mockUser } from '@/lib/mock-data';
import { Giveaway } from '@/lib/types';
import {
  GiftIcon,
  TicketIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const getTimeRemaining = (endDate: Date) => {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, expired: false };
};

const formatTimeRemaining = (timeRemaining: ReturnType<typeof getTimeRemaining>) => {
  if (timeRemaining.expired) return 'Terminé';
  
  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}j ${timeRemaining.hours}h`;
  } else if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  } else {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }
};

const GiveawayCard = ({ giveaway, onParticipate }: { giveaway: Giveaway; onParticipate: (giveaway: Giveaway, tickets: number) => void }) => {
  const [ticketsToUse, setTicketsToUse] = useState(1);
  const timeRemaining = getTimeRemaining(new Date(giveaway.endDate));
  const progress = (giveaway.soldTickets / giveaway.maxTickets) * 100;
  
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{giveaway.title}</CardTitle>
            <p className="text-sm text-muted-foreground mb-3">{giveaway.description}</p>
          </div>
          <Badge 
            variant={giveaway.status === 'active' ? 'default' : 'secondary'}
            className={giveaway.status === 'active' ? 'bg-green-500' : ''}
          >
            {giveaway.status === 'active' ? 'En cours' : giveaway.status === 'ended' ? 'Terminé' : 'Annulé'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Prize */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4 border">
          <div className="flex items-center space-x-3">
            <TrophyIcon className="w-8 h-8 text-orange-600" />
            <div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-200">Prix à gagner</h4>
              <p className="text-orange-700 dark:text-orange-300">{giveaway.prize}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TicketIcon className="w-4 h-4 text-muted-foreground" />
            <span>Prix: {giveaway.ticketPrice} tickets</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-4 h-4 text-muted-foreground" />
            <span>{giveaway.soldTickets} / {giveaway.maxTickets}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-4 h-4 text-muted-foreground" />
            <span>{formatTimeRemaining(timeRemaining)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(giveaway.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tickets vendus</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Winner (if ended) */}
        {giveaway.status === 'ended' && giveaway.winnerId && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <StarIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Gagnant: {giveaway.winnerId}
              </span>
            </div>
          </div>
        )}

        {/* Participation */}
        {giveaway.status === 'active' && !timeRemaining.expired && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Label htmlFor={`tickets-${giveaway.id}`} className="text-sm">
                Nombre de tickets à utiliser:
              </Label>
            </div>
            <div className="flex space-x-2">
              <Input
                id={`tickets-${giveaway.id}`}
                type="number"
                min="1"
                max={Math.min(mockUser.tickets, giveaway.maxTickets - giveaway.soldTickets)}
                value={ticketsToUse}
                onChange={(e) => setTicketsToUse(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1"
              />
              <Button
                onClick={() => onParticipate(giveaway, ticketsToUse)}
                disabled={mockUser.tickets < ticketsToUse || ticketsToUse > (giveaway.maxTickets - giveaway.soldTickets)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                Participer
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Vous avez {mockUser.tickets} tickets disponibles
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function GiveawaysPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');

  const handleParticipate = (giveaway: Giveaway, tickets: number) => {
    if (!user) {
      toast.error('Vous devez être connecté pour participer');
      return;
    }

    if (user.tickets < tickets) {
      toast.error('Vous n\'avez pas assez de tickets');
      return;
    }

    // Simulation de participation
    toast.success(`Participation enregistrée ! ${tickets} ticket(s) utilisé(s) pour ${giveaway.title}`);
  };

  const activeGiveaways = mockGiveaways.filter(g => g.status === 'active');
  const endedGiveaways = mockGiveaways.filter(g => g.status === 'ended');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <GiftIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Giveaways
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Utilisez vos tickets pour participer aux giveaways et gagner des skins exceptionnels
          </p>
        </motion.div>

        {/* User Tickets */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 sm:mb-8"
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">Niveau {user.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <TicketIcon className="w-5 h-5 text-purple-500" />
                      <span className="text-2xl font-bold">{user.tickets}</span>
                      <span className="text-muted-foreground">tickets</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gagnez plus de tickets en vendant vos skins !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How Tickets Work */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TicketIcon className="w-5 h-5 text-purple-500" />
                <span>Comment fonctionnent les tickets ?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Gagnez des tickets</h4>
                  <p className="text-sm text-muted-foreground">
                    Recevez des tickets à chaque trade en fonction du volume
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GiftIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Participez aux giveaways</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilisez vos tickets pour participer aux tirages au sort
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrophyIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Remportez des prix</h4>
                  <p className="text-sm text-muted-foreground">
                    Gagnez des skins exceptionnels et des récompenses exclusives
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Giveaways Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">
                En cours ({activeGiveaways.length})
              </TabsTrigger>
              <TabsTrigger value="ended">
                Terminés ({endedGiveaways.length})
              </TabsTrigger>
              <TabsTrigger value="my-entries">
                Mes participations
              </TabsTrigger>
            </TabsList>

            {/* Active Giveaways */}
            <TabsContent value="active">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeGiveaways.map((giveaway, index) => (
                  <motion.div
                    key={giveaway.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <GiveawayCard giveaway={giveaway} onParticipate={handleParticipate} />
                  </motion.div>
                ))}
              </div>
              {activeGiveaways.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Aucun giveaway actif</h3>
                    <p className="text-muted-foreground">
                      Revenez bientôt pour découvrir de nouveaux giveaways !
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Ended Giveaways */}
            <TabsContent value="ended">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {endedGiveaways.map((giveaway, index) => (
                  <motion.div
                    key={giveaway.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <GiveawayCard giveaway={giveaway} onParticipate={handleParticipate} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* My Entries */}
            <TabsContent value="my-entries">
              {user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Mes participations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {/* Mock entries */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">AK-47 | Redline Giveaway</h4>
                            <p className="text-sm text-muted-foreground">5 tickets utilisés</p>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            En cours
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Knife Collection</h4>
                            <p className="text-sm text-muted-foreground">3 tickets utilisés</p>
                          </div>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Perdu
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Connexion requise</h3>
                    <p className="text-muted-foreground mb-6">
                      Connectez-vous pour voir vos participations
                    </p>
                    <Button onClick={() => window.location.href = '/'}>
                      Se connecter avec Steam
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
