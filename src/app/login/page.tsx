'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { authClient, signInWithDiscord } from '~/lib/auth-client';
import { useLocale } from '@/components/providers/locale-provider';

export default function LoginPage() {
  const { messages } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || messages.loginPage.errors.loginError);
        setLoading(false);
        return;
      }

      if ((result.data as Record<string, unknown>)?.twoFactorRedirect) {
        return;
      }

      if (result.data?.user) {
        const role = (result.data.user as any).role;

        switch (role) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'AFFILIATE':
            router.push('/affiliate');
            break;
          case 'MODERATOR':
            router.push('/moderator');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(messages.loginPage.errors.invalidCredentials);
      setLoading(false);
    }
  };

  const handleSteamLogin = async () => {
    try {
      window.location.href = '/api/auth/steam/login';
    } catch (error) {
      setError(messages.loginPage.errors.steamError);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await signInWithDiscord();
    } catch (error) {
      setError(messages.loginPage.errors.discordError);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">CS</span>
            </div>
            <span className="font-bold text-3xl text-white">MoonSkin</span>
          </Link>
          <p className="text-slate-400 mt-2">{messages.loginPage.subtitle}</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">
              {messages.loginPage.title}
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              {messages.loginPage.chooseMethod}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-0"
                onClick={handleDiscordLogin}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                {messages.loginPage.continueWithDiscord}
              </Button>

              <Button
                variant="outline"
                className="w-full bg-[#171A21] hover:bg-[#0E1015] text-white border-0"
                onClick={handleSteamLogin}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                {messages.loginPage.continueWithSteam}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">
                  {messages.loginPage.orContinueWithEmail}
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  {messages.loginPage.emailLabel}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={messages.loginPage.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">
                    {messages.loginPage.passwordLabel}
                  </Label>
                  <Link
                    href="/password/forgot"
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {messages.loginPage.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={messages.admin.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {messages.loginPage.loggingIn}
                  </>
                ) : (
                  messages.loginPage.login
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400">
              {messages.loginPage.noAccountYet}{' '}
              <Link href="/" className="text-orange-400 hover:text-orange-300 transition-colors">
                {messages.loginPage.loginWithSteam}
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500">
          <p>
            {messages.loginPage.legalNotice}{' '}
            <Link href="/terms" className="text-orange-400 hover:text-orange-300">
              {messages.loginPage.termsOfService}
            </Link>
            {' '}{messages.loginPage.and}{' '}
            <Link href="/privacy" className="text-orange-400 hover:text-orange-300">
              {messages.loginPage.privacyPolicy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
