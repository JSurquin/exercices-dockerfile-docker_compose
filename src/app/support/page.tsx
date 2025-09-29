'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { Messages } from '@/lib/i18n';
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

const getFaqCategories = (messages: Messages) => [
  {
    id: 'general',
    title: messages.support.faq.categories.general,
    icon: QuestionMarkCircleIcon,
    questions: [
      {
        question: messages.support.faq.questions.howItWorks,
        answer: messages.support.faq.questions.howItWorksAnswer,
      },
      {
        question: messages.support.faq.questions.fees,
        answer: messages.support.faq.questions.feesAnswer,
      },
      {
        question: messages.support.faq.questions.processTime,
        answer: messages.support.faq.questions.processTimeAnswer,
      },
      {
        question: messages.support.faq.questions.priceCalculation,
        answer: messages.support.faq.questions.priceCalculationAnswer,
      },
    ],
  },
  {
    id: 'security',
    title: messages.support.faq.categories.security,
    icon: ShieldCheckIcon,
    questions: [
      {
        question: messages.support.faq.questions.whyKyc,
        answer: messages.support.faq.questions.whyKycAnswer,
      },
      {
        question: messages.support.faq.questions.dataSecurity,
        answer: messages.support.faq.questions.dataSecurityAnswer,
      },
      {
        question: messages.support.faq.questions.kycRejected,
        answer: messages.support.faq.questions.kycRejectedAnswer,
      },
      {
        question: messages.support.faq.questions.fraudProtection,
        answer: messages.support.faq.questions.fraudProtectionAnswer,
      },
    ],
  },
  {
    id: 'payments',
    title: messages.support.faq.categories.payments,
    icon: CurrencyDollarIcon,
    questions: [
      {
        question: messages.support.faq.questions.paymentMethods,
        answer: messages.support.faq.questions.paymentMethodsAnswer,
      },
      {
        question: messages.support.faq.questions.paymentTime,
        answer: messages.support.faq.questions.paymentTimeAnswer,
      },
      {
        question: messages.support.faq.questions.changePaymentMethod,
        answer: messages.support.faq.questions.changePaymentMethodAnswer,
      },
      {
        question: messages.support.faq.questions.minimumAmount,
        answer: messages.support.faq.questions.minimumAmountAnswer,
      },
    ],
  },
  {
    id: 'trading',
    title: messages.support.faq.categories.trading,
    icon: CreditCardIcon,
    questions: [
      {
        question: messages.support.faq.questions.acceptedSkins,
        answer: messages.support.faq.questions.acceptedSkinsAnswer,
      },
      {
        question: messages.support.faq.questions.steamRefusesTrade,
        answer: messages.support.faq.questions.steamRefusesTradeAnswer,
      },
      {
        question: messages.support.faq.questions.cancelTrade,
        answer: messages.support.faq.questions.cancelTradeAnswer,
      },
      {
        question: messages.support.faq.questions.xpSystem,
        answer: messages.support.faq.questions.xpSystemAnswer,
      },
    ],
  },
];

const getSupportStats = (messages: Messages) => [
  { label: messages.support.stats.responseTime, value: '< 2h', icon: ClockIcon },
  { label: messages.support.stats.resolutionRate, value: '98.5%', icon: CheckCircleIcon },
  { label: messages.support.stats.supportAvailable, value: '24/7', icon: ChatBubbleLeftRightIcon },
  { label: messages.support.stats.languagesSupported, value: 'FR, EN, CN', icon: DocumentTextIcon },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { messages } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqCategories = getFaqCategories(messages);
  const supportStats = getSupportStats(messages);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulation d'envoi du ticket
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(messages.support.contactForm.success);
      setContactForm({
        subject: '',
        category: '',
        priority: 'normal',
        message: '',
      });
    } catch {
      toast.error(messages.support.contactForm.error);
    } finally {
      setIsSubmitting(false);
    }
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
            <QuestionMarkCircleIcon className="w-8 h-8 inline-block mr-2 text-orange-600" />
            {messages.support.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {messages.support.subtitle}
          </p>
        </motion.div>

        {/* Support Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 sm:mb-12"
        >
          {supportStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>{messages.support.faq.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {faqCategories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex items-center space-x-2"
                      >
                        <category.icon className="w-4 h-4" />
                        <span>{category.title}</span>
                      </Button>
                    ))}
                  </div>

                  {/* FAQ Content */}
                  {faqCategories.map((category) => (
                    selectedCategory === category.id && (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Accordion type="single" collapsible>
                          {category.questions.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                              <AccordionTrigger className="text-left">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </motion.div>
                    )
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    <span>{messages.support.quickActions.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    {messages.support.quickActions.checkTradeStatus}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    {messages.support.quickActions.paymentProblem}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    {messages.support.quickActions.kycQuestions}
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    {messages.support.quickActions.technicalIssue}
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>{messages.support.contactForm.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-3 sm:space-y-4">
                    {user && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <UserCircleIcon className="w-4 h-4" />
                          <span>{messages.support.contactForm.connectedAs}</span>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="subject">{messages.support.contactForm.subject} *</Label>
                      <Input
                        id="subject"
                        placeholder={messages.support.contactForm.subjectPlaceholder}
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">{messages.support.contactForm.category} *</Label>
                      <Select value={contactForm.category} onValueChange={(value) => setContactForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={messages.support.contactForm.categoryPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trading">{messages.support.contactForm.categories.trading}</SelectItem>
                          <SelectItem value="payment">{messages.support.contactForm.categories.payment}</SelectItem>
                          <SelectItem value="kyc">{messages.support.contactForm.categories.kyc}</SelectItem>
                          <SelectItem value="technical">{messages.support.contactForm.categories.technical}</SelectItem>
                          <SelectItem value="account">{messages.support.contactForm.categories.account}</SelectItem>
                          <SelectItem value="other">{messages.support.contactForm.categories.other}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">{messages.support.contactForm.priority}</Label>
                      <Select value={contactForm.priority} onValueChange={(value) => setContactForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>{messages.support.contactForm.priorities.low}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="normal">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <span>{messages.support.contactForm.priorities.normal}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full" />
                              <span>{messages.support.contactForm.priorities.high}</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span>{messages.support.contactForm.priorities.urgent}</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{messages.support.contactForm.message} *</Label>
                      <Textarea
                        id="message"
                        placeholder={messages.support.contactForm.messagePlaceholder}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={6}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || !contactForm.subject || !contactForm.category || !contactForm.message}
                    >
                      {isSubmitting ? messages.support.contactForm.submitting : messages.support.contactForm.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Alternative Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>{messages.support.otherContact.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">{messages.support.otherContact.discord.title}</h4>
                      <p className="text-sm text-muted-foreground">{messages.support.otherContact.discord.description}</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        {messages.support.otherContact.discord.button}
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{messages.support.otherContact.email.title}</h4>
                      <p className="text-sm text-muted-foreground">{messages.support.otherContact.email.address}</p>
                      <p className="text-xs text-muted-foreground">{messages.support.otherContact.email.responseTime}</p>
                    </div>

                    <div>
                      <h4 className="font-medium">{messages.support.otherContact.hours.title}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{messages.support.otherContact.hours.weekdays}</p>
                        <p>{messages.support.otherContact.hours.weekend}</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                          {messages.support.otherContact.hours.emergency}
                        </Badge>
                      </div>
                    </div>
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
