"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { resolveI18nContent } from "@/lib/resolve-i18n-content";
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
} from "@heroicons/react/24/outline";
import {
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
  CheckIcon,
} from "@heroicons/react/24/solid";

/* ─────────────────────────────────────────────
 * Arbre de catégories / sous-catégories
 * ───────────────────────────────────────────── */

interface Subcategory {
  key: string;
  label: string;
  emoji: string;
}

interface Category {
  key: string;
  label: string;
  emoji: string;
  description: string;
  subcategories: Subcategory[];
}


/* ─────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────── */

type ChatStep = "categories" | "subcategories" | "conversation";

/* ─────────────────────────────────────────────
 * Composant principal
 * ───────────────────────────────────────────── */

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { messages } = useLocale();

  const CATEGORIES: Category[] = [
    {
      key: "trade",
      label: messages.chatWidget.categories.trade.label,
      emoji: "🔄",
      description: messages.chatWidget.categories.trade.description,
      subcategories: [
        { key: "trade.pending", label: messages.chatWidget.categories.trade.subcategories.pending, emoji: "⏳" },
        { key: "trade.blocked", label: messages.chatWidget.categories.trade.subcategories.blocked, emoji: "🚫" },
        { key: "trade.item_missing", label: messages.chatWidget.categories.trade.subcategories.itemMissing, emoji: "📦" },
        { key: "trade.lock", label: messages.chatWidget.categories.trade.subcategories.lock, emoji: "🔒" },
        { key: "trade.bot_issue", label: messages.chatWidget.categories.trade.subcategories.botIssue, emoji: "🤖" },
      ],
    },
    {
      key: "payment",
      label: messages.chatWidget.categories.payment.label,
      emoji: "💰",
      description: messages.chatWidget.categories.payment.description,
      subcategories: [
        { key: "payment.card", label: messages.chatWidget.categories.payment.subcategories.card, emoji: "💳" },
        { key: "payment.sepa_fr", label: messages.chatWidget.categories.payment.subcategories.sepaFr, emoji: "🏦" },
        { key: "payment.sepa_eu", label: messages.chatWidget.categories.payment.subcategories.sepaEu, emoji: "🌍" },
        { key: "payment.crypto", label: messages.chatWidget.categories.payment.subcategories.crypto, emoji: "🪙" },
        { key: "delay.card", label: messages.chatWidget.categories.payment.subcategories.delayCard, emoji: "⏱️" },
        { key: "delay.sepa_fr", label: messages.chatWidget.categories.payment.subcategories.delaySepaFr, emoji: "⏱️" },
        { key: "delay.sepa_eu", label: messages.chatWidget.categories.payment.subcategories.delaySepaEu, emoji: "⏱️" },
        { key: "delay.crypto", label: messages.chatWidget.categories.payment.subcategories.delayCrypto, emoji: "⏱️" },
      ],
    },
    {
      key: "support",
      label: messages.chatWidget.categories.support.label,
      emoji: "🛠️",
      description: messages.chatWidget.categories.support.description,
      subcategories: [
        { key: "support.bug", label: messages.chatWidget.categories.support.subcategories.bug, emoji: "🐛" },
        { key: "support.partnership", label: messages.chatWidget.categories.support.subcategories.partnership, emoji: "🤝" },
        { key: "support.kyc", label: messages.chatWidget.categories.support.subcategories.kyc, emoji: "🪪" },
        { key: "support.other", label: messages.chatWidget.categories.support.subcategories.other, emoji: "💬" },
      ],
    },
  ];
  const { user } = useAuth();
  const {
    currentConversation,
    conversationId,
    sendMessage,
    getUnreadCount,
    isLoading,
  } = useChat(isOpen);

  const queryClient = useQueryClient();
  const [chatStep, setChatStep] = useState<ChatStep>("categories");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [isSendingBotMsg, setIsSendingBotMsg] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Si une conversation existe déjà, aller directement au chat
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      setChatStep("conversation");
    }
  }, [currentConversation]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (chatStep === "conversation") {
      setTimeout(scrollToBottom, 50);
    }
  }, [currentConversation?.messages, chatStep, scrollToBottom]);

  const handleToggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsAnimating(true);
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  useEffect(() => {
    const handleOpenSupport = (e: Event) => {
      const detail = (e as CustomEvent<{ prefillMessage?: string }>).detail;
      setIsOpen(true);
      if (detail?.prefillMessage) {
        setMessage(detail.prefillMessage);
        setChatStep("conversation");
      }
    };
    window.addEventListener("open-support-chat", handleOpenSupport);
    return () => window.removeEventListener("open-support-chat", handleOpenSupport);
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setChatStep("subcategories");
  };

  const handleSubcategorySelect = async (subcategory: Subcategory) => {
    setIsSendingBotMsg(true);
    try {
      let convId = conversationId;

      if (!convId) {
        // Créer la conversation avec la sélection comme message initial
        const result = await sendMessage(subcategory.label) as any;
        // sendMessage retourne la conversation quand elle est créée
        convId = result?.id ?? localStorage.getItem("guest_conversation_id");
      }

      // Envoyer le message bot de la sous-catégorie
      if (convId) {
        await fetch(`/api/chat/conversations/${convId}/bot-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subcategoryKey: subcategory.key }),
        });
        // Forcer le rechargement de la conversation pour afficher le message bot
        queryClient.invalidateQueries({ queryKey: queryKeys.conversation(convId) });
      }

      setChatStep("conversation");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingBotMsg(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    const content = message;
    setMessage("");
    await sendMessage(content);
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const resolveContent = (content: string) =>
    resolveI18nContent(content, messages);

  const unreadCount = getUnreadCount();

  return (
    <>
      {/* ── Popup chat ── */}
      <div
        className={`
          fixed bottom-24 right-3 left-3
          sm:left-auto sm:right-6 sm:w-[390px]
          chat-glass rounded-2xl shadow-2xl z-[9999]
          flex flex-col overflow-hidden
          transition-all duration-300 ease-out
          pointer-events-auto
          ${isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }
        `}
        style={{ height: isOpen ? "clamp(480px, 75dvh, 640px)" : 0 }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            {(chatStep === "subcategories" || (chatStep === "conversation" && !currentConversation?.messages?.length)) && (
              <button
                onClick={() => {
                  if (chatStep === "subcategories") setChatStep("categories");
                  else { setChatStep("categories"); setSelectedCategory(null); }
                }}
                className="p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            )}
            <div className="relative">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarImage src="/images/support-avatar.svg" />
                <AvatarFallback className="bg-white/20 text-white text-sm">
                  🤖
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{messages.chatWidget.support}</h3>
              <p className="text-xs text-white/80">{messages.chatWidget.online} · {messages.chatWidget.responseTime}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Corps — prend tout l'espace restant ── */}
        <div className="flex-1 min-h-0 flex flex-col">

          {/* ── Étape 1 : Catégories ── */}
          {chatStep === "categories" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center pb-1">
                {messages.chatWidget.greeting}{user ? ` ${user.username}` : ""}{messages.chatWidget.greetingSuffix}
              </p>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategorySelect(cat)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition-all duration-150 group text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* ── Étape 2 : Sous-catégories ── */}
          {chatStep === "subcategories" && selectedCategory && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="text-sm text-muted-foreground pb-1">
                {selectedCategory.emoji} <strong>{selectedCategory.label}</strong> — {messages.chatWidget.problemQuestion}
              </p>
              {selectedCategory.subcategories.map((sub) => (
                <button
                  key={sub.key}
                  onClick={() => handleSubcategorySelect(sub)}
                  disabled={isSendingBotMsg}
                  className="w-full flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300 transition-all duration-150 group text-left disabled:opacity-60"
                >
                  <span className="text-sm font-medium">{sub.label}</span>
                  {isSendingBotMsg ? (
                    <div className="h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ── Étape 3 : Conversation ── */}
          {chatStep === "conversation" && (
            <>
              {/* Zone messages — scrollable, ne pousse jamais l'input */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
              >
                {/* Message de bienvenue si pas encore de conversation */}
                {!currentConversation && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted border text-sm">
                      {messages.chatWidget.responses.welcomeMessage}
                    </div>
                  </div>
                )}

                {currentConversation?.messages.map((msg) => {
                  const isUser =
                    msg.senderType === "USER" && msg.userId === user?.id;
                  const isBot = msg.senderType === "BOT";
                  const isModerator = msg.senderType === "MODERATOR";
                  const isSystem = msg.senderType === "SYSTEM";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-0 slide-in-from-bottom-1 duration-200`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          isUser
                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-sm"
                            : isModerator
                            ? "bg-blue-500 text-white rounded-tl-sm"
                            : isSystem
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-tl-sm text-xs"
                            : "bg-muted border rounded-tl-sm"
                        }`}
                      >
                        {isModerator && (
                          <p className="text-[10px] text-white/80 font-medium mb-0.5">👨‍💼 {messages.chatWidget.moderatorLabel}</p>
                        )}
                        {isBot && (
                          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">🤖 {messages.chatWidget.botLabel}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {resolveContent(msg.content)}
                        </p>
                        <div
                          className={`flex items-center justify-between mt-1 gap-2 ${
                            isUser ? "text-white/70" : isSystem ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
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
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Zone saisie — toujours visible, jamais poussée ── */}
              <div className="flex-shrink-0 border-t bg-background px-3 py-2.5">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={messages.chatWidget.placeholder}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 resize-none rounded-xl border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 transition-all min-h-[38px] max-h-[100px] leading-relaxed"
                    style={{ height: "38px" }}
                  />
                  <Button
                    size="icon"
                    className="h-[38px] w-[38px] flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center select-none">
                  {messages.chatWidget.sendHint}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bouton flottant ── */}
      <div className="fixed bottom-6 right-6 z-[99999] pointer-events-auto">
        <div className="relative">
          {unreadCount > 0 && !isOpen && (
            <Badge className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-500 text-white text-xs flex items-center justify-center animate-pulse z-10">
              {unreadCount}
            </Badge>
          )}

          <button
            onClick={handleToggleChat}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 border-0 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <div
              className={`transition-all duration-200 ${isOpen ? "rotate-0" : "rotate-0"}`}
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6 text-white" />
              ) : (
                <ChatBubbleBottomCenterTextIconSolid className="h-6 w-6 text-white" />
              )}
            </div>
          </button>

          {!isOpen && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 chat-pulse-ring opacity-20 pointer-events-none" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 animate-pulse opacity-10 pointer-events-none" />
            </>
          )}
        </div>
      </div>
    </>
  );
}
