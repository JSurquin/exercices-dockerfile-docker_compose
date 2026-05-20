"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { SkinplaceInventoryViewer } from "@/components/skinplace/skinplace-inventory-viewer";
import { SafeImg } from "@/components/ui/safe-image";
import { SkinplaceTradeCreator, TradeCreatedData } from "@/components/skinplace/skinplace-trade-creator";
import { ConvertedPrice } from "@/components/ui/converted-price";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";
import { TradeStatusModal, TradeModalStatus } from "@/components/sell/trade-status-modal";
import { parseSteamId64FromUserInput } from "@/lib/steam-id";
import InlineTradeLinkEditor from "@/components/sell/inline-trade-link-editor";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { UserRoleBadge } from "@/components/ui/user-role-badge";
import { LoginRequiredBlock } from '@/components/auth/require-auth';
import { useTourMode } from '@/components/providers/tour-provider';
import { SellTourDemo } from '@/components/tour-demos/sell-tour-demo';
import { XPPreviewBar, estimateXPGain, xpForNextLevel, levelFromXP } from '@/components/sell/xp-preview-bar';

const getSteps = (messages: any) => [
  { id: "inventory", title: messages.sellPage.steps.inventory, icon: LinkIcon },
  { id: "trade", title: messages.sellPage.steps.trade, icon: CurrencyDollarIcon },
  { id: "confirmation", title: messages.sellPage.steps.confirmation, icon: CheckCircleIcon },
];

const POLL_INTERVAL_MS = 8000;
const POLL_MAX_ATTEMPTS = 45; // ~6 minutes de polling

