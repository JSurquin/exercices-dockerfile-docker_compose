'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { GiveawayWithEntries } from '@/hooks/use-giveaways';

interface DrawNotification {
  id: string;
  giveawayTitle: string;
  winner: {
    steamUsername: string | null;
    steamAvatar: string | null;
  };
  prize: string;
  timestamp: Date;
}

export function GiveawayNotifications() {
  const [notifications, setNotifications] = useState<DrawNotification[]>([]);

  useEffect(() => {
    // Écouter les événements de tirage
    const checkForDraws = async () => {
      try {
        // Cette fonction pourrait être améliorée avec des WebSockets
        // Pour l'instant, on utilise un polling simple
        const response = await fetch('/api/giveaways?status=ENDED');
        if (response.ok) {
          const giveaways: GiveawayWithEntries[] = await response.json();
          
          // Vérifier les nouveaux gagnants
          giveaways.forEach((giveaway) => {
            if (giveaway.winnerId && giveaway.updatedAt) {
              const drawTime = new Date(giveaway.updatedAt);
              const now = new Date();
              const timeDiff = now.getTime() - drawTime.getTime();
              
              // Si le tirage a eu lieu dans les 5 dernières minutes
              if (timeDiff < 5 * 60 * 1000) {
                const existingNotification = notifications.find(n => n.id === giveaway.id);
                if (!existingNotification) {
                  const winner = giveaway.entries?.find((entry) => entry.userId === giveaway.winnerId);
                  if (winner && winner.user) {
                    const notification: DrawNotification = {
                      id: giveaway.id,
                      giveawayTitle: giveaway.title,
                      winner: winner.user,
                      prize: giveaway.prize,
                      timestamp: drawTime
                    };
                    
                    setNotifications(prev => [notification, ...prev.slice(0, 2)]); // Garder max 3 notifications
                    
                    // Toast notification
                    toast.success(`🎉 ${giveaway.title} - Gagnant: ${winner.user.steamUsername || 'Joueur'}`);
                  }
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('Error checking for draws:', error);
      }
    };

    // Vérification initiale seulement (pas d'intervalle pour éviter les boucles)
    checkForDraws();

    // TODO: Réactiver avec WebSockets ou une meilleure gestion
    // const interval = setInterval(checkForDraws, 30000);
    // return () => clearInterval(interval);
  }, []); // Pas de dépendances pour éviter les boucles

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <Card className="w-80 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      Nouveau Gagnant !
                    </span>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={notification.winner.steamAvatar || undefined} />
                    <AvatarFallback className="bg-yellow-500 text-white">
                      {(notification.winner.steamUsername || 'W').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 truncate">
                      {notification.winner.steamUsername || 'Joueur anonyme'}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 truncate">
                      {notification.prize}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      {notification.giveawayTitle}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}