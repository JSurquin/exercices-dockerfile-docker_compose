'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bell,
  Settings,
  User,
  LogOut,
  Shield,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { adminBtnOutline, adminGlassCard } from '@/lib/admin-ui';

const adminDropdownContent = cn('border p-1', adminGlassCard);
const adminDropdownItem =
  'text-foreground focus:bg-theme-accent/10 focus:text-theme-highlight cursor-pointer';
const adminDropdownSeparator = 'bg-border/60';

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
              <DropdownMenuContent align="end" className={cn('w-56', adminDropdownContent)}>
                <DropdownMenuLabel className="text-foreground">{t.quickActions}</DropdownMenuLabel>
                <DropdownMenuSeparator className={adminDropdownSeparator} />
                <DropdownMenuItem className={adminDropdownItem}>
                  <Download className="mr-2 h-4 w-4" />
                  {t.exportData}
                </DropdownMenuItem>
                <DropdownMenuItem className={adminDropdownItem}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t.generateReport}
                </DropdownMenuItem>
                <DropdownMenuItem className={adminDropdownItem}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {t.documentation}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
            <DropdownMenuContent align="end" className={cn('w-80', adminDropdownContent)}>
              <DropdownMenuLabel className="flex items-center justify-between text-foreground">
                <span>{t.notifications}</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} {unreadCount > 1 ? t.newNotificationPlural : t.newNotificationSingular}
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={adminDropdownSeparator} />
              <div className="max-h-[300px] overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {t.noUnreadNotifications}
                  </div>
                ) : (
                  recentNotifications.map((notification: Notification, index: number) => (
                    <div key={notification.id}>
                      {index > 0 && <DropdownMenuSeparator className={adminDropdownSeparator} />}
                      <DropdownMenuItem 
                        asChild
                        className={cn(adminDropdownItem, 'flex flex-col items-start gap-1 p-3')}
                      >
                        <Link href={notification.link || '/notifications'}>
                          <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-foreground">{notification.titleFr}</span>
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
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {notification.messageFr}
                          </span>
                          <span className="text-xs text-muted-foreground/80">
                            {format(new Date(notification.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator className={adminDropdownSeparator} />
              <DropdownMenuItem asChild className={cn(adminDropdownItem, 'justify-center text-theme-highlight focus:text-theme-highlight')}>
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
            <DropdownMenuContent align="end" className={cn('w-56', adminDropdownContent)}>
              <DropdownMenuLabel className="text-foreground">
                <div className="flex flex-col">
                  <span className="font-medium">{session?.user?.name || 'Admin'}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {session?.user?.email || 'admin@moonskin.fr'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={adminDropdownSeparator} />
              <DropdownMenuItem asChild className={adminDropdownItem}>
                <Link href="/admin/settings">
                  <User className="mr-2 h-4 w-4" />
                  {t.myProfile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={adminDropdownItem}>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  {t.settings}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className={adminDropdownSeparator} />
              <DropdownMenuItem asChild className={adminDropdownItem}>
                <Link href="/">
                  <Shield className="mr-2 h-4 w-4" />
                  {t.backToSite}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className={adminDropdownSeparator} />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t.logout}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </header>
  );
}

