'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, XCircle, Clock, ExternalLink, AlertCircle, User } from 'lucide-react';
import { AddressForm, type AddressData } from './AddressForm';
import { toast } from 'sonner';

interface KycStatus {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  message: string;
  canRetry: boolean;
  verificationUrl?: string;
  declineReasons?: string[];
}

interface KycVerificationProps {
  onStatusChange?: (status: 'PENDING' | 'VERIFIED' | 'REJECTED') => void;
}

export function KycVerification({ onStatusChange }: KycVerificationProps) {
  // Simple translation fallback
  const t = (key: string) => key;
  const [initiating, setInitiating] = useState(false);
  const [step, setStep] = useState<'address' | 'verification'>('address');
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [isDevelopment] = useState(() => process.env.NODE_ENV === 'development');
  const [error, setError] = useState<string | null>(null);
  const previousStatusRef = useRef<KycStatus | null>(null);
  const lastInitiateTimeRef = useRef<number>(0);

  const { data: kycStatus, isLoading: loading, error: queryFetchError, refetch } = useQuery<KycStatus | null>({
    queryKey: queryKeys.kycStatus,
    queryFn: async (): Promise<KycStatus | null> => {
      if (isDevelopment && verificationId && previousStatusRef.current?.status === 'PENDING') {
        const response = await fetch(`/api/kycaid/poll/${verificationId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur');
        const transformedStatus: KycStatus = {
          status: data.verified === true ? 'VERIFIED' : data.verified === false ? 'REJECTED' : 'PENDING',
          message: data.message || '',
          canRetry: data.status !== 'completed',
          declineReasons: data.declineReasons,
        };
        if (data.status === 'completed') setVerificationId(null);
        return transformedStatus;
      } else {
        const response = await fetch('/api/kycaid/status');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erreur');
        return data as KycStatus;
      }
    },
    refetchInterval: (isDevelopment && verificationId && previousStatusRef.current?.status === 'PENDING') ? 10_000 : 30_000,
    staleTime: 0,
  });

  useEffect(() => {
    previousStatusRef.current = kycStatus ?? null;
  }, [kycStatus]);

  const queryError2 = queryFetchError instanceof Error ? queryFetchError.message : null;
  const displayError = error ?? queryError2;

  useEffect(() => {
    if (kycStatus) {
      onStatusChange?.(kycStatus.status);
    }
  }, [kycStatus, onStatusChange]);

  const handleAddressSubmit = async (address: AddressData) => {
    setInitiating(true);
    setError(null);

    try {
      const response = await fetch('/api/kycaid/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (response.ok) {
        setAddressSubmitted(true);
        setStep('verification');
        // Initier le KYC après soumission de l'adresse
        await handleInitiateKyc();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'enregistrement de l\'adresse');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setInitiating(false);
    }
  };

  const handleInitiateKyc = async () => {
    // Anti-spam : empêcher les clics multiples (cooldown 10s côté client)
    const now = Date.now();
    if (now - lastInitiateTimeRef.current < 10_000) {
      setError('Veuillez patienter avant de réessayer.');
      return;
    }
    if (initiating) return;

    lastInitiateTimeRef.current = now;
    console.log('[KYC] Initiating KYC process...');
    setInitiating(true);
    setError(null);

    try {
      console.log('[KYC] Calling /api/kycaid/initiate...');
      const response = await fetch('/api/kycaid/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      console.log('[KYC] Response status:', response.status);
      const data = await response.json();
      console.log('[KYC] Response data:', data);

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || data.error || 'Une vérification est déjà en cours. Veuillez patienter.');
          return;
        }
        throw new Error(data.error || data.details || 'Erreur lors de l\'initialisation du KYC');
      }

      // Stocker le verificationId pour le polling en mode dev
      if (data.verificationId) {
        setVerificationId(data.verificationId);
        console.log('[KYC] ✅ Verification ID stored:', data.verificationId);
      }

      // Rediriger vers l'URL de vérification
      if (data.verificationUrl) {
        console.log('[KYC] ✅ Opening verification URL:', data.verificationUrl);
        window.open(data.verificationUrl, '_blank');
        // Actualiser le statut après quelques secondes
        setTimeout(() => refetch(), 3000);
      } else {
        console.warn('[KYC] ⚠️  No verification URL returned');
        setError('Aucune URL de vérification retournée');
      }
    } catch (err) {
      console.error('[KYC] ❌ Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setInitiating(false);
    }
  };

  const getStatusIcon = () => {
    if (!kycStatus) return null;

    switch (kycStatus.status) {
      case 'VERIFIED':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'PENDING':
      default:
        return <Clock className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!kycStatus) return null;

    switch (kycStatus.status) {
      case 'VERIFIED':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">{t('kyc.status.verified') || 'Vérifié'}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{t('kyc.status.rejected') || 'Refusé'}</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">{t('kyc.status.pending') || 'En attente'}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <CardTitle>{t('kyc.title') || 'Vérification d\'identité'}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {t('kyc.description') || 'La vérification de votre identité est requise pour recevoir des paiements.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error') || 'Erreur'}</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {/* Étape 1 : Formulaire d'adresse */}
        {step === 'address' && !addressSubmitted && (kycStatus?.status === 'PENDING' || kycStatus?.canRetry) && (
          <AddressForm onSubmit={handleAddressSubmit} isLoading={initiating} />
        )}

        {/* Étape 2 : Vérification */}
        {(step === 'verification' || kycStatus?.status === 'VERIFIED' || addressSubmitted) && kycStatus && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            {getStatusIcon()}
            <p className="text-muted-foreground max-w-md">{kycStatus.message}</p>

            {kycStatus.declineReasons && kycStatus.declineReasons.length > 0 && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('kyc.declineReasons') || 'Raisons du refus'}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {kycStatus.declineReasons.map((reason: string, index: number) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {kycStatus.status === 'VERIFIED' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 w-full">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div className="text-left">
                    <p className="font-semibold text-green-500">
                      {t('kyc.verified.title') || 'Identité vérifiée'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('kyc.verified.description') || 'Vous pouvez maintenant recevoir des paiements.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(kycStatus.status === 'PENDING' || kycStatus.canRetry) && (
              <>
                {kycStatus.verificationUrl ? (
                  <Button
                    size="lg"
                    onClick={() => window.open(kycStatus.verificationUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('kyc.continue') || 'Continuer la vérification'}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleInitiateKyc}
                    disabled={initiating}
                  >
                    {initiating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading') || 'Chargement...'}
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        {kycStatus.canRetry
                          ? t('kyc.retry') || 'Réessayer la vérification'
                          : t('kyc.start') || 'Commencer la vérification'}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">{t('kyc.steps.title') || 'Comment ça marche ?'}</h4>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">{t('kyc.steps.step1.title') || 'Préparez vos documents'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('kyc.steps.step1.description') || 'Carte d\'identité ou passeport en cours de validité.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">{t('kyc.steps.step2.title') || 'Prenez un selfie'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('kyc.steps.step2.description') || 'Une photo de vous pour confirmer votre identité.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">{t('kyc.steps.step3.title') || 'Vérification automatique'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('kyc.steps.step3.description') || 'La vérification prend généralement moins de 5 minutes.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t('kyc.privacy') || 'Vos données sont sécurisées et utilisées uniquement pour vérifier votre identité conformément aux réglementations anti-blanchiment.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

