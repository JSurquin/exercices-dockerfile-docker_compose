'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Zap, 
  Gift, 
  TrendingUp, 
  Users, 
  Check,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  emailTemplates as centralizedTemplates,
  EmailTemplateConfig,
  getCategoryLabel,
} from '@/lib/email-templates';
import { useLocale } from '@/components/providers/locale-provider';

// Re-export the EmailTemplate interface for backwards compatibility
export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'promotion' | 'newsletter' | 'announcement' | 'giveaway' | 'transactional' | 'marketing' | 'notification';
  icon: React.ReactNode;
  preview: string;
  htmlContent: string;
  variables: string[];
}

// Helper function to get icon for category
const getCategoryIcon = (category: EmailTemplateConfig['category']) => {
  switch (category) {
    case 'welcome': return <Users className="h-5 w-5" />;
    case 'promotion': return <Zap className="h-5 w-5" />;
    case 'newsletter': return <Mail className="h-5 w-5" />;
    case 'announcement': return <TrendingUp className="h-5 w-5" />;
    case 'giveaway': return <Gift className="h-5 w-5" />;
    case 'transactional': return <Mail className="h-5 w-5" />;
    default: return <Mail className="h-5 w-5" />;
  }
};

// Transform centralized templates to component format
const emailTemplates: EmailTemplate[] = centralizedTemplates.map((template) => ({
  id: template.id,
  name: template.name,
  description: template.description,
  category: template.category as EmailTemplate['category'],
  icon: getCategoryIcon(template.category),
  preview: template.descriptionEn || template.description,
  htmlContent: template.htmlContent,
  variables: template.variables,
}));

interface EmailTemplateSelectorProps {
  selectedTemplate: EmailTemplate | null;
  onTemplateSelect: (template: EmailTemplate) => void;
}

export function EmailTemplateSelector({ selectedTemplate, onTemplateSelect }: EmailTemplateSelectorProps) {
  const { messages } = useLocale();
  const t = messages.admin.emailTemplateSelector;

  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Tailwind class mapping for categories
  const getTailwindCategoryColor = (category: EmailTemplate['category']): string => {
    const colorMap: Record<string, string> = {
      transactional: 'bg-blue-500',
      marketing: 'bg-purple-500',
      notification: 'bg-indigo-500',
      welcome: 'bg-emerald-500',
      promotion: 'bg-red-500',
      newsletter: 'bg-green-500',
      announcement: 'bg-violet-500',
      giveaway: 'bg-yellow-500',
    };
    return colorMap[category] || 'bg-gray-500';
  };

  // Use centralized label function
  const getLocalCategoryLabel = (category: EmailTemplate['category']) => {
    return getCategoryLabel(category as EmailTemplateConfig['category'], 'fr');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">{t.title}</h3>
        <p className="text-slate-400 text-sm">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {emailTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`border-slate-700 bg-slate-800/50 cursor-pointer transition-all hover:bg-slate-700/50 ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-orange-500' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-orange-500">
                    {template.icon}
                  </div>
                  <CardTitle className="text-sm text-white">
                    {template.name}
                  </CardTitle>
                </div>
                <Badge 
                  className={`${getTailwindCategoryColor(template.category)} text-white text-xs`}
                >
                  {getLocalCategoryLabel(template.category)}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-400">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTemplateSelect(template)}
                  className={`flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 ${
                    selectedTemplate?.id === template.id ? 'bg-orange-500 text-white border-orange-500' : ''
                  }`}
                >
                  {selectedTemplate?.id === template.id ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      {t.selected}
                    </>
                  ) : (
                    t.use
                  )}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewTemplate(template)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        {template.icon}
                        {t.preview.replace('{name}', template.name)}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-slate-300 text-sm">
                        {template.preview}
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: template.htmlContent
                              .replace(/\{\{username\}\}/g, 'John Doe')
                              .replace(/\{\{email\}\}/g, 'john@example.com')
                              .replace(/\{\{joinDate\}\}/g, '15 Oct 2024')
                              .replace(/\{\{promoTitle\}\}/g, 'FLASH SALE')
                              .replace(/\{\{discount\}\}/g, '25')
                              .replace(/\{\{endDate\}\}/g, '31 Oct 2024')
                              .replace(/\{\{promoCode\}\}/g, 'FLASH25')
                              .replace(/\{\{weekNumber\}\}/g, '42')
                              .replace(/\{\{topSkin\}\}/g, 'AK-47 Redline')
                              .replace(/\{\{marketTrend\}\}/g, '15')
                              .replace(/\{\{newsItems\}\}/g, '<p>• Nouvelle mise à jour CS2<br>• Nouveaux skins disponibles</p>')
                              .replace(/\{\{giveawayTitle\}\}/g, 'Dragon Lore Giveaway')
                              .replace(/\{\{prize\}\}/g, 'AWP Dragon Lore FN')
                              .replace(/\{\{ticketsRequired\}\}/g, '50')
                              .replace(/\{\{marketDate\}\}/g, '16 Oct 2024')
                              .replace(/\{\{topGainers\}\}/g, '<p>• AK-47 Redline: +15%<br>• M4A4 Howl: +12%</p>')
                              .replace(/\{\{topLosers\}\}/g, '<p>• Karambit Fade: -8%<br>• Butterfly Knife: -5%</p>')
                              .replace(/\{\{marketAnalysis\}\}/g, 'Le marché montre une tendance haussière cette semaine...')
                              .replace(/\{\{baseUrl\}\}/g, 'https://moonskin.com')
                          }} 
                        />
                      </div>
                      {template.variables.length > 0 && (
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <h4 className="text-white text-sm font-medium mb-2">{t.availableVariables}</h4>
                          <div className="flex flex-wrap gap-2">
                            {template.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-orange-500">
              {selectedTemplate.icon}
            </div>
            <h4 className="text-white font-medium">{t.selectedTemplate.replace('{name}', selectedTemplate.name)}</h4>
            <Badge className={`${getTailwindCategoryColor(selectedTemplate.category)} text-white`}>
              {getLocalCategoryLabel(selectedTemplate.category)}
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mb-3">{selectedTemplate.description}</p>
          {selectedTemplate.variables.length > 0 && (
            <div>
              <p className="text-slate-300 text-sm mb-2">{t.availableVariables}</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map((variable) => (
                  <Badge key={variable} variant="outline" className="text-xs border-slate-600 text-slate-300">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { emailTemplates };
