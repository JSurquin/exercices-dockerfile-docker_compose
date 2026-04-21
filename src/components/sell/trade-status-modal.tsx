"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";
import { SafeImg } from "@/components/ui/safe-image";
import { SkinplaceBotInfo } from "@/components/skinplace/skinplace-trade-creator";

export type TradeModalStatus = "accepted" | "cancelled" | "pending" | null;

interface TradeStatusModalProps {
  status: TradeModalStatus;
  onClose: () => void;
  onSellAgain: () => void;
  bot?: SkinplaceBotInfo | null;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => i);
const COLORS = [
  "#f97316", "#22c55e", "#3b82f6", "#a855f7",
  "#fb923c", "#86efac", "#93c5fd", "#d8b4fe",
];

export function TradeStatusModal({
  status,
  onClose,
  onSellAgain,
  bot,
}: TradeStatusModalProps) {
  const { messages } = useLocale();
  const t = messages.sellPage.tradeStatusModal;
  const isAccepted = status === "accepted";
  const isCancelled = status === "cancelled";
  const isPending = status === "pending";

  return (
    <Dialog open={status !== null} onOpenChange={(open) => !open && (isPending ? null : onClose())}>
      <DialogContent
        className="sm:max-w-md text-center overflow-hidden"
        showCloseButton={!isPending}
      >
        {/* Particules confetti CSS pour trade accepté */}
        {isAccepted && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {PARTICLES.map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: COLORS[i % COLORS.length],
                  left: `${5 + (i * 5.5) % 90}%`,
                  top: "-8px",
                }}
                initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  y: [0, 60 + (i % 3) * 40, 180 + (i % 4) * 60],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8)],
                  opacity: [1, 1, 0],
                  rotate: [0, 180 + i * 20, 360 + i * 40],
                  scale: [1, 0.8, 0.5],
                }}
                transition={{
                  duration: 1.4 + (i % 4) * 0.2,
                  delay: (i % 6) * 0.08,
                  ease: "easeIn",
                }}
              />
            ))}
          </div>
        )}

        <DialogHeader>
          <AnimatePresence mode="wait">
            {isAccepted && (
              <motion.div
                key="accepted"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-500/30"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.8, repeat: 2, ease: "easeOut" }}
                  />
                  <CheckCircleIcon className="w-20 h-20 text-green-500 relative z-10" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  {t.acceptedTitle}
                </DialogTitle>
              </motion.div>
            )}

            {isPending && (
              <motion.div
                key="pending"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-orange-500/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <ClockIcon className="w-20 h-20 text-orange-500 relative z-10" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  {t.pendingTitle}
                </DialogTitle>
              </motion.div>
            )}

            {isCancelled && (
              <motion.div
                key="cancelled"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <XCircleIcon className="w-20 h-20 text-red-500" />
                <DialogTitle className="text-2xl font-bold text-center">
                  {t.cancelledTitle}
                </DialogTitle>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <DialogDescription className="text-base text-center leading-relaxed">
            {isAccepted
              ? t.acceptedDescription
              : isPending
              ? t.pendingDescription
              : t.cancelledDescription}
          </DialogDescription>

          {isAccepted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-300 leading-relaxed"
            >
              {t.holdReminder}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3 pt-2"
          >
            {isAccepted ? (
              <>
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <a href="/dashboard">
                    <ArrowRightIcon className="w-4 h-4 mr-2" />
                    {t.backToAccount}
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href="/dashboard?tab=trades">{t.viewTrades}</a>
                </Button>
              </>
            ) : isPending ? (
              <>
                {bot && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border border-orange-500/30 bg-orange-500/5 rounded-lg p-4 text-left"
                  >
                    <p className="text-xs font-semibold text-orange-500 mb-3 flex items-center gap-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/>
                        <path d="M2 20c0-4 4-7 10-7s10 3 10 7"/>
                        <circle cx="18" cy="8" r="3" fill="currentColor" stroke="none" className="opacity-60"/>
                        <path d="M18 5v-.5M18 11v-.5M15.5 8h-.5M21 8h-.5" strokeWidth="1.5"/>
                      </svg>
                      {messages.sellPage.confirmation.moonSkinBotTitle}
                    </p>
                    <div className="flex items-center gap-3">
                      <SafeImg
                        src={bot.avatar}
                        alt={bot.name}
                        className="w-11 h-11 rounded-full border-2 border-orange-500/40 object-cover"
                        fallbackClassName="w-11 h-11 rounded-full border-2 border-orange-500/40"
                        fallbackIcon={<UserIcon className="w-6 h-6 text-muted-foreground" />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">{bot.name}</p>
                          {bot.level && (
                            <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                              {messages.sellPage.confirmation.botLevelShort} {bot.level}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {messages.sellPage.confirmation.steamIdLabel} {bot.steamid}
                        </p>
                        {bot.registration_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {messages.sellPage.confirmation.memberSince} {bot.registration_date}
                          </p>
                        )}
                      </div>
                      {bot.profile_url && (
                        <a
                          href={bot.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-xs underline text-orange-500 hover:text-orange-600"
                        >
                          {messages.sellPage.confirmation.viewProfile}
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  <a
                    href="https://steamcommunity.com/my/tradeoffers/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowRightIcon className="w-4 h-4 mr-2" />
                    {t.acceptOnSteam}
                  </a>
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={onSellAgain}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  {t.sellAgain}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href="/dashboard">{t.backToAccount}</a>
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
