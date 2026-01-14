'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/components/providers/locale-provider';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { messages } = useLocale();
  
  const t = messages.components.newsletter.unsubscribe;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_unsubscribed'>('loading');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t.missingToken);
      return;
    }

    // Appeler l'API de désabonnement
    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/newsletter/unsubscribe?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setEmail(data.email || '');
          if (data.message?.includes('déjà désabonné')) {
            setStatus('already_unsubscribed');
          } else {
            setStatus('success');
          }
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Une erreur est survenue.');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors du désabonnement.');
      }
    };

    unsubscribe();
  }, [token]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'already_unsubscribed':
        return <CheckCircle className="h-12 w-12 text-blue-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5';
      case 'already_unsubscribed':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      default:
        return 'border-slate-700/50 bg-slate-800/50';
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return t.loading;
      case 'success':
        return t.success;
      case 'already_unsubscribed':
        return t.alreadyUnsubscribed;
      case 'error':
        return t.error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Mail className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
        </div>

        {/* Status Card */}
        <Card className={`${getStatusColor()} backdrop-blur-sm`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-white text-xl">
              {getTitle()}
            </CardTitle>
            {email && (
              <CardDescription className="text-slate-300">
                {email}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-slate-300">
              {message}
            </p>

            {status === 'success' && (
              <div className="space-y-4">
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t.confirmed}
                </Badge>
                
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">
                    {t.noMoreEmails}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t.canResubscribe}
                  </p>
                </div>
              </div>
            )}

            {status === 'already_unsubscribed' && (
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                <Mail className="h-3 w-3 mr-1" />
                {t.alreadyUnsubscribed}
              </Badge>
            )}

            {status === 'error' && (
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <p className="text-sm text-red-300">
                  {t.errorDesc}
                </p>
              </div>
            )}

            <div className="pt-4 space-y-2">
              <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backHome}
                </Link>
              </Button>
              
              {status === 'success' || status === 'already_unsubscribed' ? (
                <Button asChild variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Link href="/#newsletter">
                    {t.resubscribe}
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>MoonSkin - {messages.nav.platform}</p>
          <p className="mt-1">
            <Link href="/contact" className="hover:text-slate-400 transition-colors">
              {messages.contact.title}
            </Link>
            {' • '}
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              {messages.privacy.title}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}