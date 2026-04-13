'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/types';
import { signInWithDiscord, signOut, getSession } from '~/lib/auth-client';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithSteam: () => Promise<User>;
  loginWithDiscord: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { messages } = useLocale();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevPathnameRef = useRef<string | undefined>(undefined);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au montage
    const checkSession = async () => {
      try {
        // Vérifier Better Auth session
        const sessionData = await getSession();
        if (sessionData?.data?.user) {
          // Récupérer les données complètes de l'utilisateur depuis notre API
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Fallback avec les données de base de Better Auth
            const betterAuthUser = sessionData.data.user;
            const convertedUser: User = {
              id: betterAuthUser.id,
              steamId64: '', // Sera rempli par l'API
              username: betterAuthUser.name || 'User',
              avatar: betterAuthUser.image || '',
              level: 1,
              xp: 0,
              tickets: 0,
              fragments: 0,
              totalVolume: 0,
              kycStatus: 'PENDING',
              acceptedTermsAt: new Date(),
              joinedAt: betterAuthUser.createdAt,
            };
            setUser(convertedUser);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Après un promote / changement de rôle en admin, le profil doit être re-lu depuis la DB (rôle à jour dans la navbar).
  useEffect(() => {
    const prev = prevPathnameRef.current;
    if (
      prev != null &&
      prev.startsWith('/admin') &&
      pathname != null &&
      !pathname.startsWith('/admin')
    ) {
      void refreshUser();
    }
    prevPathnameRef.current = pathname;
  }, [pathname, refreshUser]);

  const loginWithSteam = async (): Promise<User> => {
    setIsLoading(true);
    try {
      toast.loading(messages.authProvider.steamLoginInProgress, {
        description: messages.authProvider.steamLoginRedirect,
      });
      
      // Rediriger vers l'authentification Steam
      window.location.href = '/api/auth/steam/login';
      // Ce code ne sera jamais atteint car on redirige
      return {} as User;
    } catch (error) {
      setIsLoading(false);
      toast.error(messages.authProvider.steamLoginError, {
        description: messages.authProvider.steamLoginErrorDesc,
      });
      throw error;
    }
  };

  const loginWithDiscord = async (): Promise<void> => {
    setIsLoading(true);
    try {
      toast.loading(messages.authProvider.discordLoginInProgress, {
        description: messages.authProvider.discordLoginRedirect,
      });
      
      await signInWithDiscord();
      // Better Auth gère la redirection automatiquement
      
      toast.success(messages.authProvider.discordLoginSuccess, {
        description: messages.authProvider.discordLoginSuccessDesc,
      });
    } catch (error) {
      console.error('Discord login error:', error);
      toast.error(messages.authProvider.discordLoginError, {
        description: messages.authProvider.discordLoginErrorDesc,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      toast.success(messages.authProvider.logoutSuccess, {
        description: messages.authProvider.logoutSuccessDesc,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // En cas d'erreur, forcer la déconnexion côté client
      setUser(null);
      toast.error(messages.authProvider.logoutError, {
        description: messages.authProvider.logoutErrorDesc,
      });
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No user to update');
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update user');
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithSteam, loginWithDiscord, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
