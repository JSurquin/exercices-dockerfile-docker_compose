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
  Star,
  Check,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'promotion' | 'newsletter' | 'announcement' | 'giveaway';
  icon: React.ReactNode;
  preview: string;
  htmlContent: string;
  variables: string[];
}

const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-cs2',
    name: 'Bienvenue CS2',
    description: 'Template d\'accueil pour les nouveaux utilisateurs avec thème Counter-Strike',
    category: 'welcome',
    icon: <Users className="h-5 w-5" />,
    preview: 'Template moderne avec header CS2, message de bienvenue personnalisé et call-to-action pour commencer à trader.',
    variables: ['{{username}}', '{{email}}', '{{joinDate}}'],
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff;">
        <div style="background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎯 Bienvenue sur CashTrade</h1>
          <p style="margin: 10px 0 0 0; color: #ffffff; opacity: 0.9;">Votre plateforme de trading CS2</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #ff6b35; margin-bottom: 15px;">Salut {{username}} ! 👋</h2>
          
          <p style="line-height: 1.6; margin-bottom: 20px;">
            Félicitations ! Vous venez de rejoindre la communauté CashTrade, la plateforme de référence pour échanger vos skins CS2 contre de l'argent réel.
          </p>
          
          <div style="background: rgba(255, 107, 53, 0.1); border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #ff6b35;">🚀 Prêt à commencer ?</h3>
            <p style="margin: 0; line-height: 1.5;">
              Connectez votre inventaire Steam et découvrez la valeur de vos skins en quelques clics !
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{baseUrl}}/dashboard" style="background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accéder à mon Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 30px; text-align: center; color: #888;">
            <p style="margin: 0; font-size: 14px;">
              Rejoint le {{joinDate}} • Email: {{email}}
            </p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'promotion-flash',
    name: 'Promotion Flash',
    description: 'Template pour les promotions limitées avec design accrocheur',
    category: 'promotion',
    icon: <Zap className="h-5 w-5" />,
    preview: 'Design dynamique avec countdown, réductions mises en avant et urgence visuelle.',
    variables: ['{{promoTitle}}', '{{discount}}', '{{endDate}}', '{{promoCode}}'],
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #000;">
        <div style="background: linear-gradient(45deg, #ff0000, #ff6b35, #ffff00); padding: 3px;">
          <div style="background: #000; padding: 25px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 32px; text-shadow: 0 0 10px #ff6b35;">
              ⚡ {{promoTitle}} ⚡
            </h1>
            <p style="color: #ff6b35; margin: 10px 0; font-size: 18px; font-weight: bold;">
              OFFRE LIMITÉE - DÉPÊCHEZ-VOUS !
            </p>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 20px; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(90deg, #ff0000, #ff6b35); color: white; padding: 20px; border-radius: 15px; display: inline-block; transform: rotate(-2deg);">
              <span style="font-size: 48px; font-weight: bold;">{{discount}}%</span>
              <p style="margin: 5px 0 0 0; font-size: 16px;">DE RÉDUCTION</p>
            </div>
          </div>
          
          <div style="background: rgba(255, 107, 53, 0.1); border: 2px dashed #ff6b35; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #ff6b35; margin: 0 0 10px 0;">🎯 Code Promo</h3>
            <div style="background: #ff6b35; color: #000; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 20px; letter-spacing: 2px;">
              {{promoCode}}
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #ff6b35; font-weight: bold; margin-bottom: 15px;">
              ⏰ Offre valable jusqu'au {{endDate}}
            </p>
            <a href="{{baseUrl}}/sell" style="background: linear-gradient(90deg, #ff0000, #ff6b35); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; text-transform: uppercase;">
              Profiter maintenant
            </a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'newsletter-weekly',
    name: 'Newsletter Hebdomadaire',
    description: 'Template pour la newsletter hebdomadaire avec actualités et stats',
    category: 'newsletter',
    icon: <Mail className="h-5 w-5" />,
    preview: 'Layout propre avec sections actualités, statistiques du marché et highlights de la semaine.',
    variables: ['{{weekNumber}}', '{{topSkin}}', '{{marketTrend}}', '{{newsItems}}'],
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px;">📊 CashTrade Weekly</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Semaine {{weekNumber}} • Votre résumé hebdomadaire</p>
        </div>
        
        <div style="padding: 30px 20px; background: white;">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
              🔥 Skin de la semaine
            </h2>
            <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px; border-radius: 10px; margin-top: 15px;">
              <h3 style="margin: 0 0 10px 0;">{{topSkin}}</h3>
              <p style="margin: 0; opacity: 0.9;">Le skin le plus échangé cette semaine avec une hausse de {{marketTrend}}%</p>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
              📈 Tendances du marché
            </h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="color: #059669; font-size: 24px; font-weight: bold;">+12%</div>
                <div style="color: #6b7280; font-size: 14px;">AK-47 Skins</div>
              </div>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="color: #dc2626; font-size: 24px; font-weight: bold;">-5%</div>
                <div style="color: #6b7280; font-size: 14px;">Knife Skins</div>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
              📰 Actualités
            </h2>
            <div style="margin-top: 15px;">
              {{newsItems}}
            </div>
          </div>
          
          <div style="text-align: center; background: #f8fafc; padding: 20px; border-radius: 10px;">
            <a href="{{baseUrl}}/dashboard" style="background: #ff6b35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Voir mon Dashboard
            </a>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'giveaway-announcement',
    name: 'Annonce Giveaway',
    description: 'Template pour annoncer les nouveaux giveaways avec design festif',
    category: 'giveaway',
    icon: <Gift className="h-5 w-5" />,
    preview: 'Design coloré et festif pour annoncer les giveaways avec prix mis en avant.',
    variables: ['{{giveawayTitle}}', '{{prize}}', '{{endDate}}', '{{ticketsRequired}}'],
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: radial-gradient(circle, #4c1d95, #1e1b4b);">
        <div style="padding: 30px 20px; text-align: center;">
          <div style="background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: bold; margin-bottom: 10px;">
            🎉 NOUVEAU GIVEAWAY 🎉
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px;">{{giveawayTitle}}</h1>
        </div>
        
        <div style="background: white; margin: 0 20px; border-radius: 15px; padding: 30px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.1;"></div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 25px; border-radius: 15px; display: inline-block; box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);">
              <div style="font-size: 18px; margin-bottom: 10px;">🏆 PRIX À GAGNER</div>
              <div style="font-size: 32px; font-weight: bold;">{{prize}}</div>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 15px 0; text-align: center;">
              🎫 Comment participer ?
            </h3>
            <div style="text-align: center;">
              <div style="background: #ff6b35; color: white; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
                {{ticketsRequired}} tickets requis
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #ef4444; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
              ⏰ Tirage le {{endDate}}
            </p>
            <a href="{{baseUrl}}/giveaways" style="background: linear-gradient(90deg, #8b5cf6, #a855f7); color: white; padding: 18px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 18px; display: inline-block; text-transform: uppercase; box-shadow: 0 5px 15px rgba(139, 92, 246, 0.3);">
              Participer maintenant
            </a>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center;">
          <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
            Bonne chance à tous ! 🍀
          </p>
        </div>
      </div>
    `
  },
  {
    id: 'market-update',
    name: 'Mise à jour Marché',
    description: 'Template pour les updates du marché CS2 avec graphiques et analyses',
    category: 'announcement',
    icon: <TrendingUp className="h-5 w-5" />,
    preview: 'Design professionnel avec données de marché, graphiques et recommandations.',
    variables: ['{{marketDate}}', '{{topGainers}}', '{{topLosers}}', '{{marketAnalysis}}'],
    htmlContent: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 25px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <div style="background: #ff6b35; padding: 10px; border-radius: 50%; margin-right: 15px;">
              📊
            </div>
            <h1 style="margin: 0; font-size: 26px;">Market Update CS2</h1>
          </div>
          <p style="margin: 0; text-align: center; opacity: 0.9;">{{marketDate}}</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #0f172a; margin-bottom: 20px; display: flex; align-items: center;">
              <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 10px; font-size: 14px;">↗️</span>
              Top Gainers
            </h2>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px;">
              {{topGainers}}
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h2 style="color: #0f172a; margin-bottom: 20px; display: flex; align-items: center;">
              <span style="background: #ef4444; color: white; padding: 5px 10px; border-radius: 5px; margin-right: 10px; font-size: 14px;">↘️</span>
              Top Losers
            </h2>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px;">
              {{topLosers}}
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
            <h3 style="color: #0f172a; margin: 0 0 15px 0;">💡 Analyse du marché</h3>
            <div style="color: #374151; line-height: 1.6;">
              {{marketAnalysis}}
            </div>
          </div>
          
          <div style="text-align: center; background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 20px; border-radius: 10px;">
            <h3 style="color: white; margin: 0 0 15px 0;">📈 Prêt à trader ?</h3>
            <a href="{{baseUrl}}/sell" style="background: white; color: #ff6b35; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Vendre mes skins
            </a>
          </div>
        </div>
      </div>
    `
  }
];

