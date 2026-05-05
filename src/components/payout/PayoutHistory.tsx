'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, History, CreditCard, Building2, ChevronLeft, ChevronRight, ArrowDownRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLocale } from '@/components/providers/locale-provider';

interface Payout {
  id: string;
  status: string;
  amountCents: number;
  createdAt: string;
  paidAt?: string;
  paymentMethod: {
    id: string;
    type: string;
    isVerified?: boolean;
    details: {
      type: string;
      maskedIban?: string | null;
      maskedBic?: string | null;
      iban?: string; // legacy, ne plus utiliser
    } | null;
  };
  trade?: {
    ticketId: string;
    grossCents: number;
  };
}

export function PayoutHistory() {
  const { messages, locale } = useLocale();
  const t = messages.payoutComponents.history;
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const { data, isLoading: loading } = useQuery({
    queryKey: [...queryKeys.flexifyHistory, { limit, offset }],
    queryFn: async () => {
      const response = await fetch(`/api/flexify/payout?limit=${limit}&offset=${offset}`);
      if (!response.ok) return { payouts: [], total: 0 };
      return response.json();
    },
  });

  const payouts = data?.payouts ?? [];
  const total = data?.total ?? 0;

  const formatCents = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  const dateLocaleMap = { fr: 'fr-FR', en: 'en-US', cn: 'zh-CN' } as const;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(dateLocaleMap[locale], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.statusPaid}
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            {t.statusFailed}
          </Badge>
        );
      case 'PROCESSING':
      case 'SCHEDULED':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {t.statusProcessing}
          </Badge>
        );
      case 'VERIFICATION_REQUIRED':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t.statusVerification}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">
            <Clock className="w-3 h-3 mr-1" />
            {t.statusPending}
          </Badge>
        );
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'SEPA':
        return <Building2 className="w-4 h-4" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <ArrowDownRight className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (payout: Payout) => {
    const type = payout.paymentMethod.type;
    const details = payout.paymentMethod.details;

    if (type === 'SEPA' && details?.maskedIban) {
      return `SEPA ${details.maskedIban}`;
    }
    if (type === 'SEPA' && details && 'iban' in details && typeof (details as { iban?: string }).iban === 'string') {
      const iban = (details as { iban: string }).iban;
      return `SEPA ••••${iban.slice(-4)}`;
    }
    if (type === 'CARD' && details && 'lastFourDigits' in details) {
      return `${t.cardPrefix} ••••${(details as { lastFourDigits: string }).lastFourDigits}`;
    }
    return type;
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <CardTitle>{t.title}</CardTitle>
          </div>
          {total > 0 && (
            <Badge variant="secondary">{total} {t.total}</Badge>
          )}
        </div>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ArrowDownRight className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {t.empty}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {payouts.map((payout: Payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {getMethodIcon(payout.paymentMethod.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getMethodLabel(payout)}</span>
                        {getStatusBadge(payout.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(payout.createdAt)}
                        {payout.trade && (
                          <span className="ml-2">• Trade #{payout.trade.ticketId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCents(payout.amountCents)}
                    </div>
                    {payout.paidAt && (
                      <div className="text-xs text-green-500">
                        {t.paidAt} {formatDate(payout.paidAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t.previous}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {t.page} {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                >
                  {t.next}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

