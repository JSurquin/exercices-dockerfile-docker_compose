"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gamepad2, 
  ArrowRight, 
  ArrowLeft, 
  Link, 
  DollarSign, 
  Shield, 
  CheckCircle,
  ExternalLink,
  Coins,
  AlertTriangle
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, onComplete }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tradeUrl, setTradeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { locale, messages } = useLocale();
  const { updateUser } = useAuth();

  const steps = [
    {
      title: "Bienvenue sur CashTrade !",
      titleEn: "Welcome to CashTrade!",
      icon: <Gamepad2 className="w-12 h-12 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            La plateforme #1 pour vendre vos skins CS2 en toute sécurité et obtenir de l&apos;argent réel.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">100% Sécurisé</span>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">Meilleurs prix</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Paiement rapide</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-purple-500" />
              <span className="text-sm">Support 24/7</span>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The #1 platform to sell your CS2 skins safely and get real money.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">100% Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm">Best prices</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span className="text-sm">Fast payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-5 h-5 text-purple-500" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Configurez votre Trade Link Steam",
      titleEn: "Set up your Steam Trade Link",
      icon: <Link className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Pour vendre vos skins, vous devez d&apos;abord configurer votre Trade Link Steam.
          </p>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">Comment obtenir votre Trade Link :</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Ouvrez Steam et allez dans votre inventaire</li>
              <li>{messages.components.onboarding.step2}</li>
              <li>Copiez votre URL d&apos;échange</li>
              <li>Collez-la dans vos paramètres CashTrade</li>
            </ol>
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            ⚠️ Gardez votre Trade Link privé et sécurisé
          </Badge>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            To sell your skins, you first need to set up your Steam Trade Link.
          </p>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">How to get your Trade Link:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open Steam and go to your inventory</li>
              <li>Click {"Trade Offers"} then {"Who can send me Trade Offers?"}</li>
              <li>Copy your trade URL</li>
              <li>Paste it in your CashTrade settings</li>
            </ol>
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500">
            ⚠️ Keep your Trade Link private and secure
          </Badge>
        </div>
      )
    },
    {
      title: "Saisissez votre Trade Link",
      titleEn: "Enter your Trade Link",
      icon: <Link className="w-12 h-12 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Configurez maintenant votre Trade Link Steam pour pouvoir vendre vos skins.
          </p>
          <div className="space-y-2">
            <Label htmlFor="trade-url">URL de Trade Steam</Label>
            <Input
              id="trade-url"
              placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
              value={tradeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={isValidUrl === false ? 'border-red-500' : ''}
            />
            {isValidUrl === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  URL de trade Steam invalide. 
                  <a 
                    href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    Obtenez votre URL ici
                  </a>
                </AlertDescription>
              </Alert>
            )}
            {isValidUrl === true && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  URL de trade Steam valide ✓
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Astuce :</strong> Vous pourrez modifier cette URL plus tard dans vos paramètres.
            </p>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Set up your Steam Trade Link now to be able to sell your skins.
          </p>
          <div className="space-y-2">
            <Label htmlFor="trade-url">Steam Trade URL</Label>
            <Input
              id="trade-url"
              placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
              value={tradeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={isValidUrl === false ? 'border-red-500' : ''}
            />
            {isValidUrl === false && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Invalid Steam trade URL. 
                  <a 
                    href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    Get your URL here
                  </a>
                </AlertDescription>
              </Alert>
            )}
            {isValidUrl === true && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Valid Steam trade URL ✓
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> You can change this URL later in your settings.
            </p>
          </div>
        </div>
      )
    },
    {
      title: messages.components.onboarding.sellTitle,
      titleEn: "Sell your skins in 3 steps",
      icon: <DollarSign className="w-12 h-12 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Le processus de vente est simple et sécurisé :
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Sélectionnez vos skins</h4>
                <p className="text-sm text-muted-foreground">Choisissez les skins que vous voulez vendre depuis votre inventaire Steam</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Acceptez l&apos;offre d&apos;échange</h4>
                <p className="text-sm text-muted-foreground">Notre bot vous enverra une offre d&apos;échange que vous devrez accepter</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Recevez votre paiement</h4>
                <p className="text-sm text-muted-foreground">Après 7 jours (Trade Hold Steam), recevez votre argent par SEPA ou crypto</p>
              </div>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            The selling process is simple and secure:
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Select your skins</h4>
                <p className="text-sm text-muted-foreground">Choose the skins you want to sell from your Steam inventory</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Accept the trade offer</h4>
                <p className="text-sm text-muted-foreground">Our bot will send you a trade offer that you need to accept</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Receive your payment</h4>
                <p className="text-sm text-muted-foreground">After 7 days (Steam Trade Hold), receive your money via SEPA or crypto</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: messages.components.onboarding.securityTitle,
      titleEn: "Security and KYC",
      icon: <Shield className="w-12 h-12 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Pour votre sécurité et la conformité légale, nous appliquons des mesures strictes :
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">KYC obligatoire</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Vérification d&apos;identité requise pour tous les paiements
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-300">Paiements sécurisés</h4>
              <p className="text-sm text-green-600 dark:text-green-400">
                SEPA avec vérification renforcée, crypto avec KYC
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <h4 className="font-semibold text-orange-700 dark:text-orange-300">Trade Hold Steam</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Délai de sécurité de 7 jours imposé par Steam
              </p>
            </div>
          </div>
        </div>
      ),
      contentEn: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            For your security and legal compliance, we apply strict measures:
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300">Mandatory KYC</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Identity verification required for all payments
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <h4 className="font-semibold text-green-700 dark:text-green-300">Secure payments</h4>
              <p className="text-sm text-green-600 dark:text-green-400">
                SEPA with enhanced verification, crypto with KYC
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <h4 className="font-semibold text-orange-700 dark:text-orange-300">Steam Trade Hold</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                7-day security delay imposed by Steam
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateTradeUrl = (url: string) => {
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const handleNext = async () => {
    // Si on est sur l'étape de saisie du trade link (étape 2, index 1)
    if (currentStep === 2) {
      if (!isValidUrl || !tradeUrl) {
        toast.error('Veuillez saisir un Trade Link Steam valide');
        return;
      }

      setLoading(true);
      try {
        await updateUser({ tradeLink: tradeUrl });
        toast.success('Trade Link sauvegardé avec succès !');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du Trade Link:', error);
        toast.error('Erreur lors de la sauvegarde du Trade Link');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header avec progression */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  Étape {currentStep + 1} sur {steps.length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Passer l&apos;introduction
              </Button>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Contenu de l'étape */}
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {currentStepData.icon}
              </div>
              <CardTitle className="text-2xl">
                {locale === 'fr' ? currentStepData.title : currentStepData.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locale === 'fr' ? currentStepData.content : currentStepData.contentEn}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>

            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : index < currentStep 
                        ? 'bg-primary/60' 
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={loading || (currentStep === 2 && (!isValidUrl || !tradeUrl))}
              className="flex items-center space-x-2"
            >
              <span>
                {loading ? 'Sauvegarde...' : (isLastStep ? 'Commencer' : 'Suivant')}
              </span>
              {!isLastStep && !loading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
