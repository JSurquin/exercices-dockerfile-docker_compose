import { User } from './types';
import { mockUser } from './mock-data';

// Mock Steam auth - dans la vraie app, on utiliserait Steam OpenID
export class AuthService {
  private static readonly STORAGE_KEY = 'cashtrade_user';

  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.STORAGE_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static async loginWithSteam(): Promise<User> {
    // Simulation d'une connexion Steam
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dans la vraie app, on récupérerait les données depuis Steam
    const user = { ...mockUser };
    
    // Stockage local pour la démo
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    
    return user;
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.href = '/';
  }

  static async updateUser(updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));
    
    return updatedUser;
  }

  static async acceptTerms(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    user.acceptedTermsAt = new Date();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}
