'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { AuthService } from '@/lib/auth-service';
import { signInWithDiscord, signOut, getSession } from '@/lib/auth-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginWithSteam: () => Promise<User>;
  loginWithDiscord: () => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au montage
    const checkSession = async () => {
      try {
        // Vérifier Better Auth session
        const sessionData = await getSession();
        if (sessionData?.data?.user) {
          // Convertir Better Auth user vers notre type User
          const betterAuthUser = sessionData.data.user;
          const convertedUser: User = {
            id: betterAuthUser.id,
            steamId64: '', // Sera rempli lors de la liaison Steam
            username: betterAuthUser.name || 'Discord User',
            avatar: betterAuthUser.image || '',
            level: 1, // Valeurs par défaut pour les nouveaux utilisateurs
            xp: 0,
            tickets: 0,
            totalVolume: 0,
            kycStatus: 'pending',
            acceptedTermsAt: new Date(),
            joinedAt: betterAuthUser.createdAt,
          };
          setUser(convertedUser);
        } else {
          // Fallback vers l'ancien système Steam (mock)
          const currentUser = AuthService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Fallback vers l'ancien système
        const currentUser = AuthService.getCurrentUser();
        setUser(currentUser);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const loginWithSteam = async (): Promise<User> => {
    setIsLoading(true);
    try {
      // Rediriger vers l'authentification Steam
      window.location.href = '/api/auth/steam/login';
      // Ce code ne sera jamais atteint car on redirige
      return {} as User;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithDiscord = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithDiscord();
      // Better Auth gère la redirection automatiquement
    } catch (error) {
      console.error('Discord login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Fallback vers l'ancien système
    AuthService.logout();
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>): Promise<User> => {
    const updatedUser = await AuthService.updateUser(updates);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithSteam, loginWithDiscord, logout, updateUser }}>
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
