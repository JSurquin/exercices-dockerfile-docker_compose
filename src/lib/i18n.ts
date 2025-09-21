export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export interface Messages {
  nav: {
    home: string;
    sell: string;
    dashboard: string;
    giveaways: string;
    support: string;
    login: string;
    logout: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    features: {
      instant: string;
      secure: string;
      support: string;
    };
  };
  trade: {
    title: string;
    tradeLink: string;
    estimation: string;
    fees: string;
    cashoutFee: string;
    networkFee: string;
    total: string;
    confirm: string;
    timeline: string;
    status: {
      créé: string;
      accepté_par_bot: string;
      en_trade_hold: string;
      disponible: string;
      paiement_en_cours: string;
      payé: string;
      échoué: string;
    };
  };
  dashboard: {
    title: string;
    stats: string;
    volume: string;
    trades: string;
    xp: string;
    level: string;
    tickets: string;
    history: string;
  };
  kyc: {
    title: string;
    required: string;
    upload: string;
    pending: string;
    approved: string;
    rejected: string;
  };
  payments: {
    sepa: string;
    crypto: string;
    addMethod: string;
    verify: string;
    otp: string;
  };
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    continue: string;
    back: string;
  };
}

export const messages: Record<Locale, Messages> = {
  fr: {
    nav: {
      home: 'Accueil',
      sell: 'Vendre',
      dashboard: 'Dashboard',
      giveaways: 'Concours',
      support: 'Support',
      login: 'Connexion Steam',
      logout: 'Déconnexion',
    },
    hero: {
      title: 'Vendez vos skins CS2 en quelques clics',
      subtitle: 'La plateforme la plus rapide et sécurisée pour convertir vos skins en argent réel',
      cta: 'Commencer à vendre',
      features: {
        instant: 'Estimation instantanée',
        secure: 'Paiements sécurisés',
        support: 'Support 24/7',
      },
    },
    trade: {
      title: 'Vendre mes skins',
      tradeLink: 'Lien de trade Steam',
      estimation: 'Estimation',
      fees: 'Frais',
      cashoutFee: 'Frais de cashout (0,5%)',
      networkFee: 'Frais réseau',
      total: 'Total net',
      confirm: 'Confirmer la vente',
      timeline: 'Processus (7 jours)',
      status: {
        créé: 'Trade créé',
        accepté_par_bot: 'Accepté par le bot',
        en_trade_hold: 'En attente Steam (7j)',
        disponible: 'Prêt à payer',
        paiement_en_cours: 'Paiement en cours',
        payé: 'Payé',
        échoué: 'Échec',
      },
    },
    dashboard: {
      title: 'Mon Dashboard',
      stats: 'Statistiques',
      volume: 'Volume total',
      trades: 'Trades',
      xp: 'XP',
      level: 'Niveau',
      tickets: 'Tickets',
      history: 'Historique',
    },
    kyc: {
      title: 'Vérification KYC',
      required: 'Vérification requise pour les paiements',
      upload: 'Télécharger les documents',
      pending: 'En attente de vérification',
      approved: 'Vérifié',
      rejected: 'Rejeté',
    },
    payments: {
      sepa: 'Virement SEPA',
      crypto: 'Cryptomonnaie',
      addMethod: 'Ajouter un moyen de paiement',
      verify: 'Vérifier',
      otp: 'Code OTP',
    },
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      cancel: 'Annuler',
      continue: 'Continuer',
      back: 'Retour',
    },
  },
  en: {
    nav: {
      home: 'Home',
      sell: 'Sell',
      dashboard: 'Dashboard',
      giveaways: 'Giveaways',
      support: 'Support',
      login: 'Steam Login',
      logout: 'Logout',
    },
    hero: {
      title: 'Sell your CS2 skins in a few clicks',
      subtitle: 'The fastest and most secure platform to convert your skins to real money',
      cta: 'Start selling',
      features: {
        instant: 'Instant estimation',
        secure: 'Secure payments',
        support: '24/7 support',
      },
    },
    trade: {
      title: 'Sell my skins',
      tradeLink: 'Steam trade link',
      estimation: 'Estimation',
      fees: 'Fees',
      cashoutFee: 'Cashout fee (0.5%)',
      networkFee: 'Network fee',
      total: 'Net total',
      confirm: 'Confirm sale',
      timeline: 'Process (7 days)',
      status: {
        créé: 'Trade created',
        accepté_par_bot: 'Accepted by bot',
        en_trade_hold: 'Steam hold (7d)',
        disponible: 'Ready to pay',
        paiement_en_cours: 'Payment processing',
        payé: 'Paid',
        échoué: 'Failed',
      },
    },
    dashboard: {
      title: 'My Dashboard',
      stats: 'Statistics',
      volume: 'Total volume',
      trades: 'Trades',
      xp: 'XP',
      level: 'Level',
      tickets: 'Tickets',
      history: 'History',
    },
    kyc: {
      title: 'KYC Verification',
      required: 'Verification required for payments',
      upload: 'Upload documents',
      pending: 'Pending verification',
      approved: 'Verified',
      rejected: 'Rejected',
    },
    payments: {
      sepa: 'SEPA Transfer',
      crypto: 'Cryptocurrency',
      addMethod: 'Add payment method',
      verify: 'Verify',
      otp: 'OTP Code',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale];
}
