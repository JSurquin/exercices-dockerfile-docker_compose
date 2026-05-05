"use client";

import { useState } from 'react';
import { useSession } from '~/lib/auth-client';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';

export const useOnboarding = () => {
  const { data: session, refetch } = useSession();
  const { toast } = useToast();
  const { messages } = useLocale();
  const t = messages.hooks.onboarding;
  const [isCompleting, setIsCompleting] = useState(false);

  const completeOnboarding = async () => {
    if (!session?.user?.id) {
      toast({
        title: t.errorTitle,
        description: t.notLoggedIn,
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
        throw new Error(data.error || t.completionError);
      }

      await refetch();

      toast({
        title: t.successTitle,
        description: t.successDescription,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la completion de l\'onboarding:', error);
      toast({
        title: t.errorTitle,
        description: error instanceof Error ? error.message : t.unknownError,
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
