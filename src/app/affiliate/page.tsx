'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { AffiliateStats, AffiliateCommission } from '@/lib/types';
import { useLocale } from '@/components/providers/locale-provider';

export default function AffiliatePage() {
  const [affiliateData, setAffiliateData] = useState<AffiliateStats | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const { toast } = useToast();
  const { messages } = useLocale();

  // Mock user ID - À remplacer par l'auth réelle
  const userId = 'user_123';

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      // Charger les stats d'affilié
      const statsResponse = await fetch(`/api/affiliate/stats?userId=${userId}`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        // Ajouter les propriétés manquantes pour la compatibilité
        const affiliateDataWithMetrics = {
          ...statsData.data,
          metrics: statsData.data.metrics || {
            totalPendingCommissions: 0,
            totalPaidCommissions: 0,
            conversionRate: 0,
            averageOrderValue: 0
          },
          recentReferrals: statsData.data.recentReferrals || []
        };
        setAffiliateData(affiliateDataWithMetrics);
        loadCommissions();
      } else if (statsResponse.status === 404) {
        // Pas encore affilié, vérifier s'il y a une demande en cours
        const applyResponse = await fetch(`/api/affiliate/apply?userId=${userId}`);
        const applyData = await applyResponse.json();
        
        if (applyData.success && applyData.data.length > 0) {
          setApplications(applyData.data);
        } else {
          setShowApplication(true);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données affilié:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données d\'affiliation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    try {
      const response = await fetch(`/api/affiliate/commissions?userId=${userId}&status=PENDING`);
      const data = await response.json();

      if (data.success) {
        setCommissions(data.data.commissions);
      }
    } catch (error) {
      console.error('Erreur chargement commissions:', error);
    }
  };

  const handleApplyAffiliate = async (formData: FormData) => {
    setApplying(true);
    try {
      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          motivation: formData.get('motivation'),
          socialLinks: {
            youtube: formData.get('youtube'),
            twitch: formData.get('twitch'),
            twitter: formData.get('twitter'),
            instagram: formData.get('instagram')
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: messages.affiliate.application.success,
          description: messages.affiliate.application.success
        });
        setShowApplication(false);
        loadAffiliateData();
      } else {
        toast({
          title: 'Erreur',
          description: data.error || messages.affiliate.application.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        variant: 'destructive'
      });
    } finally {
      setApplying(false);
    }
  };

  const generateAffiliateLink = async (path = '') => {
    try {
      const response = await fetch('/api/affiliate/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, path })
      });

      const data = await response.json();

      if (data.success) {
        await navigator.clipboard.writeText(data.data.link);
        toast({
          title: messages.affiliate.linkCopied,
          description: 'Le lien d\'affiliation a été copié dans le presse-papiers.'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le lien',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Afficher l'état des demandes si elles existent
  if (applications.length > 0 && !affiliateData) {
    const latestApp = applications[0];
    
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              {messages.affiliate.application.title}
            </CardTitle>
            <CardDescription>
              Statut de votre demande d&apos;affiliation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {latestApp.status === 'PENDING' && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      Demande en cours d&apos;examen
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      Votre demande d&apos;affiliation a été soumise le {new Date(latestApp.createdAt).toLocaleDateString('fr-FR')} 
                      et est actuellement en cours de révision par notre équipe. Vous serez notifié dès qu&apos;une décision sera prise.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {latestApp.status === 'REJECTED' && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                        Demande rejetée
                      </h3>
                      <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                        Malheureusement, votre demande a été rejetée le {new Date(latestApp.reviewedAt).toLocaleDateString('fr-FR')}.
                      </p>
                      {latestApp.rejectionReason && (
                        <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                          <p className="text-sm font-medium text-red-900 dark:text-red-200">Raison :</p>
                          <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                            {latestApp.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    setApplications([]);
                    setShowApplication(true);
                  }}
                  className="w-full"
                >
                  Soumettre une nouvelle demande
                </Button>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">{messages.affiliate.application.applicationDetails}</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Date de soumission :</span>
                  <p className="font-medium">{new Date(latestApp.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Motivation :</span>
                  <p className="font-medium mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                    {latestApp.motivation}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showApplication) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              {messages.affiliate.application.title}
            </CardTitle>
            <CardDescription>
              {messages.affiliate.application.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleApplyAffiliate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="motivation">{messages.affiliate.application.motivation} *</Label>
                <Textarea
                  id="motivation"
                  name="motivation"
                  placeholder={messages.affiliate.application.motivation}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    name="youtube"
                    placeholder={messages.affiliate.application.youtubeUrlPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitch">Twitch</Label>
                  <Input
                    id="twitch"
                    name="twitch"
                    placeholder={messages.affiliate.application.twitchUsernamePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <Input
                    id="twitter"
                    name="twitter"
                    placeholder={messages.affiliate.application.twitterUsernamePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    placeholder={messages.affiliate.application.instagramUsernamePlaceholder}
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{messages.affiliate.application.benefits.title}</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• {messages.affiliate.application.benefits.commission}</li>
                  <li>• {messages.affiliate.application.benefits.payments}</li>
                  <li>• {messages.affiliate.application.benefits.dashboard}</li>
                  <li>• {messages.affiliate.application.benefits.support}</li>
                  <li>• {messages.affiliate.application.benefits.marketing}</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={applying}>
                {applying ? messages.affiliate.application.submitting : messages.affiliate.application.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Aucune donnée d&apos;affiliation trouvée.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{messages.affiliate.title}</h1>
        <p className="text-muted-foreground">
          Code d&apos;affiliation : <span className="font-mono font-semibold">{affiliateData.code}</span>
          <Badge className="ml-2" variant={affiliateData.isActive ? 'default' : 'secondary'}>
            {affiliateData.isActive ? 'Actif' : 'Inactif'}
          </Badge>
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{messages.affiliate.referrals}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliateData.totalReferrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(affiliateData.totalVolumeCents)}
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{messages.affiliate.totalEarnings}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(affiliateData.totalCommissionCents)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{messages.affiliate.pendingCommissions}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(commissions.reduce((sum, c) => sum + c.amountCents, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="referrals">{messages.affiliate.referrals}</TabsTrigger>
          <TabsTrigger value="commissions">{messages.affiliate.commissionHistory}</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performances Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{messages.affiliate.conversionRate}</span>
                    <span className="font-semibold">
                      {affiliateData.metrics?.conversionRate 
                        ? `${(affiliateData.metrics.conversionRate * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{messages.affiliate.averageOrderValue}</span>
                    <span className="font-semibold">
                      {formatCurrency(affiliateData.metrics?.averageOrderValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{messages.affiliate.application.commissionRate}</span>
                    <span className="font-semibold">
                      {(affiliateData.commissionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Liens Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateAffiliateLink()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier lien principal
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => generateAffiliateLink('/sell')}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier lien page vente
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('/affiliate/resources', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ressources marketing
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Mes Référrals</CardTitle>
              <CardDescription>
                Liste de tous les utilisateurs que vous avez référés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {affiliateData.recentReferrals?.length ? (
                <div className="space-y-4">
                  {affiliateData.recentReferrals.map((referral: any) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={referral.referredUser?.steamAvatar || '/images/default-avatar.png'} 
                          alt="Avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">
                            {referral.referredUser?.steamUsername || 'Utilisateur'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Référé le {new Date(referral.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(referral.volumeCents)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Commission: {formatCurrency(referral.commissionCents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun référral pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle>Commissions en Attente</CardTitle>
              <CardDescription>
                Commissions générées en attente de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commissions.length ? (
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(commission.amountCents)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(commission.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {commission.status}
                      </Badge>
                    </div>
                  ))}
                  <Button className="w-full mt-4">
                    Demander un Paiement
                  </Button>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune commission en attente
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Générateur de Liens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-path">Page personnalisée (optionnel)</Label>
                  <Input
                    id="custom-path"
                    placeholder={messages.affiliate.application.trackingPixelPlaceholder}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    const path = (document.getElementById('custom-path') as HTMLInputElement)?.value || '';
                    generateAffiliateLink(path);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Générer et Copier
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ressources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Guide de l&apos;affilié
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Créatifs marketing
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Support affiliés
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}