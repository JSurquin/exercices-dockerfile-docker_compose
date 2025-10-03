'use client';

import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session?.user || session.user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [session, isPending, router]);

  // Affichage du loading pendant la vérification
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-slate-300">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur si l'utilisateur n'est pas admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <CardTitle className="text-slate-100">Accès refusé</CardTitle>
            <CardDescription className="text-slate-400">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à cette zone.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour au dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage normal pour les admins
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Administration</h1>
                <p className="text-sm text-slate-400">Panel d&apos;administration CashTrade</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
