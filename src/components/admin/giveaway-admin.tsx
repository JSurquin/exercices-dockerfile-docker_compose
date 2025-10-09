'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TrophyIcon, PlayIcon } from '@heroicons/react/24/outline';

export function GiveawayAdmin() {
  const [isDrawing, setIsDrawing] = useState(false);

  const handleManualDraw = async () => {
    try {
      setIsDrawing(true);
      const response = await fetch('/api/giveaways/auto-draw', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erreur lors du tirage');
      }

      const result = await response.json();
      
      if (result.processedCount > 0) {
        toast.success(`${result.processedCount} giveaway(s) traité(s) !`);
        
        result.results.forEach((drawResult: any) => {
          if (drawResult.status === 'drawn') {
            toast.success(`🎉 Gagnant tiré pour le giveaway ${drawResult.giveawayId}`);
          } else if (drawResult.status === 'cancelled') {
            toast.info(`Giveaway ${drawResult.giveawayId} annulé (pas de participants)`);
          }
        });
      } else {
        toast.info('Aucun giveaway à tirer pour le moment');
      }
    } catch (error) {
      console.error('Erreur lors du tirage:', error);
      toast.error('Erreur lors du tirage automatique');
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrophyIcon className="w-5 h-5" />
          <span>Gestion des Giveaways</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Effectuer manuellement le tirage des giveaways expirés
          </p>
          
          <Button 
            onClick={handleManualDraw}
            disabled={isDrawing}
            className="w-full"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {isDrawing ? 'Tirage en cours...' : 'Effectuer le tirage automatique'}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>• Vérifie tous les giveaways expirés</p>
            <p>• Effectue le tirage automatiquement</p>
            <p>• Notifie les résultats</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}