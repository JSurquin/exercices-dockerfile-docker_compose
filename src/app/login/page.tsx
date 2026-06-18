'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
        const role = (result.data.user as { role?: string }).role;

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
    } catch {
      setError(messages.loginPage.errors.invalidCredentials);
      setLoading(false);
    }
  };

  const handleSteamLogin = async () => {
    try {
      window.location.href = '/api/auth/steam/login';
    } catch {
      setError(messages.loginPage.errors.steamError);
    }
  };

  const handleDiscordLogin = async () => {
    try {
      await signInWithDiscord();
    } catch {
      setError(messages.loginPage.errors.discordError);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3 mb-3 cursor-pointer">
            <div className="h-12 w-12 rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image src="/images/logo.webp" alt="MoonSkin" width={48} height={48} />
            </div>
            <span className="font-bold text-3xl text-chrome-gradient">MoonSkin</span>
          </Link>
          <p className="text-muted-foreground mt-2">{messages.loginPage.subtitle}</p>
        </div>

        <Card className="lunar-card border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {messages.loginPage.title}
            </CardTitle>
            <CardDescription className="text-center">
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
                className="w-full bg-[#171A21] hover:bg-[#0E1015] text-white border border-white/10"
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
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">
                  {messages.loginPage.orContinueWithEmail}
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {messages.loginPage.emailLabel}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={messages.loginPage.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-white/[0.04] border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {messages.loginPage.passwordLabel}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={messages.admin.login.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-white/[0.04] border-white/10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="cta"
                className="w-full"
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

            <div className="text-center text-sm text-muted-foreground">
              {messages.loginPage.noAccountYet}{' '}
              <Link href="/" className="text-theme-highlight hover:underline cursor-pointer">
                {messages.loginPage.loginWithSteam}
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            {messages.loginPage.legalNotice}{' '}
            <Link href="/terms" className="text-theme-highlight hover:underline cursor-pointer">
              {messages.loginPage.termsOfService}
            </Link>
            {' '}{messages.loginPage.and}{' '}
            <Link href="/privacy" className="text-theme-highlight hover:underline cursor-pointer">
              {messages.loginPage.privacyPolicy}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
