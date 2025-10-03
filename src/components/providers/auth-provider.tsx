'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
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
              totalVolume: 0,
              kycStatus: 'pending',
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
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // En cas d'erreur, forcer la déconnexion côté client
      setUser(null);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No user to update');
    
    try {
      // Mettre à jour via l'API Better Auth ou directement en base
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
