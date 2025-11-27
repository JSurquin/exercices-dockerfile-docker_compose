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
        toast.success('Informations personnelles mises à jour avec succès');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour des informations');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
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
        toast.success('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
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
        toast.success('Préférences de notifications mises à jour');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Erreur lors de la mise à jour des notifications');
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
        toast.success('Préférences mises à jour');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
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
              Paramètres Administrateur
            </h1>
            <p className="text-slate-300">
              Gérez vos informations personnelles et préférences d&apos;administration
            </p>
          </div>
          <Badge variant="outline" className="bg-orange-500/10 border-orange-500/50 text-orange-400">
            <ShieldCheckIcon className="w-4 h-4 mr-1" />
            Administrateur
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
                    Compte Vérifié
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/10 border-blue-500/50 text-blue-400">
                    Steam: {settings.personalInfo.steamUsername || 'Non lié'}
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
              Personnel
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <BellIcon className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              Préférences
            </TabsTrigger>
          </TabsList>

          {/* Informations Personnelles */}
          <TabsContent value="personal" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-orange-400" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-200">Nom complet</Label>
                    <Input
                      id="name"
                      value={settings.personalInfo.name}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, name: e.target.value }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder="Votre nom complet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Adresse email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.personalInfo.email}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="bg-slate-900/50 border-slate-600 text-white"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="steamUsername" className="text-slate-200">Nom d&apos;utilisateur Steam</Label>
                  <Input
                    id="steamUsername"
                    value={settings.personalInfo.steamUsername}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      personalInfo: { ...prev.personalInfo, steamUsername: e.target.value }
                    }))}
                    className="bg-slate-900/50 border-slate-600 text-white"
                    placeholder="Votre nom Steam"
                    disabled
                  />
                  <p className="text-sm text-slate-400">
                    Le nom d&apos;utilisateur Steam est synchronisé automatiquement
                  </p>
                </div>

                <Separator className="bg-slate-600" />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleSavePersonalInfo}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
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
                    Changement de mot de passe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-200">
                      Utilisez un mot de passe fort avec au moins 8 caractères, incluant des majuscules, minuscules, chiffres et symboles.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-slate-200">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white pr-10"
                          placeholder="Votre mot de passe actuel"
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
                        <Label htmlFor="newPassword" className="text-slate-200">Nouveau mot de passe</Label>
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="Nouveau mot de passe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-200">Confirmer le mot de passe</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-slate-900/50 border-slate-600 text-white"
                          placeholder="Confirmer le mot de passe"
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
                      {saving ? 'Modification...' : 'Changer le mot de passe'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Paramètres de sécurité */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                    Paramètres de sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">Authentification à deux facteurs</Label>
                      <p className="text-sm text-slate-400">
                        Ajouter une couche de sécurité supplémentaire à votre compte
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
                    <Label className="text-slate-200">Délai d&apos;expiration de session (minutes)</Label>
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
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 heure</SelectItem>
                        <SelectItem value="120">2 heures</SelectItem>
                        <SelectItem value="480">8 heures</SelectItem>
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
                  Préférences de notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-slate-200">Notifications par email</Label>
                      <p className="text-sm text-slate-400">
                        Recevoir les notifications importantes par email
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
                      <Label className="text-slate-200">Alertes de trades</Label>
                      <p className="text-sm text-slate-400">
                        Notifications pour les nouveaux trades et changements de statut
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
                      <Label className="text-slate-200">Alertes de sécurité</Label>
                      <p className="text-sm text-slate-400">
                        Notifications pour les connexions suspectes et activités de sécurité
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
                      <Label className="text-slate-200">Rapports hebdomadaires</Label>
                      <p className="text-sm text-slate-400">
                        Recevoir un résumé hebdomadaire des activités de la plateforme
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
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les notifications'}
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
                  Préférences d&apos;interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Thème</Label>
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
                        <SelectItem value="dark">Sombre</SelectItem>
                        <SelectItem value="light">Clair</SelectItem>
                        <SelectItem value="auto">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Langue</Label>
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
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Fuseau horaire</Label>
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
                        <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Disposition du dashboard</Label>
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
                        <SelectItem value="grid">Grille</SelectItem>
                        <SelectItem value="list">Liste</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
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
                    {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
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
