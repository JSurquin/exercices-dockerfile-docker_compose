"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo, type ComponentType, type SVGProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { resolveI18nContent } from "@/lib/resolve-i18n-content";
import { localeToBcp47 } from "@/lib/locale-date";
import {
  shouldShowBackButton,
  type ChatWidgetHelpStep,
  type ChatWidgetMessagesStep,
  type ChatWidgetTab,
} from "@/lib/chat-widget-config";
import { shouldClearAiTypingIndicator } from "@/lib/chat-logic";
import {
  CHAT_WIDGET_POPUP_CLOSE_MS,
  chatWidgetAiTypingBubbleClass,
  chatWidgetCategoryButtonClass,
  chatWidgetFabButtonClass,
  chatWidgetHeaderClass,
  chatWidgetHomeCardClass,
  chatWidgetInputAreaClass,
  chatWidgetMessageAlignment,
  chatWidgetMessageBubbleClass,
  chatWidgetPopupContainerClass,
  chatWidgetSendButtonClass,
  chatWidgetSenderLabelClass,
  chatWidgetSubcategoryButtonClass,
  chatWidgetTabBarClass,
  chatWidgetTabButtonClass,
  chatWidgetTextareaClass,
  chatWidgetTimestampClass,
  chatWidgetUnreadBadgeClass,
  chatWidgetMessageEnterClass,
  preserveChatLineBreaks,
  isWidgetMessageFromViewer,
  shouldShowWidgetAiTyping,
  shouldShowWidgetUnreadBadge,
  type WidgetSenderType,
} from "@/lib/chat-widget-styles";
import { useAuth } from "@/components/providers/auth-provider";
import { useChat } from "@/hooks/use-chat";
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
} from "@heroicons/react/24/outline";
import {
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
  CheckIcon,
} from "@heroicons/react/24/solid";

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

const CHAT_REMARK_PLUGINS = [remarkGfm];

const CHAT_MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => <p className="font-semibold text-sm mb-1">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="font-semibold text-sm mb-1">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="font-medium text-sm mb-0.5">{children}</p>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80">
      {children}
    </a>
  ),
  br: () => <br />,
};

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

