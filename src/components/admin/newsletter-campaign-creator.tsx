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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Save, 
  Calendar as CalendarIcon, 
  Eye, 
  Users,
  Clock,
  Mail,
  FileText,
  Palette,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WysiwygEditor } from './wysiwyg-editor';
import { EmailTemplateSelector, EmailTemplate } from './email-template-selector';
import { useLocale } from '@/components/providers/locale-provider';

interface NewsletterCampaignCreatorProps {
  onCampaignCreated?: () => void;
}

export function NewsletterCampaignCreator({ onCampaignCreated }: NewsletterCampaignCreatorProps) {
  const { messages } = useLocale();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [contentMode, setContentMode] = useState<'template' | 'wysiwyg' | 'text'>('template');

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setHtmlContent(template.htmlContent);
    setContentMode('template');
    // Pré-remplir le sujet si vide
    if (!subject) {
      setSubject(template.name);
    }
  };

  const getContentForSave = () => {
    switch (contentMode) {
      case 'template':
        return selectedTemplate ? selectedTemplate.htmlContent : htmlContent;
      case 'wysiwyg':
        return htmlContent;
      case 'text':
        return content;
      default:
        return content;
    }
  };

  const handleSaveDraft = async () => {
    const contentToSave = getContentForSave();
    if (!title || !subject || !contentToSave) {
      toast.error(messages.admin.newsletter.campaignCreator.errorRequired);
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
          content: contentToSave,
          contentType: contentMode === 'text' ? 'text' : 'html',
          templateId: selectedTemplate?.id,
          scheduledAt: scheduledDate?.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(messages.admin.newsletter.campaignCreator.saveSuccess);
        resetForm();
        onCampaignCreated?.();
      } else {
        toast.error(data.message || messages.admin.newsletter.campaignCreator.saveError);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error(messages.admin.newsletter.campaignCreator.saveError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNow = async () => {
    const contentToSave = getContentForSave();
    if (!title || !subject || !contentToSave) {
      toast.error(messages.admin.newsletter.campaignCreator.errorRequired);
      return;
    }

    if (!confirm(messages.admin.newsletter.campaignCreator.confirmSend)) {
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
          content: contentToSave,
          contentType: contentMode === 'text' ? 'text' : 'html',
          templateId: selectedTemplate?.id,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData.message || messages.admin.newsletter.campaignCreator.saveError);
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
        toast.success(`${messages.admin.newsletter.campaignCreator.sendSuccess} ${sendData.stats.totalSent}`);
        resetForm();
        onCampaignCreated?.();
      } else {
        toast.error(sendData.message || messages.admin.newsletter.campaignCreator.sendError);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast.error(messages.admin.newsletter.campaignCreator.sendCampaignError);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setContent('');
    setHtmlContent('');
    setScheduledDate(undefined);
    setPreviewMode(false);
    setSelectedTemplate(null);
    setContentMode('template');
  };

  const getPreviewHtml = () => {
    const contentToPreview = getContentForSave();
    
    if (contentMode === 'text') {
      return contentToPreview
        .split('\n\n')
        .map(paragraph => `<p style="margin-bottom: 16px; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
    }
    
    return contentToPreview;
  };

  if (previewMode) {
    return (
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                {messages.admin.newsletter.campaignCreator.previewTitle}
              </CardTitle>
              <CardDescription>
                {messages.admin.newsletter.campaignCreator.previewSubtitle}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(false)}
              className="border-slate-600 text-slate-300"
            >
              {messages.admin.newsletter.campaignCreator.backToEdit}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 rounded-lg text-black">
            <div className="border-b pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">{subject}</h1>
              <p className="text-sm text-gray-600 mt-1">De: MoonSkin &lt;{process.env.NEXT_PUBLIC_NEWSLETTER_FROM_EMAIL ?? 'noreply@moonskin.com'}&gt;</p>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            />
            <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>{messages.admin.newsletter.campaignCreator.unsubscribeNotice}</p>
              <p><a href="#" className="text-gray-500">{messages.admin.newsletter.campaignCreator.unsubscribeLink}</a></p>
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
          {messages.admin.newsletter.campaignCreator.title}
        </CardTitle>
        <CardDescription>
          {messages.admin.newsletter.campaignCreator.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Titre de la campagne */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300">
            {messages.admin.newsletter.campaignCreator.campaignTitleLabel}
          </Label>
          <Input
            id="title"
            placeholder={messages.admin.newsletter.campaignCreator.campaignTitlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        {/* Sujet de l'email */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-slate-300">
            {messages.admin.newsletter.campaignCreator.emailSubjectLabel}
          </Label>
          <Input
            id="subject"
            placeholder={messages.admin.newsletter.campaignCreator.emailSubjectPlaceholder}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>

        {/* Contenu */}
        <div className="space-y-4">
          <Label className="text-slate-300">
            {messages.admin.newsletter.campaignCreator.emailContentLabel}
          </Label>
          
          <Tabs value={contentMode} onValueChange={(value) => setContentMode(value as 'template' | 'wysiwyg' | 'text')}>
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="template" className="data-[state=active]:bg-orange-500">
                <Palette className="h-4 w-4 mr-2" />
                {messages.admin.newsletter.campaignCreator.tabTemplates}
              </TabsTrigger>
              <TabsTrigger value="wysiwyg" className="data-[state=active]:bg-orange-500">
                <FileText className="h-4 w-4 mr-2" />
                {messages.admin.newsletter.campaignCreator.tabVisual}
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-orange-500">
                <Code className="h-4 w-4 mr-2" />
                {messages.admin.newsletter.campaignCreator.tabText}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <EmailTemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
              />
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {messages.admin.newsletter.campaignCreator.customizeTemplate}
                  </Label>
                  <WysiwygEditor
                    value={htmlContent}
                    onChange={setHtmlContent}
                    placeholder={messages.components.newsletter.templatePlaceholder}
                    height="400px"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="wysiwyg" className="space-y-2">
              <WysiwygEditor
                value={htmlContent}
                onChange={setHtmlContent}
                placeholder={messages.components.newsletter.visualEditorPlaceholder}
                height="500px"
              />
              <p className="text-xs text-slate-400">
                {messages.admin.newsletter.campaignCreator.visualEditorHint}
              </p>
            </TabsContent>

            <TabsContent value="text" className="space-y-2">
              <Textarea
                placeholder={messages.components.newsletter.textEditorPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="bg-slate-700 border-slate-600 text-white resize-none"
              />
              <p className="text-xs text-slate-400">
                {messages.admin.newsletter.campaignCreator.textEditorHint}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Planification (optionnelle) */}
        <div className="space-y-2">
          <Label className="text-slate-300">
            {messages.admin.newsletter.campaignCreator.schedulingLabel}
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
                  <span>{messages.admin.newsletter.campaignCreator.schedulingPlaceholder}</span>
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
            disabled={!title || !subject || !getContentForSave()}
          >
            <Eye className="h-4 w-4 mr-2" />
            {messages.admin.newsletter.campaignCreator.previewButton}
          </Button>

          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isLoading || !title || !subject || !getContentForSave()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {messages.admin.newsletter.campaignCreator.savingButton}
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {scheduledDate ? messages.admin.newsletter.campaignCreator.scheduleButton : messages.admin.newsletter.campaignCreator.saveButton}
              </>
            )}
          </Button>

          <Button
            onClick={handleSendNow}
            disabled={isSending || !title || !subject || !getContentForSave()}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex-1"
          >
            {isSending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {messages.admin.newsletter.campaignCreator.sendingButton}
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {messages.admin.newsletter.campaignCreator.sendNowButton}
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Users className="h-4 w-4" />
            <span>{messages.admin.newsletter.campaignCreator.audienceInfo}</span>
          </div>
          {scheduledDate && (
            <div className="flex items-center gap-2 text-slate-300 text-sm mt-2">
              <Clock className="h-4 w-4" />
              <span>{messages.admin.newsletter.campaignCreator.scheduledOn} {format(scheduledDate, 'PPP à HH:mm', { locale: fr })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}