'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/components/providers/locale-provider';

export type SiteTourProps = {
  onFinish: () => void;
};

type TourStep = DriveStep & {
  page?: string;
  waitMs?: number;
};

function buildTourSteps(locale: string): TourStep[] {
  const isFr = locale === 'fr';
  const isEn = locale === 'en';

  const t = {
    welcome: {
      title: isFr ? '👋 Bienvenue sur MoonSkin !' : isEn ? '👋 Welcome to MoonSkin!' : '👋 欢迎来到 MoonSkin！',
      description: isFr
        ? 'La plateforme la plus rapide pour vendre vos skins CS2 contre de l\'argent réel. Ce guide vous montre les fonctionnalités clés en quelques étapes.'
        : isEn
        ? 'The fastest platform to sell your CS2 skins for real money. This guide walks you through the key features in a few steps.'
        : '最快速出售 CS2 皮肤换取真实货币的平台。本指南将带您了解几个关键功能。',
    },
    sell: {
      title: isFr ? '💰 Vendre vos skins' : isEn ? '💰 Sell your skins' : '💰 出售皮肤',
      description: isFr
        ? 'Obtenez une estimation instantanée de vos skins via Skinplace, acceptez l\'offre et recevez votre paiement sous 7 jours après le trade hold Steam.'
        : isEn
        ? 'Get an instant estimate of your skins via Skinplace, accept the offer and receive your payment within 7 days after the Steam trade hold.'
        : '通过 Skinplace 即时估算您的皮肤价值，接受报价后，Steam 交易保留期结束后 7 天内收款。',
    },
    dashboard: {
      title: isFr ? '📊 Tableau de bord' : isEn ? '📊 Dashboard' : '📊 仪表盘',
      description: isFr
        ? 'Suivez l\'état de vos trades en temps réel, consultez votre solde, vos gains XP et vos tickets de giveaway.'
        : isEn
        ? 'Track the status of your trades in real time, check your balance, XP earnings and giveaway tickets.'
        : '实时跟踪交易状态，查看余额、XP 收益和抽奖券。',
    },
    giveaways: {
      title: isFr ? '🎁 Concours' : isEn ? '🎁 Giveaways' : '🎁 抽奖活动',
      description: isFr
        ? 'Dépensez vos tickets gagnés via vos ventes pour participer aux concours. Plus vous vendez, plus vous accumulez de tickets.'
        : isEn
        ? 'Spend your tickets earned through your sales to enter giveaways. The more you sell, the more tickets you accumulate.'
        : '用出售赚取的票券参与抽奖。销售越多，积累的票券越多。',
    },
    missions: {
      title: isFr ? '🏆 Missions' : isEn ? '🏆 Missions' : '🏆 任务',
      description: isFr
        ? 'Complétez des défis pour gagner de l\'XP et monter en niveau. Chaque niveau débloque des avantages exclusifs.'
        : isEn
        ? 'Complete challenges to earn XP and level up. Each level unlocks exclusive perks.'
        : '完成挑战赚取 XP 并升级。每个级别解锁专属权益。',
    },
    kyc: {
      title: isFr ? '🔐 KYC & Paiements' : isEn ? '🔐 KYC & Payments' : '🔐 KYC 与付款',
      description: isFr
        ? 'La vérification d\'identité (KYC) est obligatoire avant tout paiement. Vous pouvez choisir entre SEPA (virement bancaire) ou crypto (via Binance).'
        : isEn
        ? 'Identity verification (KYC) is mandatory before any payment. You can choose between SEPA (bank transfer) or crypto (via Binance).'
        : '任何付款前都需要身份验证 (KYC)。可选择 SEPA（银行转账）或加密货币（通过 Binance）。',
    },
    finish: {
      title: isFr ? '🚀 Prêt à commencer !' : isEn ? '🚀 Ready to start!' : '🚀 准备开始！',
      description: isFr
        ? 'Connectez-vous avec Steam et vendez vos premiers skins. Le guide est accessible à tout moment depuis le footer. Bonne vente !'
        : isEn
        ? 'Log in with Steam and sell your first skins. The guide is accessible at any time from the footer. Happy selling!'
        : '使用 Steam 登录并出售您的第一批皮肤。随时可从页脚访问本指南。祝销售愉快！',
    },
  };

  return [
    {
      page: '/',
      waitMs: 500,
      popover: { title: t.welcome.title, description: t.welcome.description, align: 'center' },
    },
    {
      element: '[data-tour="nav-sell"]',
      popover: { title: t.sell.title, description: t.sell.description, side: 'bottom' },
    },
    {
      element: '[data-tour="nav-dashboard"]',
      popover: { title: t.dashboard.title, description: t.dashboard.description, side: 'bottom' },
    },
    {
      element: '[data-tour="nav-giveaways"]',
      popover: { title: t.giveaways.title, description: t.giveaways.description, side: 'bottom' },
    },
    {
      element: '[data-tour="nav-missions"]',
      popover: { title: t.missions.title, description: t.missions.description, side: 'bottom' },
    },
    {
      popover: { title: t.kyc.title, description: t.kyc.description, align: 'center' },
    },
    {
      popover: { title: t.finish.title, description: t.finish.description, align: 'center' },
    },
  ];
}