const ChatWidgetInput = memo(function ChatWidgetInput({
  onSend,
  disabled,
  placeholder,
  sendHint,
  prefillMessage,
}: ChatWidgetInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefillMessage) {
      setMessage(prefillMessage);
      const el = textareaRef.current;
      if (el) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 100) + "px";
      }
    }
  }, [prefillMessage]);

  const resetTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "38px";
  }, []);

  const handleSend = async () => {
    if (!message.trim() || disabled) return;
    const content = message;
    setMessage("");
    resetTextareaHeight();
    await onSend(content);
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
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
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

interface ChatWidgetMessageListProps {
  conversationId: string | null;
  messages: WidgetMessage[];
  viewerUserId?: string;
  welcomeMessage: string;
  moderatorLabel: string;
  botLabel: string;
  aiLabel: string;
  resolveContent: (content: string) => string;
  dateLocale: string;
  isLoadingOlderMessages: boolean;
  isLoading: boolean;
  showAiTyping: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ChatWidgetMessageList = memo(function ChatWidgetMessageList({
  conversationId,
  messages,
  viewerUserId,
  welcomeMessage,
  moderatorLabel,
  botLabel,
  aiLabel,
  resolveContent,
  dateLocale,
  isLoadingOlderMessages,
  isLoading,
  showAiTyping,
  onScroll,
  containerRef,
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
      className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
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
        const isBot = msg.senderType === "BOT";
        const isAi = msg.senderType === "AI";
        const isModerator = msg.senderType === "MODERATOR";
        const bubbleSender: WidgetSenderType = isUser ? "USER" : (msg.senderType as WidgetSenderType);
        const isNewMessage = !seenMessageIdsRef.current.has(msg.id);
        if (isNewMessage) {
          seenMessageIdsRef.current.add(msg.id);
        }

        return (
          <div
            key={msg.id}
            className={`flex ${chatWidgetMessageAlignment(isUser)} ${chatWidgetMessageEnterClass(isNewMessage)}`}
          >
            <div className={chatWidgetMessageBubbleClass(bubbleSender)}>
              {isModerator && chatWidgetSenderLabelClass("MODERATOR") && (
                <div className="flex items-center gap-1 mb-1">
                  <span className={chatWidgetSenderLabelClass("MODERATOR")!}>
                    <UserCircleIcon className="h-3 w-3 shrink-0" aria-hidden />
                    {moderatorLabel}
                  </span>
                </div>
              )}
              {isBot && chatWidgetSenderLabelClass("BOT") && (
                <div className="flex items-center gap-1 mb-1">
                  <span className={chatWidgetSenderLabelClass("BOT")!}>
                    <CpuChipIcon className="h-3 w-3 shrink-0" aria-hidden />
                    {botLabel}
                  </span>
                </div>
              )}
              {isAi && chatWidgetSenderLabelClass("AI") && (
                <div className="flex items-center gap-1 mb-1">
                  <span className={chatWidgetSenderLabelClass("AI")!}>
                    <SparklesIcon className="h-3 w-3 shrink-0" aria-hidden />
                    {aiLabel}
                  </span>
                </div>
              )}
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {resolveContent(msg.content)}
                </p>
              ) : (
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={CHAT_REMARK_PLUGINS} components={CHAT_MARKDOWN_COMPONENTS}>
                    {preserveChatLineBreaks(resolveContent(msg.content))}
                  </ReactMarkdown>
                </div>
              )}
              <div
                className={`flex items-center justify-between mt-1 gap-2 ${chatWidgetTimestampClass(bubbleSender)}`}
              >
                <span className="text-[10px]">{formatMessageTime(msg.createdAt, dateLocale)}</span>
                {isUser && (
                  <div className="flex text-green-300">
                    <CheckIcon className="h-3 w-3" />
                    <CheckIcon className="h-3 w-3 -ml-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {isLoading && (
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
    getUnreadCount,
    isLoading,
  } = useChat(isOpen, isInConversation);

  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [inputPrefill, setInputPrefill] = useState<string | undefined>();
  const [isSendingBotMsg, setIsSendingBotMsg] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiTypingBaseCount, setAiTypingBaseCount] = useState(0);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wasOpenBeforeMobileMenuRef = useRef(false);
  const [isHiddenByMobileMenu, setIsHiddenByMobileMenu] = useState(false);
  const aiTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevScrollHeightRef = useRef(0);

  const resetWidgetNavigation = useCallback(() => {
    setActiveTab("home");
    setHelpStep("categories");
    setMessagesStep("list");
    setSelectedCategory(null);
    setInputPrefill(undefined);
    setIsSendingBotMsg(false);
    setIsAiTyping(false);
    setAiTypingBaseCount(0);
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
  const totalListUnread = conversationListItems.reduce(
    (acc, item) =>
      acc + (isInConversation && item.id === conversationId ? 0 : item.unread),
    0,
  );

  const effectiveIsAiTyping =
    isAiTyping &&
    !shouldClearAiTypingIndicator({
      isAiTyping,
      messages: currentConversation?.messages ?? [],
      baseMessageCount: aiTypingBaseCount,
    });

  const showAiTyping = shouldShowWidgetAiTyping({
    isAiTyping: effectiveIsAiTyping,
    isLoading,
    messageCount: currentConversation?.messages.length ?? 0,
    baseMessageCount: aiTypingBaseCount,
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

  useEffect(() => {
    if (isInConversation) {
      setTimeout(scrollToBottom, 50);
    }
  }, [currentConversation?.messages, isInConversation, scrollToBottom]);

  const handleToggleChat = () => {
    if (isOpen) {
      closePopup();
    } else {
      openPopup();
    }
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
      openPopup();
      setActiveTab("messages");
      setMessagesStep("conversation");
      if (detail?.prefillMessage) {
        setInputPrefill(detail.prefillMessage);
      }
    };
    window.addEventListener("open-support-chat", handleOpenSupport);
    return () => window.removeEventListener("open-support-chat", handleOpenSupport);
  }, [openPopup]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("chat-widget-open-change", { detail: { open: isOpen } })
    );
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

  const handleSubcategorySelect = async (subcategory: Subcategory) => {
    setIsSendingBotMsg(true);
    try {
      const categoryKey = selectedCategory?.key;
      const result = await sendMessage(subcategory.label, {
        category: categoryKey,
        forceNew: true,
      });
      const convId = result.conversationId ?? conversationId;

      if (convId) {
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
      }

      setActiveTab("messages");
      setMessagesStep("conversation");
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
    if (isLoading) return;
    const baseCount = currentConversation?.messages.length ?? 0;
    try {
      await sendMessage(content);
      setInputPrefill(undefined);
      setAiTypingBaseCount(baseCount);
      setIsAiTyping(true);
      if (aiTypingTimeoutRef.current) clearTimeout(aiTypingTimeoutRef.current);
      aiTypingTimeoutRef.current = setTimeout(() => setIsAiTyping(false), 90_000);
      setTimeout(scrollToBottom, 100);
    } catch {
      setIsAiTyping(false);
    }
  }, [isLoading, currentConversation?.messages.length, sendMessage, scrollToBottom]);

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

  useEffect(() => {
    if (!effectiveIsAiTyping && isAiTyping) {
      setIsAiTyping(false);
      if (aiTypingTimeoutRef.current) {
        clearTimeout(aiTypingTimeoutRef.current);
        aiTypingTimeoutRef.current = null;
      }
    }
  }, [effectiveIsAiTyping, isAiTyping]);

  const unreadCount = getUnreadCount();

  if (isHiddenByMobileMenu) {
    return null;
  }

  const showBack = shouldShowBackButton({ tab: activeTab, helpStep, messagesStep });

  const renderHomeTab = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div className="pb-1">
        <p className="text-lg font-semibold">
          {messages.chatWidget.greeting}{user ? ` ${user.username}` : ""} 👋
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {messages.chatWidget.home.subtitle}
        </p>
      </div>

      {recentConversation ? (
        <button
          type="button"
          onClick={() => {
            setConversationId(recentConversation.id);
            goToConversation();
          }}
          className={chatWidgetHomeCardClass()}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="/images/support-avatar.svg" />
              <AvatarFallback className="text-xs">
                <CpuChipIcon className="h-4 w-4" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate">{recentConversation.title}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatRelativeTime(recentConversation.lastMessageAt, relativeTimeLabels, dateLocale)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {messages.chatWidget.home.recentMessage}
              </p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </button>
      ) : null}

      <div className={chatWidgetHomeCardClass()}>
        <div className="flex items-center gap-2 mb-3">
          <MagnifyingGlassIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <p className="text-sm font-semibold">{messages.chatWidget.home.searchHelp}</p>
        </div>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className="w-full flex items-center justify-between py-2 px-1 rounded-lg hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5">
                <cat.icon className="h-4 w-4 text-theme-accent shrink-0" aria-hidden />
                <span className="text-sm">{cat.label}</span>
              </div>
              <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-theme-accent transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={goToConversation}
        className={chatWidgetHomeCardClass()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{messages.chatWidget.home.askQuestion}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {messages.chatWidget.home.askQuestionDesc}
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </button>
    </div>
  );

  const renderHelpTab = () => {
    if (helpStep === "subcategories" && selectedCategory) {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-sm text-muted-foreground pb-1 flex items-center gap-1.5">
            <selectedCategory.icon className="h-4 w-4 text-theme-accent shrink-0" aria-hidden />
            <span>
              <strong>{selectedCategory.label}</strong>, {messages.chatWidget.problemQuestion}
            </span>
          </p>
          {selectedCategory.subcategories.map((sub) => (
            <button
              key={sub.key}
              onClick={() => handleSubcategorySelect(sub)}
              disabled={isSendingBotMsg}
              className={chatWidgetSubcategoryButtonClass(isSendingBotMsg)}
            >
              <span className="text-sm font-medium">{sub.label}</span>
              {isSendingBotMsg ? (
                <div className="h-4 w-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-theme-accent transition-colors" />
              )}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-sm text-muted-foreground text-center pb-1">
          {messages.chatWidget.greeting}{user ? ` ${user.username}` : ""}{messages.chatWidget.greetingSuffix}
        </p>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategorySelect(cat)}
            className={chatWidgetCategoryButtonClass()}
          >
            <div className="flex items-center gap-3">
              <cat.icon className="h-6 w-6 text-theme-accent shrink-0" aria-hidden />
              <div>
                <p className="font-semibold text-sm">{cat.label}</p>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-theme-accent transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    );
  };

  const renderMessagesList = () => (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="p-3 border-b flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{messages.chatWidget.historyTitle}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="chat-new-conversation"
          className="h-8 gap-1"
          onClick={handleNewConversation}
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {messages.chatWidget.newConversation}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1" data-testid="chat-history-list">
        {conversationListItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <ChatBubbleBottomCenterTextIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{messages.chatWidget.home.noConversations}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={goToConversation}
            >
              {messages.chatWidget.home.startChat}
            </Button>
          </div>
        ) : (
          conversationListItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectHistoryItem(item.id)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors hover:bg-theme-accent/5 dark:hover:bg-theme-accent/10 ${
                item.id === conversationId ? "border-theme-accent/40 bg-theme-accent/5" : "bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                {item.unread > 0 && (
                  <Badge className="h-5 min-w-5 px-1 text-[10px]">{item.unread}</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(item.lastMessageAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderConversation = () => (
    <>
      <ChatWidgetMessageList
        conversationId={conversationId}
        messages={currentConversation?.messages ?? []}
        viewerUserId={user?.id}
        welcomeMessage={messages.chatWidget.responses.welcomeMessage}
        moderatorLabel={messages.chatWidget.moderatorLabel}
        botLabel={messages.chatWidget.botLabel}
        aiLabel={messages.chatWidget.aiLabel}
        resolveContent={resolveContent}
        dateLocale={dateLocale}
        isLoadingOlderMessages={isLoadingOlderMessages}
        isLoading={isLoading}
        showAiTyping={showAiTyping}
        onScroll={handleMessagesScroll}
        containerRef={messagesContainerRef}
      />
      <ChatWidgetInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={messages.chatWidget.placeholder}
        sendHint={messages.chatWidget.sendHint}
        prefillMessage={inputPrefill}
      />
    </>
  );

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
        <HomeIcon className={`h-5 w-5 shrink-0 ${activeTab === "home" ? "text-theme-accent" : ""}`} />
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
        <QuestionMarkCircleIcon className={`h-5 w-5 shrink-0 ${activeTab === "help" ? "text-theme-accent" : ""}`} />
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
            className={`h-5 w-5 ${activeTab === "messages" ? "text-theme-accent" : ""}`}
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

  return (
    <>
      {popupMounted && (
      <div
        data-testid="chat-popup"
        className={chatWidgetPopupContainerClass(isOpen)}
      >
        <div className={chatWidgetHeaderClass()}>
          <div className="flex items-center space-x-3">
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            )}
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarImage src="/images/support-avatar.svg" />
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  <CpuChipIcon className="h-4 w-4" aria-hidden />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{messages.chatWidget.support}</h3>
              <p className="text-xs text-white/80">
                {messages.chatWidget.online} · {messages.chatWidget.responseTime}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePopup}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

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
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[99999] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] sm:right-[max(1.5rem,env(safe-area-inset-right,0px))] pointer-events-auto">
          <div className="relative">
            {shouldShowWidgetUnreadBadge(unreadCount, isOpen) && (
              <Badge className={chatWidgetUnreadBadgeClass()}>
                {unreadCount}
              </Badge>
            )}

            <button
              type="button"
              data-testid="chat-fab"
              aria-label={messages.chatWidget.tooltip}
              onClick={handleToggleChat}
              className={chatWidgetFabButtonClass()}
            >
              <ChatBubbleBottomCenterTextIconSolid className="h-6 w-6 text-white" />
            </button>

            <div className="absolute inset-0 rounded-full bg-cta-gradient chat-pulse-ring opacity-20 pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
}
