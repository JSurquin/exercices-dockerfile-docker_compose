"use client";

import { useState } from 'react';
import { useSession } from '~/lib/auth-client';
import { useToast } from '@/hooks/use-toast';

export const useOnboarding = () => {
  const { data: session, refetch } = useSession();
  const { toast } = useToast(); 
  const [isCompleting, setIsCompleting] = useState(false);

  const completeOnboarding = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour terminer l'onboarding",
        variant: "destructive"
      });
      return false;
    }

    setIsCompleting(true);
    
    try {
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la completion de l\'onboarding');
      }

      // Rafraîchir la session pour récupérer isFirstLogin mis à jour
      await refetch();

      toast({
        title: "Bienvenue !",
        description: "Votre onboarding est terminé. Vous pouvez maintenant utiliser toutes les fonctionnalités de CashTrade.",
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la completion de l\'onboarding:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    isFirstLogin: session?.user?.isFirstLogin ?? false,
    isCompleting,
    completeOnboarding
  };
};
