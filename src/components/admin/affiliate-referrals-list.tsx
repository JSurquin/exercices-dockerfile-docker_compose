'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, ExternalLink, UserMinus } from 'lucide-react';
import { queryKeys } from '@/lib/query-keys';
import { UserRoleBadge } from '@/components/ui/user-role-badge';
import { useLocale } from '@/components/providers/locale-provider';

interface ReferralUser {
  id: string;
  email: string;
  steamUsername: string | null;
  steamAvatar: string | null;
  steamId: string | null;
  userTag: string | null;
  bonusRatePercent: number;
  affiliateRewardsBlocked: boolean;
  xpRewardsBlocked: boolean;
  createdAt: string;
  totalVolumeCents: number;
}

interface ReferralRow {
  id: string;
  referredAt: string;
  churnedAt?: string | null;
  isActive?: boolean;
  volumeCents: number;
  commissionCents: number;
  tradeId: string | null;
  pendingSale?: { grossCents: number; status: string } | null;
  user: ReferralUser;
}

type Props = {
  affiliateId: string;
  /** Masque le titre interne quand la liste est dans le dialog détail affilié */
  embedded?: boolean;
};

export function AffiliateReferralsList({ affiliateId, embedded = false }: Props) {
  const { messages } = useLocale();
  const t = messages.admin.affiliatesManagement.referrals;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [referralStatus, setReferralStatus] = useState<'active' | 'churned'>('active');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.adminAffiliateReferrals(affiliateId, { page, search: debouncedSearch, status: referralStatus }),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        status: referralStatus,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/referrals?${params}`);
      if (!res.ok) throw new Error(t.loadError);
      return res.json();
    },
    placeholderData: keepPreviousData,
    enabled: !!affiliateId,
  });

  const referrals: ReferralRow[] = data?.data?.referrals ?? [];
  const pagination = data?.data?.pagination;

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className={embedded ? 'space-y-3' : 'admin-dialog-stat rounded-lg border p-4 space-y-3'}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!embedded && <h4 className="text-sm font-medium text-white">{t.title}</h4>}
        <div className={`flex gap-1 ${embedded ? 'ml-auto' : ''}`}>
          <Button
            variant={referralStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setReferralStatus('active'); setPage(1); }}
          >
            {t.tabActive}
          </Button>
          <Button
            variant={referralStatus === 'churned' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setReferralStatus('churned'); setPage(1); }}
          >
            <UserMinus className="h-3 w-3 mr-1" />
            {t.tabChurned}
          </Button>
        </div>
      </div>
      {pagination && (
        <span className="text-xs text-muted-foreground block">
          {t.totalCount.replace('{count}', String(pagination.total))}
        </span>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 admin-panel-field"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : referrals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t.empty}</p>
      ) : (
        <div className="rounded-md border border-border/40 overflow-x-auto max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="admin-table-row hover:bg-transparent border-border/40">
                <TableHead className="admin-table-head">{t.colUser}</TableHead>
                <TableHead className="admin-table-head">{t.colJoined}</TableHead>
                {referralStatus === 'churned' && (
                  <TableHead className="admin-table-head">{t.colChurned}</TableHead>
                )}
                <TableHead className="admin-table-head">{t.colVolume}</TableHead>
                <TableHead className="admin-table-head">{t.colCommission}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((ref) => (
                <TableRow key={ref.id} className="admin-table-row">
                  <TableCell>
                    <Link
                      href={`/admin/users/${ref.user.id}`}
                      className="flex items-center gap-2 hover:opacity-80 min-w-[180px]"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={ref.user.steamAvatar ?? undefined} />
                        <AvatarFallback>{ref.user.steamUsername?.[0] ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-white">
                            {ref.user.steamUsername || ref.user.email}
                          </span>
                          <UserRoleBadge userTag={ref.user.userTag} />
                          {(ref.user.affiliateRewardsBlocked || ref.user.xpRewardsBlocked) && (
                            <Badge variant="outline" className="text-theme-stat border-theme-highlight/50 text-[10px]">
                              {t.rewardsBlockedBadge}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{ref.user.steamId}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(ref.referredAt)}</TableCell>
                  {referralStatus === 'churned' && (
                    <TableCell className="text-sm">
                      {ref.churnedAt ? formatDate(ref.churnedAt) : '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">
                    <div className="flex flex-col items-start gap-1">
                      <span>{formatCurrency(ref.volumeCents)}</span>
                      {ref.pendingSale && ref.pendingSale.grossCents > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-theme-accent/40 bg-theme-accent/10 text-theme-highlight"
                        >
                          {t.saleInProgressBadge.replace(
                            '{amount}',
                            formatCurrency(ref.pendingSale.grossCents)
                          )}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-success text-sm">
                    {formatCurrency(ref.commissionCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {t.page.replace('{page}', String(page)).replace('{total}', String(pagination.pages))}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-border/50 text-foreground h-7 text-xs hover:bg-accent/30"
            >
              {t.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="border-border/50 text-foreground h-7 text-xs hover:bg-accent/30"
            >
              {t.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
