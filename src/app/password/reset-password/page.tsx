'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { authClient } from '~/lib/auth-client';
import { useLocale } from '@/components/providers/locale-provider';

export default function ResetPasswordPage() {
  const { messages } = useLocale();
  const text = messages.resetPassword;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
   
  if (!token) {
    return <div>{messages.resetPassword.tokenMissing}</div>;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validations côté client
    if (password.length < 8) {
      setError(messages.resetPassword.passwordTooShort);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(messages.resetPassword.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (error) {
        setError(error.message as string | undefined || messages.resetPassword.resetError);
      } else {
        setResetSuccess(true);
      }

      if (data) {
        setResetSuccess(true);
        toast.success(messages.resetPassword.resetSuccess);
      }
    } catch (error) {
      setError(messages.resetPassword.resetError);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-slate-100">{messages.resetPassword.resetSuccessTitle}</CardTitle>
            <CardDescription className="text-slate-400">
              {messages.resetPassword.resetSuccessMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-300 text-sm">
              {messages.resetPassword.resetSuccessRedirect}
            </p>
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
              <Link href="/admin/login" className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {messages.resetPassword.loginNow}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
            <Shield className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {messages.resetPassword.resetPasswordTitle}
          </h1>
          <p className="text-slate-400">
            {messages.resetPassword.resetPasswordDesc}
          </p>
          {userEmail && (
            <p className="text-sm text-slate-500 mt-2">
              {text.accountLabel} : <span className="text-orange-400">{userEmail}</span>
            </p>
          )}
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">
              {messages.resetPassword.resetPasswordTitle}
            </CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {messages.resetPassword.resetPasswordDesc}
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
                <Label htmlFor="password" className="text-slate-300">
                  {messages.resetPassword.newPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={text.passwordPlaceholder}
                    required
                    minLength={8}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  {messages.resetPassword.confirmPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={text.confirmPasswordPlaceholder}
                    required
                    minLength={8}
                    className="bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Indicateur de force du mot de passe */}
              {password && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">{text.strength} :</div>
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-green-500' : 'bg-slate-600'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`} />
                    <div className={`h-1 flex-1 rounded ${password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'bg-green-500' : 'bg-slate-600'}`} />
                  </div>
                  <div className="text-xs text-slate-500">
                    {password.length < 8 && text.strengthTooShort}
                    {password.length >= 8 && password.length < 12 && text.strengthWeak}
                    {password.length >= 12 && /[A-Z]/.test(password) && text.strengthMedium}
                    {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && text.strengthStrong}
                    {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) && text.strengthVeryStrong}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Link href="/admin/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {text.cancel}
                  </Link>
                </Button>
                <Button
                  type="submit"
                  disabled={loading || password !== confirmPassword || password.length < 8}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {messages.resetPassword.updating}
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      {messages.resetPassword.reset}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-600">
            {text.securityNote}
          </p>
        </div>
      </div>
    </div>
  );
}
