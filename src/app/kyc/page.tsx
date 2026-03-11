'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  CameraIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Messages } from '~/utils/types';

type KYCStep = 'info' | 'documents' | 'selfie' | 'address' | 'review';
type DocumentType = 'id_card' | 'passport' | 'driving_license';

const getSteps = (messages: Messages) => [
  { id: 'info', title: messages.kycPage.steps.info, icon: DocumentTextIcon },
  { id: 'documents', title: messages.kycPage.steps.documents, icon: DocumentTextIcon },
  { id: 'selfie', title: messages.kycPage.steps.selfie, icon: CameraIcon },
  { id: 'address', title: messages.kycPage.steps.address, icon: HomeIcon },
  { id: 'review', title: messages.kycPage.steps.review, icon: CheckCircleIcon },
];

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export default function KYCPage() {
  const { user, updateUser } = useAuth();
  const { messages } = useLocale();
  const [currentStep, setCurrentStep] = useState<KYCStep>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false); // Pour forcer l'affichage du formulaire
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
  });
  const [documentType, setDocumentType] = useState<DocumentType>('id_card');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const steps = getSteps(messages);

  useQuery({
    queryKey: queryKeys.kycStatus,
    queryFn: async () => {
      const justVerified = localStorage.getItem('kyc_just_verified');
      if (justVerified) {
        const timestamp = parseInt(justVerified);
        if (Date.now() - timestamp < 30000) {
          return null;
        } else {
          localStorage.removeItem('kyc_just_verified');
        }
      }

      const response = await fetch('/api/kycaid/status');
      if (!response.ok) return null;
      const data = await response.json();

      if (data.verificationId && process.env.NODE_ENV === 'development') {
        const pollResponse = await fetch(`/api/kycaid/poll/${data.verificationId}`);
        if (pollResponse.ok) {
          const pollData = await pollResponse.json();
          if (pollData.verified === true) {
            localStorage.setItem('kyc_just_verified', Date.now().toString());
            toast.success('KYC vérifié avec succès !');
            setTimeout(() => window.location.reload(), 1000);
          } else if (pollData.status === 'completed' && pollData.verified === false) {
            toast.error('KYC refusé. Veuillez réessayer.');
            setTimeout(() => window.location.reload(), 1000);
          }
        }
      }
      return data;
    },
    enabled: user?.kycStatus === 'IN_PROGRESS',
    refetchInterval: user?.kycStatus === 'IN_PROGRESS' ? 10_000 : false,
  });

  const handleFileUpload = (type: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`${file.name} ${messages.kycPage.toasts.uploaded}`);
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stepOrder: KYCStep[] = ['info', 'documents', 'selfie', 'address', 'review'];
      const currentIndex = stepOrder.indexOf(currentStep);
      
      if (currentIndex < stepOrder.length - 1) {
        setCurrentStep(stepOrder[currentIndex + 1]);
      } else {
        // Submit KYC
        await submitKYC();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    const stepOrder: KYCStep[] = ['info', 'documents', 'selfie', 'address', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const submitKYC = async () => {
    try {
      console.log('🚀 [KYC FRONTEND] Début de la soumission du dossier KYC');
      console.log('📋 [KYC FRONTEND] Informations personnelles:', personalInfo);
      console.log('📋 [KYC FRONTEND] Type de document:', documentType);
      console.log('📋 [KYC FRONTEND] Fichiers uploadés:', Object.keys(uploadedFiles));
      
      // Validation finale
      if (!uploadedFiles.identity || !uploadedFiles.selfie) {
        console.error('❌ [KYC FRONTEND] Documents manquants');
        toast.error(messages.kycPage.toasts.error);
        return;
      }

      // Préparer le FormData
      const formData = new FormData();
      
      // Ajouter les informations personnelles
      formData.append('personalInfo', JSON.stringify(personalInfo));
      // Le type de document sera mappé côté serveur (id_card → GOVERNMENT_ID)
      formData.append('documentType', documentType); // id_card, passport, driving_license
      
      // Ajouter les fichiers
      formData.append('identityFile', uploadedFiles.identity);
      if (uploadedFiles.identityBack) {
        formData.append('identityBackFile', uploadedFiles.identityBack);
      }
      formData.append('selfieFile', uploadedFiles.selfie);
      if (uploadedFiles.address) {
        formData.append('addressFile', uploadedFiles.address);
      }

      console.log('📤 [KYC FRONTEND] Envoi de la requête à /api/kyc/submit');

      // Envoyer à l'API
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [KYC FRONTEND] Erreur de l\'API:', data);
        throw new Error(data.error || 'Erreur lors de la soumission');
      }

      console.log('✅ [KYC FRONTEND] Réponse de l\'API:', data);
      console.log('🎉 [KYC FRONTEND] Dossier KYC soumis avec succès !');
      
      // Mettre à jour l'utilisateur
      if (user) {
        await updateUser({ kycStatus: 'IN_PROGRESS' });
        console.log('✅ [KYC FRONTEND] Statut utilisateur mis à jour : IN_PROGRESS');
      }
      
      toast.success(messages.toast.kycSubmitted);
      
      // Optionnel : rediriger vers le dashboard après quelques secondes
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error: any) {
      console.error('💥 [KYC FRONTEND] Erreur lors de la soumission:', error);
      toast.error(error.message || messages.kycPage.toasts.error);
    }
  };

  const getStepIndex = () => {
    const stepOrder: KYCStep[] = ['info', 'documents', 'selfie', 'address', 'review'];
    return stepOrder.indexOf(currentStep);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'info':
        return personalInfo.firstName && personalInfo.lastName && personalInfo.dateOfBirth && personalInfo.nationality;
      case 'documents':
        return uploadedFiles.identity;
      case 'selfie':
        return uploadedFiles.selfie;
      case 'address':
        return uploadedFiles.address || true; // Optionnel
      default:
        return true;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{messages.kycPage.status.loginRequired.title}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.kycPage.status.loginRequired.description}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              {messages.kycPage.status.loginRequired.login}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC déjà vérifié
  if (user.kycStatus === 'VERIFIED') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">{messages.kycPage.status.verified.title}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.kycPage.status.verified.description}
            </p>
            <Button asChild>
              <a href="/dashboard">{messages.kycPage.status.verified.dashboard}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC en cours (et qu'on ne force pas l'affichage du formulaire)
  if (user.kycStatus === 'IN_PROGRESS' && !forceShowForm) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <div className="relative">
              <ClockIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              {process.env.NODE_ENV === 'development' && (
                <ArrowPathIcon className="w-6 h-6 absolute top-0 right-1/3 text-blue-500 animate-spin" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{messages.kycPage.status.inProgress.title}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.kycPage.status.inProgress.description}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-blue-500 mb-4">
                Vérification automatique en cours... (polling toutes les 10s)
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <a href="/dashboard">{messages.kycPage.status.inProgress.dashboard}</a>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('[KYC] Forcing form display from IN_PROGRESS');
                  setForceShowForm(true);
                }}
              >
                Soumettre une nouvelle vérification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC rejeté (et qu'on ne force pas l'affichage du formulaire)
  if (user.kycStatus === 'REJECTED' && !forceShowForm) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">{messages.kycPage.status.rejected.title}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.kycPage.status.rejected.description}
            </p>
            <Button 
              onClick={() => {
                console.log('[KYC] Recommencer button clicked - forcing form display');
                setForceShowForm(true);
                setCurrentStep('info');
                // Reset les fichiers uploadés
                setUploadedFiles({});
              }}
            >
              {messages.kycPage.status.rejected.restart}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{messages.kycPage.title}</h1>
          <p className="text-muted-foreground">
            {messages.kycPage.subtitle}
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= getStepIndex() 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {index < getStepIndex() ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    index <= getStepIndex() ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-0.5 ml-6 ${
                    index < getStepIndex() ? 'bg-orange-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(getStepIndex() / (steps.length - 1)) * 100} className="h-2" />
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {(() => {
                const step = steps.find(s => s.id === currentStep);
                const IconComponent = step?.icon;
                return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
              })()}
              <span>{steps.find(s => s.id === currentStep)?.title}</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Info Step */}
              {currentStep === 'info' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          {messages.kycPage.info.title}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          {messages.kycPage.info.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{messages.kycPage.info.firstName} *</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder={messages.kycPage.info.firstNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{messages.kycPage.info.lastName} *</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder={messages.kycPage.info.lastNamePlaceholder}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">{messages.kycPage.info.dateOfBirth} *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">{messages.kycPage.info.nationality} *</Label>
                      <Select value={personalInfo.nationality} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, nationality: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={messages.common.selectPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FR">{messages.kycPage.info.countries.france}</SelectItem>
                          <SelectItem value="BE">{messages.kycPage.info.countries.belgium}</SelectItem>
                          <SelectItem value="CH">{messages.kycPage.info.countries.switzerland}</SelectItem>
                          <SelectItem value="CA">{messages.kycPage.info.countries.canada}</SelectItem>
                          <SelectItem value="US">{messages.kycPage.info.countries.usa}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold">{messages.kycPage.info.address}</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address">{messages.kycPage.info.address}</Label>
                      <Input
                        id="address"
                        value={personalInfo.address}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder={messages.kycPage.info.addressPlaceholder}
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">{messages.kycPage.info.city}</Label>
                        <Input
                          id="city"
                          value={personalInfo.city}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                          placeholder={messages.kycPage.info.cityPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">{messages.kycPage.info.postalCode}</Label>
                        <Input
                          id="postalCode"
                          value={personalInfo.postalCode}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder={messages.kycPage.info.postalCodePlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{messages.kycPage.info.country}</Label>
                        <Select value={personalInfo.country} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, country: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FR">{messages.kycPage.info.countries.france}</SelectItem>
                            <SelectItem value="BE">{messages.kycPage.info.countries.belgium}</SelectItem>
                            <SelectItem value="CH">{messages.kycPage.info.countries.switzerland}</SelectItem>
                            <SelectItem value="CA">{messages.kycPage.info.countries.canada}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Step */}
              {currentStep === 'documents' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label>{messages.kycPage.documents.type} *</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id_card">{messages.kycPage.documents.types.id}</SelectItem>
                        <SelectItem value="passport">{messages.kycPage.documents.types.passport}</SelectItem>
                        <SelectItem value="driving_license">{messages.kycPage.documents.types.license}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recto du document */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">{messages.kycPage.documents.upload} (Recto) *</h4>
                    <p className="text-muted-foreground mb-4">
                      {messages.kycPage.documents.description}
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('identity', file);
                      }}
                      className="max-w-xs mx-auto"
                    />
                    {uploadedFiles.identity && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 inline-block mr-2" />
                        <span className="text-green-700 dark:text-green-300">
                          {uploadedFiles.identity.name} {messages.kycPage.documents.uploaded}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verso du document (si carte d'identité) */}
                  {documentType === 'id_card' && (
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h4 className="font-semibold mb-2">Verso de la carte d&apos;identité</h4>
                      <p className="text-muted-foregro und mb-4">
                        Upload le verso de votre carte d&apos;identité (optionnel mais recommandé)
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('identityBack', file);
                        }}
                        className="max-w-xs mx-auto"
                      />
                      {uploadedFiles.identityBack && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 inline-block mr-2" />
                          <span className="text-green-700 dark:text-green-300">
                            {uploadedFiles.identityBack.name} {messages.kycPage.documents.uploaded}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          {messages.kycPage.documents.tips.title}
                        </p>
                        <ul className="text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                          <li>{messages.kycPage.documents.tips.lighting}</li>
                          <li>{messages.kycPage.documents.tips.readable}</li>
                          <li>{messages.kycPage.documents.tips.reflection}</li>
                          <li>{messages.kycPage.documents.tips.complete}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selfie Step */}
              {currentStep === 'selfie' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <CameraIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">{messages.kycPage.selfie.title}</h4>
                    <p className="text-muted-foreground mb-4">
                      {messages.kycPage.selfie.description}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('selfie', file);
                      }}
                      className="max-w-xs mx-auto"
                    />
                    {uploadedFiles.selfie && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 inline-block mr-2" />
                        <span className="text-green-700 dark:text-green-300">
                          {messages.kycPage.selfie.uploaded}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          {messages.kycPage.selfie.instructions.title}
                        </p>
                        <ul className="text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                          <li>{messages.kycPage.selfie.instructions.camera}</li>
                          <li>{messages.kycPage.selfie.instructions.visible}</li>
                          <li>{messages.kycPage.selfie.instructions.accessories}</li>
                          <li>{messages.kycPage.selfie.instructions.lighting}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Step */}
              {currentStep === 'address' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          {messages.kycPage.addressDoc.optional}
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          {messages.kycPage.addressDoc.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <HomeIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">{messages.kycPage.addressDoc.title}</h4>
                    <p className="text-muted-foreground mb-4">
                      {messages.kycPage.addressDoc.description.split('.')[1]}
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('address', file);
                      }}
                      className="max-w-xs mx-auto"
                    />
                    {uploadedFiles.address && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 inline-block mr-2" />
                        <span className="text-green-700 dark:text-green-300">
                          {uploadedFiles.address.name} {messages.kycPage.addressDoc.uploaded}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleNextStep}>
                    {messages.kycPage.addressDoc.skip}
                  </Button>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                          {messages.kycPage.review.complete}
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          {messages.kycPage.review.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold">{messages.kycPage.review.personalInfo}</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{messages.kycPage.review.fullName}</span>
                        <p className="font-medium">{personalInfo.firstName} {personalInfo.lastName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{messages.kycPage.info.dateOfBirth}:</span>
                        <p className="font-medium">{personalInfo.dateOfBirth}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{messages.kycPage.review.nationality}</span>
                        <p className="font-medium">{personalInfo.nationality}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{messages.kycPage.review.address}</span>
                        <p className="font-medium">{personalInfo.address}, {personalInfo.city} {personalInfo.postalCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold">{messages.kycPage.review.documents}</h3>
                    <div className="space-y-2">
                      {uploadedFiles.identity && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>{messages.kycPage.review.identity} {uploadedFiles.identity.name}</span>
                        </div>
                      )}
                      {uploadedFiles.selfie && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>{messages.kycPage.review.selfie}</span>
                        </div>
                      )}
                      {uploadedFiles.address && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>{messages.kycPage.review.addressDocument} {uploadedFiles.address.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          {messages.kycPage.review.delay.title}
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          {messages.kycPage.review.delay.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 'info'}
                >
                  {messages.kycPage.navigation.previous}
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid() || isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isLoading ? messages.kycPage.navigation.loading : currentStep === 'review' ? messages.kycPage.navigation.submit : messages.kycPage.navigation.next}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
