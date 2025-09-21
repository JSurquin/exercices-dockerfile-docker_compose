'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
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
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

type KYCStep = 'info' | 'documents' | 'selfie' | 'address' | 'review';
type DocumentType = 'id_card' | 'passport' | 'driving_license';

const steps = [
  { id: 'info', title: 'Informations personnelles', icon: DocumentTextIcon },
  { id: 'documents', title: 'Pièce d\'identité', icon: DocumentTextIcon },
  { id: 'selfie', title: 'Selfie de vérification', icon: CameraIcon },
  { id: 'address', title: 'Justificatif de domicile', icon: HomeIcon },
  { id: 'review', title: 'Vérification', icon: CheckCircleIcon },
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
  const [currentStep, setCurrentStep] = useState<KYCStep>('info');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleFileUpload = (type: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
    toast.success(`${file.name} téléchargé avec succès`);
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
      // Simulation de soumission KYC
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (user) {
        await updateUser({ kycStatus: 'in_progress' });
      }
      
      toast.success('Dossier KYC soumis avec succès ! Vous recevrez une réponse sous 24-48h.');
    } catch {
      toast.error('Erreur lors de la soumission du dossier KYC');
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
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-6">
              Vous devez être connecté pour accéder au processus KYC.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Se connecter avec Steam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC déjà vérifié
  if (user.kycStatus === 'verified') {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">KYC Vérifié</h2>
            <p className="text-muted-foreground mb-6">
              Votre identité a été vérifiée avec succès. Vous pouvez maintenant effectuer des paiements.
            </p>
            <Button asChild>
              <a href="/dashboard">Retour au dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC en cours
  if (user.kycStatus === 'in_progress') {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <ClockIcon className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">KYC en cours de vérification</h2>
            <p className="text-muted-foreground mb-6">
              Votre dossier KYC est en cours de vérification. Vous recevrez une réponse sous 24-48h.
            </p>
            <Button asChild variant="outline">
              <a href="/dashboard">Retour au dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si KYC rejeté
  if (user.kycStatus === 'rejected') {
    return (
      <div className="container mx-auto px-4 py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">KYC Rejeté</h2>
            <p className="text-muted-foreground mb-6">
              Votre dossier KYC a été rejeté. Veuillez recommencer le processus avec des documents valides.
            </p>
            <Button onClick={() => setCurrentStep('info')}>
              Recommencer le KYC
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Vérification KYC</h1>
          <p className="text-muted-foreground">
            Vérifiez votre identité pour accéder aux paiements sécurisés
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
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
            <CardContent className="space-y-6">
              {/* Info Step */}
              {currentStep === 'info' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Pourquoi ces informations ?
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Ces informations sont requises par la réglementation européenne pour lutter contre le blanchiment d'argent et garantir la sécurité des transactions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom de famille *</Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={personalInfo.dateOfBirth}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationalité *</Label>
                      <Select value={personalInfo.nationality} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, nationality: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="BE">Belgique</SelectItem>
                          <SelectItem value="CH">Suisse</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="US">États-Unis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Adresse</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse complète</Label>
                      <Input
                        id="address"
                        value={personalInfo.address}
                        onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Rue de la Paix"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={personalInfo.city}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Paris"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal</Label>
                        <Input
                          id="postalCode"
                          value={personalInfo.postalCode}
                          onChange={(e) => setPersonalInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="75001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Select value={personalInfo.country} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, country: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FR">France</SelectItem>
                            <SelectItem value="BE">Belgique</SelectItem>
                            <SelectItem value="CH">Suisse</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Step */}
              {currentStep === 'documents' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type de document *</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id_card">Carte d&apos;identité</SelectItem>
                        <SelectItem value="passport">Passeport</SelectItem>
                        <SelectItem value="driving_license">Permis de conduire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Télécharger votre pièce d&apos;identité</h4>
                    <p className="text-muted-foreground mb-4">
                      Assurez-vous que le document est lisible et que toutes les informations sont visibles
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
                          {uploadedFiles.identity.name} téléchargé
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Conseils pour une photo de qualité
                        </p>
                        <ul className="text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                          <li>Prenez la photo dans un endroit bien éclairé</li>
                          <li>Assurez-vous que tous les textes sont lisibles</li>
                          <li>Évitez les reflets et les ombres</li>
                          <li>Le document doit être entièrement visible</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selfie Step */}
              {currentStep === 'selfie' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <CameraIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Selfie de vérification</h4>
                    <p className="text-muted-foreground mb-4">
                      Prenez un selfie clair de votre visage pour vérifier votre identité
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
                          Selfie téléchargé
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Instructions pour le selfie
                        </p>
                        <ul className="text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                          <li>Regardez directement la caméra</li>
                          <li>Votre visage doit être entièrement visible</li>
                          <li>Évitez les lunettes de soleil ou chapeaux</li>
                          <li>L'éclairage doit être naturel et uniforme</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Address Step */}
              {currentStep === 'address' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Justificatif de domicile (optionnel)
                        </p>
                        <p className="text-blue-700 dark:text-blue-300">
                          Cette étape est optionnelle mais peut accélérer la vérification. Documents acceptés : facture d'électricité, de gaz, d'eau, relevé bancaire, avis d'imposition (datant de moins de 3 mois).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <HomeIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Justificatif de domicile</h4>
                    <p className="text-muted-foreground mb-4">
                      Document officiel datant de moins de 3 mois
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
                          {uploadedFiles.address.name} téléchargé
                        </span>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full" onClick={handleNextStep}>
                    Passer cette étape
                  </Button>
                </div>
              )}

              {/* Review Step */}
              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                          Dossier complet
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          Vérifiez vos informations avant de soumettre votre dossier KYC.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Informations personnelles</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nom complet:</span>
                        <p className="font-medium">{personalInfo.firstName} {personalInfo.lastName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date de naissance:</span>
                        <p className="font-medium">{personalInfo.dateOfBirth}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nationalité:</span>
                        <p className="font-medium">{personalInfo.nationality}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Adresse:</span>
                        <p className="font-medium">{personalInfo.address}, {personalInfo.city} {personalInfo.postalCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Documents téléchargés</h3>
                    <div className="space-y-2">
                      {uploadedFiles.identity && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>Pièce d&apos;identité: {uploadedFiles.identity.name}</span>
                        </div>
                      )}
                      {uploadedFiles.selfie && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>Selfie de vérification</span>
                        </div>
                      )}
                      {uploadedFiles.address && (
                        <div className="flex items-center space-x-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span>Justificatif de domicile: {uploadedFiles.address.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Délai de vérification
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Votre dossier sera vérifié sous 24-48h ouvrées. Vous recevrez une notification par email une fois la vérification terminée.
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
                  Précédent
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid() || isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isLoading ? 'Chargement...' : currentStep === 'review' ? 'Soumettre le dossier' : 'Suivant'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
