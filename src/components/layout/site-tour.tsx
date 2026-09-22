'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
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
  const fr = locale === 'fr';
  const cn = locale === 'cn';

  const t = (textFr: string, textEn: string, textCn: string) =>
    fr ? textFr : cn ? textCn : textEn;

  return [
    // ─── Page d'accueil ─────────────────────────────────────────────────────
    {
      page: '/',
      waitMs: 600,
      popover: {
        title: t('Bienvenue sur MoonSkin !', 'Welcome to MoonSkin!', '欢迎来到 MoonSkin！'),
        description: t(
          'MoonSkin est la plateforme la plus rapide pour <strong>vendre vos skins CS2 contre de l\'argent réel</strong>. Ce guide vous emmène page par page pour découvrir chaque fonctionnalité. Utilisez <strong>Précédent / Suivant</strong> pour naviguer.',
          'MoonSkin is the fastest platform to <strong>sell your CS2 skins for real money</strong>. This guide takes you page by page through every feature. Use <strong>Back / Next</strong> to navigate.',
          'MoonSkin 是最快速出售 CS2 皮肤换取真实货币的平台。本指南将带您逐页了解每项功能。使用<strong>上一步/下一步</strong>导航。'
        ),
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-sell"]',
      popover: {
        title: t('Vendre vos skins', 'Sell your skins', '出售皮肤'),
        description: t(
          'Point d\'entrée principal : obtenez une <strong>estimation instantanée</strong> de vos skins via notre API, sélectionnez les items à vendre et confirmez. Le paiement arrive sous <strong>7 jours</strong> après le trade hold Steam.',
          'Main entry point: get an <strong>instant estimate</strong> of your skins via our API, select items to sell and confirm. Payment arrives within <strong>7 days</strong> after the Steam trade hold.',
          '主要入口：通过我们的 API 即时估算皮肤价值，选择要出售的物品并确认。Steam 交易保留期后 <strong>7 天内</strong>付款。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="nav-dashboard"]',
      popover: {
        title: t('Tableau de bord', 'Dashboard', '仪表盘'),
        description: t(
          'Suivez vos trades en temps réel, consultez votre <strong>solde disponible</strong>, votre progression XP, vos fragments et l\'historique complet de vos paiements. C\'est votre centre de contrôle.',
          'Track your trades in real time, check your <strong>available balance</strong>, XP progress, fragments and full payment history. This is your control center.',
          '实时追踪交易，查看<strong>可用余额</strong>、XP进度、碎片以及完整的付款历史。这是您的控制中心。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="nav-giveaways"]',
      popover: {
        title: t('Concours', 'Giveaways', '抽奖活动'),
        description: t(
          'Participez aux concours avec vos <strong>fragments</strong> gagnés lors de vos ventes. Plus vous vendez, plus vous accumulez de fragments pour tenter de gagner des skins, du cash ou des items exclusifs.',
          'Enter giveaways with your <strong>fragments</strong> earned from your sales. The more you sell, the more fragments you collect to win skins, cash or exclusive items.',
          '使用出售赚取的<strong>碎片</strong>参与抽奖。销售越多，积累的碎片越多，赢取皮肤、现金或专属物品的机会越大。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="nav-missions"]',
      popover: {
        title: t('Missions', 'Missions', '任务'),
        description: t(
          'Complétez des défis quotidiens, hebdomadaires et mensuels pour gagner des <strong>fragments</strong>. Chaque fragment peut être dépensé dans un concours. Les missions sociales (Discord, Telegram…) offrent aussi des récompenses.',
          'Complete daily, weekly and monthly challenges to earn <strong>fragments</strong>. Each fragment can be spent in a giveaway. Social missions (Discord, Telegram…) also offer rewards.',
          '完成每日、每周和每月挑战以赚取<strong>碎片</strong>。每个碎片都可用于参与抽奖。社交任务（Discord、Telegram…）也提供奖励。'
        ),
        side: 'bottom',
      },
    },
    // ─── Page Vente ─────────────────────────────────────────────────────────
    {
      page: '/sell',
      waitMs: 900,
      popover: {
        title: t('Page de vente', 'Sell Page', '出售页面'),
        description: t(
          'Vous êtes maintenant sur la page de vente. Le processus se déroule en <strong>3 étapes</strong> : sélection de l\'inventaire, récapitulatif du trade, puis confirmation. Chaque étape est guidée.',
          'You are now on the sell page. The process follows <strong>3 steps</strong>: inventory selection, trade summary, then confirmation. Each step is guided.',
          '您现在在出售页面。流程分为<strong>3个步骤</strong>：库存选择、交易摘要，然后确认。每个步骤都有引导。'
        ),
        align: 'center',
      },
    },
    {
      element: '[data-tour="sell-steam-account"]',
      popover: {
        title: t('Compte Steam connecté', 'Connected Steam account', '已连接的 Steam 账户'),
        description: t(
          'Votre <strong>compte Steam de connexion</strong> est affiché ici à titre informatif. Il est lié à MoonSkin et <strong>ne peut pas être modifié</strong> sur cette page.',
          'Your <strong>login Steam account</strong> is shown here for information. It is linked to MoonSkin and <strong>cannot be changed</strong> on this page.',
          '您的<strong>登录 Steam 账户</strong>在此显示仅供参考。它与 MoonSkin 绑定，<strong>无法</strong>在此页面修改。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="sell-trade-link"]',
      popover: {
        title: t('Trade Link Steam, modifiable', 'Steam Trade Link, editable', 'Steam 交易链接, 可修改'),
        description: t(
          'C\'est la <strong>seule information modifiable</strong> : elle détermine quel inventaire est chargé et où vous recevez les offres d\'échange. Cliquez sur <em>Modifier</em> pour la mettre à jour.',
          'This is the <strong>only editable field</strong>: it determines which inventory is loaded and where you receive trade offers. Click <em>Edit</em> to update it.',
          '这是<strong>唯一可修改的信息</strong>：它决定加载哪个库存以及接收交易报价的位置。点击<em>修改</em>进行更新。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="sell-steps"]',
      popover: {
        title: t('Étapes du processus', 'Process steps', '流程步骤'),
        description: t(
          'La barre de progression indique où vous en êtes : <strong>Inventaire</strong>, puis <strong>Trade</strong>, puis <strong>Confirmation</strong>. Chaque étape validée reste cochée pour voir votre avancement d\'un seul coup d\'œil.',
          'The progress bar shows where you are: <strong>Inventory</strong>, then <strong>Trade</strong>, then <strong>Confirmation</strong>. Each completed step stays checked so you can see your progress at a glance.',
          '进度条显示您的位置：<strong>库存</strong>，然后<strong>交易</strong>，最后<strong>确认</strong>。每个完成的步骤保持勾选，一眼即可看到您的进度。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="sell-inventory"]',
      popover: {
        title: t('Votre inventaire CS2', 'Your CS2 Inventory', '您的 CS2 库存'),
        description: t(
          'Votre inventaire Steam se charge ici. Cochez les skins que vous souhaitez vendre : le <strong>prix estimé</strong> s\'affiche pour chaque item via notre API. Une fois votre sélection faite, cliquez sur <em>Continuer</em>.',
          'Your Steam inventory loads here. Check the skins you want to sell: the <strong>estimated price</strong> appears for each item via our API. Once selected, click <em>Continue</em>.',
          '您的 Steam 库存在此加载。勾选要出售的皮肤：每件物品通过我们的 API 显示<strong>估计价格</strong>。选好后点击<em>继续</em>。'
        ),
        side: 'top',
      },
    },
    // ─── Page Dashboard ──────────────────────────────────────────────────────
    {
      page: '/dashboard',
      waitMs: 1000,
      popover: {
        title: t('Votre tableau de bord', 'Your Dashboard', '您的仪表盘'),
        description: t(
          'Bienvenue dans votre espace personnel. Ici vous retrouvez votre <strong>solde</strong>, vos trades, vos statistiques et votre progression. Tout est mis à jour en temps réel.',
          'Welcome to your personal space. Here you find your <strong>balance</strong>, trades, statistics and progression. Everything updates in real time.',
          '欢迎来到您的个人空间。在这里可以找到您的<strong>余额</strong>、交易、统计数据和进度。一切实时更新。'
        ),
        align: 'center',
      },
    },
    {
      element: '[data-tour="dashboard-xp"]',
      popover: {
        title: t('Niveau & XP', 'Level & XP', '等级与XP'),
        description: t(
          'Votre <strong>niveau</strong> et votre <strong>barre XP</strong> progressent avec chaque vente. Monter de niveau débloque des avantages exclusifs comme un taux de cashout amélioré. Chaque euro vendu vous rapporte de l\'XP.',
          'Your <strong>level</strong> and <strong>XP bar</strong> progress with each sale. Leveling up unlocks exclusive perks like an improved cashout rate. Each euro sold earns you XP.',
          '您的<strong>等级</strong>和<strong>XP条</strong>随每次销售而增长。升级可解锁专属特权，如更高的提现率。每卖出一欧元就能赚取XP。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="dashboard-balance"]',
      popover: {
        title: t('Votre solde', 'Your Balance', '您的余额'),
        description: t(
          'Le <strong>solde disponible</strong> (en vert) est prêt à être retiré. Le montant en attente (ambre) correspond aux trades dont le trade hold Steam n\'est pas encore levé. Le graphique montre l\'<strong>évolution sur 30 jours</strong>.',
          'The <strong>available balance</strong> (green) is ready to withdraw. The pending amount (amber) corresponds to trades still under Steam trade hold. The chart shows the <strong>30-day evolution</strong>.',
          '<strong>可用余额</strong>（绿色）可以立即提现。待处理金额（琥珀色）对应仍在 Steam 交易保留期的交易。图表显示<strong>30天变化</strong>。'
        ),
        side: 'top',
      },
    },
    {
      element: '[data-tour="dashboard-stats"]',
      popover: {
        title: t('Vos statistiques', 'Your Statistics', '您的统计数据'),
        description: t(
          'Ces 4 cartes résument votre activité : <strong>volume total vendu</strong>, <strong>nombre de trades</strong>, votre <strong>niveau actuel</strong> et vos <strong>fragments</strong> disponibles pour les concours. D\'un seul coup d\'œil, vous savez où vous en êtes.',
          'These 4 cards summarize your activity: <strong>total volume sold</strong>, <strong>number of trades</strong>, your <strong>current level</strong> and your <strong>fragments</strong> available for giveaways. At a glance you know where you stand.',
          '这4张卡片汇总了您的活动：<strong>总销售额</strong>、<strong>交易次数</strong>、您的<strong>当前等级</strong>以及可用于抽奖的<strong>碎片</strong>。一眼就能知道您的状态。'
        ),
        side: 'top',
      },
    },
    {
      element: '[data-tour="dashboard-trades"]',
      popover: {
        title: t('Onglets de suivi', 'Tracking Tabs', '追踪标签'),
        description: t(
          'Les onglets vous permettent de consulter : <strong>Trades</strong> (historique et statut de chaque vente), <strong>Analytiques</strong> (graphiques de performance), <strong>Paiements</strong> (historique des retraits) et <strong>Paramètres</strong> (méthode de paiement, IBAN, crypto).',
          'The tabs let you consult: <strong>Trades</strong> (history and status of each sale), <strong>Analytics</strong> (performance charts), <strong>Payments</strong> (withdrawal history) and <strong>Settings</strong> (payment method, IBAN, crypto).',
          '标签页让您查看：<strong>交易</strong>（每笔销售的历史和状态）、<strong>分析</strong>（性能图表）、<strong>付款</strong>（提现历史）和<strong>设置</strong>（支付方式、IBAN、加密货币）。'
        ),
        side: 'top',
      },
    },
    // ─── Page Concours ───────────────────────────────────────────────────────
    {
      page: '/giveaways',
      waitMs: 1000,
      popover: {
        title: t('Page des concours', 'Giveaways Page', '抽奖页面'),
        description: t(
          'Bienvenue dans la section concours. Les <strong>fragments</strong> que vous avez accumulés en vendant servent de monnaie pour participer. Plus vous en misez, plus vos chances de gagner augmentent.',
          'Welcome to the giveaways section. The <strong>fragments</strong> you accumulated by selling serve as currency to participate. The more you stake, the higher your chances of winning.',
          '欢迎来到抽奖区。您通过出售积累的<strong>碎片</strong>作为参与货币。押注越多，赢的机会越大。'
        ),
        align: 'center',
      },
    },
    {
      element: '[data-tour="giveaways-fragments"]',
      popover: {
        title: t('Votre solde de fragments', 'Your Fragment Balance', '您的碎片余额'),
        description: t(
          'Cette carte affiche votre <strong>solde de fragments</strong> et votre progression vers le prochain concours accessible. Les fragments ne sont <strong>pas transférables</strong> et ne servent qu\'ici.',
          'This card displays your <strong>fragment balance</strong> and your progress toward the next accessible giveaway. Fragments are <strong>not transferable</strong> and are only used here.',
          '此卡片显示您的<strong>碎片余额</strong>以及您向下一个可参与抽奖的进度。碎片<strong>不可转让</strong>，仅在此处使用。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="giveaways-how"]',
      popover: {
        title: t('Comment ça marche ?', 'How does it work?', '如何运作？'),
        description: t(
          'Vendez des skins pour gagner des fragments, puis dépensez vos fragments pour obtenir des entrées dans un concours. Le tirage est <strong>aléatoire déterministe</strong> (seed enregistré) et les résultats sont publics et vérifiables.',
          'Sell skins to earn fragments, then spend your fragments to get entries in a giveaway. The draw is <strong>deterministic random</strong> (logged seed) and results are public and verifiable.',
          '出售皮肤赚取碎片，然后花费碎片获得抽奖入场资格。抽奖为<strong>确定性随机</strong>（记录种子），结果公开可验证。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="giveaways-tabs"]',
      popover: {
        title: t('Giveaways en cours / historique', 'Active giveaways / history', '进行中的抽奖 / 历史'),
        description: t(
          'La liste montre les concours en cours. Cliquez sur une carte pour l’afficher en haut et y entrer. Le bouton <strong>Historique</strong> ouvre les tirages terminés.',
          'The list shows ongoing giveaways. Click a card to feature it at the top and enter. The <strong>History</strong> button reveals ended draws.',
          '列表显示进行中的抽奖。点击卡片可将其显示在顶部并参与。<strong>历史</strong>按钮可查看已结束的抽奖。'
        ),
        side: 'top',
      },
    },
    // ─── Page Missions ───────────────────────────────────────────────────────
    {
      page: '/missions',
      waitMs: 1000,
      popover: {
        title: t('Page des missions', 'Missions Page', '任务页面'),
        description: t(
          'Les missions sont votre source de <strong>fragments gratuits</strong>. Un bonus de bienvenue de 1 000 fragments t’attend, puis des missions quotidiennes, hebdo, mensuelles et sociales. Complète-en un maximum pour maximiser tes chances aux concours.',
          'Missions are your source of <strong>free fragments</strong>. A 1,000-fragment welcome bonus is waiting, then daily, weekly, monthly and social missions. Complete as many as you can to maximize your giveaway chances.',
          '任务是您获取<strong>免费碎片</strong>的来源。新用户可领取 1 000 碎片欢迎奖励，此外还有每日、每周、每月和社交任务。尽量多完成任务以最大化抽奖机会。'
        ),
        align: 'center',
      },
    },
    {
      element: '[data-tour="missions-stats"]',
      popover: {
        title: t('Vos compteurs', 'Your counters', '您的计数器'),
        description: t(
          'Trois chiffres essentiels : <strong>fragments accumulés</strong>, <strong>fragments à réclamer</strong> (missions complétées en attente de validation) et <strong>missions terminées</strong>. Cliquez sur "Réclamer" pour encaisser chaque récompense.',
          'Three key numbers: <strong>accumulated fragments</strong>, <strong>fragments to claim</strong> (completed missions pending validation) and <strong>completed missions</strong>. Click "Claim" to collect each reward.',
          '三个关键数字：<strong>累积碎片</strong>、<strong>待领取碎片</strong>（已完成但待验证的任务）和<strong>已完成任务</strong>。点击"领取"收集每个奖励。'
        ),
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="missions-categories"]',
      popover: {
        title: t('Catégories de missions', 'Mission Categories', '任务类别'),
        description: t(
          'Les missions sont organisées en <strong>5 catégories</strong> : <em>Bonus</em> (surprises), <em>Quotidiennes</em> (visite journalière, vente du jour), <em>Hebdomadaires</em> (volume de vente sur 7 jours), <em>Mensuelles</em> (grands objectifs) et <em>Sociales</em> (rejoindre Discord, Telegram, suivre sur Instagram…).',
          'Missions are organized into <strong>5 categories</strong>: <em>Bonus</em> (surprises), <em>Daily</em> (daily visit, day\'s sale), <em>Weekly</em> (7-day sales volume), <em>Monthly</em> (big objectives) and <em>Social</em> (join Discord, Telegram, follow on Instagram…).',
          '任务分为<strong>5个类别</strong>：<em>奖励</em>（惊喜）、<em>每日</em>（每日访问、当日销售）、<em>每周</em>（7天销售额）、<em>每月</em>（大目标）和<em>社交</em>（加入Discord、Telegram、关注Instagram…）。'
        ),
        side: 'top',
      },
    },
    // ─── Fin du tour ─────────────────────────────────────────────────────────
    {
      page: '/dashboard',
      waitMs: 800,
      popover: {
        title: t('KYC & méthode de paiement', 'KYC & Payment Method', 'KYC 与支付方式'),
        description: t(
          'Avant de retirer vos gains, vous devez valider votre identité (<strong>KYC</strong>) via la page dédiée. Deux options de retrait : <strong>SEPA</strong> (virement bancaire, 1 à 3 jours ouvrés) ou <strong>crypto</strong> (rapide, via Binance). Configurez votre méthode dans l\'onglet <em>Paramètres</em> du dashboard.',
          'Before withdrawing your earnings, you must verify your identity (<strong>KYC</strong>) on the dedicated page. Two withdrawal options: <strong>SEPA</strong> (bank transfer, 1 to 3 business days) or <strong>crypto</strong> (fast, via Binance). Set up your method in the <em>Settings</em> tab of the dashboard.',
          '提现前，您需要在专用页面完成身份验证（<strong>KYC</strong>）。两种提现选项：<strong>SEPA</strong>（银行转账，1至3个工作日）或<strong>加密货币</strong>（快速，通过Binance）。在仪表盘的<em>设置</em>标签中配置您的方式。'
        ),
        align: 'center',
      },
    },
    {
      popover: {
        title: t('Vous êtes prêt !', 'You are ready!', '您准备好了！'),
        description: t(
          '<strong>Récap du parcours :</strong> vendez vos skins, suivez l\'état sur le dashboard, accumulez des fragments, participez aux concours et complétez des missions pour en gagner davantage. Relancez ce guide à tout moment depuis le <strong>footer du site</strong>. Bonne vente !',
          '<strong>Tour recap:</strong> sell your skins, track status on the dashboard, accumulate fragments, enter giveaways and complete missions for more fragments. Relaunch this guide anytime from the <strong>site footer</strong>. Happy selling!',
          '<strong>旅程回顾：</strong>出售皮肤，在仪表盘跟踪状态，积累碎片，参与抽奖并完成任务获取更多碎片。随时从<strong>网站页脚</strong>重新启动本指南。祝销售顺利！'
        ),
        align: 'center',
      },
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

  const steps = useMemo(() => buildTourSteps(locale), [locale]);

  const progressText =
    locale === 'fr' ? 'Étape {{current}} sur {{total}}' :
    locale === 'cn' ? '第 {{current}} / {{total}} 步' :
    'Step {{current}} of {{total}}';
  const nextBtnText = locale === 'fr' ? 'Suivant →' : locale === 'cn' ? '下一步 →' : 'Next →';
  const prevBtnText = locale === 'fr' ? '← Précédent' : locale === 'cn' ? '← 上一步' : '← Back';
  const doneBtnText = locale === 'fr' ? 'Terminer' : locale === 'cn' ? '完成' : 'Done';

  const buildAndDrive = useCallback(
    async (startAt: number) => {
      destroyedRef.current = false;
      try { driverRef.current?.destroy(); } catch { /* noop */ }
      driverRef.current = null;

      const { driver } = await import('driver.js');

      const driverSteps: DriveStep[] = steps.map(({ element, popover }) => ({ element, popover }));

      const instance = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.6,
        stagePadding: 10,
        stageRadius: 14,
        popoverClass: 'moonskin-tour-popover',
        progressText,
        nextBtnText,
        prevBtnText,
        doneBtnText,
        steps: driverSteps,

        onNextClick: () => {
          const next = stepIndexRef.current + 1;
          if (next >= steps.length) {
            instance.destroy();
            driverRef.current = null;
            onFinishRef.current();
            return;
          }
          const nextStep = steps[next];
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
          const prevStep = steps[prev];
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
    [locale, router, steps, progressText, nextBtnText, prevBtnText, doneBtnText]
  );

  useEffect(() => {
    let cancelled = false;
    stepIndexRef.current = 0;
    const firstStep = steps[0];

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
  }, [buildAndDrive, router, steps]);

  return null;
}
