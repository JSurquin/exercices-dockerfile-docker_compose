'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { UserCheck, Loader2 } from 'lucide-react';

interface CreateAffiliateDialogProps {
  onAffiliateCreated?: () => void;
}

export function CreateAffiliateDialog({ onAffiliateCreated }: CreateAffiliateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [commissionRate, setCommissionRate] = useState('2');
  const [sendEmail, setSendEmail] = useState(true);
  const { toast } = useToast();
  const { messages } = useLocale();

  const t = messages.admin.affiliateCreation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate commission rate
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new Error(t.errorInvalidRate);
      }

      const response = await fetch('/api/admin/affiliates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          code: code || undefined,
          commissionRate: rate,
          sendEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorMessage);
      }

      toast({
        title: t.successTitle,
        description: t.successMessage.replace('{code}', data.data.affiliate.code),
      });

      // Reset form
      setEmail('');
      setName('');
      setCode('');
      setCommissionRate('2');
      setSendEmail(true);
      setOpen(false);

      // Callback to refresh parent list
      if (onAffiliateCreated) {
        onAffiliateCreated();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.errorMessage;
      
      let description = errorMessage;
      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        description = t.errorEmailExists;
      } else if (errorMessage.includes('code') && errorMessage.includes('exists')) {
        description = t.errorCodeExists;
      }

      toast({
        title: t.errorTitle,
        description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          {t.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{t.title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {t.description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              {t.emailLabel}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              {t.nameLabel}
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-white">
              {t.codeLabel}
            </Label>
            <Input
              id="code"
              type="text"
              placeholder={t.codePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">{t.codeHelper}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionRate" className="text-white">
              {t.commissionRateLabel}
            </Label>
            <Input
              id="commissionRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder={t.commissionRatePlaceholder}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              required
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">{t.commissionRateHelper}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              className="border-slate-600"
            />
            <Label
              htmlFor="sendEmail"
              className="text-sm font-normal text-slate-300 cursor-pointer"
            >
              {t.sendEmailLabel}
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              {messages.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.creating}
                </>
              ) : (
                t.createButton
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
