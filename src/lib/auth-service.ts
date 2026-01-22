// Service d'authentification - Mock pour la compatibilité avec l'ancien système
import { User } from '@/lib/types';

export class AuthService {
  private static readonly STORAGE_KEY = 'cashtrade_user';

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    
    return null;
  }

  static async loginWithSteam(): Promise<User> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = this.getCurrentUser();
    if (existingUser) {
      return existingUser;
    }

    // Nouveau utilisateur - attribution de 100 tickets initiaux
    const mockUser: User = {
      id: 'steam_76561198000000000',
      steamId64: '76561198000000000',
      username: 'TestUser',
      avatar: 'https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef94e52a288_medium.jpg',
      level: 1,
      xp: 0,
      tickets: 100, // 100 tickets initiaux pour tous les nouveaux utilisateurs
      totalVolume: 0,
      kycStatus: 'PENDING',
      acceptedTermsAt: new Date(),
      joinedAt: new Date(),
    };

    // Stocker en localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mockUser));
    
    return mockUser;
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  static async updateUser(updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser: User = {
      ...currentUser,
      ...updates,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }
}

