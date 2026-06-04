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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { UserPlus, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  onUserCreated?: () => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [sendEmail, setSendEmail] = useState(true);
  const { toast } = useToast();
  const { messages } = useLocale();

  const t = messages.admin.userCreation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          role,
          sendEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorMessage);
      }

      toast({
        title: t.successTitle,
        description: t.successMessage,
      });

      // Reset form
      setEmail('');
      setName('');
      setRole('USER');
      setSendEmail(true);
      setOpen(false);

      // Callback to refresh parent list
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.errorMessage;
      
      let description = errorMessage;
      if (errorMessage.includes('already exists')) {
        description = t.errorEmailExists;
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
          className="bg-cta-gradient hover:brightness-110"
        >
          <UserPlus className="h-4 w-4 mr-2" />
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
            <Label htmlFor="role" className="text-white">
              {t.roleLabel}
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="USER" className="text-white">
                  {t.roles.user}
                </SelectItem>
                <SelectItem value="MODERATOR" className="text-white">
                  {t.roles.moderator}
                </SelectItem>
                <SelectItem value="ADMIN" className="text-white">
                  {t.roles.admin}
                </SelectItem>
              </SelectContent>
            </Select>
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
              className="bg-cta-gradient hover:brightness-110"
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
