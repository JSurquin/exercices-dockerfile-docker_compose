"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  CurrencyEuroIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const contactMethods = [
  {
    title: "Chat en direct",
    description: "Support instantané pour vos questions urgentes",
    icon: ChatBubbleLeftRightIcon,
    availability: "24/7",
    responseTime: "< 2 minutes",
    color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    action: "Démarrer le chat",
  },
  {
    title: "Email Support",
    description: "Pour les questions détaillées nécessitant un suivi",
    icon: EnvelopeIcon,
    availability: "24/7",
    responseTime: "< 2 heures",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    action: "support@cashtrade.gg",
  },
  {
    title: "Téléphone",
    description: "Assistance vocale pour les cas complexes",
    icon: PhoneIcon,
    availability: "Lun-Ven 9h-18h",
    responseTime: "Immédiat",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    action: "+33 1 23 45 67 89",
  },
];

const departments = [
  {
    name: "Support technique",
    email: "support@cashtrade.gg",
    description: "Problèmes de compte, trading, paiements",
    icon: QuestionMarkCircleIcon,
  },
  {
    name: "Sécurité & Fraude",
    email: "security@cashtrade.gg",
    description: "Signalement d'activités suspectes, sécurité",
    icon: ShieldCheckIcon,
  },
  {
    name: "Conformité & KYC",
    email: "compliance@cashtrade.gg",
    description: "Questions KYC, vérification d'identité",
    icon: DocumentTextIcon,
  },
  {
    name: "Partenariats",
    email: "business@cashtrade.gg",
    description: "Collaborations, intégrations, API",
    icon: CurrencyEuroIcon,
  },
  {
    name: "Presse & Médias",
    email: "press@cashtrade.gg",
    description: "Relations presse, communiqués, interviews",
    icon: DocumentTextIcon,
  },
];

const officeHours = [
  { day: "Lundi - Vendredi", hours: "9h00 - 18h00", type: "Support téléphonique" },
  { day: "Samedi - Dimanche", hours: "10h00 - 16h00", type: "Chat & Email uniquement" },
  { day: "24/7", hours: "Toujours disponible", type: "Chat en direct & Email" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    department: "",
    priority: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <EnvelopeIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            Nous contacter
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Notre équipe est là pour vous aider. Choisissez le moyen de contact qui vous convient le mieux.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Support en ligne - Temps de réponse moyen : 1.5 min</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Envoyer un message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Votre nom et prénom"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Département</Label>
                        <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir un département" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept, index) => (
                              <SelectItem key={index} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priorité</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Niveau de priorité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Élevée</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder="Résumé de votre demande"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder="Décrivez votre demande en détail..."
                        rows={6}
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <input type="checkbox" id="privacy" className="mt-1" required />
                      <Label htmlFor="privacy" className="text-sm text-muted-foreground">
                        J'accepte que mes données soient traitées conformément à notre{" "}
                        <a href="/privacy" className="text-orange-600 hover:underline">
                          politique de confidentialité
                        </a>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Moyens de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center flex-shrink-0`}>
                          <method.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{method.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                          <div className="flex flex-col space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-3 h-3" />
                              <span>{method.availability}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              <span>Réponse {method.responseTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        {method.action}
                      </Button>
                      {index < contactMethods.length - 1 && <hr />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Departments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Départements spécialisés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <dept.icon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">{dept.name}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{dept.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {dept.email}
                          </Badge>
                        </div>
                      </div>
                      {index < departments.length - 1 && <hr />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Office Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5" />
                    <span>Horaires de support</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {officeHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{schedule.day}</div>
                        <div className="text-xs text-muted-foreground">{schedule.type}</div>
                      </div>
                      <div className="text-sm text-right">
                        <div className="font-medium">{schedule.hours}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5" />
                    <span>Nos bureaux</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">CashTrade SAS</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>123 Rue de la Tech</p>
                      <p>75001 Paris, France</p>
                      <p>SIRET : 123 456 789 00012</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Société immatriculée au RCS de Paris. 
                      Agréée en tant qu'établissement de paiement par l'ACPR.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}