"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Bell,
  Send,
  Users,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  BarChart3,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

interface Notification {
  id: string;
  userId: string;
  type: string;
  priority: string;
  titleFr: string;
  titleEn: string;
  messageFr: string;
  messageEn: string;
  link?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  createdBy?: string;
  user: {
    id: string;
    steamUsername?: string;
    email: string;
  };
}

const notificationTypes = [
  { value: "TRADE_UPDATE", label: "Mise à jour trade" },
  { value: "PAYOUT_UPDATE", label: "Mise à jour payout" },
  { value: "KYC_UPDATE", label: "Mise à jour KYC" },
  { value: "GIVEAWAY_WIN", label: "Giveaway gagné" },
  { value: "MISSION_COMPLETED", label: "Mission complétée" },
  { value: "LEVEL_UP", label: "Niveau augmenté" },
  { value: "ADMIN_MESSAGE", label: "Message admin" },
  { value: "SYSTEM_ANNOUNCEMENT", label: "Annonce système" },
  { value: "SECURITY_ALERT", label: "Alerte sécurité" },
];

const notificationPriorities = [
  { value: "LOW", label: "Basse", color: "text-slate-400" },
  { value: "NORMAL", label: "Normale", color: "text-blue-400" },
  { value: "HIGH", label: "Haute", color: "text-orange-400" },
  { value: "URGENT", label: "Urgente", color: "text-red-400" },
];

