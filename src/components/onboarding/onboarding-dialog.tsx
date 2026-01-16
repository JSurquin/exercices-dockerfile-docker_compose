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
  const [steamId, setSteamId] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isValidSteamId, setIsValidSteamId] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const { locale, messages } = useLocale();
  const { user } = useAuth();
  
  // Vérifier si l'utilisateur a déjà un Steam ID
  const hasSteamId = user?.steamId64;

  // Créer les étapes dynamiquement en fonction de si l'utilisateur a un Steam ID
  const allSteps = [
    {
      title: messages.components.onboarding.welcome.title,
      icon: <Gamepad2 className="w-12 h-12 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.welcome.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" />
              <span className="text-xs sm:text-sm">{messages.components.onboarding.welcome.features.secure}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 shrink-0" />
              <span className="text-xs sm:text-sm">{messages.components.onboarding.welcome.features.bestPrices}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
              <span className="text-xs sm:text-sm">{messages.components.onboarding.welcome.features.fastPayment}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 shrink-0" />
              <span className="text-xs sm:text-sm">{messages.components.onboarding.welcome.features.support}</span>
            </div>
          </div>
        </div>
      )
    },
    // Étape Steam ID (conditionnelle - seulement si l'utilisateur n'a pas de Steam ID)
    ...(!hasSteamId ? [{
      title: messages.components.onboarding.steamId.title,
      icon: <Gamepad2 className="w-12 h-12 text-orange-500" />,
      isSteamIdStep: true,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.steamId.description}
          </p>
          <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">Comment trouver votre Steam ID 64 ?</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm">
              <li className="wrap-break-word">Allez sur <a href="https://steamid.io/" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline break-all">steamid.io</a></li>
              <li className="wrap-break-word">Entrez votre profil Steam</li>
              <li className="wrap-break-word">Copiez le steamID64 (17 chiffres)</li>
            </ol>
          </div>
          <div className="space-y-2">
            <Label htmlFor="steam-id" className="text-sm sm:text-base">Steam ID 64</Label>
            <Input
              id="steam-id"
              placeholder="76561198XXXXXXXXX"
              value={steamId}
              onChange={(e) => handleSteamIdChange(e.target.value)}
              className={`text-sm sm:text-base w-full ${isValidSteamId === false ? 'border-red-500' : ''}`}
            />
            {isValidSteamId === false && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="wrap-break-word">
                  Le Steam ID doit être composé de 17 chiffres et commencer par 7656119.
                </AlertDescription>
              </Alert>
            )}
            {isValidSteamId === true && (
              <Alert className="text-xs sm:text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <AlertDescription>
                  Steam ID valide !
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs sm:text-sm inline-block w-full sm:w-auto">
            <span className="wrap-break-word">Vous pouvez aussi vous reconnecter avec Steam pour lier automatiquement votre compte</span>
          </Badge>
        </div>
      )
    }] : []),
    {
      title: messages.components.onboarding.tradeLink.title,
      icon: <Link className="w-12 h-12 text-blue-500" />,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.tradeLink.description}
          </p>
          <div className="bg-muted p-3 sm:p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm sm:text-base">{messages.components.onboarding.tradeLink.howTo.title}</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm wrap-break-word">
              <li className="wrap-break-word">{messages.components.onboarding.tradeLink.howTo.step1}</li>
              <li className="wrap-break-word">{messages.components.onboarding.step2}</li>
              <li className="wrap-break-word">{messages.components.onboarding.tradeLink.howTo.step3}</li>
              <li className="wrap-break-word">{messages.components.onboarding.tradeLink.howTo.step4}</li>
            </ol>
          </div>
          <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs sm:text-sm inline-block w-full sm:w-auto">
            <span className="wrap-break-word">{messages.components.onboarding.tradeLink.warning}</span>
          </Badge>
        </div>
      )
    },
    {
      title: messages.components.onboarding.enterTradeLink.title,
      icon: <Link className="w-12 h-12 text-green-500" />,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.enterTradeLink.description}
          </p>
          <div className="space-y-2">
            <Label htmlFor="trade-url" className="text-sm sm:text-base">{messages.components.onboarding.enterTradeLink.label}</Label>
            <Input
              id="trade-url"
              placeholder={messages.components.onboarding.enterTradeLink.placeholder}
              value={tradeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className={`text-sm sm:text-base w-full ${isValidUrl === false ? 'border-red-500' : ''}`}
            />
            {isValidUrl === false && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <AlertDescription className="wrap-break-word">
                  {messages.components.onboarding.enterTradeLink.invalidUrl}
                  <a 
                    href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1 break-all"
                  >
                    {messages.components.onboarding.enterTradeLink.getUrlHere}
                  </a>
                </AlertDescription>
              </Alert>
            )}
            {isValidUrl === true && (
              <Alert className="text-xs sm:text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <AlertDescription>
                  {messages.components.onboarding.enterTradeLink.validUrl}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-950 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 wrap-break-word">
              {messages.components.onboarding.enterTradeLink.tip}
            </p>
          </div>
        </div>
      )
    },
    {
      title: messages.components.onboarding.sellProcess.title,
      icon: <DollarSign className="w-12 h-12 text-green-500" />,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.sellProcess.description}
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">1</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base wrap-break-word">{messages.components.onboarding.sellProcess.steps.select.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word">{messages.components.onboarding.sellProcess.steps.select.description}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">2</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base wrap-break-word">{messages.components.onboarding.sellProcess.steps.accept.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word">{messages.components.onboarding.sellProcess.steps.accept.description}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">3</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base wrap-break-word">{messages.components.onboarding.sellProcess.steps.receive.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word">{messages.components.onboarding.sellProcess.steps.receive.description}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: messages.components.onboarding.security.title,
      icon: <Shield className="w-12 h-12 text-purple-500" />,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            {messages.components.onboarding.security.description}
          </p>
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base text-blue-700 dark:text-blue-300 wrap-break-word">{messages.components.onboarding.security.kyc.title}</h4>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 wrap-break-word">
                {messages.components.onboarding.security.kyc.description}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base text-green-700 dark:text-green-300 wrap-break-word">{messages.components.onboarding.security.payments.title}</h4>
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 wrap-break-word">
                {messages.components.onboarding.security.payments.description}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
              <h4 className="font-semibold text-sm sm:text-base text-orange-700 dark:text-orange-300 wrap-break-word">{messages.components.onboarding.security.tradeHold.title}</h4>
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 wrap-break-word">
                {messages.components.onboarding.security.tradeHold.description}
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const steps = allSteps;
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateTradeUrl = (url: string) => {
    const steamTradeUrlRegex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=[a-zA-Z0-9_-]+$/;
    return steamTradeUrlRegex.test(url);
  };

  const validateSteamId = (id: string) => {
    // Steam ID 64 commence par 7656119 et a 17 chiffres au total
    const steamIdRegex = /^7656119[0-9]{10}$/;
    return steamIdRegex.test(id);
  };

  const handleUrlChange = (url: string) => {
    setTradeUrl(url);
    setIsValidUrl(url ? validateTradeUrl(url) : null);
  };

  const handleSteamIdChange = (id: string) => {
    setSteamId(id);
    setIsValidSteamId(id ? validateSteamId(id) : null);
  };

  const handleNext = async () => {
    // Vérifier si c'est l'étape Steam ID (si l'utilisateur n'avait pas de Steam ID)
    if (!hasSteamId && currentStepData.isSteamIdStep) {
      if (!isValidSteamId || !steamId) {
        toast.error(messages.components.onboarding.errors.invalidSteamId);
        return;
      }

      setLoading(true);
      try {
        // Appel direct à l'API au lieu d'utiliser updateUser du contexte
        const response = await fetch('/api/user/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ steamId64: steamId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erreur lors de la sauvegarde');
        }

        toast.success(messages.components.onboarding.success.steamIdSaved);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du Steam ID:', error);
        toast.error(error instanceof Error ? error.message : messages.components.onboarding.errors.steamIdSaveError);
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    // Si on est sur l'étape de saisie du trade link
    // L'index change selon si on a l'étape Steam ID ou pas
    const tradeLinkStepIndex = hasSteamId ? 2 : 3;
    if (currentStep === tradeLinkStepIndex) {
      if (!isValidUrl || !tradeUrl) {
        toast.error(messages.components.onboarding.errors.invalidTradeLink);
        return;
      }

      setLoading(true);
      try {
        // Appel direct à l'API
        const response = await fetch('/api/user/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tradeLink: tradeUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erreur lors de la sauvegarde');
        }

        toast.success(messages.components.onboarding.success.tradeLinkSaved);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du Trade Link:', error);
        toast.error(messages.components.onboarding.errors.saveError);
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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
          {/* Header avec progression */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {messages.components.onboarding.navigation.step} {currentStep + 1} {messages.components.onboarding.navigation.of} {steps.length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground text-xs sm:text-sm shrink-0"
              >
                {messages.components.onboarding.navigation.skip}
              </Button>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Contenu de l'étape */}
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-3 sm:pb-4 px-2 sm:px-6">
              <div className="flex justify-center mb-3 sm:mb-4">
                {currentStepData.icon}
              </div>
              <CardTitle className="text-lg sm:text-xl lg:text-2xl wrap-break-word">
                {currentStepData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              {currentStepData.content}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-3 sm:pt-4 gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{messages.components.onboarding.navigation.previous}</span>
              <span className="sm:hidden">Préc.</span>
            </Button>

            <div className="flex space-x-1 shrink-0">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
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
              disabled={
                loading || 
                (!hasSteamId && currentStepData.isSteamIdStep && (!isValidSteamId || !steamId)) ||
                ((hasSteamId ? currentStep === 2 : currentStep === 3) && (!isValidUrl || !tradeUrl))
              }
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="truncate">
                {loading ? messages.components.onboarding.navigation.saving : (isLastStep ? messages.components.onboarding.navigation.start : messages.components.onboarding.navigation.next)}
              </span>
              {!isLastStep && !loading && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
