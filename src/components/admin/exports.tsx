'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Database,
  TrendingUp,
  Users,
  CreditCard,
  Shield
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocale } from '@/components/providers/locale-provider';

export function AdminExports() {
  const { messages } = useLocale();
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);

  const exportTypes = [
    {
      id: 'trades',
      name: 'Trades',
      description: 'Export de tous les trades avec détails',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-blue-500',
    },
    {
      id: 'users',
      name: 'Utilisateurs',
      description: 'Export des données utilisateurs',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-500',
    },
    {
      id: 'payouts',
      name: 'Paiements',
      description: 'Export des paiements SEPA et crypto',
      icon: <CreditCard className="h-5 w-5" />,
      color: 'bg-purple-500',
    },
    {
      id: 'kyc',
      name: 'Documents KYC',
      description: 'Export des documents de vérification',
      icon: <Shield className="h-5 w-5" />,
      color: 'bg-orange-500',
    },
    {
      id: 'affiliates',
      name: 'Affiliés',
      description: 'Export des données d\'affiliation',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-cyan-500',
    },
    {
      id: 'giveaways',
      name: 'Giveaways',
      description: 'Export des giveaways et participations',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-pink-500',
    },
  ];

  const handleExport = async () => {
    if (!selectedType) return;

    try {
      setIsExporting(true);
      
      const params = new URLSearchParams();
      params.append('type', selectedType);
      params.append('format', exportFormat);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());

      const response = await fetch(`/api/admin/exports?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Ajouter à l'historique
      setExportHistory(prev => [{
        id: Date.now().toString(),
        type: selectedType,
        format: exportFormat,
        dateFrom,
        dateTo,
        exportedAt: new Date(),
        size: blob.size,
      }, ...prev]);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuration d&apos;Export
          </CardTitle>
          <CardDescription className="text-slate-300">
            Sélectionnez le type de données à exporter et configurez les filtres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type d'export */}
          <div className="space-y-3">
            <Label className="text-slate-300">Type de données</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exportTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === type.id 
                      ? 'ring-2 ring-blue-500 bg-slate-700/50' 
                      : 'bg-slate-800/30 border-slate-600'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>
                        {type.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{type.name}</h3>
                        <p className="text-xs text-slate-400">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Filtres de date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? formatDate(dateFrom, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="bg-slate-800"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? formatDate(dateTo, 'dd/MM/yyyy', { locale: fr }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="bg-slate-800"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Format d'export */}
          <div className="space-y-2">
            <Label className="text-slate-300">Format d&apos;export</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bouton d'export */}
          <Button
            onClick={handleExport}
            disabled={!selectedType || isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter les données
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Historique des exports */}
      {exportHistory.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historique des Exports
            </CardTitle>
            <CardDescription className="text-slate-300">
              Derniers exports effectués
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-600 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">
                        {item.type} ({item.format.toUpperCase()})
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.dateFrom && item.dateTo
                          ? `${formatDate(item.dateFrom, 'dd/MM/yyyy')} - ${formatDate(item.dateTo, 'dd/MM/yyyy')}`
                          : 'Toutes les données'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">
                      {formatDate(item.exportedAt, 'dd/MM/yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ExportHistoryItem {
  id: string;
  type: string;
  format: 'csv' | 'excel';
  dateFrom?: Date;
  dateTo?: Date;
  exportedAt: Date;
  size: number;
}
