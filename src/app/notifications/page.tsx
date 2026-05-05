"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  priority: string;
  titleFr: string;
  titleEn: string;
  messageFr: string;
  messageEn: string;
  titleCn?: string;
  messageCn?: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

const notificationIcons: Record<string, typeof BellIcon> = {
  TRADE_UPDATE: InformationCircleIcon,
  PAYOUT_UPDATE: CheckCircleIcon,
  KYC_UPDATE: ExclamationTriangleIcon,
  GIVEAWAY_WIN: CheckCircleIcon,
  MISSION_COMPLETED: CheckCircleIcon,
  LEVEL_UP: CheckCircleIcon,
  ADMIN_MESSAGE: BellIcon,
  SYSTEM_ANNOUNCEMENT: BellIcon,
  SECURITY_ALERT: ExclamationTriangleIcon,
};

const priorityColors: Record<string, string> = {
  LOW: "text-slate-400",
  NORMAL: "text-blue-400",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { locale, messages } = useLocale();
  const t = messages.notificationsPage;
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: [...queryKeys.userNotifications, { page: currentPage, unreadOnly: filter === "unread" }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        unreadOnly: (filter === "unread").toString(),
      });
      const response = await fetch(`/api/user/notifications?${params}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user,
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notificationsData?.unreadCount ?? 0;
  const total = notificationsData?.total ?? 0;
  const totalPages = notificationsData?.totalPages ?? 1;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userNotifications });
        toast.success(t.toastMarkedRead);
      } else {
        toast.error(t.toastError);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error(t.toastError);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PATCH",
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userNotifications });
        toast.success(t.toastAllMarkedRead);
      } else {
        toast.error(t.toastError);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error(t.toastError);
    }
  };

  const getNotificationContent = (notification: Notification) => {
    const title =
      locale === "fr"
        ? notification.titleFr
        : locale === "en"
          ? notification.titleEn
          : notification.titleCn ?? notification.titleEn;

    const message =
      locale === "fr"
        ? notification.messageFr
        : locale === "en"
          ? notification.messageEn
          : notification.messageCn ?? notification.messageEn;

    return { title, message };
  };

  const Icon = (type: string) => notificationIcons[type] ?? BellIcon;

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <BellIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{t.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">
              {t.loginDescription}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              {t.loginButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
                <BellIcon className="w-8 h-8 text-orange-500" />
                {t.title}
              </h1>
              <p className="text-muted-foreground">
                {unreadCount > 0
                  ? (unreadCount > 1 ? t.unreadCountPlural : t.unreadCount).replace("{count}", String(unreadCount))
                  : t.noUnread}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="hidden sm:flex"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {t.markAllRead}
              </Button>
            )}
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all">
                {t.tabAll} ({total})
              </TabsTrigger>
              <TabsTrigger value="unread">
                {t.tabUnread} ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-3">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BellIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t.noNotifications}
                    </h3>
                    <p className="text-muted-foreground">
                      {filter === "unread"
                        ? t.noUnreadNotifications
                        : t.noNotificationsYet}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {notifications.map((notification: Notification) => {
                    const { title, message } = getNotificationContent(notification);
                    const NotificationIcon = Icon(notification.type);

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          className={`${
                            !notification.read
                              ? "border-orange-500/50 bg-orange-500/5"
                              : "border-slate-700"
                          } hover:shadow-lg transition-all duration-200`}
                        >
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  !notification.read
                                    ? "bg-orange-500/20"
                                    : "bg-slate-700"
                                }`}
                              >
                                <NotificationIcon
                                  className={`w-5 h-5 ${
                                    priorityColors[notification.priority] ??
                                    "text-slate-400"
                                  }`}
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h3 className="font-semibold text-base sm:text-lg">
                                    {title}
                                  </h3>
                                  {!notification.read && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-orange-500/20 text-orange-500 border-orange-500/40 shrink-0"
                                    >
                                      {t.badgeNew}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-muted-foreground text-sm mb-3">
                                  {message}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    {format(
                                      new Date(notification.createdAt),
                                      "dd/MM/yyyy à HH:mm",
                                      { locale: locale === "fr" ? fr : enUS }
                                    )}
                                  </div>

                                  {notification.link && (
                                    <Link
                                      href={notification.link}
                                      className="text-orange-500 hover:text-orange-400 font-medium"
                                    >
                                      {t.viewDetails}
                                    </Link>
                                  )}

                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="text-xs h-7 px-2"
                                    >
                                      <CheckIcon className="w-3.5 h-3.5 mr-1" />
                                      {t.markAsRead}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t.previous}
                      </Button>
                      <span className="px-4 py-2 text-sm text-muted-foreground">
                        {t.pageOf.replace("{current}", String(currentPage)).replace("{total}", String(totalPages))}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        {t.next}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
