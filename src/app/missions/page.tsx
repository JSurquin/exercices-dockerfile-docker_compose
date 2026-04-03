'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { toast } from 'sonner';
import { SparklesIcon } from '@heroicons/react/24/outline';

type MissionRow = {
  key: string;
  category: string;
  rewardFragments: number;
  periodKey: string;
  completed: boolean;
  eligible: boolean;
};

export default function MissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const r = await fetch('/api/missions', { credentials: 'include' });
      if (!r.ok) throw new Error('Erreur chargement missions');
      return r.json() as Promise<{ missions: MissionRow[] }>;
    },
    enabled: !!user,
  });

  const claim = useMutation({
    mutationFn: async (missionKey: string) => {
      const r = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionKey }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Erreur');
      return j;
    },
    onSuccess: (j: { fragments?: number }) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast.success(`+${j.fragments ?? 0} fragments`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  if (authLoading) {
    return (
      <div className="container py-24 text-center text-muted-foreground">Chargement…</div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-24 text-center space-y-4">
        <p className="text-muted-foreground">Connecte-toi pour voir les missions.</p>
        <Link href="/giveaways" className="text-orange-600 underline">
          Retour aux giveaways
        </Link>
      </div>
    );
  }

  const missions = data?.missions ?? [];

  const byCat = (c: string) => missions.filter((m) => m.category === c);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-amber-500" />
            Missions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gagne des fragments contrôlés — les ventes restent la source principale.
          </p>
        </div>
        <Link href="/giveaways">
          <Button variant="outline">Giveaways</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement des missions…</p>
      ) : (
        <>
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'SOCIAL'] as const).map((cat) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-lg">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {byCat(cat).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune mission.</p>
                ) : (
                  byCat(cat).map((m) => (
                    <div
                      key={`${m.key}-${m.periodKey}`}
                      className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{m.key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          +{m.rewardFragments} fragments
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.completed ? (
                          <Badge variant="secondary">Réclamée</Badge>
                        ) : m.eligible ? (
                          <Button
                            size="sm"
                            disabled={claim.isPending}
                            onClick={() => claim.mutate(m.key)}
                          >
                            Réclamer
                          </Button>
                        ) : (
                          <Badge variant="outline">Non disponible</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {claim.isError && (
        <p className="text-sm text-destructive">
          {(claim.error as Error)?.message}
        </p>
      )}
    </div>
  );
}
