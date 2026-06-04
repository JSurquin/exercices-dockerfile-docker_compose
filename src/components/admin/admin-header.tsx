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
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { adminBtnOutline } from '@/lib/admin-ui';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface AdminHeaderProps {
  breadcrumbs?: Breadcrumb[];
  title?: string;
  actions?: React.ReactNode;
}

interface Notification {
  id: string;
  type: string;
  priority: string;
  titleFr: string;
  messageFr: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function AdminHeader({ breadcrumbs, title, actions }: AdminHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const { messages } = useLocale();
  const t = messages.adminNav.header;

  const { data: notificationsData } = useQuery({
    queryKey: queryKeys.userNotifications,
    queryFn: async () => {
      const response = await fetch('/api/user/notifications?limit=5&unreadOnly=true');
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000,
  });

  const unreadCount = notificationsData?.unreadCount ?? 0;
  const recentNotifications = notificationsData?.notifications ?? [];

  const defaultBreadcrumbs: Breadcrumb[] = [
    { label: 'Admin', href: '/admin' },
    { label: 'Dashboard' },
  ];

  const displayBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <header className="admin-glass-header sticky top-0 z-30 border-b supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        {/* Spacer for mobile burger button */}
        <div className="w-10 shrink-0 lg:hidden" />

        {/* Breadcrumbs - Hidden on mobile */}
        <div className="hidden flex-1 items-center gap-2 lg:flex">
          <Shield className="h-5 w-5 text-theme-accent" />
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
            <h1 className="text-base font-bold text-white truncate">{title}</h1>
          </div>
        )}

        {/* On mobile without title, spacer */}
        {!title && <div className="flex-1 lg:hidden" />}

        {/* Search Bar */}
        <div className="hidden w-full max-w-sm md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              className="h-9 w-full border-slate-700 bg-slate-800/50 pl-9 text-sm text-white placeholder:text-slate-400 focus-visible:ring-primary"
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
                <DropdownMenuLabel className="text-slate-300">{t.quickActions}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <Download className="mr-2 h-4 w-4" />
                  {t.exportData}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  {t.generateReport}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t.documentation}
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
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 border-slate-700 bg-slate-900">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span className="text-slate-300">{t.notifications}</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} {unreadCount > 1 ? t.newNotificationPlural : t.newNotificationSingular}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <div className="max-h-[300px] overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    {t.noUnreadNotifications}
                  </div>
                ) : (
                  recentNotifications.map((notification: Notification, index: number) => (
                    <div key={notification.id}>
                      {index > 0 && <DropdownMenuSeparator className="bg-slate-700" />}
                      <DropdownMenuItem 
                        asChild
                        className="flex flex-col items-start gap-1 p-3 text-slate-300 focus:bg-slate-800 cursor-pointer"
                      >
                        <Link href={notification.link || '/notifications'}>
                          <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-white">{notification.titleFr}</span>
                            <Badge 
                              variant={
                                notification.priority === 'URGENT' ? 'destructive' :
                                notification.priority === 'HIGH' ? 'default' :
                                'secondary'
                              } 
                              className="h-5 text-xs"
                            >
                              {notification.priority === 'URGENT' ? t.priorityUrgent :
                               notification.priority === 'HIGH' ? t.priorityHigh :
                               notification.priority === 'NORMAL' ? t.priorityNormal : t.priorityInfo}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 line-clamp-1">
                            {notification.messageFr}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(notification.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="justify-center text-theme-highlight focus:bg-slate-800 focus:text-theme-highlight cursor-pointer">
                <Link href="/notifications">
                  {t.viewAllNotifications}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 text-slate-400 hover:text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cta-gradient-br text-sm font-bold text-white">
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
                  {t.myProfile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                <Link href="/">
                  <Shield className="mr-2 h-4 w-4" />
                  {t.backToSite}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar - only show if user triggers it, hidden by default */}
    </header>
  );
}

