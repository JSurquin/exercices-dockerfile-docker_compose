'use client';

import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
  EnvelopeIcon,
  ServerIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/components/providers/locale-provider';
import { queryKeys } from '@/lib/query-keys';
import { PlatformConfigSettings } from '@/components/admin/platform-config-settings';

interface AdminSettingsData {
  personalInfo: {
    name: string;
    email: string;
    steamUsername: string;
    avatar: string;
    createdAt: string;
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
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
}

interface SmtpSettingsData {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  secure: boolean;
  alertEmailTo: string;
  bccAdminEnabled: boolean;
  isFromDb: boolean;
}

async function fetchSettings(): Promise<AdminSettingsData> {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

async function fetchSmtpSettings(): Promise<SmtpSettingsData> {
  const res = await fetch('/api/admin/smtp-settings');
  if (!res.ok) throw new Error('Failed to load SMTP settings');
  return res.json();
}

async function patchSmtpSettings(data: Partial<Omit<SmtpSettingsData, 'isFromDb'>>) {
  const res = await fetch('/api/admin/smtp-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to save SMTP settings');
  }
  return res.json();
}

async function resetSmtpSettings() {
  const res = await fetch('/api/admin/smtp-settings', { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to reset SMTP settings');
  }
  return res.json();
}

async function testSmtpConnection() {
  const res = await fetch('/api/admin/smtp-settings/test', { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'SMTP connection failed');
  }
  return res.json();
}

async function patchSettings(patch: Partial<Omit<AdminSettingsData, 'personalInfo'>>) {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to save settings');
  }
  return res.json();
}

async function updateProfile(data: { name: string; email: string }) {
  const res = await fetch('/api/admin/update-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to update profile');
  }
  return res.json();
}

async function changePassword(data: { currentPassword: string; newPassword: string }) {
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Failed to change password');
  }
  return res.json();
}

