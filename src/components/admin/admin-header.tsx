'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  Shield,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSession } from '~/lib/auth-client';
import { useTheme } from 'next-themes';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  breadcrumbs?: Breadcrumb[];
  title?: string;
  actions?: React.ReactNode;
}

export function AdminHeader({ breadcrumbs, title, actions }: AdminHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [notificationsCount] = useState(3);
  const pathname = usePathname();

  const defaultBreadcrumbs: Breadcrumb[] = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard' },
  ];

  const displayBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm supports-[backdrop-filter]:bg-slate-900/75">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Breadcrumbs - Hidden on mobile */}
        <div className="hidden flex-1 items-center gap-2 lg:flex">
          <Shield className="h-5 w-5 text-orange-500" />
          <nav className="flex items-center gap-1 text-sm">
            {displayBreadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-white">{crumb.label}</span>
                )}
                {index < displayBreadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Title on mobile */}
        {title && (
          <div className="flex-1 lg:hidden">
            <h1 className="text-lg font-bold text-white">{title}</h1>
          </div>
        )}

        {/* Search Bar */}
        <div className="hidden w-full max-w-sm md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="h-9 w-full border-slate-700 bg-slate-800/50 pl-9 text-sm text-white placeholder:text-slate-400 focus-visible:ring-orange-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Custom Actions */}
          {actions && <div className="hidden md:flex">{actions}</div>}

          {/* Quick Actions Dropdown - Mobile */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-900">
                <DropdownMenuLabel className="text-slate-300">Actions rapides</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <Download className="mr-2 h-4 w-4" />
                  Exporter données
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  Générer rapport
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Documentation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden text-slate-400 hover:text-white md:inline-flex"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                  >
                    {notificationsCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 border-slate-700 bg-slate-900">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-slate-300">Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {notificationsCount} nouvelles
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <div className="max-h-[300px] overflow-y-auto">
                {/* Exemple de notifications */}
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 text-slate-300 focus:bg-slate-800">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-white">Nouveau KYC à valider</span>
                    <Badge variant="destructive" className="h-5 text-xs">Urgent</Badge>
                  </div>
                  <span className="text-xs text-slate-400">Il y a 5 minutes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 text-slate-300 focus:bg-slate-800">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-white">Paiement en attente</span>
                    <Badge variant="secondary" className="h-5 text-xs">Info</Badge>
                  </div>
                  <span className="text-xs text-slate-400">Il y a 1 heure</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 text-slate-300 focus:bg-slate-800">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-white">Giveaway terminé</span>
                    <Badge variant="outline" className="h-5 text-xs">Système</Badge>
                  </div>
                  <span className="text-xs text-slate-400">Il y a 2 heures</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="justify-center text-orange-400 focus:bg-slate-800 focus:text-orange-300">
                Voir toutes les notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 text-slate-400 hover:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="hidden text-sm font-medium text-white md:inline-block">
                  {session?.user?.name || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-slate-700 bg-slate-900">
              <DropdownMenuLabel className="text-slate-300">
                <div className="flex flex-col">
                  <span className="text-white">{session?.user?.name || 'Admin'}</span>
                  <span className="text-xs font-normal text-slate-400">
                    {session?.user?.email || 'admin@moonskin.fr'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/admin/settings">
                  <User className="mr-2 h-4 w-4" />
                  Mon Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/">
                  <Shield className="mr-2 h-4 w-4" />
                  Retour au Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="border-t border-slate-700 px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="h-9 w-full border-slate-700 bg-slate-800/50 pl-9 text-sm text-white placeholder:text-slate-400"
          />
        </div>
      </div>
    </header>
  );
}

