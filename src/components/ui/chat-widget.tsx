"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo, type ComponentType, type SVGProps } from "react";
import Image from "next/image";
import { ChatMarkdownContent } from "@/lib/chat-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { resolveI18nContent } from "@/lib/resolve-i18n-content";
import { localeToBcp47 } from "@/lib/locale-date";
import { shouldShowBackButton,
  getChatWidgetSupportStaff,
  type ChatWidgetHelpStep,
  type ChatWidgetMessagesStep,
  type ChatWidgetTab,
  type ChatWidgetSupportStaffMember,
} from "@/lib/chat-widget-config";
import { MOONSKIN_LOGO_AVATAR_SRC, resolveStaffAvatarSrc } from "@/lib/team-avatars";
import { isTerminalConversationStatus, shouldClearAiTypingIndicator } from "@/lib/chat-logic";
import {
  CHAT_WIDGET_POPUP_CLOSE_MS,
  CHAT_WIDGET_RATING_EMOJIS,
  setChatWidgetBodyScrollLock,
  chatWidgetAiTypingBubbleClass,
  chatWidgetConversationEndedClass,
  chatWidgetConversationHeaderClass,
  chatWidgetFabButtonClass,
  chatWidgetHistoryItemClass,
  chatWidgetHistoryItemTitleClass,
  chatWidgetHomeCardClass,
  chatWidgetHomeCardInnerButtonClass,
  chatWidgetHomeHeaderClass,
  chatWidgetHomeBodyClass,
  chatWidgetHomeCardSectionTitleClass,
  chatWidgetHomeHelpLinkClass,
  chatWidgetHomeSearchHeaderClass,
  chatWidgetHelpCategoryIconClass,
  chatWidgetHelpCategoryRowClass,
  chatWidgetHelpSubcategoryRowClass,
  chatWidgetPanelHeaderClass,
  chatWidgetPanelHeaderSubtitleClass,
  chatWidgetPanelHeaderTitleClass,
  chatWidgetConversationScrollClass,
  chatWidgetMessagesListBodyClass,
  chatWidgetHistoryCardClass,
  chatWidgetHistorySectionTitleClass,
  chatWidgetStaffAvatarStackClass,
  chatWidgetStaffAvatarClass,
  chatWidgetStaffAvatarLargeClass,
  chatWidgetInputAreaClass,
  chatWidgetMessageAlignment,
  chatWidgetMessageBubbleClass,
  chatWidgetPopupContainerClass,
  chatWidgetRatingBoxClass,
  chatWidgetRatingEmojiClass,
  chatWidgetSendButtonClass,
  chatWidgetSenderLabelClass,
  chatWidgetSystemBannerClass,
  chatWidgetSystemJoinClass,
  chatWidgetTabBarClass,
  chatWidgetTabButtonClass,
  chatWidgetTabIconClass,
  chatWidgetTextareaClass,
  chatWidgetTimestampClass,
  chatWidgetUnreadBadgeClass,
  chatWidgetMessageEnterClass,
  isWidgetMessageFromViewer,
  resolveWidgetSystemMessageVariant,
  shouldShowWidgetAiTyping,
  shouldShowWidgetUnreadBadge,
  type WidgetSenderType,
} from "@/lib/chat-widget-styles";
import { useAuth } from "@/components/providers/auth-provider";
import { useChat } from "@/hooks/use-chat";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  SparklesIcon,
  UserCircleIcon,
  PlusIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";

const SUPPORT_AVATAR_SRC = MOONSKIN_LOGO_AVATAR_SRC;

const ChatWidgetSupportHeadsetIcon = memo(function ChatWidgetSupportHeadsetIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M5 12.25a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="3.25" y="12" width="5.25" height="7.75" rx="2.625" fill="currentColor" />
      <rect x="15.5" y="12" width="5.25" height="7.75" rx="2.625" fill="currentColor" />
      <path
        d="M5.25 19.75v1.25c0 .97-.79 1.75-1.75 1.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="3.5" cy="22.75" r="1.15" fill="currentColor" />
    </svg>
  );
});

interface ChatWidgetStaffAvatarsProps {
  members: ChatWidgetSupportStaffMember[];
  size?: "sm" | "md";
  borderClass?: string;
}

