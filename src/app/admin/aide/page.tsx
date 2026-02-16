'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Shield,
  BarChart3,
  FileDown,
  Gift,
  Mail,
  MessageSquare,
  Activity,
  Settings,
  UserCheck,
  Percent,
  TrendingUp,
  FileText,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminAidePage() {
  const { messages } = useLocale();
  const t = messages.adminNav;

  const sections = [
    {
      id: 'overview',
      title: t.groups.overview,
      icon: LayoutDashboard,
      items: [
        {
          title: t.items.dashboard,
          href: '/admin/dashboard',
          desc: "Vue d'ensemble : statistiques globales, volume mensuel, trades récents. Onglet par défaut du dashboard. Utilisez les boutons « Exporter les données » et « Rapport complet » pour générer des PDF.",
        },
        {
          title: t.items.analytics,
          href: '/admin/dashboard?tab=analytics',
          desc: 'Graphiques et analytiques détaillées (volume, conversions, tendances). Analysez les performances de la plateforme sur la période choisie.',
        },
      ],
    },
    {
      id: 'management',
      title: t.groups.management,
      icon: Users,
      items: [
        {
          title: t.items.users,
          href: '/admin/dashboard?tab=users',
          desc: "Liste de tous les utilisateurs : recherche, filtre par statut KYC, export CSV. Cliquez sur « Voir » pour ouvrir la fiche utilisateur (solde, gel de compte, limites de retrait). Création d'utilisateur possible via le bouton dédié.",
        },
        {
          title: 'Fiche utilisateur',
          href: '/admin/dashboard?tab=users',
          desc: "Depuis la liste utilisateurs, lien « Voir » → page détail. Gestion du solde (ajuster, gel/dégel, historique des transactions) et des limites de retrait mensuelles (plafond en €). Compte gelé = aucun payout possible.",
        },
        {
          title: t.items.trades,
          href: '/admin/dashboard?tab=trades',
          desc: "Tous les trades : statuts (créé → accepté → trade hold → disponible → paiement en cours → payé/échoué), recherche, filtre par statut ou date, export. Suivez le cycle de vie de chaque vente.",
        },
        {
          title: t.items.payouts,
          href: '/admin/dashboard?tab=payouts',
          desc: "Paiements SEPA et crypto : états (en attente, vérification requise, vérifié, planifié, exécuté, payé, échoué, annulé). Vous pouvez annuler un payout dans les statuts annulables. Filtres et export disponibles.",
        },
        {
          title: t.items.kyc,
          href: '/admin/dashboard?tab=kyc',
          desc: "Validation des documents KYC (identité, selfie, domicile). Consultez les pièces, approuvez ou rejetez avec motif. Le KYC doit être validé avant tout payout. Bouton « Rafraîchir » pour resynchroniser avec le prestataire (Kycaid).",
        },
      ],
    },
    {
      id: 'affiliation',
      title: t.groups.affiliation,
      icon: UserCheck,
      items: [
        {
          title: t.items.applications,
          href: '/admin/affiliate-applications',
          desc: "Demandes d'affiliation : examinez et validez ou refusez les candidatures. Badge dans le menu indique le nombre de demandes en attente.",
        },
        {
          title: t.items.affiliates,
          href: '/admin/dashboard?tab=affiliates',
          desc: "Liste des affiliés actifs : code, parrainages, volume, commissions, taux. Création d'affilié manuelle, activation/désactivation, édition du taux de commission.",
        },
        {
          title: t.items.commissions,
          href: '/admin/dashboard?tab=commissions',
          desc: "Gestion des commissions affiliés : historique, calcul (par défaut 2 % du volume brut), recalcul possible via l'API dédiée.",
        },
        {
          title: t.items.performance,
          href: '/admin/dashboard?tab=affiliate-performance',
          desc: "Performances des affiliés (section en cours de développement). Métriques et classements prévus.",
        },
      ],
    },
    {
      id: 'marketing',
      title: t.groups.marketing,
      icon: Gift,
      items: [
        {
          title: t.items.giveaways,
          href: '/admin/giveaways',
          desc: "Création et gestion des giveaways : titre, description, lot, prix en tickets, nombre max de tickets, durée. Liste des giveaways, tirage au sort (RNG déterministe), suppression. Les utilisateurs dépensent des tickets pour participer.",
        },
        {
          title: t.items.newsletter,
          href: '/admin/newsletter',
          desc: "Newsletter : abonnés (liste, recherche, statut actif/inactif, export), campagnes (création, envoi, historique). Envoi d'emails groupés et suivi des envois.",
        },
      ],
    },
    {
      id: 'communication',
      title: t.groups.communication,
      icon: MessageSquare,
      items: [
        {
          title: t.items.chatSupport,
          href: '/admin/chat',
          desc: "Chat support : conversations avec les utilisateurs, attribution aux modérateurs, statistiques (conversations, messages). Gestion des modérateurs et des discussions en direct.",
        },
      ],
    },
    {
      id: 'content',
      title: t.groups.content,
      icon: FileText,
      items: [
        {
          title: t.items.legalPages,
          href: '/admin/legal-pages',
          desc: "Pages légales (CGU, confidentialité, KYC, AML, À propos, Presse) : édition FR/EN/CN, publication/dépublication, historique des versions, traduction. Éditeur WYSIWYG pour le contenu.",
        },
      ],
    },
    {
      id: 'system',
      title: t.groups.system,
      icon: Activity,
      items: [
        {
          title: t.items.audit,
          href: '/admin/audit',
          desc: "Audit & sécurité : journaux d'actions (qui a fait quoi, quand, IP), métriques (tentatives de connexion, actions admin, paiements). Filtres par type, gravité, utilisateur, période. Export et surveillance de la fraude.",
        },
        {
          title: t.items.exports,
          href: '/admin/dashboard?tab=exports',
          desc: "Exports configurables : choix du type (trades, utilisateurs, payouts, KYC, affiliés, giveaways), période (date début/fin), format CSV ou Excel. Historique des exports récents.",
        },
        {
          title: t.items.settings,
          href: '/admin/settings',
          desc: "Paramètres du compte admin : profil (nom, email, avatar), sécurité (changement de mot de passe), notifications (emails, alertes trades/sécurité, rapports hebdo), préférences (thème, langue, fuseau, disposition du dashboard).",
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        {...fadeIn}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent md:text-4xl">
              Aide Admin
            </h1>
            <p className="mt-1 text-slate-400">
              Guide complet pour utiliser la plateforme MoonSkin en tant qu&apos;administrateur
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-400" />
              Comment utiliser ce guide
            </CardTitle>
            <CardDescription className="text-slate-400">
              La barre latérale (ou le menu mobile) reprend les mêmes sections. Chaque bloc ci-dessous
              correspond à un groupe du menu. Cliquez sur les liens pour accéder directement à la
              section concernée. Les montants sont toujours en centimes en base de données et
              affichés en euros à l&apos;écran.
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <div className="space-y-10">
        {sections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.section
              key={section.id}
              {...fadeIn}
              transition={{ delay: 0.05 + sectionIndex * 0.03 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                  <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <Card
                    key={item.href + item.title}
                    className="bg-slate-800/30 border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={item.href}
                              className="font-medium text-orange-400 hover:text-orange-300 hover:underline"
                            >
                              {item.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                        </div>
                        {
                          <Button variant="ghost" size="sm" asChild className="shrink-0 text-slate-400 hover:text-orange-400">
                            <Link href={item.href} className="flex items-center gap-1">
                              <span className="hidden sm:inline">Ouvrir</span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {sectionIndex < sections.length - 1 && (
                <Separator className="mt-6 bg-slate-700" />
              )}
            </motion.section>
          );
        })}
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Rappels importants</CardTitle>
            <CardDescription className="text-slate-400">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>KYC obligatoire avant tout payout (SEPA ou crypto).</li>
                <li>Premier payout et changement d&apos;IBAN : vérification renforcée (OTP ou micro-virement).</li>
                <li>Calculs financiers en centimes ; affichage en euros.</li>
                <li>Trade hold Steam 7 jours avant disponibilité du solde.</li>
                <li>Exports et audit : consultez les logs pour la conformité et la sécurité.</li>
              </ul>
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </div>
  );
}
