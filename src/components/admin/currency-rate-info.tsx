'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/use-currency-converter';
import { useLocale } from '@/components/providers/locale-provider';

export function CurrencyRateInfo() {
  const { messages } = useLocale();
  const t = messages.admin?.currencyRate;
  const { 
    exchangeRate, 
    loading, 
    error, 
    lastUpdate, 
    fetchRate, 
    clearCache, 
    getCacheInfo 
  } = useCurrencyConverter();
  
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  useEffect(() => {
    const updateCacheInfo = () => {
      setCacheInfo(getCacheInfo());
    };
    
    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 1000); // Mise à jour chaque seconde
    
    return () => clearInterval(interval);
  }, [getCacheInfo, exchangeRate]);

  const handleRefresh = async () => {
    await fetchRate();
    setCacheInfo(getCacheInfo());
  };

  const handleClearCache = () => {
    clearCache();
    setCacheInfo(getCacheInfo());
  };

  const formatAge = (ageMs: number) => {
    const minutes = Math.floor(ageMs / 60000);
    const seconds = Math.floor((ageMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t?.title ?? 'Taux de Change USD → EUR'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t?.error ?? 'Erreur:'} {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t?.currentRate ?? 'Taux actuel:'}</span>
              <span className="font-mono font-bold">
                {exchangeRate ? `1 USD = ${exchangeRate.toFixed(4)} EUR` : (t?.loading ?? 'Chargement...')}
              </span>
            </div>
            
            {lastUpdate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t?.lastUpdate ?? 'Dernière MAJ:'}</span>
                <span className="text-sm">
                  {lastUpdate.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {cacheInfo && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t?.cacheStatus ?? 'État du cache:'}</span>
                  <Badge variant={cacheInfo.hasCache ? "default" : "secondary"}>
                    {cacheInfo.hasCache ? (t?.cacheActive ?? 'Actif') : (t?.cacheEmpty ?? 'Vide')}
                  </Badge>
                </div>
                
                {cacheInfo.hasCache && cacheInfo.age && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t?.cacheAge ?? 'Âge du cache:'}</span>
                    <span className="text-sm font-mono">
                      {formatAge(cacheInfo.age)}
                    </span>
                  </div>
                )}
                {cacheInfo.hasCache && cacheInfo.source && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t?.cacheSource ?? 'Source:'}</span>
                    <Badge variant={cacheInfo.source === 'api' ? 'default' : cacheInfo.source === 'db' ? 'secondary' : 'destructive'}>
                      {cacheInfo.source === 'api' ? 'API Live' : cacheInfo.source === 'db' ? 'BDD (J-1)' : 'Hardcodé'}
                    </Badge>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t?.refresh ?? 'Actualiser'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            {t?.clearCache ?? 'Vider le cache'}
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">{t?.conversionExample ?? 'Exemple de conversion:'}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">100.00 USD</span>
            </div>
            <div>
              <span className="font-medium">
                {exchangeRate ? `${(100 * exchangeRate).toFixed(2)} EUR` : '---'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-muted-foreground">
            {t?.apiStatus ?? 'API Frankfurter:'} {error ? (t?.apiError ?? 'Erreur') : (t?.apiOk ?? 'Opérationnelle')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
