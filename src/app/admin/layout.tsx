'use client';

import { Suspense } from 'react';
import { useSession } from '~/lib/auth-client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav';
import { AdminHeader } from '@/components/admin/admin-header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Si on est sur la page de login, pas de vérification
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage && !isPending && (!session?.user || session.user.role !== 'ADMIN')) {
      // Rediriger vers la page de connexion admin au lieu du dashboard
      router.push('/admin/login');
    }
  }, [session, isPending, router, isLoginPage]);

  // Si on est sur la page de login, afficher directement le contenu
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Affichage du loading pendant la vérification
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-300">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Affichage d'erreur si l'utilisateur n'est pas admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
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
              <Link href="/admin/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Connexion Admin
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage normal pour les admins avec nouveau layout
  return (
    <div className="dark min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Navigation */}
      <Suspense fallback={null}>
        <AdminMobileNav />
      </Suspense>

      {/* Desktop Layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block">
          <Suspense fallback={null}>
            <AdminSidebar />
          </Suspense>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
