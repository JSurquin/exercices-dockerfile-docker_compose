"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  mockTrades,
  mockVolumeData,
  mockTradeStatusData,
} from "@/lib/mock-data";
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  TicketIcon,
  StarIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import CountUp from "react-countup";

const formatPrice = (centimes: number) => {
  return (centimes / 100).toFixed(2) + "€";
};

const getStatusColor = (status: string) => {
  const colors = {
    créé: "bg-blue-500",
    accepté_par_bot: "bg-indigo-500",
    en_trade_hold: "bg-yellow-500",
    disponible: "bg-green-500",
    paiement_en_cours: "bg-orange-500",
    payé: "bg-emerald-500",
    échoué: "bg-red-500",
  };
  return colors[status as keyof typeof colors] || "bg-gray-500";
};

const getStatusText = (status: string) => {
  const texts = {
    créé: "Créé",
    accepté_par_bot: "Accepté",
    en_trade_hold: "Trade Hold (7j)",
    disponible: "Prêt à payer",
    paiement_en_cours: "Paiement en cours",
    payé: "Payé",
    échoué: "Échec",
  };
  return texts[status as keyof typeof texts] || status;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { messages } = useLocale();

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              {messages.dashboard.loginRequired}
            </h2>
            <p className="text-muted-foreground mb-6">
              {messages.dashboard.loginSubtitle}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              {messages.common.steamLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevel = user.level;
  const nextLevel = currentLevel + 1;
  const xpForCurrentLevel = currentLevel * 1000;
  const xpForNextLevel = nextLevel * 1000;
  const xpProgress =
    ((user.xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) *
    100;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center space-x-3 sm:space-x-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback>
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold">
                {messages.dashboard.welcome}, {user.username}
              </h1>
              <p className="text-muted-foreground">
                {messages.dashboard.subtitle}
              </p>
            </div>
          </div>

          {/* XP Progress */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold">{messages.dashboard.currentLevel} {currentLevel}</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.xp - xpForCurrentLevel} /{" "}
                      {xpForNextLevel - xpForCurrentLevel} {messages.dashboard.xp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {user.xp.toLocaleString()} {messages.dashboard.xp}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {xpForNextLevel - user.xp} {messages.dashboard.xpForNext} {nextLevel}
                  </p>
                </div>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8"
        >
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.volume}</p>
                  <p className="text-2xl font-bold">
                    <CountUp
                      end={user.totalVolume / 100}
                      duration={2}
                      decimals={2}
                      suffix="€"
                    />
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.trades}</p>
                  <p className="text-2xl font-bold">
                    <CountUp end={mockTrades.length} duration={2} />
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.level}</p>
                  <p className="text-2xl font-bold">{user.level}</p>
                </div>
                <StarIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{messages.dashboard.tickets}</p>
                  <p className="text-2xl font-bold">{user.tickets}</p>
                </div>
                <TicketIcon className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="trades" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trades">{messages.dashboard.tabs.trades}</TabsTrigger>
              <TabsTrigger value="analytics">{messages.dashboard.tabs.analytics}</TabsTrigger>
              <TabsTrigger value="payments">{messages.dashboard.tabs.payments}</TabsTrigger>
              <TabsTrigger value="settings">{messages.dashboard.tabs.settings}</TabsTrigger>
            </TabsList>

            {/* Trades Tab */}
            <TabsContent value="trades" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{messages.dashboard.tradeHistory.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {mockTrades.map((trade) => (
                      <div key={trade.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(
                                trade.status
                              )} text-white`}
                            >
                              {getStatusText(trade.status)}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {trade.ticketId}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatPrice(trade.netCentimes)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(trade.créédLe).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.items} ({trade.items.length}):
                            </span>
                            <div className="mt-1">
                              {trade.items.slice(0, 2).map((item, index) => (
                                <p key={index} className="truncate">
                                  {item.name}
                                </p>
                              ))}
                              {trade.items.length > 2 && (
                                <p className="text-muted-foreground">
                                  +{trade.items.length - 2} {messages.dashboard.tradeHistory.others}
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.fees}
                            </span>
                            <p>{messages.dashboard.tradeHistory.cashout} {formatPrice(trade.frais.cashout)}</p>
                            <p>{messages.dashboard.tradeHistory.network} {formatPrice(trade.frais.réseau)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {messages.dashboard.tradeHistory.timeline}
                            </span>
                            {trade.tradeAcceptéLe && (
                              <p>
                                {messages.dashboard.tradeHistory.accepted}{" "}
                                {new Date(
                                  trade.tradeAcceptéLe
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {trade.disponibleLe && (
                              <p>
                                {messages.dashboard.tradeHistory.available}{" "}
                                {new Date(
                                  trade.disponibleLe
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.analytics.tradingVolume}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={mockVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            formatPrice(value as number),
                            "Volume",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="#f97316"
                          strokeWidth={2}
                          dot={{ fill: "#f97316" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.analytics.tradeStatus}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={mockTradeStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {mockTradeStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{messages.dashboard.payments.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <BanknotesIcon className="w-5 h-5 text-blue-600" />
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
                            {messages.dashboard.payments.verified}
                          </Badge>
                          <Badge variant="outline">{messages.dashboard.payments.default}</Badge>
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
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {messages.dashboard.payments.verified}
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      {messages.dashboard.payments.addMethod}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.settings.profile}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          Steam ID: {user.steamId64}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          KYC{" "}
                          {user.kycStatus === "verified"
                            ? messages.kyc.approved
                            : messages.kyc.pending}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{messages.dashboard.settings.security}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{messages.dashboard.settings.twoFactor}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.dashboard.settings.twoFactorDesc}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {messages.dashboard.settings.enabled}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{messages.dashboard.settings.emailNotifications}</p>
                        <p className="text-sm text-muted-foreground">
                          {messages.dashboard.settings.emailNotificationsDesc}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {messages.dashboard.settings.enabled}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
