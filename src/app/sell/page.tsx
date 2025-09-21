"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { mockTradeItems } from "@/lib/mock-data";
import { TradeItem } from "@/lib/types";
import {
  LinkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

const steps = [
  { id: "tradelink", title: "Trade Link Steam", icon: LinkIcon },
  { id: "estimation", title: "Estimation", icon: CurrencyDollarIcon },
  { id: "confirmation", title: "Confirmation", icon: CheckCircleIcon },
];

export default function SellPage() {
  const { user } = useAuth();
  const { messages } = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [tradeLink, setTradeLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<TradeItem[]>([]);
  const [estimation, setEstimation] = useState({
    brutCentimes: 0,
    fraisCashout: 0,
    fraisReseau: 2000, // 20€ de frais réseau
    netCentimes: 0,
  });

  const calculateEstimation = (items: TradeItem[]) => {
    const brutCentimes = items.reduce(
      (sum, item) => sum + item.prixCentimes,
      0
    );
    const fraisCashout = Math.round(brutCentimes * 0.005); // 0.5%
    const fraisReseau = 2000; // 20€
    const netCentimes = brutCentimes - fraisCashout - fraisReseau;

    return {
      brutCentimes,
      fraisCashout,
      fraisReseau,
      netCentimes,
    };
  };

  const handleTradeLinkSubmit = async () => {
    if (!tradeLink.includes("steamcommunity.com/tradeoffer/new/")) {
      toast.error(
        "Lien de trade invalide. Veuillez copier le lien depuis Steam."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Simulation d'appel API pour récupérer les items
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Utilisation des données mockées
      setItems(mockTradeItems);
      const newEstimation = calculateEstimation(mockTradeItems);
      setEstimation(newEstimation);

      setCurrentStep(1);
      toast.success("Items chargés avec succès !");
    } catch {
      toast.error("Erreur lors de la récupération des items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTrade = async () => {
    setIsLoading(true);
    try {
      // Simulation de création du trade
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const ticketId = `TICK-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0")}`;

      toast.success(`Trade créé ! ID: ${ticketId}`);
      setCurrentStep(2);
    } catch {
      toast.error("Erreur lors de la création du trade");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (centimes: number) => {
    return (centimes / 100).toFixed(2) + "€";
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      "Consumer Grade": "bg-gray-500",
      "Industrial Grade": "bg-blue-500",
      "Mil-Spec": "bg-blue-600",
      Restricted: "bg-purple-500",
      Classified: "bg-pink-500",
      Covert: "bg-red-500",
      Extraordinary: "bg-yellow-500",
    };
    return colors[rarity as keyof typeof colors] || "bg-gray-500";
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-6 sm:p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{messages.trade.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">
              {messages.trade.loginSubtitle}
            </p>
            <Button onClick={() => (window.location.href = "/")}>
              {messages.trade.steamLogin}
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
            {messages.trade.title}
          </h1>
          <p className="text-muted-foreground">
            {messages.trade.subtitle}
          </p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LinkIcon className="w-5 h-5" />
                  <span>Lien de Trade Steam</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Comment trouver votre Trade Link ?
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                        <li>Ouvrez Steam et allez dans votre inventaire</li>
                        <li>
                          Cliquez sur &quot;Paramètres de confidentialité&quot;
                        </li>
                        <li>Copiez l&apos;URL du Trade Link</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradelink">URL du Trade Link Steam</Label>
                  <Input
                    id="tradelink"
                    placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..."
                    value={tradeLink}
                    onChange={(e) => setTradeLink(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        Important
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Assurez-vous que votre inventaire Steam est public et
                        que votre Trade Link est valide. Nous ne pouvons pas
                        accéder à un inventaire privé.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleTradeLinkSubmit}
                  disabled={!tradeLink || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading
                    ? "Chargement des items..."
                    : "Analyser l&apos;inventaire"}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 1 && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Items List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Items sélectionnés ({items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-3 sm:space-x-4 p-3 border rounded-lg"
                        >
                          <img
                            src={item.iconUrl}
                            alt={item.name}
                            className="w-16 h-16 rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-skin.png";
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.statTrak && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-orange-100 text-orange-800"
                                >
                                  StatTrak™
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.exterior}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div
                                className={`w-2 h-2 rounded-full ${getRarityColor(
                                  item.rarity
                                )}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {item.rarity}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatPrice(item.prixCentimes)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estimation Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CurrencyDollarIcon className="w-5 h-5" />
                      <span>Estimation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total brut</span>
                        <span className="font-semibold">
                          {formatPrice(estimation.brutCentimes)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Frais de cashout (0,5%)</span>
                        <span>-{formatPrice(estimation.fraisCashout)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Frais réseau</span>
                        <span>-{formatPrice(estimation.fraisReseau)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total net</span>
                        <span className="text-green-600">
                          {formatPrice(estimation.netCentimes)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Timeline</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trade hold Steam de 7 jours puis paiement automatique
                      </p>
                    </div>

                    <Button
                      onClick={handleConfirmTrade}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading
                        ? "Création du trade..."
                        : "Confirmer la vente"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">
                  Trade créé avec succès !
                </h2>
                <p className="text-muted-foreground mb-6">
                  Votre trade a été créé et envoyé. Acceptez l&apos;offre sur
                  Steam pour continuer.
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        ID du trade:
                      </span>
                      <p className="font-mono">TICK-20240921-0001</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Montant net:
                      </span>
                      <p className="font-bold text-green-600">
                        {formatPrice(estimation.netCentimes)}
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
