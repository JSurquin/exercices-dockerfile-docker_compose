"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CircleStackIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

type ServiceStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

interface Service {
  name: string;
  status: ServiceStatus;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  uptime: number;
  responseTime: number;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "low" | "medium" | "high";
  createdAt: Date;
  resolvedAt?: Date;
  description: string;
  updates: {
    time: Date;
    message: string;
    status: string;
  }[];
}

const getStatusIcon = (status: ServiceStatus) => {
  switch (status) {
    case "operational":
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    case "degraded":
      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
    case "partial_outage":
      return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
    case "major_outage":
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    case "maintenance":
      return <ClockIcon className="w-5 h-5 text-blue-500" />;
    default:
      return <CheckCircleIcon className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusText = (status: ServiceStatus) => {
  switch (status) {
    case "operational":
      return "Opérationnel";
    case "degraded":
      return "Dégradé";
    case "partial_outage":
      return "Panne partielle";
    case "major_outage":
      return "Panne majeure";
    case "maintenance":
      return "Maintenance";
    default:
      return "Inconnu";
  }
};

const getStatusColor = (status: ServiceStatus) => {
  switch (status) {
    case "operational":
      return "bg-green-100 text-green-800";
    case "degraded":
      return "bg-yellow-100 text-yellow-800";
    case "partial_outage":
      return "bg-orange-100 text-orange-800";
    case "major_outage":
      return "bg-red-100 text-red-800";
    case "maintenance":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function StatusPage() {
  const [services] = useState<Service[]>([
    {
      name: "Site Web",
      status: "operational",
      description: "Interface utilisateur principale",
      icon: GlobeAltIcon,
      uptime: 99.95,
      responseTime: 245,
    },
    {
      name: "API CashTrade",
      status: "operational",
      description: "API principal pour les trades",
      icon: CpuChipIcon,
      uptime: 99.99,
      responseTime: 120,
    },
    {
      name: "Base de données",
      status: "operational",
      description: "Stockage des données utilisateur",
      icon: CircleStackIcon,
      uptime: 99.98,
      responseTime: 15,
    },
    {
      name: "Paiements SEPA",
      status: "operational",
      description: "Traitement des virements bancaires",
      icon: CreditCardIcon,
      uptime: 99.92,
      responseTime: 2500,
    },
    {
      name: "Paiements Crypto",
      status: "operational",
      description: "Traitement des cryptomonnaies",
      icon: CreditCardIcon,
      uptime: 99.89,
      responseTime: 8000,
    },
    {
      name: "API Steam",
      status: "degraded",
      description: "Intégration avec Steam",
      icon: GlobeAltIcon,
      uptime: 98.5,
      responseTime: 1800,
    },
  ]);

  const [incidents] = useState<Incident[]>([
    {
      id: "inc_001",
      title: "Lenteurs API Steam",
      status: "monitoring",
      impact: "low",
      createdAt: new Date("2024-09-21T10:30:00Z"),
      description:
        "Nous observons des temps de réponse plus lents que d'habitude avec l&apos;API Steam, pouvant affecter les estimations de prix.",
      updates: [
        {
          time: new Date("2024-09-21T11:15:00Z"),
          message:
            "Nous continuons de surveiller la situation. Les services fonctionnent normalement mais avec des délais légèrement plus longs.",
          status: "monitoring",
        },
        {
          time: new Date("2024-09-21T10:30:00Z"),
          message:
            "Nous avons identifié des lenteurs avec l&apos;API Steam. Notre équipe technique enquête.",
          status: "identified",
        },
      ],
    },
  ]);

  const [overallStatus, setOverallStatus] =
    useState<ServiceStatus>("operational");

  useEffect(() => {
    // Déterminer le statut global basé sur les services
    const hasOutage = services.some((s) => s.status === "major_outage");
    const hasPartialOutage = services.some(
      (s) => s.status === "partial_outage"
    );
    const hasDegraded = services.some((s) => s.status === "degraded");
    const hasMaintenance = services.some((s) => s.status === "maintenance");

    if (hasOutage) {
      setOverallStatus("major_outage");
    } else if (hasPartialOutage) {
      setOverallStatus("partial_outage");
    } else if (hasDegraded) {
      setOverallStatus("degraded");
    } else if (hasMaintenance) {
      setOverallStatus("maintenance");
    } else {
      setOverallStatus("operational");
    }
  }, [services]);

  const averageUptime =
    services.reduce((acc, service) => acc + service.uptime, 0) /
    services.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Statut des services CashTrade
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Surveillez en temps réel la disponibilité de nos services
          </p>

          {/* Overall Status */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-3">
                  {getStatusIcon(overallStatus)}
                  <div>
                    <p className="font-semibold">Statut global</p>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(overallStatus)}
                    >
                      {getStatusText(overallStatus)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Overall Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {averageUptime.toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Disponibilité moyenne (30j)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {services.filter((s) => s.status === "operational").length}/
                {services.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Services opérationnels
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {incidents.filter((i) => i.status !== "resolved").length}
              </p>
              <p className="text-sm text-muted-foreground">Incidents actifs</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Services Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold mb-6">Services</h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <service.icon className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusIcon(service.status)}
                          <Badge
                            variant="secondary"
                            className={getStatusColor(service.status)}
                          >
                            {getStatusText(service.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Uptime: {service.uptime}%</p>
                          <p>Latence: {service.responseTime}ms</p>
                        </div>
                      </div>
                    </div>

                    {/* Uptime bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Disponibilité (30 jours)</span>
                        <span>{service.uptime}%</span>
                      </div>
                      <Progress value={service.uptime} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Incidents */}
        {incidents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-semibold mb-6">Incidents récents</h2>
            <div className="space-y-6">
              {incidents.map((incident, index) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {incident.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={
                              incident.impact === "low"
                                ? "border-yellow-500 text-yellow-700"
                                : incident.impact === "medium"
                                ? "border-orange-500 text-orange-700"
                                : "border-red-500 text-red-700"
                            }
                          >
                            Impact{" "}
                            {incident.impact === "low"
                              ? "faible"
                              : incident.impact === "medium"
                              ? "moyen"
                              : "élevé"}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              incident.status === "resolved"
                                ? "bg-green-100 text-green-800"
                                : incident.status === "monitoring"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {incident.status === "investigating"
                              ? "Enquête"
                              : incident.status === "identified"
                              ? "Identifié"
                              : incident.status === "monitoring"
                              ? "Surveillance"
                              : "Résolu"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {incident.description}
                      </p>

                      {/* Updates */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Mises à jour :</h4>
                        {incident.updates.map((update, updateIndex) => (
                          <div
                            key={updateIndex}
                            className="border-l-2 border-muted pl-4"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {update.time.toLocaleString("fr-FR")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {update.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {update.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">
                Cette page est mise à jour automatiquement toutes les 30
                secondes
              </p>
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleString("fr-FR")}
              </p>
              <div className="mt-4">
                <Badge variant="outline" className="mr-2">
                  📧 Alertes email disponibles
                </Badge>
                <Badge variant="outline">📱 API Status disponible</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
