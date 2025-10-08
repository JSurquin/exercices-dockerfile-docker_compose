'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  RefreshCw, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function AffiliateTools() {
  const [loading, setLoading] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const { toast } = useToast();

  const handleRecalculate = async (action: string, params: any = {}) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/affiliates/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Succès',
          description: data.message
        });
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Erreur lors de l\'opération',
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recalcul par affilié */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Recalcul Affilié
            </CardTitle>
            <CardDescription>
              Recalculer les commissions pour un affilié spécifique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate-id">ID Affilié</Label>
              <Input
                id="affiliate-id"
                placeholder="affiliate_xxx"
                value={selectedAffiliate}
                onChange={(e) => setSelectedAffiliate(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => handleRecalculate('recalculate_affiliate', { affiliateId: selectedAffiliate })}
              disabled={loading || !selectedAffiliate}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recalculer
            </Button>
          </CardContent>
        </Card>

        {/* Traitement d'un trade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Traiter Trade
            </CardTitle>
            <CardDescription>
              Forcer le calcul des commissions pour un trade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trade-id">ID Trade</Label>
              <Input
                id="trade-id"
                placeholder="trade_xxx"
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
              />
            </div>
            <Button 
              className="w-full"
              onClick={() => handleRecalculate('process_trade', { tradeId: selectedTrade })}
              disabled={loading || !selectedTrade}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Traiter
            </Button>
          </CardContent>
        </Card>

        {/* Recalcul global */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recalcul Global
            </CardTitle>
            <CardDescription>
              Recalculer toutes les commissions (opération lourde)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Attention</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Cette opération peut prendre plusieurs minutes
              </p>
            </div>
            <Button 
              className="w-full"
              variant="destructive"
              onClick={() => handleRecalculate('recalculate_all')}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Recalculer Tout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informations utiles */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Règles de Commission</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Taux par défaut : 2% du volume brut</li>
                <li>• Calculé uniquement sur les trades PAID</li>
                <li>• Commission créée en statut PENDING</li>
                <li>• Paiement après approbation admin</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Statuts des Commissions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• PENDING : En attente d&apos;approbation</li>
                <li>• APPROVED : Approuvée, prête au paiement</li>
                <li>• PAID : Payée via payout</li>
                <li>• CANCELLED : Annulée par l&apos;admin</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}