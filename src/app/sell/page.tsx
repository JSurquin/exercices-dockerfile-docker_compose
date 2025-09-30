"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { InventoryViewer } from "@/components/skinplace/inventory-viewer";
import { TradeCreator } from "@/components/skinplace/trade-creator";
import { SkinplaceInventoryItem } from "@/lib/types";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

const getSteps = () => [
  { id: "inventory", title: "Sélection des items", icon: LinkIcon },
  { id: "trade", title: "Création du trade", icon: CurrencyDollarIcon },
  { id: "confirmation", title: "Confirmation", icon: CheckCircleIcon },
];

export default function SellPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getSteps();
  const [selectedItems, setSelectedItems] = useState<SkinplaceInventoryItem[]>([]);
  const [tradeData, setTradeData] = useState<{ trade_id: string; token: string; status: string; total_value: number; expires_at: Date } | null>(null);

  const handleItemSelect = (item: SkinplaceInventoryItem) => {
    setSelectedItems([item]);
    setCurrentStep(1);
  };

  const handleTradeCreated = (trade: { trade_id: string; token: string; status: string; total_value: number; expires_at: Date }) => {
    setTradeData(trade);
    setCurrentStep(2);
    toast.success("Trade créé avec succès !");
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
              Connexion requise
            </h2>
            <p className="text-muted-foreground mb-6">
              Vous devez être connecté avec Steam pour vendre vos skins.
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              Se connecter avec Steam
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
          className="text-center mb-6 sm:mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            Vendre vos skins CS2
          </h1>
          <p className="text-muted-foreground">Vendez vos skins Counter-Strike 2 instantanément et recevez votre argent rapidement</p>
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
            <InventoryViewer
              steamId={user.steamId64}
              onItemSelect={handleItemSelect}
              selectable={true}
            />
          )}

          {currentStep === 1 && (
            <TradeCreator
              steamId={user.steamId64}
              selectedItems={selectedItems}
              onTradeCreated={handleTradeCreated}
            />
          )}

          {currentStep === 2 && tradeData && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">
                  Trade créé avec succès !
                </h2>
                <p className="text-muted-foreground mb-6">
                  Votre trade a été créé et est en attente d&apos;acceptation.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        ID du trade:
                      </span>
                      <p className="font-mono">{tradeData.trade_id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Valeur totale:
                      </span>
                      <p className="font-bold text-green-600">
                        {formatPrice(tradeData.total_value)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <a href="/dashboard" target="_blank">
                      Suivre le trade
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://steamcommunity.com/my/tradeoffers/"
                      target="_blank"
                    >
                      Ouvrir Steam
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
