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
} from "@heroicons/react/24/outline";
import { useLocale } from "@/components/providers/locale-provider";

export type TradeModalStatus = "accepted" | "cancelled" | "pending" | null;

interface TradeStatusModalProps {
  status: TradeModalStatus;
  onClose: () => void;
  onSellAgain: () => void;
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