export default function AdminNotificationsPage() {
  const { messages } = useLocale();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [newNotification, setNewNotification] = useState({
    type: "SYSTEM_ANNOUNCEMENT",
    priority: "NORMAL",
    titleFr: "",
    titleEn: "",
    messageFr: "",
    messageEn: "",
    titleCn: "",
    messageCn: "",
    link: "",
    targetAllUsers: true,
    userIds: "",
  });

  const [isSending, setIsSending] = useState(false);

  const { data: notificationsData, isLoading: loading } = useQuery({
    queryKey: [
      ...queryKeys.adminNotifications,
      { page: currentPage, type: typeFilter, priority: priorityFilter },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);

      const response = await fetch(`/api/admin/notifications?${params}`);
      const data = await response.json();
      return response.ok ? data : null;
    },
  });

  const notifications = notificationsData?.notifications ?? [];
  const total = notificationsData?.total ?? 0;
  const stats = notificationsData?.stats ?? [];

  const handleCreateNotification = async () => {
    if (
      !newNotification.titleFr ||
      !newNotification.titleEn ||
      !newNotification.messageFr ||
      !newNotification.messageEn
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires (FR et EN)");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        ...newNotification,
        userIds: newNotification.targetAllUsers
          ? undefined
          : newNotification.userIds
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
      };

      const response = await fetch("/api/admin/notifications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message ?? "Notification(s) créée(s) avec succès");
        setNewNotification({
          type: "SYSTEM_ANNOUNCEMENT",
          priority: "NORMAL",
          titleFr: "",
          titleEn: "",
          messageFr: "",
          messageEn: "",
          titleCn: "",
          messageCn: "",
          link: "",
          targetAllUsers: true,
          userIds: "",
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
      } else {
        toast.error(data.error ?? "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Erreur lors de la création de la notification");
    } finally {
      setIsSending(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/notifications?id=${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Notification supprimée avec succès");
        queryClient.invalidateQueries({ queryKey: queryKeys.adminNotifications });
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = notificationPriorities.find((pr) => pr.value === priority);
    return (
      <Badge
        variant="outline"
        className={`${p?.color ?? "text-slate-400"} border-current`}
      >
        {p?.label ?? priority}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const t = notificationTypes.find((nt) => nt.value === type);
    return (
      <Badge variant="secondary" className="bg-slate-700 text-slate-200">
        {t?.label ?? type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Bell className="h-7 w-7 text-orange-500 shrink-0" />
            Gestion des Notifications
          </h1>
          <p className="text-slate-400 mt-1">
            Créez et gérez les notifications utilisateur
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total
            </CardTitle>
            <Bell className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{total}</div>
          </CardContent>
        </Card>

        {stats.slice(0, 3).map((stat: { type: string; _count: { id: number } }) => (
          <Card key={stat.type} className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {notificationTypes.find((t) => t.value === stat.type)?.label ??
                  stat.type}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {stat._count.id}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700 h-auto">
          <TabsTrigger
            value="list"
            className="flex items-center gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-orange-500"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>Liste des notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="flex items-center gap-2 py-2 text-xs sm:text-sm data-[state=active]:bg-orange-500"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Créer une notification</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <CardTitle className="text-white text-lg sm:text-xl">
                  Toutes les notifications
                </CardTitle>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px] bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={priorityFilter}
                    onValueChange={setPriorityFilter}
                  >
                    <SelectTrigger className="w-[160px] bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      {notificationPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-700/50">
                    <TableRow>
                      <TableHead className="text-slate-300">Utilisateur</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Priorité</TableHead>
                      <TableHead className="text-slate-300">Titre (FR)</TableHead>
                      <TableHead className="text-slate-300">Lu</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-slate-400 py-8"
                        >
                          Aucune notification trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification: Notification) => (
                        <TableRow
                          key={notification.id}
                          className="border-slate-700 hover:bg-slate-700/30"
                        >
                          <TableCell className="text-slate-300">
                            {notification.user.steamUsername ??
                              notification.user.email}
                          </TableCell>
                          <TableCell>{getTypeBadge(notification.type)}</TableCell>
                          <TableCell>
                            {getPriorityBadge(notification.priority)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {notification.titleFr}
                          </TableCell>
                          <TableCell>
                            {notification.read ? (
                              <Badge
                                variant="outline"
                                className="text-green-400 border-green-400"
                              >
                                Lu
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-slate-400 border-slate-400"
                              >
                                Non lu
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400">
                            {format(
                              new Date(notification.createdAt),
                              "dd/MM/yyyy HH:mm",
                              { locale: fr }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {total > 50 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-slate-300 px-4 py-2">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={notifications.length < 50}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl">
                Créer une nouvelle notification
              </CardTitle>
              <CardDescription className="text-slate-400">
                Envoyez une notification à tous les utilisateurs ou à une sélection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-300">
                    Type de notification
                  </Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(value) =>
                      setNewNotification({ ...newNotification, type: value })
                    }
                  >
                    <SelectTrigger
                      id="type"
                      className="bg-slate-700 border-slate-600"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-slate-300">
                    Priorité
                  </Label>
                  <Select
                    value={newNotification.priority}
                    onValueChange={(value) =>
                      setNewNotification({ ...newNotification, priority: value })
                    }
                  >
                    <SelectTrigger
                      id="priority"
                      className="bg-slate-700 border-slate-600"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationPriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleFr" className="text-slate-300">
                    Titre (Français) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="titleFr"
                    value={newNotification.titleFr}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        titleFr: e.target.value,
                      })
                    }
                    placeholder="Ex: Nouvelle fonctionnalité"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titleEn" className="text-slate-300">
                    Titre (Anglais) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="titleEn"
                    value={newNotification.titleEn}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        titleEn: e.target.value,
                      })
                    }
                    placeholder="Ex: New feature"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="messageFr" className="text-slate-300">
                    Message (Français) <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="messageFr"
                    value={newNotification.messageFr}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        messageFr: e.target.value,
                      })
                    }
                    placeholder="Décrivez votre notification..."
                    className="bg-slate-700 border-slate-600 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageEn" className="text-slate-300">
                    Message (Anglais) <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="messageEn"
                    value={newNotification.messageEn}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        messageEn: e.target.value,
                      })
                    }
                    placeholder="Describe your notification..."
                    className="bg-slate-700 border-slate-600 min-h-[100px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleCn" className="text-slate-300">
                    Titre (Chinois) <span className="text-slate-400">(Optionnel)</span>
                  </Label>
                  <Input
                    id="titleCn"
                    value={newNotification.titleCn}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        titleCn: e.target.value,
                      })
                    }
                    placeholder="标题"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageCn" className="text-slate-300">
                    Message (Chinois) <span className="text-slate-400">(Optionnel)</span>
                  </Label>
                  <Textarea
                    id="messageCn"
                    value={newNotification.messageCn}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        messageCn: e.target.value,
                      })
                    }
                    placeholder="消息"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link" className="text-slate-300">
                  Lien (Optionnel)
                </Label>
                <Input
                  id="link"
                  value={newNotification.link}
                  onChange={(e) =>
                    setNewNotification({
                      ...newNotification,
                      link: e.target.value,
                    })
                  }
                  placeholder="/dashboard ou https://..."
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-4 p-4 border border-slate-700 rounded-lg bg-slate-700/20">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="targetAllUsers"
                    checked={newNotification.targetAllUsers}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        targetAllUsers: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="targetAllUsers" className="text-slate-300">
                    Envoyer à tous les utilisateurs
                  </Label>
                </div>

                {!newNotification.targetAllUsers && (
                  <div className="space-y-2">
                    <Label htmlFor="userIds" className="text-slate-300">
                      IDs utilisateurs (séparés par des virgules)
                    </Label>
                    <Textarea
                      id="userIds"
                      value={newNotification.userIds}
                      onChange={(e) =>
                        setNewNotification({
                          ...newNotification,
                          userIds: e.target.value,
                        })
                      }
                      placeholder="user_id_1, user_id_2, user_id_3"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    setNewNotification({
                      type: "SYSTEM_ANNOUNCEMENT",
                      priority: "NORMAL",
                      titleFr: "",
                      titleEn: "",
                      messageFr: "",
                      messageEn: "",
                      titleCn: "",
                      messageCn: "",
                      link: "",
                      targetAllUsers: true,
                      userIds: "",
                    })
                  }
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Réinitialiser
                </Button>
                <Button
                  onClick={handleCreateNotification}
                  disabled={isSending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer la notification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
