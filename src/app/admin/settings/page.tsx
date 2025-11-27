'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '~/lib/auth-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
  KeyIcon,
  BellIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';

interface AdminSettings {
  personalInfo: {
    name: string;
    email: string;
    steamUsername: string;
    avatar: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    sessionTimeout: number;
  };
  notifications: {
    emailNotifications: boolean;
    tradeAlerts: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    dashboardLayout: string;
  };
}

export default function AdminSettingsPage() {
  const { data: session, isPending } = useSession();
  const { messages } = useLocale();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [settings, setSettings] = useState<AdminSettings>({
    personalInfo: {
      name: '',
      email: '',
      steamUsername: '',
      avatar: '',
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: '',
      sessionTimeout: 30,
    },
    notifications: {
      emailNotifications: true,
      tradeAlerts: true,
      securityAlerts: true,
      weeklyReports: true,
    },
    preferences: {
      theme: 'dark',
      language: 'fr',
      timezone: 'Europe/Paris',
      dashboardLayout: 'grid',
    },
  });

  // Charger les données de l'admin
  useEffect(() => {
    if (session?.user) {
      setSettings(prev => ({
        ...prev,
        personalInfo: {
          name: session.user.name || '',
          email: session.user.email || '',
          steamUsername: session.user.steamUsername || '',
          avatar: session.user.image || session.user.steamAvatar || '',
        },
      }));
    }
  }, [session]);

  const handleSavePersonalInfo = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.personalInfo.name,
          email: settings.personalInfo.email,
        }),
      });

      if (response.ok) {
        toast.success(messages.admin.settings.personal.success);
      } else {
        throw new Error(messages.admin.settings.personal.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(messages.admin.settings.personal.error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(messages.admin.settings.passwordChange.passwordMismatch);
      return;
    }

    if (newPassword.length < 8) {
      toast.error(messages.admin.settings.passwordChange.passwordTooShort);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success(messages.admin.settings.passwordChange.success);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        throw new Error(data.error || messages.admin.settings.passwordChange.error);
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || messages.admin.settings.passwordChange.error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/update-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.notifications),
      });

      if (response.ok) {
        toast.success(messages.admin.settings.notificationPrefs.success);
      } else {
        throw new Error(messages.admin.settings.notificationPrefs.error);
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error(messages.admin.settings.notificationPrefs.error);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings.preferences),
      });

      if (response.ok) {
        toast.success(messages.admin.settings.interfacePrefs.success);
      } else {
        throw new Error(messages.admin.settings.interfacePrefs.error);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error(messages.admin.settings.interfacePrefs.error);
    } finally {
      setSaving(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              {messages.admin.settings.title}
            </h1>
            <p className="text-slate-300">
              {messages.admin.settings.subtitle}
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/50 text-orange-400">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            {messages.admin.settings.badge}
          </Badge>
        </div>
      </motion.div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-slate-800/50 border-2 border-orange-500/50 backdrop-blur-sm shadow-lg shadow-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-orange-500/50">
                <AvatarImage src={settings.personalInfo.avatar} />
                <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xl">
                  {settings.personalInfo.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {settings.personalInfo.name || 'Administrateur'}
                </h2>
                <p className="text-slate-300">{settings.personalInfo.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/50 text-green-400">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {messages.admin.settings.accountVerified}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50 text-blue-400">
                    Steam: {settings.personalInfo.steamUsername || messages.admin.settings.notLinked}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700">
            <TabsTrigger 
              value="personal" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              {messages.admin.settings.tabs.personal}
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              {messages.admin.settings.tabs.security}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <BellIcon className="w-4 h-4 mr-2" />
              {messages.admin.settings.tabs.notifications}
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              {messages.admin.settings.tabs.preferences}
            </TabsTrigger>
          </TabsList>

          {/* Informations Personnelles */}
          <TabsContent value="personal" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-orange-400" />
                  {messages.admin.settings.personal.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">{messages.admin.settings.personal.fullName}</Label>
                    <Input
                      id="name"
                      value={settings.personalInfo.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder={messages.admin.settings.personal.fullNamePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">{messages.admin.settings.personal.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.personalInfo.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder={messages.admin.settings.personal.emailPlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steamUsername" className="text-slate-200">{messages.admin.settings.personal.steamUsername}</Label>
                  <Input
                    id="steamUsername"
                    value={settings.personalInfo.steamUsername}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, steamUsername: e.target.value }
                    }))}
                    className="bg-slate-900/50 border-slate-600 text-white"
                    placeholder={messages.admin.settings.personal.steamUsernamePlaceholder}
                    disabled
                  />
                  <p className="text-sm text-slate-400">
                    {messages.admin.settings.personal.steamSync}
                  </p>
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePersonalInfo}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {saving ? messages.admin.settings.personal.saving : messages.admin.settings.personal.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              {/* Changement de mot de passe */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-red-400" />
                    {messages.admin.settings.passwordChange.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-200">
                      {messages.admin.settings.passwordChange.warning}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-slate-200">{messages.admin.settings.passwordChange.currentPassword}</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white pr-10"
                          placeholder={messages.admin.settings.passwordChange.currentPasswordPlaceholder}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-slate-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-slate-200">{messages.admin.settings.passwordChange.newPassword}</Label>
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.passwordChange.newPasswordPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-200">{messages.admin.settings.passwordChange.confirmPassword}</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.passwordChange.confirmPasswordPlaceholder}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      {saving ? messages.admin.settings.passwordChange.changing : messages.admin.settings.passwordChange.change}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Paramètres de sécurité */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                    {messages.admin.settings.securitySettings.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{messages.admin.settings.securitySettings.twoFactor}</Label>
                      <p className="text-sm text-slate-400">
                        {messages.admin.settings.securitySettings.twoFactorDesc}
                      </p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, twoFactorEnabled: checked }
                      }))}
                    />
                  </div>

                  <Separator className="bg-slate-600" />

                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.securitySettings.sessionTimeout}</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeout: parseInt(value) }
                      }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="15">{messages.admin.settings.securitySettings["15min"]}</SelectItem>
                        <SelectItem value="30">{messages.admin.settings.securitySettings["30min"]}</SelectItem>
                        <SelectItem value="60">{messages.admin.settings.securitySettings["1hour"]}</SelectItem>
                        <SelectItem value="120">{messages.admin.settings.securitySettings["2hours"]}</SelectItem>
                        <SelectItem value="480">{messages.admin.settings.securitySettings["8hours"]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-blue-400" />
                  {messages.admin.settings.notificationPrefs.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{messages.admin.settings.notificationPrefs.emailNotifications}</Label>
                      <p className="text-sm text-slate-400">
                        {messages.admin.settings.notificationPrefs.emailNotificationsDesc}
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{messages.admin.settings.notificationPrefs.tradeAlerts}</Label>
                      <p className="text-sm text-slate-400">
                        {messages.admin.settings.notificationPrefs.tradeAlertsDesc}
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.tradeAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, tradeAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{messages.admin.settings.notificationPrefs.securityAlerts}</Label>
                      <p className="text-sm text-slate-400">
                        {messages.admin.settings.notificationPrefs.securityAlertsDesc}
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.securityAlerts}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, securityAlerts: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{messages.admin.settings.notificationPrefs.weeklyReports}</Label>
                      <p className="text-sm text-slate-400">
                        {messages.admin.settings.notificationPrefs.weeklyReportsDesc}
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.weeklyReports}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, weeklyReports: checked }
                      }))}
                    />
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {saving ? messages.admin.settings.personal.saving : messages.admin.settings.notificationPrefs.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Préférences */}
          <TabsContent value="preferences" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CogIcon className="w-5 h-5 text-purple-400" />
                  {messages.admin.settings.interfacePrefs.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.interfacePrefs.theme}</Label>
                    <Select
                      value={settings.preferences.theme}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: value }
                      }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="dark">{messages.admin.settings.interfacePrefs.themeDark}</SelectItem>
                        <SelectItem value="light">{messages.admin.settings.interfacePrefs.themeLight}</SelectItem>
                        <SelectItem value="auto">{messages.admin.settings.interfacePrefs.themeAuto}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.interfacePrefs.language}</Label>
                    <Select
                      value={settings.preferences.language}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: value }
                      }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="fr">{messages.admin.settings.interfacePrefs.french}</SelectItem>
                        <SelectItem value="en">{messages.admin.settings.interfacePrefs.english}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.interfacePrefs.timezone}</Label>
                    <Select
                      value={settings.preferences.timezone}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, timezone: value }
                      }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="Europe/Paris">{messages.admin.settings.interfacePrefs.parisCET}</SelectItem>
                        <SelectItem value="Europe/London">{messages.admin.settings.interfacePrefs.londonGMT}</SelectItem>
                        <SelectItem value="America/New_York">{messages.admin.settings.interfacePrefs.newYorkEST}</SelectItem>
                        <SelectItem value="Asia/Tokyo">{messages.admin.settings.interfacePrefs.tokyoJST}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.interfacePrefs.dashboardLayout}</Label>
                    <Select
                      value={settings.preferences.dashboardLayout}
                      onValueChange={(value) => setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, dashboardLayout: value }
                      }))}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="grid">{messages.admin.settings.interfacePrefs.layoutGrid}</SelectItem>
                        <SelectItem value="list">{messages.admin.settings.interfacePrefs.layoutList}</SelectItem>
                        <SelectItem value="compact">{messages.admin.settings.interfacePrefs.layoutCompact}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    {saving ? messages.admin.settings.personal.saving : messages.admin.settings.interfacePrefs.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
