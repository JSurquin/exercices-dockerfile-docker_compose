'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSession } from '~/lib/auth-client';

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

const navigationGroups: NavGroup[] = [
  {
    title: 'Vue d\'ensemble',
    items: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        href: '/admin/dashboard?tab=analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Gestion',
    items: [
      {
        title: 'Utilisateurs',
        href: '/admin/dashboard?tab=users',
        icon: Users,
      },
      {
        title: 'Trades',
        href: '/admin/dashboard?tab=trades',
        icon: ShoppingCart,
      },
      {
        title: 'Paiements',
        href: '/admin/dashboard?tab=payouts',
        icon: CreditCard,
        badge: 5,
        badgeVariant: 'destructive',
      },
      {
        title: 'KYC',
        href: '/admin/dashboard?tab=kyc',
        icon: Shield,
        badge: 3,
        badgeVariant: 'destructive',
      },
    ],
  },
  {
    title: 'Affiliation',
    items: [
      {
        title: 'Affiliés',
        href: '/admin/dashboard?tab=affiliates',
        icon: UserCheck,
      },
      {
        title: 'Commissions',
        href: '/admin/dashboard?tab=commissions',
        icon: Percent,
      },
      {
        title: 'Performances',
        href: '/admin/dashboard?tab=affiliate-performance',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        title: 'Giveaways',
        href: '/admin/giveaways',
        icon: Gift,
      },
      {
        title: 'Newsletter',
        href: '/admin/newsletter',
        icon: Mail,
      },
    ],
  },
  {
    title: 'Communication',
    items: [
      {
        title: 'Chat Support',
        href: '/admin/chat',
        icon: MessageSquare,
        badge: 'NEW',
        badgeVariant: 'secondary',
      },
    ],
  },
  {
    title: 'Système',
    items: [
      {
        title: 'Audit & Sécurité',
        href: '/admin/audit',
        icon: Activity,
      },
      {
        title: 'Exports',
        href: '/admin/dashboard?tab=exports',
        icon: FileDown,
      },
      {
        title: 'Paramètres',
        href: '/admin/settings',
        icon: Settings,
      },
    ],
  },
];

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href.includes('?tab=')) {
      const [path, query] = href.split('?');
      const searchParams = new URLSearchParams(query);
      const tab = searchParams.get('tab');
      return pathname === path && window.location.search.includes(`tab=${tab}`);
    }
    return pathname === href;
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Burger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm border border-slate-700 text-white hover:bg-slate-700"
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
            className="fixed top-0 left-0 z-50 h-full w-80 overflow-y-auto border-r border-slate-700 bg-slate-900 lg:hidden"
          >
            {/* Header */}
            <div className="flex h-20 items-center justify-between border-b border-slate-700 px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">CashTrade</h2>
                  <p className="text-xs text-slate-400">Admin Panel</p>
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
                      
                      return (
                        <Link key={itemIndex} href={item.href} onClick={closeMenu}>
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'group relative flex items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200',
                              active
                                ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 shadow-lg shadow-orange-500/10'
                                : 'text-slate-300 hover:bg-slate-800/50 hover:text-white active:bg-slate-800'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5 flex-shrink-0',
                                active ? 'text-orange-400' : 'text-slate-400 group-hover:text-white'
                              )}
                            />
                            <span className="flex-1 text-sm font-medium">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant || 'default'}
                                className="h-5 px-2 text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {active && (
                              <motion.div
                                layoutId="activeMobileIndicator"
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
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-slate-700 p-6">
              <div className="space-y-2">
                <Link href="/" onClick={closeMenu}>
                  <Button variant="outline" className="w-full justify-start gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Home className="h-4 w-4" />
                    Retour au Site
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
                  Déconnexion
                </Button>
              </div>
              
              {/* Status */}
              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Système</span>
                  <Badge variant="secondary" className="h-5 text-xs">
                    <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    En ligne
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

