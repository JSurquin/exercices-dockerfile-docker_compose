"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useChat } from "@/hooks/use-chat";
import { SenderType } from "@prisma/client";
import {
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import {
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextIconSolid,
  CheckIcon,
} from "@heroicons/react/24/solid";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages } = useLocale();
  const { user } = useAuth();
  const { 
    currentConversation, 
    sendMessage, 
    getUnreadCount, 
    isLoading
  } = useChat();
  
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    // Les conversations sont automatiquement mises à jour par React Query (polling toutes les 5s)
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const quickActions: QuickAction[] = [
    {
      icon: ChatBubbleBottomCenterTextIcon,
      label: messages.chatWidget.tradeProblem,
      onClick: () => handleQuickMessage(messages.chatWidget.quickMessages.tradeProblem),
    },
    {
      icon: PhoneIcon,
      label: messages.chatWidget.urgentSupport,
      onClick: () => handleQuickMessage(messages.chatWidget.quickMessages.urgentHelp),
    },
    {
      icon: CheckIcon,
      label: messages.chatWidget.kycStatus,
      onClick: () => handleQuickMessage(messages.chatWidget.quickMessages.kycStatusCheck),
    },
  ];

  const handleQuickMessage = async (quickMessage: string) => {
    await sendMessage(quickMessage);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const messageContent = message;
    setMessage("");
    await sendMessage(messageContent);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  return (
    <>
      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 md:w-[380px] md:h-[600px] chat-glass rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarImage src="/images/support-avatar.svg" />
                  <AvatarFallback className="bg-white/20 text-white text-sm">
                    🤖
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{messages.chatWidget.support}</h3>
                <p className="text-xs text-white/80">
                  {messages.chatWidget.online} • {messages.chatWidget.responseTime}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <VideoCameraIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-muted/30 border-b">
            <p className="text-xs text-muted-foreground mb-3">{messages.chatWidget.quickActions}</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-background hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"
                  onClick={action.onClick}
                >
                  <action.icon className="h-3 w-3 mr-1.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Message de bienvenue si pas de conversation */}
              {!currentConversation && (
                <div className="flex justify-start message-slide-in">
                  <div className="max-w-[280px] rounded-2xl px-4 py-2 bg-muted border">
                    <p className="text-sm">{messages.chatWidget.responses.welcomeMessage}</p>
                    <div className="flex items-center justify-between mt-1 gap-2 text-muted-foreground">
                      <span className="text-xs">{formatTime(new Date())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages de la conversation */}
              {currentConversation?.messages.map((msg) => {
                const isUserMessage = msg.senderType === 'USER' && msg.userId === user?.id;
                const isBotOrModerator = msg.senderType === 'BOT' || msg.senderType === 'MODERATOR' || msg.senderType === 'SYSTEM';
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUserMessage ? "justify-end" : "justify-start"} message-slide-in`}
                  >
                    <div
                      className={`max-w-[280px] rounded-2xl px-4 py-2 ${
                        isUserMessage
                          ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                          : isBotOrModerator
                          ? msg.senderType === 'MODERATOR'
                            ? "bg-blue-100 border border-blue-200 text-blue-900"
                            : "bg-muted border"
                          : "bg-muted border"
                      }`}
                    >
                      {/* Indicateur du type d'expéditeur pour les messages non-utilisateur */}
                      {!isUserMessage && msg.senderType === 'MODERATOR' && (
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          👨‍💼 Modérateur
                        </div>
                      )}
                      {!isUserMessage && msg.senderType === 'SYSTEM' && (
                        <div className="text-xs text-gray-600 font-medium mb-1">
                          ⚙️ Système
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`flex items-center justify-between mt-1 gap-2 ${
                          isUserMessage ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-xs">{formatTime(new Date(msg.createdAt))}</span>
                        {isUserMessage && (
                          <div className="flex items-center">
                            <div className="flex text-green-300">
                              <CheckIcon className="h-3 w-3" />
                              <CheckIcon className="h-3 w-3 -ml-1" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Indicateur de chargement */}
              {isLoading && (
                <div className="flex justify-center">
                  <div className="bg-muted border rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-end space-x-2">
              <div className="flex-1 min-h-[40px] max-h-[120px] relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={messages.chatWidget.placeholder}
                  className="pr-20 resize-none"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <FaceSmileIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <PaperClipIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                size="icon"
                className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
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
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {messages.chatWidget.poweredBy} • {messages.chatWidget.responseTimeInfo}
            </p>
          </div>
        </div>
      )}

      {/* Chat Badge */}
      <div className="fixed bottom-6 right-6 !z-[99999] pointer-events-auto">
        <div className="relative">
          {/* Unread Badge */}
          {getUnreadCount() > 0 && !isOpen && (
            <Badge className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
              {getUnreadCount()}
            </Badge>
          )}
          
          {/* Main Chat Button */}
          <button
            className="h-14 w-14 rounded-full bg-orange-500 border-4 shadow-lg transition-all duration-200 group flex items-center justify-center cursor-pointer relative"
            onClick={handleToggleChat}
            onMouseDown={() => console.log("🔥 MOUSE DOWN!")}
            onMouseUp={() => console.log("🔥 MOUSE UP!")}
            onMouseEnter={() => console.log("🔥 MOUSE ENTER!")}
            style={{ zIndex: 99999 }}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            ) : (
              <ChatBubbleBottomCenterTextIconSolid className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Floating Tooltip */}
          {!isOpen && (
            <div className="absolute bottom-16 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                {messages.chatWidget.tooltip}
                <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          )}

          {/* Pulse Animation */}
          {!isOpen && (
            <>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 chat-pulse-ring opacity-20"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 animate-pulse opacity-10"></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
