'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { GiveawayWithEntries } from '@/hooks/use-giveaways';

interface DrawNotification {
  id: string;
  giveawayTitle: string;
  winners: Array<{
    steamUsername: string | null;
    steamAvatar: string | null;
    rank: number;
  }>;
  prize: string;
  timestamp: Date;
}

const POLL_INTERVAL_MS = 30_000;

export function GiveawayNotifications() {
  const [notifications, setNotifications] = useState<DrawNotification[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkForDraws = async () => {
      try {
        const response = await fetch('/api/giveaways?status=ENDED', { credentials: 'include' });
        if (!response.ok) return;
        const giveaways: GiveawayWithEntries[] = await response.json();

        giveaways.forEach((giveaway) => {
          if (seenIds.current.has(giveaway.id)) return;
          if (!giveaway.winners || giveaway.winners.length === 0) return;
          if (!giveaway.updatedAt) return;

          const drawTime = new Date(giveaway.updatedAt);
          const timeDiff = Date.now() - drawTime.getTime();
          // Notifier seulement si le tirage date de moins de 5 minutes
          if (timeDiff > 5 * 60 * 1000) return;

          seenIds.current.add(giveaway.id);

          const winners = giveaway.winners.map((w) => ({
            steamUsername: w.user?.steamUsername ?? null,
            steamAvatar: w.user?.steamAvatar ?? null,
            rank: w.rank,
          }));

          const notification: DrawNotification = {
            id: giveaway.id,
            giveawayTitle: giveaway.title,
            winners,
            prize: giveaway.prize,
            timestamp: drawTime,
          };

          const firstWinner = winners[0];
          toast.success(
            `🎉 ${giveaway.title} — Gagnant : ${firstWinner?.steamUsername ?? 'Joueur'}`
          );

          setNotifications((prev) => [notification, ...prev.slice(0, 2)]);
        });
      } catch (error) {
        console.error('[GiveawayNotifications] Erreur polling:', error);
      }
    };

    checkForDraws();
    const interval = setInterval(checkForDraws, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
            transition={{ duration: 0.4, type: 'spring' }}
          >
            <Card className="w-80 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      {notification.winners.length > 1 ? 'Nouveaux Gagnants !' : 'Nouveau Gagnant !'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {notification.winners.slice(0, 3).map((winner, i) => (
                  <div key={i} className="flex items-center space-x-3 mt-2">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={winner.steamAvatar || undefined} />
                      <AvatarFallback className="bg-yellow-500 text-white text-xs">
                        {(winner.steamUsername || 'W').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 truncate">
                        {winner.steamUsername ?? 'Joueur anonyme'}
                        {notification.winners.length > 1 && (
                          <span className="ml-1 text-xs text-yellow-600">#{winner.rank}</span>
                        )}
                      </p>
                      {i === 0 && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 truncate">
                          {notification.prize} — {notification.giveawayTitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
