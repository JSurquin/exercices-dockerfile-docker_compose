"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { useTheme } from "next-themes";
import {
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  CreditCardIcon,
  MoonIcon,
  SunIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const { locale, setLocale, messages } = useLocale();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    tradeAlerts: true,
    paymentAlerts: true,
    marketingEmails: false,
    twoFactorEnabled: true,
    language: locale,
    theme: theme || "dark",
  });

  const handleSaveSettings = async () => {
    try {
      // Simulation de sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(messages.toast.settingsSavedSuccess);
    } catch {
      toast.error(messages.toast.settingsSaveError || "Erreur lors de la sauvegarde");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <UserCircleIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{messages.dashboard.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.settings.loginDescription}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              {messages.common.steamLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {messages.settings.title}
          </h1>
          <p className="text-muted-foreground">
            {messages.settings.subtitle}
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">{messages.settings.tabs.profile}</TabsTrigger>
              <TabsTrigger value="security">{messages.settings.tabs.security}</TabsTrigger>
              <TabsTrigger value="notifications">{messages.settings.tabs.notifications}</TabsTrigger>
              <TabsTrigger value="payments">{messages.settings.tabs.payments}</TabsTrigger>
              <TabsTrigger value="preferences">{messages.settings.tabs.preferences}</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserCircleIcon className="w-5 h-5" />
                    <span>{messages.settings.profile.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        Steam ID: {user.steamId64}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          KYC{" "}
                          {user.kycStatus === "verified"
                            ? messages.settings.security.kyc.verified
                            : messages.settings.security.kyc.pending}
                        </Badge>
                        <Badge variant="outline">{messages.settings.profile.level} {user.level}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{messages.settings.profile.steamUsername}</Label>
                      <Input value={user.username} disabled />
                      <p className="text-xs text-muted-foreground">
                        {messages.settings.profile.steamSync}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>{messages.settings.profile.memberSince}</Label>
                      <Input
                        value={new Date(user.joinedAt).toLocaleDateString()}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="font-semibold">{messages.settings.profile.statistics}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{user.level}</p>
                        <p className="text-sm text-muted-foreground">{messages.settings.profile.level}</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">
                          {user.xp.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.profile.totalXp}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">{user.tickets}</p>
                        <p className="text-sm text-muted-foreground">{messages.settings.profile.tickets}</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold">
                          {(user.totalVolume / 100).toFixed(0)}€
                        </p>
                        <p className="text-sm text-muted-foreground">{messages.settings.profile.volume}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ShieldCheckIcon className="w-5 h-5" />
                      <span>{messages.settings.security.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">
                          {messages.settings.security.twoFactor.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.security.twoFactor.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {messages.settings.security.twoFactor.enabled}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {messages.settings.security.twoFactor.configure}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Vérification KYC</h4>
                        <p className="text-sm text-muted-foreground">
                          Statut de vérification de votre identité
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {user.kycStatus === "verified"
                            ? "Vérifié"
                            : "En attente"}
                        </Badge>
                        {user.kycStatus !== "verified" && (
                          <Button variant="outline" size="sm">
                            Commencer KYC
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">Sessions actives</h4>
                        <p className="text-sm text-muted-foreground">
                          Gérez vos connexions actives
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Voir les sessions
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Données personnelles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Conformité RGPD
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Vous avez le droit d&apos;accéder, modifier ou supprimer vos
                        données personnelles.
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Exporter mes données
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          Supprimer mon compte
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BellIcon className="w-5 h-5" />
                    <span>Préférences de notification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          Notifications par email
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des notifications importantes par email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            emailNotifications: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Alertes de trade</h4>
                        <p className="text-sm text-muted-foreground">
                          Notifications lors des changements d&apos;état de vos
                          trades
                        </p>
                      </div>
                      <Switch
                        checked={settings.tradeAlerts}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            tradeAlerts: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Alertes de paiement</h4>
                        <p className="text-sm text-muted-foreground">
                          Notifications lors des paiements et transactions
                        </p>
                      </div>
                      <Switch
                        checked={settings.paymentAlerts}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentAlerts: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Notifications push</h4>
                        <p className="text-sm text-muted-foreground">
                          Notifications push dans le navigateur
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            pushNotifications: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Emails marketing</h4>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des informations sur les nouveautés et
                          promotions
                        </p>
                      </div>
                      <Switch
                        checked={settings.marketingEmails}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            marketingEmails: checked,
                          }))
                        }
                      />
                    </div>p
                  </div>

                  <Button onClick={handleSaveSettings}>
                    Sauvegarder les préférences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCardIcon className="w-5 h-5" />
                    <span>Méthodes de paiement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <CreditCardIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">SEPA - Qonto</p>
                            <p className="text-sm text-muted-foreground">
                              FR76 **** **** **** **89
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Vérifié
                          </Badge>
                          <Badge variant="outline">Par défaut</Badge>
                          <Button variant="ghost" size="sm">
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-xs">
                              ₿
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">Bitcoin</p>
                            <p className="text-sm text-muted-foreground">
                              1A1z...DivfNa
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Vérifié
                          </Badge>
                          <Button variant="ghost" size="sm">
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ajouter une méthode de paiement
                  </Button>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          Important
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Tout changement d&apos;IBAN nécessite une nouvelle
                          vérification et un délai de 7 jours.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CogIcon className="w-5 h-5" />
                    <span>Préférences d&apos;affichage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Langue</h4>
                        <p className="text-sm text-muted-foreground">
                          Choisissez votre langue préférée
                        </p>
                      </div>
                      <Select
                        value={locale}
                        onValueChange={(value) =>
                          setLocale(value as "fr" | "en")
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="en">🇺🇸 English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Thème</h4>
                        <p className="text-sm text-muted-foreground">
                          Choisissez votre thème d&apos;affichage
                        </p>
                      </div>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center space-x-2">
                              <SunIcon className="w-4 h-4" />
                              <span>Clair</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center space-x-2">
                              <MoonIcon className="w-4 h-4" />
                              <span>Sombre</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center space-x-2">
                              <CogIcon className="w-4 h-4" />
                              <span>Système</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings}>
                    Sauvegarder les préférences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
