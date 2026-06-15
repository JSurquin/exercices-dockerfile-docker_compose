'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Menu,
  X,
  Shield,
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  BarChart3,
  FileDown,
  Gift,
  Mail,
  MessageSquare,
  Activity,
  Settings,
  UserCheck,
  Percent,
  TrendingUp,
  Home,
  LogOut,
  FileText,
  HelpCircle,
  Star,
  Landmark,
  Crown,
  Store,
  Heart,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSession } from '~/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useAffiliateApplications } from '@/hooks/use-affiliate-applications';
import { useAffiliateGiveawayRequests } from '@/hooks/use-affiliate-giveaway-requests';
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

// Navigation is generated dynamically from translations

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { messages } = useLocale();
  const t = messages.adminNav;
  const { pendingCount: affiliatePendingCount } = useAffiliateApplications();
  const { pendingCount: giveawayRequestsPending } = useAffiliateGiveawayRequests();

  const { data: pendingCounts } = useQuery<{
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
        { title: t.items.trades, href: '/admin/dashboard?tab=trades', icon: ShoppingCart },
        { title: t.items.payouts, href: '/admin/dashboard?tab=payouts', icon: CreditCard, badge: pendingCounts?.pendingApprovals, badgeVariant: 'destructive' as const },
        { title: t.items.sepaRequests ?? 'SEPA France', href: '/admin/sepa-requests', icon: Landmark, badge: pendingCounts?.sepaPending, badgeVariant: 'destructive' as const },
        { title: t.items.kyc, href: '/admin/dashboard?tab=kyc', icon: Shield, badge: pendingCounts?.kycPending, badgeVariant: 'destructive' as const },
      ],
    },
    {
      title: t.groups.affiliation,
      items: [
        { title: t.items.applications, href: '/admin/affiliate-applications', icon: FileDown, badge: affiliatePendingCount, badgeVariant: 'destructive' as const },
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
        { title: t.items.gamificationEconomy ?? 'Économie gamification', href: '/admin/gamification-economy', icon: TrendingUp },
        { title: t.items.points ?? 'Points & Gamification', href: '/admin/points', icon: Star },
        { title: t.items.newsletter, href: '/admin/newsletter', icon: Mail },
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

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Burger Button - aligné avec le header (h-14) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="lg:hidden fixed top-0 left-0 z-50 h-14 w-14 rounded-none bg-transparent border-r border-b border-slate-700 text-white hover:bg-slate-800/80"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="admin-glass-sidebar fixed top-0 left-0 z-50 h-full w-80 overflow-y-auto border-r lg:hidden"
          >
            {/* Header */}
            <div className="flex h-20 items-center justify-between border-b border-slate-700 px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cta-gradient-br shadow-lg shadow-[var(--cta-shadow)]">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">MoonSkin</h2>
                  <p className="text-xs text-slate-400">{t.header.adminPanel}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMenu}
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="border-b border-slate-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                    {session.user.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{session.user.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-5 text-xs">
                        {session.user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-6 p-6">
              {navigationGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      const itemBadge =
                        item.href === '/admin/affiliate-applications' && affiliatePendingCount > 0
                          ? affiliatePendingCount
                          : item.badge;
                      
                      return (
                        <Link key={itemIndex} href={item.href} onClick={closeMenu}>
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={cn(adminNavItem, 'py-3', active && adminNavItemActive)}
                          >
                            <Icon className={cn(active ? adminNavIconActive : adminNavIcon)} />
                            <span className="flex-1 text-sm font-medium">{item.title}</span>
                            {itemBadge && (typeof itemBadge === 'number' ? itemBadge > 0 : itemBadge) && (
                              <Badge variant="outline" className={adminBadgeCount}>
                                {itemBadge}
                              </Badge>
                            )}
                            {active && (
                              <motion.div
                                layoutId="activeMobileIndicator"
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
                    <Separator className="my-4 bg-slate-700" />
                  )}
                </div>
              ))}
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-slate-700 p-6">
              <div className="space-y-2">
                <Link href="/" onClick={closeMenu}>
                  <Button variant="outline" className="w-full justify-start gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Home className="h-4 w-4" />
                    {t.footer.backToSite}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => {
                    closeMenu();
                    // Logique de déconnexion
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t.footer.logout}
                </Button>
              </div>
              
              {/* Status */}
              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t.footer.system}</span>
                  <Badge variant="secondary" className="h-5 text-xs">
                    <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    {t.footer.online}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

