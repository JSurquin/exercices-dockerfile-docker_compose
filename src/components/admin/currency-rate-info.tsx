'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useCurrencyConverter } from '@/hooks/use-currency-converter';

export function CurrencyRateInfo() {
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
          Taux de Change USD → EUR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur: {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Taux actuel:</span>
              <span className="font-mono font-bold">
                {exchangeRate ? `1 USD = ${exchangeRate.toFixed(4)} EUR` : 'Chargement...'}
              </span>
            </div>
            
            {lastUpdate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernière MAJ:</span>
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
                  <span className="text-sm text-muted-foreground">État du cache:</span>
                  <Badge variant={cacheInfo.hasCache ? "default" : "secondary"}>
                    {cacheInfo.hasCache ? "Actif" : "Vide"}
                  </Badge>
                </div>
                
                {cacheInfo.hasCache && cacheInfo.age && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Âge du cache:</span>
                    <span className="text-sm font-mono">
                      {formatAge(cacheInfo.age)}
                    </span>
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
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            Vider le cache
          </Button>
        </div>

        {/* Exemple de conversion */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Exemple de conversion:</h4>
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

        {/* Statut de l'API */}
        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          <span className="text-muted-foreground">
            API Frankfurter: {error ? 'Erreur' : 'Opérationnelle'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
