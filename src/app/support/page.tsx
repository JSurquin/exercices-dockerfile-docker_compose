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

const faqCategories = [
  {
    id: 'general',
    title: 'Questions générales',
    icon: QuestionMarkCircleIcon,
    questions: [
      {
        question: 'Comment fonctionne CashTrade ?',
        answer: 'CashTrade est une plateforme qui vous permet de vendre vos skins CS2 contre de l\'argent réel. Vous connectez votre compte Steam, ajoutez votre Trade Link, nous estimons vos skins en temps réel via l\'API Skinplace, puis nous créons un trade. Après le trade hold Steam de 7 jours, vous recevez automatiquement votre paiement.',
      },
      {
        question: 'Quels sont les frais ?',
        answer: 'Nous appliquons seulement 0,5% de frais de cashout sur le montant brut de votre vente. Des frais de réseau peuvent s\'appliquer selon votre méthode de paiement (environ 20€ pour SEPA, variable pour les cryptomonnaies). Aucun frais caché !',
      },
      {
        question: 'Combien de temps prend le processus ?',
        answer: 'Le processus complet prend environ 7-9 jours : estimation instantanée, création du trade (quelques minutes), trade hold Steam obligatoire (7 jours), puis paiement automatique (24-48h). Vous pouvez suivre l\'état en temps réel sur votre dashboard.',
      },
      {
        question: 'Comment sont calculés les prix des skins ?',
        answer: 'Nos prix sont basés sur l\'API Skinplace qui agrège les données de marché en temps réel. Les prix sont mis à jour toutes les 5 minutes pour refléter les fluctuations du marché. Nous utilisons la moyenne des prix de vente récents.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité & KYC',
    icon: ShieldCheckIcon,
    questions: [
      {
        question: 'Pourquoi dois-je faire un KYC ?',
        answer: 'Le KYC (Know Your Customer) est obligatoire selon la réglementation européenne pour lutter contre le blanchiment d\'argent. Il nous permet de vérifier votre identité et de sécuriser tous les paiements. Le processus est simple et prend généralement 24-48h.',
      },
      {
        question: 'Mes données sont-elles sécurisées ?',
        answer: 'Absolument. Nous utilisons un chiffrement SSL 256-bit pour toutes les communications. Vos documents KYC sont stockés de manière sécurisée et nous ne conservons que les références ID fournies par notre prestataire KYC. Nous sommes conformes RGPD.',
      },
      {
        question: 'Que faire si mon KYC est rejeté ?',
        answer: 'Si votre KYC est rejeté, vous recevrez un email avec les raisons du rejet. Vous pourrez alors corriger les problèmes et soumettre à nouveau vos documents. Les raisons courantes sont : documents illisibles, informations incohérentes, ou documents expirés.',
      },
      {
        question: 'Comment protégez-vous contre la fraude ?',
        answer: 'Nous avons plusieurs systèmes de protection : limitation du nombre de trades par jour, détection des pics d\'activité suspects, vérification des Trade Links, cooldown après changement d\'IBAN, et système de vérification renforcée pour les nouveaux comptes.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Paiements',
    icon: CurrencyDollarIcon,
    questions: [
      {
        question: 'Quelles méthodes de paiement acceptez-vous ?',
        answer: 'Nous supportons les virements SEPA (via Qonto) et les cryptomonnaies (Bitcoin, Ethereum, USDT, USDC). Les paiements SEPA nécessitent une vérification renforcée (OTP ou micro-virement) lors du premier paiement ou changement d\'IBAN.',
      },
      {
        question: 'Combien de temps prend un paiement ?',
        answer: 'Les virements SEPA prennent 24-48h ouvrées. Les paiements crypto sont généralement traités en quelques heures une fois les confirmations blockchain validées. Vous recevez une notification dès que le paiement est initié.',
      },
      {
        question: 'Puis-je changer ma méthode de paiement ?',
        answer: 'Oui, vous pouvez ajouter et modifier vos méthodes de paiement dans votre dashboard. Pour SEPA, un nouveau changement d\'IBAN nécessite une nouvelle vérification et un cooldown de 7 jours (sauf si micro-vérification validée).',
      },
      {
        question: 'Y a-t-il un montant minimum ?',
        answer: 'Le montant minimum pour un paiement est de 20€ nets (après déduction des frais). Cela permet de couvrir les frais de traitement et de réseau. Vous pouvez accumuler plusieurs trades avant de demander un paiement.',
      },
    ],
  },
  {
    id: 'trading',
    title: 'Trading & Skins',
    icon: CreditCardIcon,
    questions: [
      {
        question: 'Quels skins acceptez-vous ?',
        answer: 'Nous acceptons tous les skins CS2 tradables (non liés au compte). Les skins doivent être dans votre inventaire Steam et votre inventaire doit être public. Les skins StatTrak™ et avec stickers sont également acceptés.',
      },
      {
        question: 'Que se passe-t-il si Steam refuse le trade ?',
        answer: 'Si Steam refuse le trade (inventaire privé, Trade Link invalide, skins non tradables), nous annulons automatiquement la demande et vous en informons. Vous pouvez alors corriger le problème et relancer le processus.',
      },
      {
        question: 'Puis-je annuler un trade en cours ?',
        answer: 'Vous pouvez annuler un trade tant qu\'il n\'a pas été accepté sur Steam. Une fois le trade accepté et en trade hold, l\'annulation n\'est plus possible selon les règles de Steam. Contactez le support si vous avez un problème urgent.',
      },
      {
        question: 'Comment fonctionne le système XP et tickets ?',
        answer: 'Vous gagnez de l\'XP à chaque trade en fonction du volume (1 XP = 1€ de volume). Chaque niveau vous donne des tickets que vous pouvez utiliser dans nos giveaways pour gagner des skins gratuits. Plus vous tradez, plus vous montez de niveau !',
      },
    ],
  },
];

const supportStats = [
  { label: 'Temps de réponse moyen', value: '< 2h', icon: ClockIcon },
  { label: 'Taux de résolution', value: '98.5%', icon: CheckCircleIcon },
  { label: 'Support disponible', value: '24/7', icon: ChatBubbleLeftRightIcon },
  { label: 'Langues supportées', value: 'FR, EN, CN', icon: DocumentTextIcon },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    priority: 'normal',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulation d'envoi du ticket
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Ticket de support créé avec succès ! Vous recevrez une réponse sous 2h.');
      setContactForm({
        subject: '',
        category: '',
        priority: 'normal',
        message: '',
      });
    } catch {
      toast.error('Erreur lors de la création du ticket');
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
            Centre d&apos;aide
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trouvez des réponses à vos questions ou contactez notre équipe support
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
                    <span>Questions fréquentes</span>
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
                    <span>Actions rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Vérifier le statut de mon trade
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    Problème de paiement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Questions KYC
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                    Signaler un problème technique
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Contacter le support</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitTicket} className="space-y-3 sm:space-y-4">
                    {user && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <UserCircleIcon className="w-4 h-4" />
                          <span>Connecté en tant que:</span>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Input
                        id="subject"
                        placeholder="Décrivez brièvement votre problème"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie *</Label>
                      <Select value={contactForm.category} onValueChange={(value) => setContactForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trading">Problème de trade</SelectItem>
                          <SelectItem value="payment">Problème de paiement</SelectItem>
                          <SelectItem value="kyc">Question KYC</SelectItem>
                          <SelectItem value="technical">Problème technique</SelectItem>
                          <SelectItem value="account">Compte utilisateur</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priorité</Label>
                      <Select value={contactForm.priority} onValueChange={(value) => setContactForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span>Faible</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="normal">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                              <span>Normal</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full" />
                              <span>Élevée</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span>Urgente</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre problème en détail..."
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
                      {isSubmitting ? 'Envoi en cours...' : 'Envoyer le ticket'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Alternative Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Autres moyens de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium">Discord Community</h4>
                      <p className="text-sm text-muted-foreground">Rejoignez notre serveur Discord pour une aide rapide</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Rejoindre Discord
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Email Direct</h4>
                      <p className="text-sm text-muted-foreground">support@cashtrade.gg</p>
                      <p className="text-xs text-muted-foreground">Réponse sous 24h</p>
                    </div>

                    <div>
                      <h4 className="font-medium">Heures d&apos;ouverture</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Lun-Ven: 9h-18h (CET)</p>
                        <p>Sam-Dim: 10h-16h (CET)</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                          Support 24/7 pour urgences
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
