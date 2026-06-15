'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useAffiliateApplications } from '@/hooks/use-affiliate-applications';
import { useAffiliateGiveawayRequests } from '@/hooks/use-affiliate-giveaway-requests';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Shield,
  BarChart3,
  FileDown,
  Gift,
  Mail,
  MessageSquare,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Percent,
  TrendingUp,
  Eye,
  DollarSign,
  FileText,
  HelpCircle,
  Star,
  Landmark,
  Crown,
  Store,
  Heart,
  Ban,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  adminBadgeCount,
  adminNavIcon,
  adminNavIconActive,
  adminNavItem,
  adminNavItemActive,
} from '@/lib/admin-ui';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Navigation structure - titles are keys that will be translated dynamically

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pendingCount } = useAffiliateApplications();
  const { pendingCount: giveawayRequestsPending } = useAffiliateGiveawayRequests();
  const { messages } = useLocale();
  const t = messages.adminNav;

  const { data: pendingCounts } = useQuery<{
    pendingPayouts: number;
    pendingApprovals: number;
    kycPending: number;
    sepaPending: number;
  }>({
    queryKey: queryKeys.adminPendingCounts,
    queryFn: async () => {
      const res = await fetch('/api/admin/pending-counts');
      if (!res.ok) throw new Error('Failed to fetch pending counts');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const navigationGroups: NavGroup[] = [
    {
      title: t.groups.overview,
      items: [
        { title: t.items.dashboard, href: '/admin/dashboard', icon: LayoutDashboard },
        { title: t.items.analytics, href: '/admin/dashboard?tab=analytics', icon: BarChart3 },
      ],
    },
    {
      title: t.groups.management,
      items: [
        { title: t.items.users, href: '/admin/dashboard?tab=users', icon: Users },
        { title: t.items.bannedUsers, href: '/admin/banned-users', icon: UserX },
        { title: t.items.trades, href: '/admin/dashboard?tab=trades', icon: ShoppingCart },
        { title: t.items.payouts, href: '/admin/dashboard?tab=payouts', icon: CreditCard, badge: pendingCounts?.pendingApprovals, badgeVariant: 'destructive' as const },
        { title: t.items.sepaRequests, href: '/admin/sepa-requests', icon: Landmark, badge: pendingCounts?.sepaPending, badgeVariant: 'destructive' as const },
        { title: t.items.kyc, href: '/admin/dashboard?tab=kyc', icon: Shield, badge: pendingCounts?.kycPending, badgeVariant: 'destructive' as const },
      ],
    },
    {
      title: t.groups.affiliation,
      items: [
        { title: t.items.applications, href: '/admin/affiliate-applications', icon: FileDown, badgeVariant: 'destructive' as const },
        { title: t.items.affiliates, href: '/admin/dashboard?tab=affiliates', icon: UserCheck },
        { title: t.items.commissions, href: '/admin/dashboard?tab=commissions', icon: Percent },
        { title: t.items.giveawayRequests, href: '/admin/affiliate-giveaway-requests', icon: Gift, badge: giveawayRequestsPending || undefined, badgeVariant: 'destructive' as const },
        { title: t.items.performance, href: '/admin/dashboard?tab=affiliate-performance', icon: TrendingUp },
      ],
    },
    {
      title: t.groups.vipMerchant ?? 'VIP & Merchants',
      items: [
        { title: t.items.vip ?? 'VIP', href: '/admin/dashboard?tab=vip', icon: Crown },
        { title: t.items.merchants ?? 'Merchants', href: '/admin/dashboard?tab=merchants', icon: Store },
      ],
    },
    {
      title: t.groups.marketing,
      items: [
        { title: t.items.giveaways, href: '/admin/giveaways', icon: Gift },
        { title: t.items.gamificationEconomy, href: '/admin/gamification-economy', icon: TrendingUp },
        { title: t.items.points, href: '/admin/points', icon: Star },
        { title: t.items.newsletter, href: '/admin/newsletter', icon: Mail },
        { title: t.items.notifications, href: '/admin/notifications', icon: MessageSquare },
      ],
    },
    {
      title: t.groups.communication,
      items: [
        { title: t.items.chatSupport, href: '/admin/chat', icon: MessageSquare, badge: 'NEW', badgeVariant: 'secondary' as const },
      ],
    },
    {
      title: t.groups.content,
      items: [
        { title: t.items.partners, href: '/admin/partners', icon: Heart },
        { title: t.items.legalPages, href: '/admin/legal-pages', icon: FileText },
      ],
    },
    {
      title: t.groups.system,
      items: [
        { title: t.items.audit, href: '/admin/audit', icon: Activity },
        { title: t.items.blockedIps, href: '/admin/blocked-ips', icon: Ban },
        { title: t.items.exports, href: '/admin/dashboard?tab=exports', icon: FileDown },
        { title: t.items.settings, href: '/admin/settings', icon: Settings },
        { title: t.items.help, href: '/admin/aide', icon: HelpCircle },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href.includes('?tab=')) {
      const [path, query] = href.split('?');
      const hrefParams = new URLSearchParams(query);
      const tab = hrefParams.get('tab');
      return pathname === path && searchParams.get('tab') === tab;
    }
    if (href === '/admin/dashboard') {
      return pathname === href && !searchParams.get('tab');
    }
    return pathname === href;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn('admin-glass-sidebar relative h-full border-r', className)}
    >
      {/* Header avec logo et toggle */}
      <div className="flex h-16 items-center justify-between border-b border-border/40 px-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cta-gradient-br shadow-[0_0_16px_var(--cta-shadow)]">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">MoonSkin</h2>
                <p className="text-xs text-muted-foreground">{t.header.adminPanel}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:bg-theme-accent/10 hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className={cn("transition-all duration-300", collapsed ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem-6.5rem)]")}>
        <div className="space-y-6 p-4 pb-6">
          {navigationGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {group.title}
                  </motion.h3>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  // Badge dynamique pour les demandes d'affiliation
                  const itemBadge = item.href === '/admin/affiliate-applications' && pendingCount > 0
                    ? pendingCount
                    : item.badge;
                  
                  return (
                    <Link key={itemIndex} href={item.href}>
                      <motion.div
                        whileHover={{ x: collapsed ? 0 : 4 }}
                        className={cn(
                          adminNavItem,
                          active && adminNavItemActive,
                          collapsed && 'justify-center'
                        )}
                      >
                        <Icon className={cn(active ? adminNavIconActive : adminNavIcon)} />
                        <AnimatePresence mode="wait">
                          {!collapsed && (
                            <motion.div
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex flex-1 items-center justify-between overflow-hidden"
                            >
                              <span className="text-sm font-medium">{item.title}</span>
                              {itemBadge && (typeof itemBadge === 'number' ? itemBadge > 0 : itemBadge) && (
                                <Badge variant="outline" className={adminBadgeCount}>
                                  {itemBadge}
                                </Badge>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {/* Indicator pour item actif */}
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 h-full w-1 rounded-r-full bg-gradient-to-b from-theme-accent to-primary"
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
              {groupIndex < navigationGroups.length - 1 && (
                <Separator className="my-4 bg-border/40" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Stats rapides en bas (si non collapsed) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 border-t border-border/40 bg-background/40 p-4 backdrop-blur-md"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.footer.systemStatus}</span>
                <Badge variant="outline" className="admin-badge-status admin-badge-status--success h-5 text-xs">
                  <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-theme-success" />
                  {t.footer.online}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

