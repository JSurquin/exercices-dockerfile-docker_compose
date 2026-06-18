"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";

const MARKETING_EMAIL = "marketing@moonskin.eu";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const { messages } = useLocale();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    department: "",
    priority: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");

  const t = messages.contactPage;

  const getContactMethods = () => [
    {
      id: "liveChat",
      title: t.methods.liveChat.title,
      description: t.methods.liveChat.description,
      icon: ChatBubbleLeftRightIcon,
      availability: t.methods.liveChat.availability,
      responseTime: t.methods.liveChat.responseTime,
      color: "bg-green-500/15 text-green-400 border border-green-500/20",
      action: t.methods.liveChat.action,
    },
    {
      id: "email",
      title: t.methods.email.title,
      description: t.methods.email.description,
      icon: EnvelopeIcon,
      availability: t.methods.email.availability,
      responseTime: t.methods.email.responseTime,
      color: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
      action: MARKETING_EMAIL,
    },
    {
      id: "phone",
      title: t.methods.phone.title,
      description: t.methods.phone.description,
      icon: PhoneIcon,
      availability: t.methods.phone.availability,
      responseTime: t.methods.phone.responseTime,
      color: "bg-theme-accent/10 text-theme-accent border border-theme-accent/20",
      action: process.env.NEXT_PUBLIC_SUPPORT_PHONE || t.methods.phone.action,
    },
  ];

  const getDepartments = () => [
    {
      name: t.departmentsList.technical.name,
      email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg",
      description: t.departmentsList.technical.description,
      icon: QuestionMarkCircleIcon,
    },
    {
      name: t.departmentsList.security.name,
      email: `security@${(process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg").split("@")[1]}`,
      description: t.departmentsList.security.description,
      icon: ShieldCheckIcon,
    },
    {
      name: t.departmentsList.compliance.name,
      email: `compliance@${(process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@moonskin.gg").split("@")[1]}`,
      description: t.departmentsList.compliance.description,
      icon: DocumentTextIcon,
    },
    {
      name: t.departmentsList.partnerships.name,
      email: MARKETING_EMAIL,
      description: t.departmentsList.partnerships.description,
      icon: CurrencyEuroIcon,
    },
    {
      name: t.departmentsList.press.name,
      email: process.env.NEXT_PUBLIC_PRESS_EMAIL ?? "contact@moonskin.fun",
      description: t.departmentsList.press.description,
      icon: DocumentTextIcon,
    },
  ];

  const getOfficeHours = () => [
    t.schedule.weekdays,
    t.schedule.weekends,
    t.schedule.always,
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setFormStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        department: "",
        priority: "",
        message: "",
      });
    } catch {
      setFormStatus("error");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formStatus === "success" || formStatus === "error") {
      setFormStatus("idle");
    }
  };

  const openSupportChat = () => {
    window.dispatchEvent(new CustomEvent("open-support-chat", { detail: {} }));
  };

  const renderContactMethodButton = (method: ReturnType<typeof getContactMethods>[number]) => {
    if (method.id === "liveChat") {
      return (
        <Button variant="outline" size="sm" className="w-full cursor-pointer" onClick={openSupportChat}>
          {method.action}
        </Button>
      );
    }

    if (method.id === "email") {
      return (
        <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
          <a href={`mailto:${MARKETING_EMAIL}`}>{method.action}</a>
        </Button>
      );
    }

    const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE;
    if (phone) {
      return (
        <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
          <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
        </Button>
      );
    }

    return (
      <Button variant="outline" size="sm" className="w-full cursor-default" disabled>
        {method.action}
      </Button>
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-3xl md:text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            <EnvelopeIcon className="w-8 h-8 inline-block mr-2 text-theme-accent" />
            {messages.contact.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {messages.contact.subtitle}
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">{t.onlineStatus}</span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="lunar-card border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>{t.sendMessage}</CardTitle>
                </CardHeader>
                <CardContent>
                  {formStatus === "success" && (
                    <Alert className="mb-6 border-green-500/30 bg-green-500/10 text-green-100">
                      <CheckCircleIcon className="h-4 w-4 text-green-400" />
                      <AlertDescription>{t.formSuccess}</AlertDescription>
                    </Alert>
                  )}
                  {formStatus === "error" && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{t.formError}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t.fullName}</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder={t.fullNamePlaceholder}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.email}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder={t.emailPlaceholder}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">{t.department}</Label>
                        <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t.departmentPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {getDepartments().map((dept, index) => (
                              <SelectItem key={index} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">{t.priority}</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t.priorityPlaceholder} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t.priorities.low}</SelectItem>
                            <SelectItem value="medium">{t.priorities.medium}</SelectItem>
                            <SelectItem value="high">{t.priorities.high}</SelectItem>
                            <SelectItem value="urgent">{t.priorities.urgent}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t.subject}</Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        placeholder={t.subjectPlaceholder}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t.message}</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        placeholder={t.messagePlaceholder}
                        rows={6}
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <input type="checkbox" id="privacy" className="mt-1 cursor-pointer" required />
                      <Label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer">
                        {t.privacyConsent}{" "}
                        <a href="/privacy" className="text-theme-accent hover:underline cursor-pointer">
                          {t.privacyPolicy}
                        </a>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={formStatus === "submitting"}>
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      {formStatus === "submitting" ? t.formSubmitting : t.sendButton}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="lunar-card border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>{t.contactMethods}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getContactMethods().map((method, index) => (
                    <div key={method.id} className="space-y-3">
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
                              <span>{t.response} {method.responseTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {renderContactMethodButton(method)}
                      {index < getContactMethods().length - 1 && <hr className="border-white/10" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="lunar-card border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle>{t.departments}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getDepartments().map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <dept.icon className="w-5 h-5 text-theme-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">{dept.name}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{dept.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {dept.email}
                          </Badge>
                        </div>
                      </div>
                      {index < getDepartments().length - 1 && <hr className="border-white/10" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="lunar-card border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="w-5 h-5" />
                    <span>{t.supportHours}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getOfficeHours().map((schedule, index) => (
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="lunar-card border-white/10 bg-white/[0.03]">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5" />
                    <span>{t.offices}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">COUNTER TRADE FRANCE</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>53 T rue Auguste Blanqui</p>
                      <p>78800 Houilles, France</p>
                      <p>SIREN : 939 155 875</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-muted-foreground">
                      {t.companyInfo}
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
