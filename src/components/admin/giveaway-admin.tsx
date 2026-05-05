'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { TrophyIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';

export function GiveawayAdmin() {
  const { messages } = useLocale();
  const [isDrawing, setIsDrawing] = useState(false);

  const handleManualDraw = async () => {
    try {
      setIsDrawing(true);
      const response = await fetch('/api/giveaways/auto-draw', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(messages.admin.giveawayAdmin.toasts.drawError);
      }

      const result = await response.json();
      
      if (result.processedCount > 0) {
        toast.success(`${result.processedCount} ${messages.admin.giveawayAdmin.toasts.processed}`);
        
        result.results.forEach((drawResult: any) => {
          if (drawResult.status === 'drawn') {
            toast.success(`🎉 ${messages.admin.giveawayAdmin.toasts.drawn} ${drawResult.giveawayId}`);
          } else if (drawResult.status === 'cancelled') {
            toast.info(`${messages.admin.giveawayAdmin.toasts.cancelled} ${drawResult.giveawayId}`);
          }
        });
      } else {
        toast.info(messages.admin.giveawayAdmin.toasts.none);
      }
    } catch (error) {
      console.error('Erreur lors du tirage:', error);
      toast.error(messages.admin.giveawayAdmin.toasts.error);
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrophyIcon className="w-5 h-5" />
          <span>{messages.admin.giveawayAdmin.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {messages.admin.giveawayAdmin.description}
          </p>
          
          <Button 
            onClick={handleManualDraw}
            disabled={isDrawing}
            className="w-full"
          >
            <PlayIcon className="w-4 h-4 mr-2" />
            {isDrawing ? messages.admin.giveawayAdmin.drawing : messages.admin.giveawayAdmin.draw}
          </Button>
          
          <div className="text-xs text-muted-foreground">
            <p>• {messages.admin.giveawayAdmin.point1}</p>
            <p>• {messages.admin.giveawayAdmin.point2}</p>
            <p>• {messages.admin.giveawayAdmin.point3}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}