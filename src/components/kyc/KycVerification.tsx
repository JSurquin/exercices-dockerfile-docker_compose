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
import { useLocale } from '@/components/providers/locale-provider';

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
  const { messages } = useLocale();
  const m = messages.kycVerification;
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
        if (!response.ok) throw new Error(data.error || m.error);
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
        if (!response.ok) throw new Error(data.error || m.error);
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
        await handleInitiateKyc();
      } else {
        const data = await response.json();
        throw new Error(data.error || m.errors.addressSave);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : m.errors.unknown);
    } finally {
      setInitiating(false);
    }
  };

  const handleInitiateKyc = async () => {
    const now = Date.now();
    if (now - lastInitiateTimeRef.current < 10_000) {
      setError(m.errors.pleaseWait);
      return;
    }
    if (initiating) return;

    lastInitiateTimeRef.current = now;
    setInitiating(true);
    setError(null);

    try {
      const response = await fetch('/api/kycaid/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || data.error || m.errors.alreadyInProgress);
          return;
        }
        throw new Error(data.error || data.details || m.errors.kycInitError);
      }

      if (data.verificationId) {
        setVerificationId(data.verificationId);
      }

      if (data.verificationUrl) {
        window.open(data.verificationUrl, '_blank');
        setTimeout(() => refetch(), 3000);
      } else {
        setError(m.errors.noVerificationUrl);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : m.errors.unknown;
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
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">{m.status.verified}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">{m.status.rejected}</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">{m.status.pending}</Badge>;
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
            <CardTitle>{m.title}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {m.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {displayError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{m.error}</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        {step === 'address' && !addressSubmitted && (kycStatus?.status === 'PENDING' || kycStatus?.canRetry) && (
          <AddressForm onSubmit={handleAddressSubmit} isLoading={initiating} />
        )}

        {(step === 'verification' || kycStatus?.status === 'VERIFIED' || addressSubmitted) && kycStatus && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            {getStatusIcon()}
            <p className="text-muted-foreground max-w-md">{kycStatus.message}</p>

            {kycStatus.declineReasons && kycStatus.declineReasons.length > 0 && (
              <Alert variant="destructive" className="text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{m.declineReasons}</AlertTitle>
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
                      {m.verified.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {m.verified.description}
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
                    {m.continue}
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
                        {m.loading}
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        {kycStatus.canRetry
                          ? m.retry
                          : m.start}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        )}

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-4">{m.steps.title}</h4>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">{m.steps.step1.title}</p>
                <p className="text-sm text-muted-foreground">
                  {m.steps.step1.description}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">{m.steps.step2.title}</p>
                <p className="text-sm text-muted-foreground">
                  {m.steps.step2.description}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">{m.steps.step3.title}</p>
                <p className="text-sm text-muted-foreground">
                  {m.steps.step3.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {m.privacy}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
