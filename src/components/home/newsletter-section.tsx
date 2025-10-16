'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';
import { toast } from 'sonner';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { messages } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(true);
        setEmail('');
        toast.success('Inscription réussie ! Merci de vous être abonné à notre newsletter.');
      } else {
        if (data.error === 'ALREADY_SUBSCRIBED') {
          toast.info('Cette adresse email est déjà abonnée à notre newsletter.');
        } else {
          toast.error(data.error || 'Une erreur est survenue lors de l\'inscription.');
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <section className="py-16 px-4 bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-red-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Inscription confirmée !
              </h2>
              <p className="text-slate-300 mb-4">
                Vous recevrez bientôt nos dernières actualités et offres exclusives.
              </p>
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                <Mail className="h-4 w-4 mr-1" />
                Abonné avec succès
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-red-500/10">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Mail className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Restez informé des dernières actualités
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Recevez en exclusivité nos meilleures offres, les nouveautés CS2, 
            et les annonces importantes directement dans votre boîte mail.
          </p>
        </div>

        <Card className="max-w-md mx-auto border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500"
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Inscription en cours...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    S&apos;abonner à la newsletter
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center text-xs text-slate-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pas de spam, désinscription facile à tout moment
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Offres exclusives</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Actualités CS2</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm">Nouveaux giveaways</span>
          </div>
        </div>
      </div>
    </section>
  );
}