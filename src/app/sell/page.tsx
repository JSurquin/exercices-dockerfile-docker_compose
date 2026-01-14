"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { SkinplaceInventoryViewer } from "@/components/skinplace/skinplace-inventory-viewer";
import { SkinplaceTradeCreator } from "@/components/skinplace/skinplace-trade-creator";
import { NormalizedInventoryItem } from "@/hooks/use-skinplace-inventory";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

const getSteps = (messages: any) => [
  { id: "inventory", title: messages.sellPage.steps.inventory, icon: LinkIcon },
  { id: "trade", title: messages.sellPage.steps.trade, icon: CurrencyDollarIcon },
  { id: "confirmation", title: messages.sellPage.steps.confirmation, icon: CheckCircleIcon },
];

export default function SellPage() {
  const { user } = useAuth();
  const { messages } = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getSteps(messages);
  const [selectedItems, setSelectedItems] = useState<NormalizedInventoryItem[]>([]);
  const [tradeData, setTradeData] = useState<{ 
    trade_id: string; 
    token: string; 
    status: string; 
    total_value: number; 
    net_value: number;
    fees: { cashout_fee: number; network_fee: number };
    expires_at: Date;
  } | null>(null);
  const [activeSteamId, setActiveSteamId] = useState(user?.steamId64 || '');

  const handleItemSelect = (items: NormalizedInventoryItem[]) => {
    setSelectedItems(items);
    setCurrentStep(1);
  };

  const handleTradeCreated = (trade: { 
    trade_id: string; 
    token: string; 
    status: string; 
    total_value: number; 
    net_value: number;
    fees: { cashout_fee: number; network_fee: number };
    expires_at: Date;
  }) => {
    setTradeData(trade);
    setCurrentStep(2);
    toast.success(messages.sellPage.successMessages.tradeCreated);
  };

  const formatPrice = (centimes: number) => {
    return (centimes / 100).toFixed(2) + "€";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              {messages.dashboard.loginRequired}
            </h2>
            <p className="text-muted-foreground mb-6">
              {messages.sellPage.loginDescription}
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
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {messages.sellPage.title}
          </h1>
          <p className="text-muted-foreground">{messages.sellPage.subtitle}</p>
        </motion.div>

        {/* Progress Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      index <= currentStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-20 h-0.5 ml-6 ${
                      index < currentStep ? "bg-orange-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress
            value={(currentStep / (steps.length - 1)) * 100}
            className="h-2"
          />
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {currentStep === 0 && (
            <SkinplaceInventoryViewer
              steamId64={user.steamId64}
              onItemSelect={handleItemSelect}
              selectable={true}
              allowSteamIdChange={true}
              onSteamIdChange={(newId) => setActiveSteamId(newId)}
            />
          )}

          {currentStep === 1 && (
            <SkinplaceTradeCreator
              steamId64={activeSteamId || user.steamId64}
              selectedItems={selectedItems}
              onTradeCreated={handleTradeCreated}
            />
          )}

          {currentStep === 2 && tradeData && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h2 className="text-2xl font-bold mb-2">
                    {messages.sellPage.confirmation.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {messages.sellPage.confirmation.description}
                  </p>

                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {messages.sellPage.confirmation.tradeIdSteam}
                        </span>
                        <p className="font-mono">{tradeData.trade_id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {messages.sellPage.confirmation.grossValue}
                        </span>
                        <p className="font-medium">
                          {formatPrice(tradeData.total_value)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {messages.sellPage.confirmation.totalFees}
                        </span>
                        <p className="font-medium text-orange-600">
                          -{formatPrice(tradeData.fees.cashout_fee + tradeData.fees.network_fee)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {messages.sellPage.confirmation.youWillReceive}
                        </span>
                        <p className="font-bold text-green-600">
                          {formatPrice(tradeData.net_value)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild className="bg-orange-500 hover:bg-orange-600">
                      <a
                        href="https://steamcommunity.com/my/tradeoffers/"
                        target="_blank"
                      >
                        {messages.sellPage.confirmation.acceptTrade}
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/dashboard">
                        {messages.sellPage.confirmation.trackTrade}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Processus de paiement */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {messages.sellPage.confirmation.howItWorksTitle}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Acceptez le trade sur Steam</p>
                        <p className="text-sm text-muted-foreground">
                          Allez sur Steam et acceptez l&apos;offre de trade de notre bot
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Trade Hold Steam (7 jours)</p>
                        <p className="text-sm text-muted-foreground">
                          Steam impose un délai de 7 jours avant que le trade soit finalisé
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Configurez votre paiement</p>
                        <p className="text-sm text-muted-foreground">
                          Pendant ces 7 jours, configurez votre méthode de paiement (SEPA ou crypto) dans votre dashboard
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Paiement automatique</p>
                        <p className="text-sm text-muted-foreground">
                          Après 7 jours, vous recevrez automatiquement {formatPrice(tradeData.net_value)} sur votre compte
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {messages.sellPage.confirmation.tip}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
