'use client';

import './admin-panel.css';

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
import { PageLoading } from '@/components/ui/page-loading';
import { useLocale } from '@/components/providers/locale-provider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { messages } = useLocale();
  const adminMessages = messages.admin;

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
      <div className="admin-shell moonskin min-h-screen">
        <PageLoading variant="compact" message={adminMessages.loading.verifyingPermissions} className="min-h-screen" />
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
            <CardTitle className="text-slate-100">{adminMessages.accessDenied.title}</CardTitle>
            <CardDescription className="text-slate-400">
              {adminMessages.accessDenied.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {adminMessages.accessDenied.loginAdmin}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage normal pour les admins avec nouveau layout
  return (
    <div className="admin-shell moonskin min-h-screen bg-gradient-to-br from-[#060608] via-[#0d0d12] to-[#060608]">
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
