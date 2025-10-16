'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Save, 
  Calendar as CalendarIcon, 
  Eye, 
  Users,
  Clock,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NewsletterCampaignCreatorProps {
  onCampaignCreated?: () => void;
}

export function NewsletterCampaignCreator({ onCampaignCreated }: NewsletterCampaignCreatorProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSaveDraft = async () => {
    if (!title || !subject || !content) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          content,
          scheduledAt: scheduledDate?.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Campagne sauvegardée avec succès');
        resetForm();
        onCampaignCreated?.();
      } else {
        toast.error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNow = async () => {
    if (!title || !subject || !content) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir envoyer cette campagne maintenant à tous les abonnés ?')) {
      return;
    }

    setIsSending(true);

    try {
      // D'abord créer la campagne
      const createResponse = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          content,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.message || 'Erreur lors de la création');
      }

      // Puis l'envoyer
      const sendResponse = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: createData.campaign.id,
        }),
      });

      const sendData = await sendResponse.json();

      if (sendResponse.ok) {
        toast.success(`Campagne envoyée avec succès à ${sendData.stats.totalSent} abonnés`);
        resetForm();
        onCampaignCreated?.();
      } else {
        toast.error(sendData.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error('Erreur lors de l\'envoi de la campagne');
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setContent('');
    setScheduledDate(undefined);
    setPreviewMode(false);
  };

  const getPreviewHtml = () => {
    return content
      .split('\n\n')
      .map(paragraph => `<p style="margin-bottom: 16px; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  if (previewMode) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Aperçu de la campagne
              </CardTitle>
              <CardDescription>
                Prévisualisation de l'email qui sera envoyé
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(false)}
              className="border-slate-600 text-slate-300"
            >
              Retour à l'édition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 rounded-lg text-black">
            <div className="border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{subject}</h1>
              <p className="text-sm text-gray-600 mt-1">De: CashTrade &lt;noreply@cashtrade.com&gt;</p>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>Vous recevez cet email car vous êtes abonné à notre newsletter.</p>
              <p><a href="#" className="text-gray-500">Se désabonner</a></p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-orange-400" />
          Créer une campagne newsletter
        </CardTitle>
        <CardDescription>
          Créez et envoyez une nouvelle campagne d'emailing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Titre de la campagne */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300">
            Titre de la campagne *
          </Label>
          <Input
            id="title"
            placeholder="Ex: Newsletter Novembre 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        {/* Sujet de l'email */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-slate-300">
            Sujet de l'email *
          </Label>
          <Input
            id="subject"
            placeholder="Ex: 🎮 Nouvelles offres CS2 et giveaways exclusifs !"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        {/* Contenu */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-slate-300">
            Contenu de l'email *
          </Label>
          <Textarea
            id="content"
            placeholder="Rédigez le contenu de votre newsletter..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="bg-slate-700 border-slate-600 text-white resize-none"
          />
          <p className="text-xs text-slate-400">
            Utilisez des doubles retours à la ligne pour séparer les paragraphes.
          </p>
        </div>

        {/* Planification (optionnelle) */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            Planification (optionnel)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal border-slate-600 text-slate-300"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? (
                  format(scheduledDate, 'PPP à HH:mm', { locale: fr })
                ) : (
                  <span>Envoyer maintenant ou planifier</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="text-white"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={!title || !subject || !content}
          >
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>

          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading || !title || !subject || !content}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {scheduledDate ? 'Planifier' : 'Sauvegarder'}
              </>
            )}
          </Button>

          <Button
            onClick={handleSendNow}
            disabled={isSending || !title || !subject || !content}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex-1"
          >
            {isSending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer maintenant
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Users className="h-4 w-4" />
            <span>Cette campagne sera envoyée à tous les abonnés actifs</span>
          </div>
          {scheduledDate && (
            <div className="flex items-center gap-2 text-slate-300 text-sm mt-2">
              <Clock className="h-4 w-4" />
              <span>Envoi programmé le {format(scheduledDate, 'PPP à HH:mm', { locale: fr })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}