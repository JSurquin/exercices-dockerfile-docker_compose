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
      toast.error(messages.components.newsletter.errors.emailRequired);
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(messages.components.newsletter.errors.emailInvalid);
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
        toast.success(messages.components.newsletter.messages.subscriptionSuccess);
      } else {
        if (data.error === 'ALREADY_SUBSCRIBED') {
          toast.info(messages.components.newsletter.messages.alreadySubscribed);
        } else {
          toast.error(data.error || messages.components.newsletter.errors.subscriptionError);
        }
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(messages.components.newsletter.errors.generalError);
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
                {messages.components.newsletter.successTitle}
              </h2>
              <p className="text-slate-300 mb-4">
                {messages.components.newsletter.successDescription}
              </p>
              <Badge variant="outline" className="border-green-500/50 text-green-400">
                <Mail className="h-4 w-4 mr-1" />
                {messages.components.newsletter.successBadge}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-orange-500/20">
              <Mail className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold dark:text-white text-black mb-4">
            {messages.components.newsletter.title}
          </h2>
          <p className="text-black dark:text-white text-lg max-w-2xl mx-auto">
            {messages.components.newsletter.description}
          </p>
        </div>

        <Card className="max-w-md mx-auto border-slate-700/50 bg-slate-900 dark:bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={messages.components.newsletter.emailPlaceholder}
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
                    {messages.components.newsletter.subscribingButton}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-4 w-4 mr-2" />
                    {messages.components.newsletter.subscribeButton}
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center text-xs text-white">
              <AlertCircle className="h-3 w-3 mr-1" />
              {messages.components.newsletter.noSpamText}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full "></div>
            <span className="text-sm text-black dark:text-gray-300">{messages.components.newsletter.feature1}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full "></div>
            <span className="text-sm text-black dark:text-gray-300">{messages.components.newsletter.feature2}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-slate-300">
            <div className="w-2 h-2 bg-orange-500 rounded-full "></div>
            <span className="text-sm text-black dark:text-gray-300">{messages.components.newsletter.feature3}</span>
          </div>
        </div>
      </div>
    </section>
  );
}