export default function AdminSettingsPage() {
  const { messages } = useLocale();
  const queryClient = useQueryClient();

  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpForm, setSmtpForm] = useState<Partial<Omit<SmtpSettingsData, 'isFromDb'>>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: fetchSettings,
  });

  const { data: smtpSettings, isLoading: isSmtpLoading } = useQuery({
    queryKey: queryKeys.adminSmtpSettings,
    queryFn: fetchSmtpSettings,
  });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success(messages.admin.settings.personal.success);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success(messages.admin.settings.passwordChange.success);
      setPasswords({ current: '', newPwd: '', confirm: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settingsMutation = useMutation({
    mutationFn: patchSettings,
    onSuccess: () => {
      toast.success(messages.admin.settings.notificationPrefs.success);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smtpMutation = useMutation({
    mutationFn: patchSmtpSettings,
    onSuccess: () => {
      toast.success(messages.admin.settings.smtpSettings.success);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSmtpSettings });
      setSmtpForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smtpResetMutation = useMutation({
    mutationFn: resetSmtpSettings,
    onSuccess: () => {
      toast.success(messages.admin.settings.smtpSettings.resetSuccess);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSmtpSettings });
      setSmtpForm({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smtpTestMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: () => toast.success(messages.admin.settings.smtpSettings.testConnectionSuccess),
    onError: (e: Error) => toast.error(`${messages.admin.settings.smtpSettings.testConnectionError}: ${e.message}`),
  });

  const handlePasswordChange = () => {
    if (passwords.newPwd !== passwords.confirm) {
      toast.error(messages.admin.settings.passwordChange.passwordMismatch);
      return;
    }
    if (passwords.newPwd.length < 8) {
      toast.error(messages.admin.settings.passwordChange.passwordTooShort);
      return;
    }
    passwordMutation.mutate({ currentPassword: passwords.current, newPassword: passwords.newPwd });
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-slate-800" />
        <Skeleton className="h-32 w-full bg-slate-800" />
        <Skeleton className="h-64 w-full bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              {messages.admin.settings.title}
            </h1>
            <p className="text-slate-300">{messages.admin.settings.subtitle}</p>
          </div>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/50 text-orange-400 shrink-0">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            {messages.admin.settings.badge}
          </Badge>
        </div>
      </motion.div>

      {/* Profile Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="bg-slate-800/50 border-2 border-orange-500/50 backdrop-blur-sm shadow-lg shadow-orange-500/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-orange-500/50 shrink-0">
                <AvatarImage src={settings.personalInfo.avatar} />
                <AvatarFallback className="bg-orange-500/20 text-orange-400 text-xl">
                  {settings.personalInfo.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{settings.personalInfo.name || messages.admin.settings.badge}</h2>
                <p className="text-slate-300 truncate">{settings.personalInfo.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/50 text-green-400">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    {messages.admin.settings.accountVerified}
                  </Badge>
                  {settings.personalInfo.steamUsername && (
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50 text-blue-400 max-w-[200px] truncate">
                      Steam: {settings.personalInfo.steamUsername}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-6 h-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-1">
            {[
              { value: 'personal', icon: UserIcon, label: messages.admin.settings.tabs.personal },
              { value: 'security', icon: ShieldCheckIcon, label: messages.admin.settings.tabs.security },
              { value: 'notifications', icon: BellIcon, label: messages.admin.settings.tabs.notifications },
              { value: 'preferences', icon: CogIcon, label: messages.admin.settings.tabs.preferences },
              { value: 'smtp', icon: EnvelopeIcon, label: messages.admin.settings.tabs.smtp },
              { value: 'platform', icon: AdjustmentsHorizontalIcon, label: messages.admin.settings.tabs.platform },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline truncate">{label}</span>
                <span className="md:hidden text-[10px] leading-tight text-center truncate w-full">{label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
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
                      defaultValue={settings.personalInfo.name}
                      key={settings.personalInfo.name}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder={messages.admin.settings.personal.fullNamePlaceholder}
                      onChange={(e) => {
                        settings.personalInfo.name = e.target.value;
                      }}
                      onBlur={(e) => {
                        settings.personalInfo.name = e.target.value;
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">{messages.admin.settings.personal.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={settings.personalInfo.email}
                      key={settings.personalInfo.email}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder={messages.admin.settings.personal.emailPlaceholder}
                      onChange={(e) => { settings.personalInfo.email = e.target.value; }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">{messages.admin.settings.personal.steamUsername}</Label>
                  <Input
                    value={settings.personalInfo.steamUsername}
                    disabled
                    className="bg-slate-900/50 border-slate-600 text-slate-500"
                  />
                  <p className="text-sm text-slate-400">{messages.admin.settings.personal.steamSync}</p>
                </div>
                <Separator className="bg-slate-600" />
                <div className="flex justify-end">
                  <Button
                    onClick={() => profileMutation.mutate({ name: settings.personalInfo.name, email: settings.personalInfo.email })}
                    disabled={profileMutation.isPending}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {profileMutation.isPending ? messages.admin.settings.personal.saving : messages.admin.settings.personal.save}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
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
                    {[
                      { id: 'current', label: messages.admin.settings.passwordChange.currentPassword, placeholder: messages.admin.settings.passwordChange.currentPasswordPlaceholder, field: 'current' as const },
                      { id: 'newPwd', label: messages.admin.settings.passwordChange.newPassword, placeholder: messages.admin.settings.passwordChange.newPasswordPlaceholder, field: 'newPwd' as const },
                      { id: 'confirm', label: messages.admin.settings.passwordChange.confirmPassword, placeholder: messages.admin.settings.passwordChange.confirmPasswordPlaceholder, field: 'confirm' as const },
                    ].map(({ id, label, placeholder, field }) => (
                      <div key={id} className="space-y-2">
                        <Label htmlFor={id} className="text-slate-200">{label}</Label>
                        <div className="relative">
                          <Input
                            id={id}
                            type={showPassword ? 'text' : 'password'}
                            value={passwords[field]}
                            onChange={(e) => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                            className="bg-slate-900/50 border-slate-600 text-white pr-10"
                            placeholder={placeholder}
                          />
                          {field === 'current' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(s => !s)}
                            >
                              {showPassword ? <EyeSlashIcon className="h-4 w-4 text-slate-400" /> : <EyeIcon className="h-4 w-4 text-slate-400" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordMutation.isPending || !passwords.current || !passwords.newPwd || !passwords.confirm}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      {passwordMutation.isPending ? messages.admin.settings.passwordChange.changing : messages.admin.settings.passwordChange.change}
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                      <p className="text-sm text-slate-400">{messages.admin.settings.securitySettings.twoFactorDesc}</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) =>
                        settingsMutation.mutate({ security: { ...settings.security, twoFactorEnabled: checked } })
                      }
                      disabled={settingsMutation.isPending}
                    />
                  </div>
                  <Separator className="bg-slate-600" />
                  <div className="space-y-2">
                    <Label className="text-slate-200">{messages.admin.settings.securitySettings.sessionTimeout}</Label>
                    <Select
                      value={settings.security.sessionTimeout.toString()}
                      onValueChange={(value) =>
                        settingsMutation.mutate({ security: { ...settings.security, sessionTimeout: parseInt(value) } })
                      }
                      disabled={settingsMutation.isPending}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="15">{messages.admin.settings.securitySettings['15min']}</SelectItem>
                        <SelectItem value="30">{messages.admin.settings.securitySettings['30min']}</SelectItem>
                        <SelectItem value="60">{messages.admin.settings.securitySettings['1hour']}</SelectItem>
                        <SelectItem value="120">{messages.admin.settings.securitySettings['2hours']}</SelectItem>
                        <SelectItem value="480">{messages.admin.settings.securitySettings['8hours']}</SelectItem>
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
                {([
                  { key: 'emailNotifications', label: messages.admin.settings.notificationPrefs.emailNotifications, desc: messages.admin.settings.notificationPrefs.emailNotificationsDesc },
                  { key: 'tradeAlerts', label: messages.admin.settings.notificationPrefs.tradeAlerts, desc: messages.admin.settings.notificationPrefs.tradeAlertsDesc },
                  { key: 'securityAlerts', label: messages.admin.settings.notificationPrefs.securityAlerts, desc: messages.admin.settings.notificationPrefs.securityAlertsDesc },
                  { key: 'weeklyReports', label: messages.admin.settings.notificationPrefs.weeklyReports, desc: messages.admin.settings.notificationPrefs.weeklyReportsDesc },
                ] as const).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">{label}</Label>
                      <p className="text-sm text-slate-400">{desc}</p>
                    </div>
                    <Switch
                      checked={settings.notifications[key]}
                      onCheckedChange={(checked) =>
                        settingsMutation.mutate({ notifications: { ...settings.notifications, [key]: checked } })
                      }
                      disabled={settingsMutation.isPending}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email / SMTP */}
          <TabsContent value="smtp" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ServerIcon className="w-5 h-5 text-cyan-400" />
                  {messages.admin.settings.smtpSettings.title}
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">{messages.admin.settings.smtpSettings.subtitle}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {isSmtpLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full bg-slate-700" />
                    <Skeleton className="h-10 w-full bg-slate-700" />
                    <Skeleton className="h-10 w-full bg-slate-700" />
                  </div>
                ) : smtpSettings ? (
                  <>
                    {/* Badge source */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={smtpSettings.isFromDb
                          ? 'bg-green-500/10 border-green-500/50 text-green-400'
                          : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400'}
                      >
                        {smtpSettings.isFromDb
                          ? messages.admin.settings.smtpSettings.sourceDb
                          : messages.admin.settings.smtpSettings.sourceEnv}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Host */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.host}</Label>
                        <Input
                          defaultValue={smtpForm.host ?? smtpSettings.host}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.smtpSettings.hostPlaceholder}
                          onChange={(e) => setSmtpForm(f => ({ ...f, host: e.target.value }))}
                        />
                      </div>

                      {/* Port */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.port}</Label>
                        <Input
                          type="number"
                          defaultValue={smtpForm.port ?? smtpSettings.port}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="587"
                          onChange={(e) => setSmtpForm(f => ({ ...f, port: parseInt(e.target.value) || undefined }))}
                        />
                      </div>

                      {/* User */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.user}</Label>
                        <Input
                          defaultValue={smtpForm.user ?? smtpSettings.user}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.smtpSettings.userPlaceholder}
                          onChange={(e) => setSmtpForm(f => ({ ...f, user: e.target.value }))}
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.password}</Label>
                        <div className="relative">
                          <Input
                            type={showSmtpPassword ? 'text' : 'password'}
                            defaultValue={smtpForm.password ?? smtpSettings.password}
                            className="bg-slate-900/50 border-slate-600 text-white pr-10"
                            placeholder={messages.admin.settings.smtpSettings.passwordPlaceholder}
                            onChange={(e) => setSmtpForm(f => ({ ...f, password: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowSmtpPassword(s => !s)}
                          >
                            {showSmtpPassword ? <EyeSlashIcon className="h-4 w-4 text-slate-400" /> : <EyeIcon className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </div>
                      </div>

                      {/* From */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.from}</Label>
                        <Input
                          type="email"
                          defaultValue={smtpForm.from ?? smtpSettings.from}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.smtpSettings.fromPlaceholder}
                          onChange={(e) => setSmtpForm(f => ({ ...f, from: e.target.value }))}
                        />
                      </div>

                      {/* Alert Email To */}
                      <div className="space-y-2">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.alertEmailTo}</Label>
                        <Input
                          type="email"
                          defaultValue={smtpForm.alertEmailTo ?? smtpSettings.alertEmailTo}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder={messages.admin.settings.smtpSettings.alertEmailToPlaceholder}
                          onChange={(e) => setSmtpForm(f => ({ ...f, alertEmailTo: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Secure switch */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.secure}</Label>
                        <p className="text-sm text-slate-400">{messages.admin.settings.smtpSettings.secureDesc}</p>
                      </div>
                      <Switch
                        checked={smtpForm.secure ?? smtpSettings.secure}
                        onCheckedChange={(checked) => setSmtpForm(f => ({ ...f, secure: checked }))}
                      />
                    </div>

                    {/* BCC admin toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <div className="space-y-1">
                        <Label className="text-slate-200">{messages.admin.settings.smtpSettings.bccAdmin}</Label>
                        <p className="text-sm text-slate-400">{messages.admin.settings.smtpSettings.bccAdminDesc}</p>
                      </div>
                      <Switch
                        checked={smtpForm.bccAdminEnabled ?? smtpSettings.bccAdminEnabled}
                        onCheckedChange={(checked) => setSmtpForm(f => ({ ...f, bccAdminEnabled: checked }))}
                      />
                    </div>

                    <Separator className="bg-slate-600" />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => smtpTestMutation.mutate()}
                          disabled={smtpTestMutation.isPending}
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <EnvelopeIcon className="w-4 h-4 mr-2" />
                          {smtpTestMutation.isPending ? '...' : messages.admin.settings.smtpSettings.testConnection}
                        </Button>

                        {smtpSettings.isFromDb && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (confirm(messages.admin.settings.smtpSettings.resetToEnvConfirm)) {
                                smtpResetMutation.mutate();
                              }
                            }}
                            disabled={smtpResetMutation.isPending}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            {messages.admin.settings.smtpSettings.resetToEnv}
                          </Button>
                        )}
                      </div>

                      <Button
                        onClick={() => smtpMutation.mutate({
                          ...smtpSettings,
                          ...smtpForm,
                        })}
                        disabled={smtpMutation.isPending}
                        className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
                      >
                        {smtpMutation.isPending
                          ? messages.admin.settings.smtpSettings.saving
                          : messages.admin.settings.smtpSettings.save}
                      </Button>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Config plateforme */}
          <TabsContent value="platform" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5 text-orange-400" />
                  {messages.admin.settings.platformConfig?.title}
                </CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  {messages.admin.settings.platformConfig?.description}
                </p>
              </CardHeader>
              <CardContent>
                <PlatformConfigSettings />
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
                      onValueChange={(value) =>
                        settingsMutation.mutate({ preferences: { ...settings.preferences, theme: value } })
                      }
                      disabled={settingsMutation.isPending}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
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
                      onValueChange={(value) =>
                        settingsMutation.mutate({ preferences: { ...settings.preferences, language: value } })
                      }
                      disabled={settingsMutation.isPending}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
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
                      onValueChange={(value) =>
                        settingsMutation.mutate({ preferences: { ...settings.preferences, timezone: value } })
                      }
                      disabled={settingsMutation.isPending}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
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
                      onValueChange={(value) =>
                        settingsMutation.mutate({ preferences: { ...settings.preferences, dashboardLayout: value } })
                      }
                      disabled={settingsMutation.isPending}
                    >
                      <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="grid">{messages.admin.settings.interfacePrefs.layoutGrid}</SelectItem>
                        <SelectItem value="list">{messages.admin.settings.interfacePrefs.layoutList}</SelectItem>
                        <SelectItem value="compact">{messages.admin.settings.interfacePrefs.layoutCompact}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
