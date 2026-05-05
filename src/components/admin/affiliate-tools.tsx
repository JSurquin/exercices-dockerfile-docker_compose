'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/components/providers/locale-provider';
import { 
  Calculator, 
  RefreshCw, 
  Users, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function AffiliateTools() {
  const { messages } = useLocale();
  const t = messages.admin.affiliateTools;

  const [loading, setLoading] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');
  const { toast } = useToast();

  const handleRecalculate = async (action: string, params: Record<string, string> = {}) => {
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
          title: t.success,
          description: data.message
        });
      } else {
        toast({
          title: t.error,
          description: data.error || t.operationError,
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: t.error,
        description: t.connectionError,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t.recalculateTitle}
            </CardTitle>
            <CardDescription>
              {t.recalculateDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="affiliate-id">{t.affiliateIdLabel}</Label>
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
              {t.recalculateButton}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t.processTradeTitle}
            </CardTitle>
            <CardDescription>
              {t.processTradeDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trade-id">{t.tradeIdLabel}</Label>
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
              {t.processButton}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t.recalculateAllTitle}
            </CardTitle>
            <CardDescription>
              {t.recalculateAllDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">{t.warningTitle}</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t.warningMessage}
              </p>
            </div>
            <Button 
              className="w-full"
              variant="destructive"
              onClick={() => handleRecalculate('recalculate_all')}
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.recalculateAllButton}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.systemInfoTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">{t.commissionRulesTitle}</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t.commissionRule1}</li>
                <li>• {t.commissionRule2}</li>
                <li>• {t.commissionRule3}</li>
                <li>• {t.commissionRule4}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t.commissionStatusTitle}</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t.commissionStatus1}</li>
                <li>• {t.commissionStatus2}</li>
                <li>• {t.commissionStatus3}</li>
                <li>• {t.commissionStatus4}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
