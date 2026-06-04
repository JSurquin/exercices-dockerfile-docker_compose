'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  UserCheck,
  Percent,
  TrendingUp,
  FileText,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminAidePage() {
  const { messages } = useLocale();
  const t = messages.adminNav;
  const aide = messages.admin.aide;

  const sections = [
    {
      id: 'overview',
      title: t.groups.overview,
      icon: LayoutDashboard,
      items: [
        {
          title: t.items.dashboard,
          href: '/admin/dashboard',
          desc: aide.sections.dashboard.desc,
        },
        {
          title: t.items.analytics,
          href: '/admin/dashboard?tab=analytics',
          desc: aide.sections.analytics.desc,
        },
      ],
    },
    {
      id: 'management',
      title: t.groups.management,
      icon: Users,
      items: [
        {
          title: t.items.users,
          href: '/admin/dashboard?tab=users',
          desc: aide.sections.users.desc,
        },
        {
          title: aide.sections.userDetail.title,
          href: '/admin/dashboard?tab=users',
          desc: aide.sections.userDetail.desc,
        },
        {
          title: t.items.trades,
          href: '/admin/dashboard?tab=trades',
          desc: aide.sections.trades.desc,
        },
        {
          title: t.items.payouts,
          href: '/admin/dashboard?tab=payouts',
          desc: aide.sections.payouts.desc,
        },
        {
          title: t.items.kyc,
          href: '/admin/dashboard?tab=kyc',
          desc: aide.sections.kyc.desc,
        },
      ],
    },
    {
      id: 'affiliation',
      title: t.groups.affiliation,
      icon: UserCheck,
      items: [
        {
          title: t.items.applications,
          href: '/admin/affiliate-applications',
          desc: aide.sections.applications.desc,
        },
        {
          title: t.items.affiliates,
          href: '/admin/dashboard?tab=affiliates',
          desc: aide.sections.affiliates.desc,
        },
        {
          title: t.items.commissions,
          href: '/admin/dashboard?tab=commissions',
          desc: aide.sections.commissions.desc,
        },
        {
          title: t.items.performance,
          href: '/admin/dashboard?tab=affiliate-performance',
          desc: aide.sections.performance.desc,
        },
      ],
    },
    {
      id: 'marketing',
      title: t.groups.marketing,
      icon: Gift,
      items: [
        {
          title: t.items.giveaways,
          href: '/admin/giveaways',
          desc: aide.sections.giveaways.desc,
        },
        {
          title: t.items.newsletter,
          href: '/admin/newsletter',
          desc: aide.sections.newsletter.desc,
        },
      ],
    },
    {
      id: 'communication',
      title: t.groups.communication,
      icon: MessageSquare,
      items: [
        {
          title: t.items.chatSupport,
          href: '/admin/chat',
          desc: aide.sections.chatSupport.desc,
        },
      ],
    },
    {
      id: 'content',
      title: t.groups.content,
      icon: FileText,
      items: [
        {
          title: t.items.legalPages,
          href: '/admin/legal-pages',
          desc: aide.sections.legalPages.desc,
        },
      ],
    },
    {
      id: 'system',
      title: t.groups.system,
      icon: Activity,
      items: [
        {
          title: t.items.audit,
          href: '/admin/audit',
          desc: aide.sections.audit.desc,
        },
        {
          title: t.items.exports,
          href: '/admin/dashboard?tab=exports',
          desc: aide.sections.exports.desc,
        },
        {
          title: t.items.settings,
          href: '/admin/settings',
          desc: aide.sections.settings.desc,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        {...fadeIn}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cta-gradient-br shadow-lg shadow-[var(--cta-shadow)]">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-theme-accent to-primary bg-clip-text text-transparent md:text-4xl">
              {aide.title}
            </h1>
            <p className="mt-1 text-slate-400">
              {aide.subtitle}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-theme-highlight" />
              {aide.howToUseTitle}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {aide.howToUseDesc}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="space-y-10">
        {sections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={section.id}
              {...fadeIn}
              transition={{ delay: 0.05 + sectionIndex * 0.03 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  <Icon className="h-5 w-5 text-theme-highlight" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <Card
                    key={item.href + item.title}
                    className="bg-slate-800/30 border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={item.href}
                              className="font-medium text-theme-highlight hover:text-theme-highlight hover:underline"
                            >
                              {item.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="shrink-0 text-slate-400 hover:text-theme-highlight">
                          <Link href={item.href} className="flex items-center gap-1">
                            <span className="hidden sm:inline">{aide.openButton}</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {sectionIndex < sections.length - 1 && (
                <Separator className="mt-6 bg-slate-700" />
              )}
            </motion.section>
          );
        })}
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">{aide.remindersTitle}</CardTitle>
            <CardDescription className="text-slate-400">
              <ul className="list-disc list-inside space-y-1 mt-2">
                {aide.reminders.map((reminder, i) => (
                  <li key={i}>{reminder}</li>
                ))}
              </ul>
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </div>
  );
}
