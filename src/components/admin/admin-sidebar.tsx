'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useAffiliateApplications } from '@/hooks/use-affiliate-applications';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  const { pendingCount } = useAffiliateApplications();
  const { messages } = useLocale();
  const t = messages.adminNav;

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
        { title: t.items.payouts, href: '/admin/dashboard?tab=payouts', icon: CreditCard, badge: 5, badgeVariant: 'destructive' as const },
        { title: t.items.sepaRequests ?? 'SEPA France', href: '/admin/sepa-requests', icon: Landmark, badgeVariant: 'destructive' as const },
        { title: t.items.kyc, href: '/admin/dashboard?tab=kyc', icon: Shield, badge: 3, badgeVariant: 'destructive' as const },
      ],
    },
    {
      title: t.groups.affiliation,
      items: [
        { title: t.items.applications, href: '/admin/affiliate-applications', icon: FileDown, badge: 0, badgeVariant: 'destructive' as const },
        { title: t.items.affiliates, href: '/admin/dashboard?tab=affiliates', icon: UserCheck },
        { title: t.items.commissions, href: '/admin/dashboard?tab=commissions', icon: Percent },
        { title: t.items.performance, href: '/admin/dashboard?tab=affiliate-performance', icon: TrendingUp },
      ],
    },
    {
      title: t.groups.marketing,
      items: [
        { title: t.items.giveaways, href: '/admin/giveaways', icon: Gift },
        { title: t.items.gamificationEconomy ?? 'Économie gamification', href: '/admin/gamification-economy', icon: TrendingUp },
        { title: t.items.points ?? 'Points & Gamification', href: '/admin/points', icon: Star },
        { title: t.items.newsletter, href: '/admin/newsletter', icon: Mail },
        { title: t.items.notifications ?? 'Notifications', href: '/admin/notifications', icon: MessageSquare },
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
        { title: t.items.legalPages, href: '/admin/legal-pages', icon: FileText },
      ],
    },
    {
      title: t.groups.system,
      items: [
        { title: t.items.audit, href: '/admin/audit', icon: Activity },
        { title: t.items.exports, href: '/admin/dashboard?tab=exports', icon: FileDown },
        { title: t.items.settings, href: '/admin/settings', icon: Settings },
        { title: t.items.help, href: '/admin/aide', icon: HelpCircle },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href.includes('?tab=')) {
      const [path, query] = href.split('?');
      const searchParams = new URLSearchParams(query);
      const tab = searchParams.get('tab');
      return pathname === path && window.location.search.includes(`tab=${tab}`);
    }
    return pathname === href;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'relative h-full border-r border-slate-700 bg-slate-900/50 backdrop-blur-sm',
        className
      )}
    >
      {/* Header avec logo et toggle */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">MoonSkin</h2>
                <p className="text-xs text-slate-400">{t.header.adminPanel}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
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
                    className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
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
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                          active
                            ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 shadow-lg shadow-orange-500/10'
                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                          collapsed && 'justify-center'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            active ? 'text-orange-400' : 'text-slate-400 group-hover:text-white'
                          )}
                        />
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
                                <Badge
                                  variant={item.badgeVariant || 'default'}
                                  className="ml-auto h-5 px-1.5 text-xs"
                                >
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
                            className="absolute left-0 h-full w-1 rounded-r-full bg-gradient-to-b from-orange-400 to-orange-600"
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
        </div>
      </ScrollArea>

      {/* Stats rapides en bas (si non collapsed) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900/80 p-4 backdrop-blur-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t.footer.systemStatus}</span>
                <Badge variant="secondary" className="h-5 text-xs">
                  <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  {t.footer.online}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t.footer.uptime}</span>
                <span className="font-medium text-white">99.9%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

