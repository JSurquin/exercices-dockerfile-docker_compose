'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '~/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function ModeratorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error('Erreur de connexion', {
          description: error.message || 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Vérifier que l'utilisateur est bien modérateur ou admin
      if (data?.user) {
        // Récupérer le rôle depuis la DB car Better Auth ne le retourne pas automatiquement
        const userResponse = await fetch(`/api/user/${data.user.id}`);
        const userData = await userResponse.json();
        
        if (userData.role === 'MODERATOR' || userData.role === 'ADMIN') {
          toast.success('Connexion réussie !');
          router.push('/moderation');
        } else {
          toast.error('Accès refusé', {
            description: 'Vous n\'avez pas les permissions nécessaires',
          });
          await authClient.signOut();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error('Erreur de connexion', {
        description: 'Une erreur est survenue lors de la connexion',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldCheckIcon className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Espace Modération</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à l&apos;interface de modération
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="moderator@moonskin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Interface réservée aux modérateurs</p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="font-medium">💡 Compte de test :</p>
              <p className="text-muted-foreground">
                <span className="font-mono">moderator@moonskin.com</span><br />
                <span className="font-mono">Moderator2024!</span>
              </p>
            </div>

            <p className="text-center text-sm">
              <Link href="/" className="text-primary hover:underline">
                Retour à l&apos;accueil
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

