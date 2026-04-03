'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '~/lib/auth-client';
import { useLocale } from '@/components/providers/locale-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '~/lib/auth-client';


export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { messages } = useLocale();
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || messages.admin.login.connectionError);
        toast.error(messages.admin.login.loginFailed, {
          description: result.error.message || messages.admin.login.checkCredentials,
        });
        return;
      }

      if ((result.data as Record<string, unknown>)?.twoFactorRedirect) {
        setError("La 2FA n'est pas disponible pour les comptes administrateurs.");
        await authClient.signOut();
        return;
      }

      // Succès de la connexion
      toast.success(messages.admin.login.loginSuccess, {
        description: messages.admin.login.welcomeMessage,
      });

      // Rediriger vers le dashboard admin
      router.push('/admin/dashboard');
    } catch (err) {
      const errorMessage = messages.admin.login.connectionError;
      setError(errorMessage);
      toast.error(messages.admin.login.connectionError, {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      const { data, error } = await authClient.requestPasswordReset({
        email: forgotPasswordEmail,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}password/reset-password`,
      });

      if (data) {
        toast.success('Email envoyé !', {
          description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      } else {
        toast.error('Erreur', {
          description: error.message || 'Impossible d\'envoyer l\'email',
        });
      }
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible d\'envoyer l\'email de réinitialisation',
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            {messages.admin.login.title}
          </h1>
          <p className="text-slate-400">
            {messages.admin.login.subtitle}
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">{messages.admin.login.adminLogin}</CardTitle>
            <CardDescription className="text-slate-400">
              {messages.admin.login.adminAccess}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
                  <AlertDescription className="text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email administrateur
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@moonskin.com"
                  required
                  className="bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>

              {/* Mot de passe oublié */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-slate-400 hover:text-slate-300 text-sm"
                >
                  Mot de passe oublié ?
                </Button>
              </div>
            </form>

            {/* Séparateur */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Ou</span>
              </div>
            </div>

            {/* Connexion Steam pour admin */}
            <Button
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              asChild
            >
              <Link href="/api/auth/steam/login">
                <img 
                  src="https://steamcommunity-a.akamaihd.net/public/images/signinthroughsteam/sits_small.png" 
                  alt="Se connecter via Steam"
                  className="h-5"
                />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Problème de connexion ?{' '}
            <Link 
              href="/support" 
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Contactez le support
            </Link>
          </p>
          <p className="text-xs text-slate-600 mt-2">
            Accès sécurisé - Toutes les connexions sont enregistrées
          </p>
        </div>
      </div>

      {/* Modal Mot de passe oublié */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-white">Mot de passe oublié</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ×
                </Button>
              </div>
              <CardDescription className="text-slate-400">
                Entrez votre adresse email pour recevoir un lien de réinitialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-300">
                    Email administrateur
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="admin@moonskin.com"
                    required
                    className="bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