const ChatWidgetStaffAvatars = memo(function ChatWidgetStaffAvatars({
  members,
  size = "sm",
  borderClass,
}: ChatWidgetStaffAvatarsProps) {
  const avatarClass =
    size === "md"
      ? chatWidgetStaffAvatarLargeClass(borderClass)
      : chatWidgetStaffAvatarClass(borderClass);

  return (
    <div className={chatWidgetStaffAvatarStackClass()} aria-hidden>
      {members.map((member) => (
        <Avatar key={member.key} className={avatarClass}>
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback className="bg-theme-accent/20 text-[10px] font-semibold">
            {member.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────
 * Arbre de catégories / sous-catégories
 * ───────────────────────────────────────────── */

type ChatIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

interface Subcategory {
  key: string;
  label: string;
}

interface Category {
  key: string;
  label: string;
  icon: ChatIcon;
  description: string;
  subcategories: Subcategory[];
}

function formatRelativeTime(
  date: Date | string,
  labels: {
    now: string;
    minutes: (n: number) => string;
    hours: (n: number) => string;
    days: (n: number) => string;
  },
  locale: string,
): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return labels.now;
  if (mins < 60) return labels.minutes(mins);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return labels.hours(hours);
  const days = Math.floor(hours / 24);
  if (days < 7) return labels.days(days);
  return new Date(date).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

function formatMessageTime(date: Date | string, locale: string) {
  return new Date(date).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type WidgetMessage = {
  id: string;
  content: string;
  senderType: string;
  createdAt: string | Date;
  userId?: string | null;
};

interface ChatWidgetInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled: boolean;
  placeholder: string;
  sendHint: string;
  prefillMessage?: string;
}

/** Fenêtre anti-doublon : même contenu renvoyé trop vite (Entrée + clic, double-clic, etc.) */
const SEND_DEDUPE_MS = 8_000;

const ChatWidgetInput = memo(function ChatWidgetInput({
  onSend,
  disabled,
  placeholder,
  sendHint,
  prefillMessage,
}: ChatWidgetInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSendingRef = useRef(false);

  useEffect(() => {
    if (prefillMessage) {
      setMessage(prefillMessage);
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
      }
    }
  }, [prefillMessage]);

  const resetTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "38px";
  }, []);

  const handleSend = async () => {
    if (!message.trim() || disabled || isSendingRef.current) return;
    isSendingRef.current = true;
    const content = message;
    setMessage("");
    resetTextareaHeight();
    try {
      await onSend(content);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className={chatWidgetInputAreaClass()}>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          data-testid="chat-message-input"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={chatWidgetTextareaClass()}
          style={{ height: "38px", fontSize: "16px" }}
        />
        <Button
          size="icon"
          data-testid="chat-send-button"
          className={chatWidgetSendButtonClass()}
          onClick={() => void handleSend()}
          disabled={!message.trim() || disabled}
        >
          {disabled ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <PaperAirplaneIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 text-center select-none">
        {sendHint}
      </p>
    </div>
  );
});

interface ChatWidgetConversationRatingProps {
  conversationId: string;
  existingRating: number | null | undefined;
  title: string;
  ratedTitle: string;
  tellUsMore: string;
  sendFeedbackLabel: string;
  thankYou: string;
  onFlowStart: () => void;
  onRated: (rating: number) => void;
  onRatingSaved: () => void;
  onError: () => void;
}

type ChatWidgetRatingStep = 'select' | 'feedback' | 'done';

const ChatWidgetConversationRating = memo(function ChatWidgetConversationRating({
  conversationId,
  existingRating,
  title,
  ratedTitle,
  tellUsMore,
  sendFeedbackLabel,
  thankYou,
  onFlowStart,
  onRated,
  onRatingSaved,
  onError,
}: ChatWidgetConversationRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<ChatWidgetRatingStep>('select');
  const [selectedRating, setSelectedRating] = useState<number | null>(existingRating ?? null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (existingRating != null) {
      setSelectedRating(existingRating);
      setStep((current) => (current === 'feedback' ? 'feedback' : 'done'));
    }
  }, [existingRating]);

  const handleSelectRating = async (rating: number) => {
    if (submitting || step !== 'select') return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error('rate failed');
      setSelectedRating(rating);
      setStep('feedback');
      onFlowStart();
      onRatingSaved();
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFeedback = async () => {
    const rating = selectedRating;
    if (rating == null || submitting || step !== 'feedback') return;
    const trimmed = feedback.trim();
    if (!trimmed) {
      setStep('done');
      onRated(rating);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: trimmed }),
      });
      if (!res.ok) throw new Error('feedback failed');
      setStep('done');
      onRated(rating);
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done' && selectedRating != null) {
    return (
      <div className="flex justify-center py-3" data-testid="chat-conversation-rating-done">
        <div className={chatWidgetRatingBoxClass()}>
          <p className="text-sm font-medium text-foreground">
            {ratedTitle}{' '}
            <span className="text-xl" aria-hidden>
              {CHAT_WIDGET_RATING_EMOJIS[selectedRating - 1]}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">{thankYou}</p>
        </div>
      </div>
    );
  }

  if (step === 'feedback' && selectedRating != null) {
    return (
      <div className="flex justify-center py-3" data-testid="chat-conversation-rating-feedback">
        <div className={chatWidgetRatingBoxClass()}>
          <p className="text-sm font-medium text-foreground mb-1">
            {ratedTitle}{' '}
            <span className="text-xl" aria-hidden>
              {CHAT_WIDGET_RATING_EMOJIS[selectedRating - 1]}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mb-3">{tellUsMore}</p>
          <Textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            disabled={submitting}
            rows={3}
            className="mb-3 resize-none text-sm"
            maxLength={2000}
          />
          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={submitting}
            data-testid="chat-rating-send-feedback"
            onClick={() => void handleSendFeedback()}
          >
            {sendFeedbackLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-3" data-testid="chat-conversation-rating">
      <div className={chatWidgetRatingBoxClass()}>
        <p className="text-sm font-medium text-foreground mb-3">{title}</p>
        <div className="flex items-center justify-center gap-1">
          {CHAT_WIDGET_RATING_EMOJIS.map((emoji, index) => {
            const value = index + 1;
            const isSelected = hovered === value;
            return (
              <button
                key={emoji}
                type="button"
                disabled={submitting}
                aria-label={`${value}/5`}
                className={chatWidgetRatingEmojiClass(false, isSelected)}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => void handleSelectRating(value)}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

interface ChatWidgetMessageListProps {
  conversationId: string | null;
  messages: WidgetMessage[];
  viewerUserId?: string;
  welcomeMessage: string;
  moderatorLabel: string;
  botLabel: string;
  aiLabel: string;
  contactModeratorLabel: string;
  escalatingModeratorLabel: string;
  aiEnabled: boolean;
  escalatingModerator: boolean;
  onContactModerator: () => void | Promise<void>;
  resolveContent: (content: string) => string;
  dateLocale: string;
  isLoadingOlderMessages: boolean;
  isLoading: boolean;
  showAiTyping: boolean;
  aiTypingQueuedHint?: string;
  conversationStatus?: string;
  clientRating?: number | null;
  showRatingPrompt: boolean;
  rateTitle: string;
  rateRatedTitle: string;
  rateTellUsMore: string;
  rateSendFeedback: string;
  rateThankYou: string;
  onRatingFlowStart: () => void;
  onRated: (rating: number) => void;
  onRatingSaved: () => void;
  onRatingError: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  agentAvatarUrl?: string | null;
}

const ChatWidgetMessageList = memo(function ChatWidgetMessageList({
  conversationId,
  messages,
  viewerUserId,
  welcomeMessage,
  moderatorLabel,
  botLabel,
  aiLabel,
  contactModeratorLabel,
  escalatingModeratorLabel,
  aiEnabled,
  escalatingModerator,
  onContactModerator,
  resolveContent,
  dateLocale,
  isLoadingOlderMessages,
  isLoading,
  showAiTyping,
  aiTypingQueuedHint,
  conversationStatus,
  clientRating,
  showRatingPrompt,
  rateTitle,
  rateRatedTitle,
  rateTellUsMore,
  rateSendFeedback,
  rateThankYou,
  onRatingFlowStart,
  onRated,
  onRatingSaved,
  onRatingError,
  onScroll,
  containerRef,
  agentAvatarUrl,
}: ChatWidgetMessageListProps) {
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const seenConversationRef = useRef<string | null>(null);

  if (conversationId !== seenConversationRef.current) {
    seenMessageIdsRef.current = new Set();
    seenConversationRef.current = conversationId;
  }

  return (
    <div
      ref={containerRef}
      data-testid="chat-messages"
      onScroll={onScroll}
      className={chatWidgetConversationScrollClass()}
    >
      {isLoadingOlderMessages && (
        <div className="flex justify-center py-2">
          <div className="h-4 w-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {messages.length === 0 && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted border text-sm">
            {welcomeMessage}
          </div>
        </div>
      )}

      {messages.map((msg) => {
        const isUser = isWidgetMessageFromViewer(msg.senderType, msg.userId, viewerUserId);
        const isAi = msg.senderType === "AI";
        const isSystem = msg.senderType === "SYSTEM";
        const systemVariant = isSystem ? resolveWidgetSystemMessageVariant(msg.content) : null;
        if (systemVariant === 'closed') return null;

        const bubbleSender: WidgetSenderType = isUser ? "USER" : (msg.senderType as WidgetSenderType);
        const isNewMessage = !seenMessageIdsRef.current.has(msg.id);
        if (isNewMessage) {
          seenMessageIdsRef.current.add(msg.id);
        }

        if (isSystem && systemVariant === 'join') {
          const joinText = resolveContent(msg.content);
          return (
            <div
              key={msg.id}
              className={`${chatWidgetSystemJoinClass()} ${chatWidgetMessageEnterClass(isNewMessage)}`}
            >
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={agentAvatarUrl ?? SUPPORT_AVATAR_SRC} />
                <AvatarFallback className="text-[9px]">
                  <UserCircleIcon className="h-3 w-3" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <span>{joinText}</span>
            </div>
          );
        }

        if (isSystem && systemVariant === 'banner') {
          return (
            <div
              key={msg.id}
              className={`flex justify-start ${chatWidgetMessageEnterClass(isNewMessage)}`}
            >
              <div className={chatWidgetSystemBannerClass()}>
                {resolveContent(msg.content)}
              </div>
            </div>
          );
        }

        if (isSystem) {
          return (
            <div
              key={msg.id}
              className={`flex justify-center ${chatWidgetMessageEnterClass(isNewMessage)}`}
            >
              <p className="text-xs text-muted-foreground px-2 py-1 text-center max-w-[90%]">
                {resolveContent(msg.content)}
              </p>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex ${chatWidgetMessageAlignment(isUser)} ${chatWidgetMessageEnterClass(isNewMessage)}`}
          >
            <div className={chatWidgetMessageBubbleClass(bubbleSender)}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{resolveContent(msg.content)}</p>
              ) : (
                <ChatMarkdownContent content={resolveContent(msg.content)} />
              )}
              {isAi && aiEnabled && (
                <div className="mt-2 pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="chat-contact-moderator-button"
                    className="h-7 text-[11px] px-2.5"
                    disabled={escalatingModerator || isLoading}
                    onClick={() => void onContactModerator()}
                  >
                    {escalatingModerator ? escalatingModeratorLabel : contactModeratorLabel}
                  </Button>
                </div>
              )}
              <div
                className={`flex items-center justify-end mt-1 gap-2 ${chatWidgetTimestampClass(bubbleSender)}`}
              >
                <span className="text-[10px]">{formatMessageTime(msg.createdAt, dateLocale)}</span>
                {isUser && (
                  <div className="flex text-white/50">
                    <CheckIcon className="h-3 w-3" />
                    <CheckIcon className="h-3 w-3 -ml-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {showRatingPrompt && conversationId && (
        <ChatWidgetConversationRating
          conversationId={conversationId}
          existingRating={clientRating}
          title={rateTitle}
          ratedTitle={rateRatedTitle}
          tellUsMore={rateTellUsMore}
          sendFeedbackLabel={rateSendFeedback}
          thankYou={rateThankYou}
          onFlowStart={onRatingFlowStart}
          onRated={onRated}
          onRatingSaved={onRatingSaved}
          onError={onRatingError}
        />
      )}

      {isLoading && !showAiTyping && (
        <div className="flex justify-start">
          <div className="bg-muted border rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
            </div>
          </div>
        </div>
      )}

      {showAiTyping && (
        <div className="flex justify-start ai-typing-bubble">
          <div className={chatWidgetAiTypingBubbleClass()}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 rounded-full px-2 py-0.5">
                  <SparklesIcon className="h-3 w-3 shrink-0" aria-hidden />
                  {aiLabel}
                </span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full ai-typing-dot" />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full ai-typing-dot" />
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full ai-typing-dot" />
                </div>
              </div>
              {aiTypingQueuedHint && (
                <p className="text-[11px] leading-snug text-muted-foreground max-w-[240px]">
                  {aiTypingQueuedHint}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
 * Composant principal
 * ───────────────────────────────────────────── */

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [popupMounted, setPopupMounted] = useState(false);
  const { messages, locale } = useLocale();

  const CATEGORIES: Category[] = [
    {
      key: "trade",
      label: messages.chatWidget.categories.trade.label,
      icon: ArrowPathIcon,
      description: messages.chatWidget.categories.trade.description,
      subcategories: [
        { key: "trade.pending", label: messages.chatWidget.categories.trade.subcategories.pending },
        { key: "trade.blocked", label: messages.chatWidget.categories.trade.subcategories.blocked },
        { key: "trade.item_missing", label: messages.chatWidget.categories.trade.subcategories.itemMissing },
        { key: "trade.lock", label: messages.chatWidget.categories.trade.subcategories.lock },
        { key: "trade.bot_issue", label: messages.chatWidget.categories.trade.subcategories.botIssue },
      ],
    },
    {
      key: "payment",
      label: messages.chatWidget.categories.payment.label,
      icon: BanknotesIcon,
      description: messages.chatWidget.categories.payment.description,
      subcategories: [
        { key: "payment.card", label: messages.chatWidget.categories.payment.subcategories.card },
        { key: "payment.sepa_fr", label: messages.chatWidget.categories.payment.subcategories.sepaFr },
        { key: "payment.sepa_eu", label: messages.chatWidget.categories.payment.subcategories.sepaEu },
        { key: "payment.crypto", label: messages.chatWidget.categories.payment.subcategories.crypto },
        { key: "delay.card", label: messages.chatWidget.categories.payment.subcategories.delayCard },
        { key: "delay.sepa_fr", label: messages.chatWidget.categories.payment.subcategories.delaySepaFr },
        { key: "delay.sepa_eu", label: messages.chatWidget.categories.payment.subcategories.delaySepaEu },
        { key: "delay.crypto", label: messages.chatWidget.categories.payment.subcategories.delayCrypto },
      ],
    },
    {
      key: "support",
      label: messages.chatWidget.categories.support.label,
      icon: WrenchScrewdriverIcon,
      description: messages.chatWidget.categories.support.description,
      subcategories: [
        { key: "support.bug", label: messages.chatWidget.categories.support.subcategories.bug },
        { key: "support.partnership", label: messages.chatWidget.categories.support.subcategories.partnership },
        { key: "support.kyc", label: messages.chatWidget.categories.support.subcategories.kyc },
        { key: "support.other", label: messages.chatWidget.categories.support.subcategories.other },
      ],
    },
  ];

  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ChatWidgetTab>("home");
  const [helpStep, setHelpStep] = useState<ChatWidgetHelpStep>("categories");
  const [messagesStep, setMessagesStep] = useState<ChatWidgetMessagesStep>("list");
  const isInConversation =
    activeTab === "messages" && messagesStep === "conversation";
  const {
    currentConversation,
    conversationId,
    conversationListItems,
    setConversationId,
    startNewConversation,
    sendMessage,
    loadOlderMessages,
    hasOlderMessages,
    isLoadingOlderMessages,
    getListUnreadTotal,
    isLoading,
    isSending,
  } = useChat(isOpen, isInConversation, !user);

  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [inputPrefill, setInputPrefill] = useState<string | undefined>();
  const [isSendingBotMsg, setIsSendingBotMsg] = useState(false);
  const [isAskQuestionFlow, setIsAskQuestionFlow] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiTypingBaseCount, setAiTypingBaseCount] = useState(0);
  const [aiTypingQueuedHint, setAiTypingQueuedHint] = useState<string | undefined>();
  const [escalatingModerator, setEscalatingModerator] = useState(false);
  const [localClientRating, setLocalClientRating] = useState<number | null>(null);
  const [ratingFlowActive, setRatingFlowActive] = useState(false);
  const [ratingSubmittedThisSession, setRatingSubmittedThisSession] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wasOpenBeforeMobileMenuRef = useRef(false);
  const [isHiddenByMobileMenu, setIsHiddenByMobileMenu] = useState(false);
  const aiTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevScrollHeightRef = useRef(0);
  const sendInFlightRef = useRef(false);
  const lastSentRef = useRef<{ content: string; at: number } | null>(null);

  const resetWidgetNavigation = useCallback(() => {
    setActiveTab("home");
    setHelpStep("categories");
    setMessagesStep("list");
    setSelectedCategory(null);
    setInputPrefill(undefined);
    setIsSendingBotMsg(false);
    setIsAiTyping(false);
    setAiTypingBaseCount(0);
    setAiTypingQueuedHint(undefined);
    setEscalatingModerator(false);
    setLocalClientRating(null);
    setRatingFlowActive(false);
    setRatingSubmittedThisSession(false);
    if (aiTypingTimeoutRef.current) {
      clearTimeout(aiTypingTimeoutRef.current);
      aiTypingTimeoutRef.current = null;
    }
  }, []);

  const openPopup = useCallback(() => {
    if (popupCloseTimerRef.current) {
      clearTimeout(popupCloseTimerRef.current);
      popupCloseTimerRef.current = null;
    }
    setPopupMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    resetWidgetNavigation();
    popupCloseTimerRef.current = setTimeout(() => {
      setPopupMounted(false);
      popupCloseTimerRef.current = null;
    }, CHAT_WIDGET_POPUP_CLOSE_MS);
  }, [resetWidgetNavigation]);


  const recentConversation = conversationListItems[0] ?? null;
  const totalListUnread = isInConversation ? 0 : getListUnreadTotal();

  const effectiveIsAiTyping =
    isAiTyping &&
    !shouldClearAiTypingIndicator({
      isAiTyping,
      messages: currentConversation?.messages ?? [],
      baseMessageCount: aiTypingBaseCount,
    });

  const showAiTyping = shouldShowWidgetAiTyping({
    isAiTyping: effectiveIsAiTyping,
    isSending,
  });

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  const goToConversation = useCallback(() => {
    setActiveTab("messages");
    setMessagesStep("conversation");
  }, []);

  const handleAskQuestion = useCallback(() => {
    startNewConversation();
    setIsAskQuestionFlow(true);
    setActiveTab("messages");
    setMessagesStep("conversation");
  }, [startNewConversation]);

  useEffect(() => {
    setLocalClientRating(null);
    setRatingFlowActive(false);
    setRatingSubmittedThisSession(false);
  }, [conversationId]);

  useEffect(() => {
    if (isInConversation) {
      setTimeout(scrollToBottom, 50);
    }
  }, [currentConversation?.messages, isInConversation, scrollToBottom, localClientRating]);

  const handleToggleChat = () => {
    openPopup();
  };

  useEffect(() => {
    return () => {
      if (popupCloseTimerRef.current) {
        clearTimeout(popupCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOpenSupport = (e: Event) => {
      const detail = (e as CustomEvent<{ prefillMessage?: string }>).detail;
      startNewConversation();
      setIsAskQuestionFlow(true);
      openPopup();
      setActiveTab("messages");
      setMessagesStep("conversation");
      if (detail?.prefillMessage) {
        setInputPrefill(detail.prefillMessage);
      }
    };
    window.addEventListener("open-support-chat", handleOpenSupport);
    return () => window.removeEventListener("open-support-chat", handleOpenSupport);
  }, [openPopup, startNewConversation]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("chat-widget-open-change", { detail: { open: isOpen } })
    );
  }, [isOpen]);

  useEffect(() => {
    setChatWidgetBodyScrollLock(isOpen);
    return () => setChatWidgetBodyScrollLock(false);
  }, [isOpen]);

  useEffect(() => {
    const handleMobileMenuChange = (e: Event) => {
      const { open } = (e as CustomEvent<{ open: boolean }>).detail;
      if (open) {
        setIsOpen((current) => {
          wasOpenBeforeMobileMenuRef.current = current;
          return false;
        });
        setIsHiddenByMobileMenu(true);
      } else {
        setIsHiddenByMobileMenu(false);
        if (wasOpenBeforeMobileMenuRef.current) {
          wasOpenBeforeMobileMenuRef.current = false;
          setPopupMounted(true);
          setIsOpen(true);
        }
      }
    };
    window.addEventListener("mobile-menu-open-change", handleMobileMenuChange);
    return () =>
      window.removeEventListener("mobile-menu-open-change", handleMobileMenuChange);
  }, []);

  const handleBack = () => {
    if (activeTab === "help" && helpStep === "subcategories") {
      setHelpStep("categories");
      setSelectedCategory(null);
      return;
    }
    if (activeTab === "messages" && messagesStep === "conversation") {
      setMessagesStep("list");
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setHelpStep("subcategories");
    setActiveTab("help");
  };

  const handleOpenHelpTab = () => {
    setSelectedCategory(null);
    setHelpStep("categories");
    setActiveTab("help");
  };

  const handleSubcategorySelect = async (subcategory: Subcategory) => {
    setIsSendingBotMsg(true);
    try {
      const categoryKey = selectedCategory?.key;
      const result = await sendMessage(subcategory.label, {
        category: categoryKey,
        forceNew: true,
        skipAi: true,
      });
      const convId = result.conversationId ?? conversationId;

      if (convId) {
        setConversationId(convId);
        setActiveTab("messages");
        setMessagesStep("conversation");

        const botRes = await fetch(`/api/chat/conversations/${convId}/bot-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subcategoryKey: subcategory.key }),
        });
        if (!botRes.ok) {
          throw new Error("bot-message failed");
        }
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversationMessages(convId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      } else {
        setActiveTab("messages");
        setMessagesStep("conversation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingBotMsg(false);
    }
  };

  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 64 && hasOlderMessages && !isLoadingOlderMessages) {
      prevScrollHeightRef.current = el.scrollHeight;
      void loadOlderMessages().then(() => {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const diff =
              messagesContainerRef.current.scrollHeight - prevScrollHeightRef.current;
            messagesContainerRef.current.scrollTop = diff;
          }
        });
      });
    }
  };

  const handleSelectHistoryItem = (id: string) => {
    setConversationId(id);
    setMessagesStep("conversation");
  };

  const handleNewConversation = () => {
    startNewConversation();
    setSelectedCategory(null);
    setHelpStep("categories");
    setActiveTab("help");
    setMessagesStep("list");
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading || sendInFlightRef.current) return;

    const normalized = content.trim();
    if (!normalized) return;

    const now = Date.now();
    const last = lastSentRef.current;
    if (
      last &&
      last.content === normalized &&
      now - last.at < SEND_DEDUPE_MS
    ) {
      return;
    }

    sendInFlightRef.current = true;
    lastSentRef.current = { content: normalized, at: now };

    const baseCount = currentConversation?.messages.length ?? 0;
    const askFlow = isAskQuestionFlow;
    try {
      const data = await sendMessage(
        normalized,
        askFlow ? { category: "support", forceNew: true } : undefined,
      );
      setInputPrefill(undefined);
      if (askFlow) {
        setIsAskQuestionFlow(false);
      }
      if (data.createdNewConversation && data.reopenedFromTerminal) {
        toast({
          title: messages.chatWidget.newConversationFromClosed,
        });
      } else if (data.createdNewConversation && data.reopenedWhileAwaitingPrevious) {
        toast({
          title: messages.chatWidget.newConversationAwaitingPrevious,
        });
      }
      if (data.aiQueueHint != null) {
        setAiTypingBaseCount(baseCount);
        setAiTypingQueuedHint(
          data.aiQueueHint.waiting ? messages.chatWidget.aiTypingQueued : undefined,
        );
        setIsAiTyping(true);
        if (aiTypingTimeoutRef.current) clearTimeout(aiTypingTimeoutRef.current);
        aiTypingTimeoutRef.current = setTimeout(() => {
          setIsAiTyping(false);
          setAiTypingQueuedHint(undefined);
        }, 90_000);
      }
      setTimeout(scrollToBottom, 100);
    } catch {
      lastSentRef.current = null;
      setIsAiTyping(false);
      setAiTypingQueuedHint(undefined);
    } finally {
      sendInFlightRef.current = false;
    }
  }, [
    isLoading,
    currentConversation?.messages.length,
    sendMessage,
    scrollToBottom,
    messages.chatWidget.aiTypingQueued,
    messages.chatWidget.newConversationFromClosed,
    messages.chatWidget.newConversationAwaitingPrevious,
    toast,
    isAskQuestionFlow,
  ]);

  const handleContactModerator = useCallback(async () => {
    if (!conversationId || escalatingModerator) return;
    setEscalatingModerator(true);
    setIsAiTyping(false);
    setAiTypingQueuedHint(undefined);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/escalate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("escalate failed");
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationMessages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
      toast({
        title: messages.chatWidget.escalateError,
        variant: "destructive",
      });
    } finally {
      setEscalatingModerator(false);
    }
  }, [
    conversationId,
    escalatingModerator,
    queryClient,
    scrollToBottom,
    toast,
    messages.chatWidget.escalateError,
  ]);

  const resolveContent = useCallback(
    (content: string) => resolveI18nContent(content, messages),
    [messages],
  );

  const relativeTimeLabels = useMemo(
    () => ({
      now: messages.chatWidget.relativeTime.now,
      minutes: (n: number) => messages.chatWidget.relativeTime.minutes.replace("{n}", String(n)),
      hours: (n: number) => messages.chatWidget.relativeTime.hours.replace("{n}", String(n)),
      days: (n: number) => messages.chatWidget.relativeTime.days.replace("{n}", String(n)),
    }),
    [messages],
  );

  const dateLocale = localeToBcp47(locale);

  const supportStaff = useMemo(
    () => getChatWidgetSupportStaff(messages.about.team.members),
    [messages.about.team.members],
  );

  useEffect(() => {
    if (!effectiveIsAiTyping && isAiTyping) {
      setIsAiTyping(false);
      setAiTypingQueuedHint(undefined);
      if (aiTypingTimeoutRef.current) {
        clearTimeout(aiTypingTimeoutRef.current);
        aiTypingTimeoutRef.current = null;
      }
    }
  }, [effectiveIsAiTyping, isAiTyping]);

  const unreadCount = isInConversation ? 0 : getListUnreadTotal();

  if (isHiddenByMobileMenu) {
    return null;
  }

  const showBack = shouldShowBackButton({ tab: activeTab, helpStep, messagesStep });

  const conversationAgentName =
    currentConversation?.assignedModerator?.steamUsername ??
    currentConversation?.assignedModerator?.name ??
    messages.chatWidget.support;
  const conversationAgentAvatar =
    resolveStaffAvatarSrc(currentConversation?.assignedModerator) ?? SUPPORT_AVATAR_SRC;
  const lastStaffMessage = [...(currentConversation?.messages ?? [])]
    .reverse()
    .find((m) => ['MODERATOR', 'BOT', 'AI'].includes(m.senderType));
  const agentActivityLabel = lastStaffMessage
    ? messages.chatWidget.activeRecently.replace(
        '{time}',
        formatRelativeTime(lastStaffMessage.createdAt, relativeTimeLabels, dateLocale),
      )
    : messages.chatWidget.online;

  const renderHomeTab = () => (
    <div className={chatWidgetHomeBodyClass()}>
      {recentConversation ? (
        <div className={chatWidgetHomeCardClass()}>
          <p className={chatWidgetHomeCardSectionTitleClass()}>
            {messages.chatWidget.home.recentMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              setConversationId(recentConversation.id);
              goToConversation();
            }}
            className={chatWidgetHomeCardInnerButtonClass()}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage
                  src={
                    resolveStaffAvatarSrc(recentConversation.assignedModerator) ??
                    SUPPORT_AVATAR_SRC
                  }
                />
                <AvatarFallback className="text-xs">
                  <UserCircleIcon className="h-4 w-4" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">
                    {recentConversation.assignedModerator?.steamUsername ??
                      recentConversation.assignedModerator?.name ??
                      messages.chatWidget.support}
                  </p>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                    {formatRelativeTime(recentConversation.lastMessageAt, relativeTimeLabels, dateLocale)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isTerminalConversationStatus(recentConversation.status)
                    ? messages.chatWidget.rateConversation
                    : recentConversation.title}
                </p>
              </div>
            </div>
          </button>
        </div>
      ) : null}

      <div className={chatWidgetHomeCardClass()}>
        <button
          type="button"
          onClick={handleOpenHelpTab}
          className={`${chatWidgetHomeSearchHeaderClass()} w-full`}
          data-testid="chat-search-help"
        >
          <p className="text-sm font-semibold">{messages.chatWidget.home.searchHelp}</p>
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>
        <div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={chatWidgetHomeHelpLinkClass()}
            >
              <span>{cat.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAskQuestion}
        className={chatWidgetHomeCardClass()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{messages.chatWidget.home.askQuestion}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {messages.chatWidget.home.askQuestionDesc}
            </p>
          </div>
          <ChatWidgetStaffAvatars members={supportStaff} size="md" borderClass="border-white dark:border-card" />
        </div>
      </button>
    </div>
  );

  const renderHomeHeader = () => (
    <div className={chatWidgetHomeHeaderClass()} data-testid="chat-home-header">
      <div
        className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden"
        aria-hidden
      >
        <Image
          src="/images/logo.webp"
          alt=""
          width={220}
          height={220}
          className="opacity-[0.08] translate-y-6 scale-125 select-none"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 chat-widget-home-header-fade"
        aria-hidden
      />

      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/images/logo.webp"
            alt="MoonSkin"
            width={28}
            height={28}
            className="rounded-md shrink-0"
          />
          <span className="text-sm font-bold tracking-wide truncate">MoonSkin</span>
        </div>
        <ChatWidgetStaffAvatars members={supportStaff} borderClass="border-neutral-950" />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closePopup}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
            aria-label={messages.ui.close}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-2xl font-bold leading-tight">
          {messages.chatWidget.greeting}
          {user ? ` ${user.username}` : ""} 👋
        </p>
        <p className="text-sm text-white/75 mt-1">{messages.chatWidget.home.subtitle}</p>
      </div>
    </div>
  );

  const renderPanelHeader = ({
    title,
    subtitle,
    testId,
    trailingAction,
  }: {
    title: string;
    subtitle?: string;
    testId?: string;
    trailingAction?: React.ReactNode;
  }) => (
    <div className={chatWidgetPanelHeaderClass()} data-testid={testId}>
      <div
        className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden"
        aria-hidden
      >
        <Image
          src="/images/logo.webp"
          alt=""
          width={180}
          height={180}
          className="opacity-[0.06] translate-y-4 scale-125 select-none"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 chat-widget-home-header-fade"
        aria-hidden
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="mb-2 p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label={messages.chatWidget.tabs.messages}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          )}
          <h2 className={chatWidgetPanelHeaderTitleClass()}>{title}</h2>
          {subtitle ? (
            <p className={chatWidgetPanelHeaderSubtitleClass()}>{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {trailingAction}
          <button
            type="button"
            onClick={closePopup}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
            aria-label={messages.ui.close}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpHeader = () => {
    if (helpStep === "subcategories" && selectedCategory) {
      return renderPanelHeader({
        title: selectedCategory.label,
        subtitle: messages.chatWidget.problemQuestion,
        testId: "chat-help-header",
      });
    }
    return renderPanelHeader({
      title: messages.chatWidget.tabs.help,
      subtitle: `${messages.chatWidget.greeting}${user ? ` ${user.username}` : ""}${messages.chatWidget.greetingSuffix}`,
      testId: "chat-help-header",
    });
  };

  const renderMessagesHeader = () =>
    renderPanelHeader({
      title: messages.chatWidget.historyTitle,
      testId: "chat-messages-header",
      trailingAction: (
        <button
          type="button"
          data-testid="chat-new-conversation"
          onClick={handleNewConversation}
          className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-white/25 text-xs font-medium text-white hover:bg-white/10 transition-colors"
          aria-label={messages.chatWidget.newConversation}
        >
          <PlusIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">{messages.chatWidget.newConversation}</span>
        </button>
      ),
    });

  const renderHelpTab = () => {
    if (helpStep === "subcategories" && selectedCategory) {
      return (
        <div className={chatWidgetHomeBodyClass()}>
          <div className={chatWidgetHomeCardClass()}>
            {selectedCategory.subcategories.map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => handleSubcategorySelect(sub)}
                disabled={isSendingBotMsg}
                className={chatWidgetHelpSubcategoryRowClass(isSendingBotMsg)}
              >
                <span className="text-sm font-medium">{sub.label}</span>
                {isSendingBotMsg ? (
                  <div className="h-4 w-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-theme-accent transition-colors shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={chatWidgetHomeBodyClass()}>
        <div className={chatWidgetHomeCardClass()}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={chatWidgetHelpCategoryRowClass()}
            >
              <div className="flex items-center gap-3 min-w-0">
                <cat.icon className={chatWidgetHelpCategoryIconClass()} aria-hidden />
                <div className="min-w-0 text-left">
                  <p className="font-semibold text-sm">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-theme-accent transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoryItem = (item: (typeof conversationListItems)[number], solved = false) => (
    <button
      key={item.id}
      type="button"
      onClick={() => handleSelectHistoryItem(item.id)}
      className={chatWidgetHistoryItemClass({
        solved,
        isSelected: !solved && item.id === conversationId,
      })}
    >
      <div className="flex items-start gap-3">
        <Avatar className={`h-9 w-9 shrink-0 ${solved ? "opacity-70 group-hover:opacity-90 transition-opacity duration-200" : ""}`}>
          <AvatarImage src={SUPPORT_AVATAR_SRC} />
          <AvatarFallback className="text-xs">
            <CpuChipIcon className="h-4 w-4" aria-hidden />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={chatWidgetHistoryItemTitleClass(solved)}>{item.title}</p>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatRelativeTime(item.lastMessageAt, relativeTimeLabels, dateLocale)}
              </span>
              {!solved && item.unread > 0 && (
                <Badge className="h-5 min-w-5 px-1 text-[10px]">{item.unread}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );

  const activeConversationItems = conversationListItems.filter(
    (item) => !isTerminalConversationStatus(item.status),
  );
  const solvedConversationItems = conversationListItems.filter((item) =>
    isTerminalConversationStatus(item.status),
  );

  const renderMessagesList = () => (
    <div className={chatWidgetMessagesListBodyClass()} data-testid="chat-history-list">
      {conversationListItems.length === 0 ? (
        <div className={`${chatWidgetHomeCardClass()} flex flex-col items-center justify-center py-8 text-center`}>
          <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{messages.chatWidget.home.noConversations}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={handleAskQuestion}
          >
            {messages.chatWidget.home.startChat}
          </Button>
        </div>
      ) : (
        <>
          {activeConversationItems.length > 0 && (
            <div className={chatWidgetHistoryCardClass()}>
              {activeConversationItems.map((item) => renderHistoryItem(item))}
            </div>
          )}
          {solvedConversationItems.length > 0 && (
            <>
              <p className={chatWidgetHistorySectionTitleClass()}>
                {messages.chatWidget.solvedSectionTitle}
              </p>
              <div className={chatWidgetHistoryCardClass()}>
                {solvedConversationItems.map((item) => renderHistoryItem(item, true))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );

  const renderConversation = () => {
    const conversationClosed = isTerminalConversationStatus(currentConversation?.status ?? '');
    const effectiveClientRating =
      localClientRating ?? currentConversation?.clientRating ?? null;
    const showRatingPrompt =
      conversationClosed &&
      Boolean(conversationId) &&
      (effectiveClientRating == null || ratingFlowActive || ratingSubmittedThisSession);
    const assignedModerator = currentConversation?.assignedModerator;
    const agentDisplayName =
      assignedModerator?.steamUsername ??
      assignedModerator?.name ??
      messages.chatWidget.support;
    const agentAvatarUrl =
      resolveStaffAvatarSrc(assignedModerator) ?? SUPPORT_AVATAR_SRC;

    return (
    <>
      <ChatWidgetMessageList
        conversationId={conversationId}
        messages={currentConversation?.messages ?? []}
        viewerUserId={user?.id}
        welcomeMessage={messages.chatWidget.responses.welcomeMessage}
        moderatorLabel={messages.chatWidget.moderatorLabel}
        botLabel={messages.chatWidget.botLabel}
        aiLabel={messages.chatWidget.aiLabel}
        contactModeratorLabel={messages.chatWidget.contactModerator}
        escalatingModeratorLabel={messages.chatWidget.escalatingModerator}
        aiEnabled={currentConversation?.aiEnabled ?? true}
        escalatingModerator={escalatingModerator}
        onContactModerator={handleContactModerator}
        resolveContent={resolveContent}
        dateLocale={dateLocale}
        isLoadingOlderMessages={isLoadingOlderMessages}
        isLoading={isLoading}
        showAiTyping={showAiTyping}
        aiTypingQueuedHint={aiTypingQueuedHint}
        conversationStatus={currentConversation?.status}
        clientRating={effectiveClientRating}
        showRatingPrompt={showRatingPrompt}
        rateTitle={messages.chatWidget.rateConversation}
        rateRatedTitle={messages.chatWidget.rateRatedTitle}
        rateTellUsMore={messages.chatWidget.rateTellUsMore}
        rateSendFeedback={messages.chatWidget.rateSendFeedback}
        rateThankYou={messages.chatWidget.rateThankYou}
        onRatingFlowStart={() => setRatingFlowActive(true)}
        onRatingSaved={() => {
          if (conversationId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.conversationMessages(conversationId),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
          }
        }}
        onRated={(rating) => {
          setLocalClientRating(rating);
          setRatingFlowActive(false);
          setRatingSubmittedThisSession(true);
          if (conversationId) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.conversationMessages(conversationId),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
          }
        }}
        onRatingError={() => {
          toast({
            title: messages.chatWidget.rateError,
            variant: 'destructive',
          });
        }}
        agentAvatarUrl={agentAvatarUrl}
        onScroll={handleMessagesScroll}
        containerRef={messagesContainerRef}
      />
      {conversationClosed ? (
        <div className={chatWidgetConversationEndedClass()} data-testid="chat-conversation-ended">
          {messages.chatWidget.conversationEnded}
        </div>
      ) : (
        <ChatWidgetInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder={messages.chatWidget.placeholder}
          sendHint={messages.chatWidget.sendHint}
          prefillMessage={inputPrefill}
        />
      )}
    </>
    );
  };

  const renderTabBar = () => (
    <nav className={chatWidgetTabBarClass()} data-testid="chat-tab-bar">
      <button
        type="button"
        data-testid="chat-tab-home"
        onClick={() => {
          setActiveTab("home");
          setHelpStep("categories");
        }}
        className={chatWidgetTabButtonClass(activeTab === "home")}
        aria-label={messages.chatWidget.tabs.home}
      >
        <HomeIcon className={chatWidgetTabIconClass(activeTab === "home")} />
        <span className="text-[10px] leading-none truncate max-w-full">{messages.chatWidget.tabs.home}</span>
      </button>
      <button
        type="button"
        data-testid="chat-tab-help"
        onClick={() => {
          setActiveTab("help");
          setHelpStep("categories");
          setSelectedCategory(null);
        }}
        className={chatWidgetTabButtonClass(activeTab === "help")}
        aria-label={messages.chatWidget.tabs.help}
      >
        <QuestionMarkCircleIcon className={chatWidgetTabIconClass(activeTab === "help")} />
        <span className="text-[10px] leading-none truncate max-w-full">{messages.chatWidget.tabs.help}</span>
      </button>
      <button
        type="button"
        data-testid="chat-tab-messages"
        onClick={() => {
          setActiveTab("messages");
          setMessagesStep("list");
        }}
        className={chatWidgetTabButtonClass(activeTab === "messages")}
        aria-label={messages.chatWidget.tabs.messages}
      >
        <span className="relative inline-flex h-5 w-5 items-center justify-center shrink-0">
          <ChatBubbleBottomCenterTextIcon
            className={chatWidgetTabIconClass(activeTab === "messages")}
          />
          {totalListUnread > 0 && (
            <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
              {totalListUnread > 9 ? "9+" : totalListUnread}
            </span>
          )}
        </span>
        <span className="text-[10px] leading-none truncate max-w-full">{messages.chatWidget.tabs.messages}</span>
      </button>
    </nav>
  );

  const widgetUi = (
    <>
      {popupMounted && (
      <div
        data-chat-widget-root
        data-testid="chat-popup"
        className={chatWidgetPopupContainerClass(isOpen)}
      >
        {isInConversation ? (
          <div className={chatWidgetConversationHeaderClass()}>
            <div className="flex items-center gap-2 min-w-0">
              {showBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
                  aria-label={messages.chatWidget.tabs.messages}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
              )}
              <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                <AvatarImage src={conversationAgentAvatar} />
                <AvatarFallback className="text-xs">
                  <UserCircleIcon className="h-4 w-4" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{conversationAgentName}</h3>
                <p className="text-xs text-muted-foreground truncate">{agentActivityLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                aria-hidden
                tabIndex={-1}
              >
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={closePopup}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label={messages.ui.close}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : activeTab === "home" ? (
          renderHomeHeader()
        ) : activeTab === "help" ? (
          renderHelpHeader()
        ) : activeTab === "messages" && messagesStep === "list" ? (
          renderMessagesHeader()
        ) : null}

        <div className="flex-1 min-h-0 flex flex-col">
          {activeTab === "home" && renderHomeTab()}
          {activeTab === "help" && renderHelpTab()}
          {activeTab === "messages" && (
            messagesStep === "conversation" ? renderConversation() : renderMessagesList()
          )}
        </div>

        {renderTabBar()}
      </div>
      )}

      {!isOpen && (
        <div className="pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[99999] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]">
          <button
            type="button"
            data-testid="chat-fab"
            aria-label={messages.chatWidget.tooltip}
            onClick={handleToggleChat}
            className={chatWidgetFabButtonClass()}
          >
            {shouldShowWidgetUnreadBadge(unreadCount, isOpen) && (
              <Badge className={chatWidgetUnreadBadgeClass()}>
                {unreadCount}
              </Badge>
            )}
            <ChatWidgetSupportHeadsetIcon className="h-7 w-7 text-white" />
          </button>
        </div>
      )}
    </>
  );

  return widgetUi;
}