export function SiteTour({ onFinish }: SiteTourProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const stepIndexRef = useRef(0);
  const destroyedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const driverRef = useRef<any>(null);

  const steps = useRef(buildTourSteps(locale));

  const buildAndDrive = useCallback(
    async (startAt: number) => {
      destroyedRef.current = false;
      try { driverRef.current?.destroy(); } catch { /* noop */ }
      driverRef.current = null;

      const { driver } = await import('driver.js');
      const currentSteps = steps.current;

      const driverSteps: DriveStep[] = currentSteps.map(({ element, popover }) => ({ element, popover }));

      const instance = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'moonskin-tour-popover',
        progressText: locale === 'fr' ? 'Étape {{current}} sur {{total}}' : locale === 'cn' ? '第 {{current}} / {{total}} 步' : 'Step {{current}} of {{total}}',
        nextBtnText: locale === 'fr' ? 'Suivant →' : locale === 'cn' ? '下一步 →' : 'Next →',
        prevBtnText: locale === 'fr' ? '← Précédent' : locale === 'cn' ? '← 上一步' : '← Back',
        doneBtnText: locale === 'fr' ? 'Terminer 🎉' : locale === 'cn' ? '完成 🎉' : 'Done 🎉',
        steps: driverSteps,

        onNextClick: () => {
          const next = stepIndexRef.current + 1;
          if (next >= currentSteps.length) {
            instance.destroy();
            driverRef.current = null;
            onFinishRef.current();
            return;
          }
          const nextStep = currentSteps[next];
          const needsNav = nextStep.page && nextStep.page !== window.location.pathname;
          stepIndexRef.current = next;

          if (needsNav) {
            instance.destroy();
            driverRef.current = null;
            router.push(nextStep.page!);
            setTimeout(() => buildAndDrive(next), nextStep.waitMs ?? 900);
          } else if (nextStep.waitMs) {
            setTimeout(() => instance.moveTo(next), nextStep.waitMs);
          } else {
            instance.moveNext();
          }
        },

        onPrevClick: () => {
          const prev = stepIndexRef.current - 1;
          if (prev < 0) return;
          const prevStep = currentSteps[prev];
          const needsNav = prevStep.page && prevStep.page !== window.location.pathname;
          stepIndexRef.current = prev;

          if (needsNav) {
            instance.destroy();
            driverRef.current = null;
            router.push(prevStep.page!);
            setTimeout(() => buildAndDrive(prev), prevStep.waitMs ?? 900);
          } else {
            instance.movePrevious();
          }
        },

        onDestroyStarted: () => {
          if (!destroyedRef.current) {
            destroyedRef.current = true;
            instance.destroy();
            driverRef.current = null;
            onFinishRef.current();
          }
        },
      });

      driverRef.current = instance;
      instance.drive(startAt);
    },
    [locale, router]
  );

  useEffect(() => {
    steps.current = buildTourSteps(locale);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    stepIndexRef.current = 0;
    const firstStep = steps.current[0];

    const start = async () => {
      try {
        if (cancelled) return;
        if (firstStep.page && firstStep.page !== window.location.pathname) {
          router.push(firstStep.page);
          await new Promise((r) => setTimeout(r, firstStep.waitMs ?? 700));
        } else if (firstStep.waitMs) {
          await new Promise((r) => setTimeout(r, firstStep.waitMs));
        }
        if (cancelled) return;
        buildAndDrive(0);
      } catch {
        if (!cancelled) onFinishRef.current();
      }
    };

    const t = setTimeout(start, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
      try { driverRef.current?.destroy(); } catch { /* noop */ }
      driverRef.current = null;
    };
  }, [buildAndDrive, router]);

  return null;
}