export default function SellPage() {
  const { user } = useAuth();
  const { messages } = useLocale();
  const { isTourMode } = useTourMode();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getSteps(messages);
  const [selectedItems, setSelectedItems] = useState<NormalizedInventoryItem[]>([]);
  // Preview temps réel pour la barre XP (avant confirmation)
  const [previewItems, setPreviewItems] = useState<NormalizedInventoryItem[]>([]);
  const [tradeData, setTradeData] = useState<TradeCreatedData | null>(null);
  
  // Déterminer le Steam ID à utiliser pour l'inventaire
  // Priorité : Trade Link > steamId64 de connexion
  const getInventorySteamId = () => {
    if (user?.tradeLink) {
      const extractedId = parseSteamId64FromUserInput(user.tradeLink);
      if (extractedId) return extractedId;
    }
    // Fallback sur le steamId64 de connexion
    return user?.steamId64 || '';
  };
  
  const [activeSteamId, setActiveSteamId] = useState(getInventorySteamId());
  const [modalStatus, setModalStatus] = useState<TradeModalStatus>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  // Mettre à jour activeSteamId quand le user ou son trade link change
  useEffect(() => {
    const newSteamId = getInventorySteamId();
    if (newSteamId !== activeSteamId) {
      setActiveSteamId(newSteamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tradeLink, user?.steamId64]);

  // Callback pour rafraîchir après modification du Trade Link
  const handleTradeLinkUpdate = () => {
    const newSteamId = getInventorySteamId();
    setActiveSteamId(newSteamId);
  };

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const startPolling = useCallback((tradeId: string) => {
    stopPolling();
    pollAttemptsRef.current = 0;
    pollIntervalRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;
      const attempt = pollAttemptsRef.current;

      if (attempt > POLL_MAX_ATTEMPTS) {
        stopPolling();
        return;
      }

      try {
        const url = `/api/skinplace/trade/status/${tradeId}`;
        const res = await fetch(url);

        if (!res.ok) return;

        const data = await res.json();
        const status: string = data?.trade?.status ?? "";

        if (status === "ACCEPTED_BY_BOT") {
          setModalStatus("pending");
        } else if (status === "IN_TRADE_HOLD" || status === "AVAILABLE") {
          stopPolling();
          setModalStatus("accepted");
        } else if (status === "CANCELLED" || status === "FAILED") {
          stopPolling();
          setModalStatus("cancelled");
        }
      } catch {
        // Silently retry on next tick
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const confirmationCashoutPercent =
    tradeData && tradeData.total_value > 0
      ? ((tradeData.fees.cashout_fee / tradeData.total_value) * 100).toFixed(2)
      : "0.50";

  const handleItemSelect = (items: NormalizedInventoryItem[]) => {
    setSelectedItems(items);
    setCurrentStep(1);
  };

  const handleSelectionChange = (items: NormalizedInventoryItem[]) => {
    setPreviewItems(items);
  };

  const handleTradeCreated = (trade: TradeCreatedData) => {
    setTradeData(trade);
    setCurrentStep(2);
    toast.success(messages.sellPage.successMessages.tradeCreated);
    if (trade.trade_id) {
      startPolling(trade.trade_id);
    }
  };

  const handleModalClose = () => {
    setModalStatus(null);
  };

  const handleSellAgain = () => {
    setModalStatus(null);
    setTradeData(null);
    setSelectedItems([]);
    setCurrentStep(0);
  };

  const pendingXPGain = estimateXPGain(
    previewItems.reduce((sum, item) => sum + item.price_centimes, 0)
  );
  const userLevel = user?.level ?? 1;
  const userXP = user?.xp ?? 0;
  const xpNext = xpForNextLevel(userLevel);

  if (!user) {
    if (isTourMode) return <SellTourDemo />;
    return (
      <LoginRequiredBlock
        icon={<ShieldCheckIcon className="w-16 h-16" />}
        title={messages.dashboard.loginRequired}
        description={messages.sellPage.loginDescription}
        buttonLabel={messages.common.steamLogin}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <TradeStatusModal
        status={modalStatus}
        onClose={handleModalClose}
        onSellAgain={handleSellAgain}
        bot={tradeData?.bot}
      />
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {messages.sellPage.title}
          </h1>
          <p className="text-muted-foreground">{messages.sellPage.subtitle}</p>
        </motion.div>

        {user && (user.bonusRatePercent ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto mb-4"
          >
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 sm:px-4">
              <UserRoleBadge userTag={user.userTag} size="sm" />
              <span className="text-sm text-amber-600 dark:text-amber-400">
                {messages.sellPage.bonusBanner.replace('{percent}', String(user.bonusRatePercent))}
              </span>
            </div>
          </motion.div>
        )}

        {user && currentStep === 0 && (
          <motion.div
            data-tour="sell-trade-link"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <InlineTradeLinkEditor onSuccess={handleTradeLinkUpdate} />
          </motion.div>
        )}

        {/* Progress Stepper */}
        <motion.div
          data-tour="sell-steps"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8 overflow-x-auto -mx-1 px-1 scrollbar-thin"
        >
          <div className="flex items-center justify-center sm:justify-between gap-1 sm:gap-2 mb-4 min-w-max sm:min-w-0 w-full mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center shrink-0">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                  ) : (
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="ml-2 sm:ml-3 hidden sm:block">
                  <p
                    className={`text-xs md:text-sm font-medium leading-snug md:leading-normal ${
                      index <= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 md:w-14 lg:w-20 h-0.5 shrink-0 mx-2 sm:mx-3 md:mx-4 ${
                      index < currentStep ? "bg-orange-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            className="h-2"
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {currentStep === 0 && (
            <div data-tour="sell-inventory">
            <div className="max-w-6xl mx-auto mb-4">
              <XPPreviewBar
                currentXP={userXP}
                currentLevel={userLevel}
                xpForNextLevel={xpNext}
                pendingXPGain={pendingXPGain}
              />
            </div>
            <SkinplaceInventoryViewer
              steamId64={activeSteamId}
              linkedSteamIdentity={
                user.steamId64 && activeSteamId === user.steamId64
                  ? { name: user.username, avatarUrl: user.avatar }
                  : undefined
              }
              onItemSelect={handleItemSelect}
              onSelectionChange={handleSelectionChange}
              selectable={true}
              allowSteamIdChange={true}
              onSteamIdChange={(newId) => setActiveSteamId(newId)}
            />
            </div>
          )}

          {currentStep === 1 && (
            <SkinplaceTradeCreator
              steamId64={activeSteamId || user.steamId64}
              selectedItems={selectedItems}
              onTradeCreated={handleTradeCreated}
            />
          )}

          {currentStep === 2 && tradeData && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4 sm:p-8 text-center">
                  <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h2 className="text-2xl font-bold mb-2">
                    {messages.sellPage.confirmation.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {messages.sellPage.confirmation.description}
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground block">
                          {messages.sellPage.confirmation.tradeIdSteam}
                        </span>
                        <p className="font-mono">{tradeData.trade_id}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {messages.sellPage.confirmation.grossValue}
                        </span>
                        <span className="font-medium">
                          <ConvertedPrice usdCents={tradeData.total_value} />
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-red-500">
                        <span>
                          {messages.sellPage.confirmation.cashoutFeesLine.replace(
                            "{percent}",
                            confirmationCashoutPercent
                          )}
                        </span>
                        <span className="font-medium">
                          -<ConvertedPrice usdCents={tradeData.fees.cashout_fee} />
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="font-medium">
                          {messages.sellPage.confirmation.youWillReceive}
                        </span>
                        <span className="font-bold text-green-600 text-base">
                          <ConvertedPrice usdCents={tradeData.net_value} />
                        </span>
                      </div>
                      <div className="flex flex-wrap items-start justify-between gap-2 border border-dashed border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/20 rounded-md p-2 text-xs text-muted-foreground">
                        <span className="flex-1">{messages.sellPage.confirmation.payoutFeesReminder}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                      {messages.sellPage.confirmation.feesExplanation}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <a
                        href="https://steamcommunity.com/my/tradeoffers/"
                        target="_blank"
                      >
                        {messages.sellPage.confirmation.acceptTrade}
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/dashboard">
                        {messages.sellPage.confirmation.trackTrade}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* MoonSkin trade bot (profil technique fourni par l’API partenaire) */}
              {tradeData.bot && (
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-orange-500">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/>
                        <path d="M2 20c0-4 4-7 10-7s10 3 10 7"/>
                        <circle cx="18" cy="8" r="3" fill="currentColor" stroke="none" className="opacity-60"/>
                        <path d="M18 5v-.5M18 11v-.5M15.5 8h-.5M21 8h-.5" strokeWidth="1.5"/>
                      </svg>
                      {messages.sellPage.confirmation.moonSkinBotTitle}
                    </h3>
                    <div className="flex items-center gap-4">
                      <SafeImg
                        src={tradeData.bot.avatar}
                        alt={tradeData.bot.name}
                        className="w-14 h-14 rounded-full border-2 border-orange-500/40 object-cover"
                        fallbackClassName="w-14 h-14 rounded-full border-2 border-orange-500/40"
                        fallbackIcon={<UserIcon className="w-7 h-7 text-muted-foreground" />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-base truncate">{tradeData.bot.name}</p>
                          {tradeData.bot.level && (
                            <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                              {messages.sellPage.confirmation.botLevelShort} {tradeData.bot.level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {messages.sellPage.confirmation.steamIdLabel} {tradeData.bot.steamid}
                        </p>
                        {tradeData.bot.registration_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {messages.sellPage.confirmation.memberSince} {tradeData.bot.registration_date}
                          </p>
                        )}
                      </div>
                      {tradeData.bot.profile_url && (
                        <a
                          href={tradeData.bot.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs underline text-orange-500 hover:text-orange-600"
                        >
                          {messages.sellPage.confirmation.viewProfile}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processus de paiement */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {messages.sellPage.confirmation.howItWorksTitle}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-medium">{messages.sellPage.confirmation.steps.step1.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.sellPage.confirmation.steps.step1.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-medium">{messages.sellPage.confirmation.steps.step2.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.sellPage.confirmation.steps.step2.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-medium">{messages.sellPage.confirmation.steps.step3.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.sellPage.confirmation.steps.step3.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                        4
                      </div>
                      <div>
                        <p className="font-medium">{messages.sellPage.confirmation.steps.step4.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.sellPage.confirmation.steps.step4.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {messages.sellPage.confirmation.tip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
