'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface KycVerificationProps {
  onVerificationComplete?: () => void;
}

type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export function KycVerification({ onVerificationComplete }: KycVerificationProps) {
  const { messages } = useLocale();
  const [kycStatus, setKycStatus] = useState<KycStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [sumsubToken, setSumsubToken] = useState<string | null>(null);

  // Récupérer le statut KYC
  const fetchKycStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gatefi/kyc/status');
      if (response.ok) {
        const data = await response.json();
        setKycStatus(data.kycStatus);

        if (data.kycStatus === 'VERIFIED' && onVerificationComplete) {
          onVerificationComplete();
        }
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initier la vérification KYC
  const initiateKyc = async () => {
    setIsInitiating(true);
    try {
      const response = await fetch('/api/gatefi/kyc/status', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSumsubToken(data.token);
        // Ici, on pourrait intégrer le SDK Sumsub
        // Pour l'instant, on redirige vers une page externe ou on ouvre un widget
        window.open(
          `https://cockpit.sumsub.com/checkus#/${data.token}`,
          '_blank',
          'width=800,height=600'
        );
      }
    } catch (error) {
      console.error('Error initiating KYC:', error);
    } finally {
      setIsInitiating(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Rafraîchir automatiquement le statut toutes les 30 secondes si en attente
  useEffect(() => {
    if (kycStatus === 'PENDING') {
      const interval = setInterval(fetchKycStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [kycStatus]);

  const getStatusIcon = () => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-8 w-8 text-destructive" />;
      case 'PENDING':
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (kycStatus) {
      case 'VERIFIED':
        return <Badge variant="default">Vérifié</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Vérification d&apos;identité (KYC)</CardTitle>
              <CardDescription>
                La vérification KYC est obligatoire pour effectuer des retraits
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statut */}
        <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
          {getStatusIcon()}
          <div className="flex-1">
            {kycStatus === 'VERIFIED' && (
              <>
                <h3 className="font-semibold text-green-700 dark:text-green-400">
                  Identité vérifiée
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre identité a été vérifiée avec succès. Vous pouvez maintenant effectuer
                  des retraits.
                </p>
              </>
            )}

            {kycStatus === 'PENDING' && (
              <>
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-400">
                  Vérification en attente
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre demande de vérification est en cours de traitement. Cela peut prendre
                  quelques minutes à quelques heures.
                </p>
              </>
            )}

            {kycStatus === 'REJECTED' && (
              <>
                <h3 className="font-semibold text-destructive">Vérification rejetée</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre demande de vérification a été rejetée. Veuillez réessayer en fournissant
                  des documents valides.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Informations */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Pourquoi la vérification KYC ?</AlertTitle>
          <AlertDescription>
            La vérification KYC (Know Your Customer) est une exigence légale pour prévenir
            le blanchiment d&apos;argent et garantir la sécurité de tous les utilisateurs.
          </AlertDescription>
        </Alert>

        {/* Documents requis */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Documents requis</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Pièce d&apos;identité valide (carte d&apos;identité ou passeport)</li>
            <li>Photo selfie avec votre pièce d&apos;identité</li>
            <li>Justificatif de domicile de moins de 3 mois (si requis)</li>
          </ul>
        </div>

        {/* Actions */}
        {(kycStatus === 'PENDING' || kycStatus === 'REJECTED') && (
          <Button
            onClick={initiateKyc}
            disabled={isInitiating}
            className="w-full"
            size="lg"
          >
            {isInitiating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {kycStatus === 'REJECTED'
              ? 'Recommencer la vérification'
              : 'Démarrer la vérification'}
          </Button>
        )}

        {kycStatus === 'PENDING' && (
          <Button
            onClick={fetchKycStatus}
            variant="outline"
            className="w-full"
          >
            Actualiser le statut
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