interface EmailTemplateSelectorProps {
  selectedTemplate: EmailTemplate | null;
  onTemplateSelect: (template: EmailTemplate) => void;
}

export function EmailTemplateSelector({ selectedTemplate, onTemplateSelect }: EmailTemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  const getCategoryColor = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'welcome': return 'bg-blue-500';
      case 'promotion': return 'bg-red-500';
      case 'newsletter': return 'bg-green-500';
      case 'announcement': return 'bg-purple-500';
      case 'giveaway': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: EmailTemplate['category']) => {
    switch (category) {
      case 'welcome': return 'Bienvenue';
      case 'promotion': return 'Promotion';
      case 'newsletter': return 'Newsletter';
      case 'announcement': return 'Annonce';
      case 'giveaway': return 'Giveaway';
      default: return 'Autre';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Choisir un template</h3>
        <p className="text-slate-400 text-sm">
          Sélectionnez un template pré-conçu ou partez d&apos;une page vierge
        </p>
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
                  className={`${getCategoryColor(template.category)} text-white text-xs`}
                >
                  {getCategoryLabel(template.category)}
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
                      Sélectionné
                    </>
                  ) : (
                    'Utiliser'
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
                        Aperçu: {template.name}
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
                              .replace(/\{\{baseUrl\}\}/g, 'https://cashtrade.com')
                          }} 
                        />
                      </div>
                      {template.variables.length > 0 && (
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                          <h4 className="text-white text-sm font-medium mb-2">Variables disponibles:</h4>
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
            <h4 className="text-white font-medium">Template sélectionné: {selectedTemplate.name}</h4>
            <Badge className={`${getCategoryColor(selectedTemplate.category)} text-white`}>
              {getCategoryLabel(selectedTemplate.category)}
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mb-3">{selectedTemplate.description}</p>
          {selectedTemplate.variables.length > 0 && (
            <div>
              <p className="text-slate-300 text-sm mb-2">Variables disponibles:</p>
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
