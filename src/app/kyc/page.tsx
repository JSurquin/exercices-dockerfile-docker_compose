'use client';

import { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { LoginRequiredBlock } from '@/components/auth/require-auth';

const KYCAID_SUPPORTED_COUNTRIES = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT',
  'AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BM','BT','BO','BQ','BA','BW',
  'BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL',
  'CN','CX','CC','CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ',
  'DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FK','FO','FJ',
  'FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP',
  'GU','GT','GG','GN','GW','GY','HT','HM','VA','HN','HK','HU','IS','IN','ID',
  'IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR',
  'KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY',
  'MV','ML','MT','MH','MQ','MR','MU','YT','MX','FM','MD','MC','MN','ME','MS',
  'MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK',
  'MP','NO','OM','PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR',
  'QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC','WS','SM','ST',
  'SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES',
  'LK','SD','SR','SJ','SE','CH','SY','TW','TJ','TZ','TH','TL','TG','TK','TO',
  'TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
  'VE','VN','VG','VI','WF','EH','YE','ZM','ZW',
];

function getCountryOptions(locale: string): { code: string; name: string }[] {
  const displayLocale = locale === 'cn' ? 'zh' : locale;
  try {
    const displayNames = new Intl.DisplayNames([displayLocale], { type: 'region' });
    return KYCAID_SUPPORTED_COUNTRIES
      .map(code => ({ code, name: displayNames.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name, displayLocale));
  } catch {
    return KYCAID_SUPPORTED_COUNTRIES
      .map(code => ({ code, name: code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
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
  LockClosedIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { Messages } from '~/utils/types';

type KYCStep = 'info' | 'documents' | 'selfie' | 'address' | 'review';
type DocumentType = 'id_card' | 'passport' | 'driving_license';

const getSteps = (messages: Messages) => [
  { id: 'info', title: messages.kycPage.steps.info, icon: DocumentTextIcon },
  { id: 'documents', title: messages.kycPage.steps.documents, icon: DocumentTextIcon },
  { id: 'selfie', title: messages.kycPage.steps.selfie, icon: CameraIcon },
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
  const { messages, locale } = useLocale();
  const countryOptions = getCountryOptions(locale);
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<KYCStep>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [forceShowForm, setForceShowForm] = useState(false);
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

  const isPolling = user?.kycStatus === 'IN_PROGRESS';
  const isRejected = user?.kycStatus === 'REJECTED';
  const prevStatusRef = useRef<string | null>(null);

  const { data: kycData } = useQuery({
    queryKey: queryKeys.kycStatus,
    queryFn: async () => {
      const response = await fetch('/api/kycaid/status');
      if (!response.ok) return null;
      return response.json();
    },
    enabled: isPolling || isRejected,
    refetchInterval: isPolling ? 10_000 : false,
    refetchOnWindowFocus: isPolling,
    staleTime: 0,
  });

  // Réagir aux changements de statut retournés par l'API sans recharger la page
  useEffect(() => {
    if (!kycData) return;

    const newStatus = kycData.status as string;
    if (prevStatusRef.current === newStatus) return;
    prevStatusRef.current = newStatus;

    if (newStatus === 'VERIFIED') {
      toast.success(messages.kycPage.toasts.identityVerifiedSuccess);
      updateUser({ kycStatus: 'VERIFIED' }).catch(() => null);
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      queryClient.invalidateQueries({ queryKey: queryKeys.userDashboard });
    } else if (newStatus === 'REJECTED') {
      toast.error(messages.kycPage.toasts.verificationRejected);
      updateUser({ kycStatus: 'REJECTED' }).catch(() => null);
    }
  }, [kycData, updateUser, queryClient]);

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const compressImageFile = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;

    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      fileType: file.type as string,
    };

    try {
      const compressed = await imageCompression(file, options);
      return new File([compressed], file.name, { type: file.type });
    } catch {
      return file;
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(messages.kycPage.toasts.fileTooLarge.replace('{name}', file.name).replace('{max}', String(MAX_FILE_SIZE_MB)));
      return;
    }

    let processedFile = file;

    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) {
      toast.info(messages.kycPage.toasts.compressing.replace('{name}', file.name));
      try {
        processedFile = await compressImageFile(file);
        const savedMb = ((file.size - processedFile.size) / 1024 / 1024).toFixed(1);
        if (processedFile.size < file.size) {
          toast.success(messages.kycPage.toasts.compressed.replace('{size}', (processedFile.size / 1024 / 1024).toFixed(1)).replace('{saved}', savedMb));
        }
      } catch {
        processedFile = file;
      }
    }

    setUploadedFiles(prev => ({ ...prev, [type]: processedFile }));
    toast.success(`${processedFile.name} ${messages.kycPage.toasts.uploaded}`);
  };

  const ACTIVE_STEPS: KYCStep[] = ['info', 'documents', 'selfie', 'review'];

  const handleNextStep = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentIndex = ACTIVE_STEPS.indexOf(currentStep);
      if (currentIndex < ACTIVE_STEPS.length - 1) {
        setCurrentStep(ACTIVE_STEPS[currentIndex + 1]);
      } else {
        await submitKYC();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = ACTIVE_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ACTIVE_STEPS[currentIndex - 1]);
    }
  };

  const submitKYC = async () => {
    try {
      if (!uploadedFiles.identity || !uploadedFiles.selfie) {
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

      // Envoyer à l'API
      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [KYC FRONTEND] Erreur de l\'API:', data);
        throw new Error(data.error || messages.kycPage.toasts.submissionError || messages.kycPage.toasts.error);
      }

      if (user) {
        await updateUser({ kycStatus: 'IN_PROGRESS' });
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

  const getStepIndex = () => ACTIVE_STEPS.indexOf(currentStep);

  const isStepValid = () => {
    switch (currentStep) {
      case 'info':
        return personalInfo.firstName && personalInfo.lastName && personalInfo.dateOfBirth && personalInfo.nationality;
      case 'documents':
        return uploadedFiles.identity;
      case 'selfie':
        return uploadedFiles.selfie;
      default:
        return true;
    }
  };

  if (!user) {
    return (
      <LoginRequiredBlock
        icon={<ShieldCheckIcon className="w-16 h-16" />}
        title={messages.kycPage.status.loginRequired.title}
        description={messages.kycPage.status.loginRequired.description}
        buttonLabel={messages.kycPage.status.loginRequired.login}
      />
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
                {messages.kycPage.inProgressPolling}
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
                  setForceShowForm(true);
                }}
              >
                {messages.kycPage.submitNewVerification}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC rejeté (et qu'on ne force pas l'affichage du formulaire)
  if (user.kycStatus === 'REJECTED' && !forceShowForm) {
    const declineReasons: string[] = kycData?.declineReasons ?? [];
    const reasonsMap = messages.kycPage.status.rejected.declineReasonsMap;

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center">
              <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">{messages.kycPage.status.rejected.title}</h2>
              <p className="text-muted-foreground mb-6">
                {messages.kycPage.status.rejected.description}
              </p>
            </div>

            {declineReasons.length > 0 && (
              <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm">
                    {messages.kycPage.status.rejected.reasonsTitle}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {declineReasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span>{reasonsMap[reason] ?? reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={() => {
                  setForceShowForm(true);
                  setCurrentStep('info');
                  setUploadedFiles({});
                }}
              >
                {messages.kycPage.status.rejected.restart}
              </Button>
            </div>
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{messages.kycPage.title}</h1>
          <p className="text-muted-foreground">
            {messages.kycPage.subtitle}
          </p>
        </motion.div>

        {/* Privacy banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-emerald-950/60 dark:from-emerald-950/80 dark:via-emerald-900/60 dark:to-emerald-950/80 p-5 shadow-lg shadow-emerald-900/20">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-emerald-400/10 to-emerald-500/5 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <LockClosedIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    {messages.kycPage.privacy.badge}
                  </span>
                </div>
                <p className="text-sm font-semibold text-emerald-100 mb-1">
                  {messages.kycPage.privacy.title}
                </p>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  {messages.kycPage.privacy.description}
                </p>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: ShieldCheckIcon, text: messages.kycPage.privacy.points.noStorage },
                { icon: LockClosedIcon, text: messages.kycPage.privacy.points.directTransfer },
                { icon: ShieldExclamationIcon, text: messages.kycPage.privacy.points.certifiedPartner },
                { icon: DocumentTextIcon, text: messages.kycPage.privacy.points.referenceOnly },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2 bg-emerald-900/30 border border-emerald-500/20 rounded-lg p-2.5">
                  <Icon className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-emerald-200/90 leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          {/* Stepper — icônes + connecteurs fluides */}
          <div className="flex items-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Cercle icône */}
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-colors ${
                    index <= getStepIndex()
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-muted-foreground/40 text-muted-foreground'
                  }`}>
                    {index < getStepIndex() ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  {/* Label sous l'icône — toujours visible, xs sur mobile */}
                  <p className={`text-[10px] sm:text-xs font-medium text-center w-[56px] sm:w-[72px] leading-tight ${
                    index <= getStepIndex() ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {/* Connecteur — prend tout l'espace restant jusqu'au prochain step */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 transition-colors ${
                    index < getStepIndex() ? 'bg-orange-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(getStepIndex() / (steps.length - 1)) * 100} className="h-1.5 sm:h-2" />
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
                        <SelectContent className="max-h-60">
                          {countryOptions.map(({ code, name }) => (
                            <SelectItem key={code} value={code}>{name}</SelectItem>
                          ))}
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
                          <SelectContent className="max-h-60">
                            {countryOptions.map(({ code, name }) => (
                              <SelectItem key={code} value={code}>{name}</SelectItem>
                            ))}
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
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 text-center">
                    <DocumentTextIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-semibold mb-1 text-sm sm:text-base">{messages.kycPage.documents.upload} {messages.kycPage.documents.frontSuffix}</h4>
                    <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                      {messages.kycPage.documents.description}
                    </p>
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('identity', file);
                      }}
                      className="w-full sm:max-w-xs mx-auto"
                    />
                    {uploadedFiles.identity && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-left">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-green-700 dark:text-green-300 text-sm truncate">
                          {uploadedFiles.identity.name} {messages.kycPage.documents.uploaded}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verso du document (si carte d'identité) */}
                  {documentType === 'id_card' && (
                    <div className="border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 text-center">
                      <DocumentTextIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground" />
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">{messages.kycPage.documents.idCardBack}</h4>
                      <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
                        {messages.kycPage.documents.idCardBackDescription}
                      </p>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('identityBack', file);
                        }}
                        className="w-full sm:max-w-xs mx-auto"
                      />
                      {uploadedFiles.identityBack && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-left">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-green-700 dark:text-green-300 text-sm truncate">
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
                  <div className="border-2 border-dashed border-muted rounded-lg p-4 sm:p-6 text-center">
                    <CameraIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground" />
                    <h4 className="font-semibold mb-1 text-sm sm:text-base">{messages.kycPage.selfie.title}</h4>
                    <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
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
                      className="w-full sm:max-w-xs mx-auto"
                    />
                    {uploadedFiles.selfie && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-green-700 dark:text-green-300 text-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground text-xs">{messages.kycPage.review.fullName}</span>
                        <p className="font-medium mt-0.5">{personalInfo.firstName} {personalInfo.lastName}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground text-xs">{messages.kycPage.info.dateOfBirth}</span>
                        <p className="font-medium mt-0.5">{personalInfo.dateOfBirth}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground text-xs">{messages.kycPage.review.nationality}</span>
                        <p className="font-medium mt-0.5">
                          {countryOptions.find(c => c.code === personalInfo.nationality)?.name ?? personalInfo.nationality}
                        </p>
                      </div>
                      {personalInfo.address && (
                        <div className="p-3 rounded-lg bg-muted/40">
                          <span className="text-muted-foreground text-xs">{messages.kycPage.review.address}</span>
                          <p className="font-medium mt-0.5 break-words">{personalInfo.address}{personalInfo.city ? `, ${personalInfo.city}` : ''}{personalInfo.postalCode ? ` ${personalInfo.postalCode}` : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold">{messages.kycPage.review.documents}</h3>
                    <div className="space-y-2">
                      {uploadedFiles.identity && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm truncate">{messages.kycPage.review.identity} {uploadedFiles.identity.name}</span>
                        </div>
                      )}
                      {uploadedFiles.selfie && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{messages.kycPage.review.selfie}</span>
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
              <div className="flex justify-between gap-3 pt-5 sm:pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 'info'}
                  className="min-w-[90px] sm:min-w-[110px]"
                >
                  {messages.kycPage.navigation.previous}
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid() || isLoading}
                  className="flex-1 sm:flex-none sm:min-w-[160px] bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isLoading
                    ? messages.kycPage.navigation.loading
                    : currentStep === 'review'
                    ? messages.kycPage.navigation.submit
                    : messages.kycPage.navigation.next}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
