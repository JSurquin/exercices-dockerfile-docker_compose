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
import { Separator } from "@/components/ui/separator";
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
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import TradeLinkConfig from "@/components/settings/trade-link-config";
import SteamIdConfig from "@/components/settings/steam-id-config";

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
  const [emailInput, setEmailInput] = useState(user?.contactEmail ?? "");
  const [isEmailSaving, setIsEmailSaving] = useState(false);
  const canUseTwoFactor = user?.role !== "ADMIN" && user?.role !== "MODERATOR";

  const handleEmailUpdate = async () => {
    if (!emailInput.trim()) return;
    setIsEmailSaving(true);
    try {
      const res = await fetch("/api/user/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success(messages.settings.profile.emailSuccess);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsEmailSaving(false);
    }
  };

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
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto">
              <TabsTrigger value="profile">{messages.settings.tabs.profile}</TabsTrigger>
              <TabsTrigger value="security">{messages.settings.tabs.security}</TabsTrigger>
              <TabsTrigger value="notifications">{messages.settings.tabs.notifications}</TabsTrigger>
              <TabsTrigger value="payments">{messages.settings.tabs.payments}</TabsTrigger>
              <TabsTrigger value="preferences" className="col-span-2 sm:col-span-1">{messages.settings.tabs.preferences}</TabsTrigger>
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
                          {user.kycStatus === "VERIFIED" || user.kycStatus === "KYCAID_VERIFIED"
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

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-base font-semibold">
                        {messages.settings.profile.email}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {messages.settings.profile.emailHelp}
                    </p>
                    <div className="flex gap-2 max-w-md">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder={messages.settings.profile.emailPlaceholder}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleEmailUpdate}
                        disabled={isEmailSaving || !emailInput.trim() || emailInput.trim() === (user.contactEmail ?? "")}
                        size="sm"
                      >
                        {isEmailSaving
                          ? messages.settings.profile.emailSaving
                          : messages.settings.profile.emailSave}
                      </Button>
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
                          {(user.xp ?? 0).toLocaleString()}
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

              {/* Steam ID Configuration */}
              <div className="mt-4">
                <SteamIdConfig />
              </div>

              {/* Trade Link Configuration */}
              <div className="mt-4">
                <TradeLinkConfig />
              </div>
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
                    {canUseTwoFactor && (
                      <div className="md:flex items-center justify-between p-4 border rounded-lg">
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
                            className={
                              (user as { twoFactorEnabled?: boolean })?.twoFactorEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {(user as { twoFactorEnabled?: boolean })?.twoFactorEnabled
                              ? messages.settings.security.twoFactor.enabled
                              : "Disabled"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.location.href = "/two-factor";
                            }}
                          >
                            {messages.settings.security.twoFactor.configure}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{messages.settings.security.kyc.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.security.kyc.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {user.kycStatus === "VERIFIED" || user.kycStatus === "KYCAID_VERIFIED"
                            ? messages.settings.security.kyc.verified
                            : messages.settings.security.kyc.pending}
                        </Badge>
                        {user.kycStatus !== "VERIFIED" && user.kycStatus !== "KYCAID_VERIFIED" && (
                          <Button variant="outline" size="sm">
                            {messages.settings.security.kyc.start}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{messages.settings.security.sessions.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.security.sessions.description}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        {messages.settings.security.sessions.view}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{messages.common.personalData}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        {messages.settings.security.gdpr.title}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        {messages.settings.security.gdpr.description}
                      </p>
                      <div className="grid gap-y-2 md:gap-y-0 md:flex space-x-2">
                        <Button variant="outline" size="sm">
                          {messages.settings.security.gdpr.export}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          {messages.settings.security.gdpr.delete}
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
                    <span>{messages.settings.notifications.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {messages.settings.notifications.email.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.notifications.email.description}
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
                        <h4 className="font-semibold">{messages.settings.notifications.trades.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.notifications.trades.description}
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
                        <h4 className="font-semibold">{messages.settings.notifications.payments.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.notifications.payments.description}
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
                        <h4 className="font-semibold">{messages.settings.notifications.push.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.notifications.push.description}
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
                        <h4 className="font-semibold">{messages.settings.notifications.marketing.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.notifications.marketing.description}
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
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings}>
                    {messages.settings.notifications.save}
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
                    <span>{messages.settings.payments.title}</span>
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
                            <p className="font-medium">{messages.settings.payments.flexify}</p>
                            <p className="text-sm text-muted-foreground">
                              {messages.settings.payments.flexifyDesc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard?tab=payouts"}>
                            {messages.settings.payments.modify}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-xs">₿</span>
                          </div>
                          <div>
                            <p className="font-medium">{messages.settings.payments.whitepay}</p>
                            <p className="text-sm text-muted-foreground">
                              {messages.settings.payments.whitepayDesc}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard?tab=payouts"}>
                            {messages.settings.payments.modify}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                          {messages.settings.payments.important}
                        </p>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          {messages.settings.payments.ibanWarning}
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
                    <span>{messages.settings.preferences.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{messages.settings.preferences.language.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.preferences.language.description}
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
                          <SelectItem value="fr">{messages.settings.preferences.language.french}</SelectItem>
                          <SelectItem value="en">{messages.settings.preferences.language.english}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{messages.settings.preferences.theme.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {messages.settings.preferences.theme.description}
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
                              <span>{messages.settings.preferences.theme.light}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center space-x-2">
                              <MoonIcon className="w-4 h-4" />
                              <span>{messages.settings.preferences.theme.dark}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center space-x-2">
                              <CogIcon className="w-4 h-4" />
                              <span>{messages.settings.preferences.theme.system}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings}>
                    {messages.settings.preferences.save}
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
