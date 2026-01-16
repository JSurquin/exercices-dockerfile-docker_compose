'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale } from '@/components/providers/locale-provider';
import { Giveaway, GiveawayEntry } from '@/lib/types';
import {
  GiftIcon,
  TicketIcon,
  ClockIcon,
  UserGroupIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface GiveawayDetails extends Giveaway {
  entries: (GiveawayEntry & {
    user: {
      id: string;
      steamUsername: string | null;
      steamAvatar: string | null;
    };
  })[];
}

export default function GiveawayDetailsPage() {
  const params = useParams();
  const { messages } = useLocale();
  const [giveaway, setGiveaway] = useState<GiveawayDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const giveawayId = params.id as string;

  useEffect(() => {
    const fetchGiveaway = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/giveaways/${giveawayId}`);
        
        if (!response.ok) {
          throw new Error('Giveaway introuvable');
        }
        
        const data = await response.json();
        setGiveaway(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        console.error('Error fetching giveaway:', err);
      } finally {
        setLoading(false);
      }
    };

    if (giveawayId) {
      fetchGiveaway();
    }
  }, [giveawayId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-lg">{messages.giveawaysPage.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !giveaway) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <GiftIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{messages.giveawaysPage.giveawayNotFound}</h3>
              <p className="text-muted-foreground mb-6">
                {error || messages.giveawaysPage.giveawayNotFoundDesc}
              </p>
              <Link href="/giveaways">
                <Button>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Retour aux giveaways
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progress = (giveaway.soldTickets / giveaway.maxTickets) * 100;
  const winner = giveaway.entries.find(entry => entry.userId === giveaway.winnerId);
  const totalTickets = giveaway.entries.reduce((sum, entry) => sum + entry.ticketsUsed, 0);

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminé';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}j ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/giveaways">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour aux giveaways
            </Button>
          </Link>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <GiftIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            {giveaway.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {giveaway.description}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Giveaway Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{messages.giveawaysPage.detail.title}</span>
                    <Badge 
                      variant={giveaway.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={giveaway.status === 'ACTIVE' ? 'bg-green-500' : giveaway.status === 'ENDED' ? 'bg-blue-500' : 'bg-gray-500'}
                    >
                      {giveaway.status === 'ACTIVE' ? messages.giveawaysPage.detail.status.active : giveaway.status === 'ENDED' ? messages.giveawaysPage.detail.status.ended : messages.giveawaysPage.detail.status.cancelled}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Prize */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-6 border">
                    <div className="flex items-center space-x-4">
                      <TrophyIcon className="w-12 h-12 text-orange-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200">{messages.giveawaysPage.detail.prizeTitle}</h3>
                        <p className="text-lg text-orange-700 dark:text-orange-300">{giveaway.prize}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <TicketIcon className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm text-muted-foreground">{messages.giveawaysPage.detail.ticketPrice}</p>
                      <p className="text-lg font-semibold">{giveaway.ticketPrice}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <UserGroupIcon className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-sm text-muted-foreground">{messages.giveawaysPage.detail.participants}</p>
                      <p className="text-lg font-semibold">{giveaway.entries.length}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <ClockIcon className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">{messages.giveawaysPage.detail.timeRemaining}</p>
                      <p className="text-lg font-semibold">{getTimeRemaining(typeof giveaway.endDate === 'string' ? giveaway.endDate : giveaway.endDate.toString())}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <CalendarIcon className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm text-muted-foreground">{messages.giveawaysPage.detail.endsOn}</p>
                      <p className="text-lg font-semibold">{new Date(giveaway.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{messages.giveawaysPage.detail.ticketsSold}</span>
                      <span>{giveaway.soldTickets} / {giveaway.maxTickets} ({progress.toFixed(1)}%)</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Winner (if ended) */}
            {giveaway.status === 'ENDED' && winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrophyIcon className="w-6 h-6 text-yellow-500" />
                      <span>🎉 Gagnant du Giveaway</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={winner.user.steamAvatar || undefined} alt={winner.user.steamUsername || 'Winner'} />
                        <AvatarFallback className="bg-yellow-500 text-white">
                          {(winner.user.steamUsername || 'W').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
                          {winner.user.steamUsername || `Utilisateur ${winner.userId.slice(-6)}`}
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          A utilisé {winner.ticketsUsed} ticket(s) • Probabilité: {((winner.ticketsUsed / totalTickets) * 100).toFixed(2)}%
                        </p>
                      </div>
                      <CheckCircleIcon className="w-8 h-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Participants List */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Participants ({giveaway.entries.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {giveaway.entries.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Aucun participant pour le moment
                      </p>
                    ) : (
                      giveaway.entries
                        .sort((a, b) => b.ticketsUsed - a.ticketsUsed) // Trier par nombre de tickets
                        .map((entry, index) => (
                          <div
                            key={entry.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${
                              entry.userId === giveaway.winnerId
                                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                                : 'bg-muted/50'
                            }`}
                          >
                            <div className="text-sm text-muted-foreground w-6">
                              #{index + 1}
                            </div>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={entry.user.steamAvatar || undefined} alt={entry.user.steamUsername || 'User'} />
                              <AvatarFallback>
                                {(entry.user.steamUsername || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {entry.user.steamUsername || `Utilisateur ${entry.userId.slice(-6)}`}
                                {entry.userId === giveaway.winnerId && (
                                  <StarIcon className="w-4 h-4 inline-block ml-1 text-yellow-500" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {entry.ticketsUsed} ticket(s) • {((entry.ticketsUsed / totalTickets) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{messages.giveawaysPage.detail.statistics}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{messages.giveawaysPage.totalTicketsSold}</span>
                    <span className="font-semibold">{totalTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{messages.giveawaysPage.participantCount}</span>
                    <span className="font-semibold">{giveaway.entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{messages.giveawaysPage.avgTicketsPerParticipant}</span>
                    <span className="font-semibold">
                      {giveaway.entries.length > 0 ? (totalTickets / giveaway.entries.length).toFixed(1) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{messages.giveawaysPage.fillRate}</span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  {giveaway.status === 'ENDED' && giveaway.randomSeed && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Seed de tirage: <code className="bg-muted px-1 rounded">{giveaway.randomSeed.slice(0, 16)}...</code>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}