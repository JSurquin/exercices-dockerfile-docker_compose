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
import { useLocale } from '@/components/providers/locale-provider';

export default function ModeratorLoginPage() {
  const { messages } = useLocale();
  const t = messages.moderator;
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
        toast.error(t.loginError, {
          description: error.message || t.loginErrorDesc,
        });
        return;
      }

      if ((data as Record<string, unknown>)?.twoFactorRedirect) {
        toast.error("La 2FA n'est pas disponible pour les comptes moderateur.");
        await authClient.signOut();
        return;
      }

      // Vérifier que l'utilisateur est bien modérateur ou admin
      if (data?.user) {
        // Rôle : source de vérité côté serveur (ne pas s’appuyer sur /api/user/[id]).
        const userResponse = await fetch('/api/user/profile');
        const userData = await userResponse.json();
        
        if (userData.role === 'MODERATOR' || userData.role === 'ADMIN') {
          toast.success(t.loginSuccess);
          router.push('/moderation');
        } else {
          toast.error(t.accessDenied, {
            description: t.accessDeniedDesc,
          });
          await authClient.signOut();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast.error(t.loginError, {
        description: t.loginErrorDesc,
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
          <CardTitle className="text-2xl">{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.passwordLabel}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.passwordPlaceholder}
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
              {isLoading ? t.loggingIn : t.loginButton}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>{t.reservedInterface}</p>
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

