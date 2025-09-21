export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

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
    secondaryCta: string;
    badge: string;
    features: {
      instant: string;
      secure: string;
      transparent: string;
    };
    stats: {
      users: string;
      volume: string;
      trades: string;
      satisfaction: string;
    };
  };
  trade: {
    title: string;
    subtitle: string;
    tradeLink: string;
    estimation: string;
    fees: string;
    cashoutFee: string;
    networkFee: string;
    total: string;
    confirm: string;
    timeline: string;
    loginRequired: string;
    loginSubtitle: string;
    steamLogin: string;
    analyzing: string;
    confirming: string;
    created: string;
    accepted: string;
    tradeLinkPlaceholder: string;
    tradeLinkHelp: string;
    tradeLinkInfo: string;
    tradeLinkWarning: string;
    automaticPayment: string;
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
    subtitle: string;
    welcome: string;
    stats: string;
    volume: string;
    trades: string;
    xp: string;
    level: string;
    tickets: string;
    history: string;
    loginRequired: string;
    loginSubtitle: string;
    currentLevel: string;
    nextLevel: string;
    totalXp: string;
    xpForNext: string;
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
    connecting: string;
    online: string;
    steamLogin: string;
    confirmed: string;
    marketplace: string;
  };
}

export const messages: Record<Locale, Messages> = {
  fr: {
    nav: {
      home: "Accueil",
      sell: "Vendre",
      dashboard: "Dashboard",
      giveaways: "Concours",
      support: "Support",
      login: "Connexion Steam",
      logout: "Déconnexion",
    },
    hero: {
      title: "Vendez vos skins CS2 facilement",
      subtitle:
        "La plateforme la plus rapide et sécurisée pour convertir vos skins Counter-Strike 2 en argent réel",
      cta: "Vendre maintenant",
      secondaryCta: "Comment ça marche",
      badge: "Plateforme certifiée et sécurisée",
      features: {
        instant: "Estimation instantanée",
        secure: "Paiements sécurisés",
        transparent: "Frais transparents",
      },
      stats: {
        users: "Utilisateurs actifs",
        volume: "Millions d'€ traités",
        trades: "Trades réalisés",
        satisfaction: "Taux de satisfaction",
      },
    },
    trade: {
      title: "Vendre mes skins",
      subtitle: "Vendez vos skins CS2 en quelques étapes simples",
      tradeLink: "Trade Link Steam",
      estimation: "Estimation instantanée",
      fees: "Frais",
      cashoutFee: "Frais de cashout (0.5%)",
      networkFee: "Frais réseau SEPA",
      total: "Total net",
      confirm: "Confirmer la vente",
      timeline: "Processus (7 jours)",
      loginRequired: "Connexion requise",
      loginSubtitle:
        "Vous devez être connecté avec Steam pour vendre vos skins.",
      steamLogin: "Se connecter avec Steam",
      analyzing: "Chargement des items...",
      confirming: "Création du trade...",
      created: "Trade créé avec succès !",
      accepted:
        "Votre trade a été créé et envoyé. Acceptez l'offre sur Steam pour continuer.",
      tradeLinkPlaceholder:
        "https://steamcommunity.com/tradeoffer/new/?partner=...",
      tradeLinkHelp: "Comment obtenir mon Trade Link ?",
      tradeLinkInfo:
        'Ouvrez Steam et allez dans votre inventaire. Cliquez sur "Paramètres de confidentialité". Copiez l\'URL du Trade Link',
      tradeLinkWarning:
        "Assurez-vous que votre inventaire Steam est public et que votre Trade Link est valide. Nous ne pouvons pas accéder à un inventaire privé.",
      automaticPayment: "Paiement automatique dans 7 jours",
      status: {
        créé: "Créé",
        accepté_par_bot: "Accepté",
        en_trade_hold: "Trade Hold (7j)",
        disponible: "Prêt à payer",
        paiement_en_cours: "Paiement en cours",
        payé: "Payé",
        échoué: "Échec",
      },
    },
    dashboard: {
      title: "Mon Dashboard",
      subtitle: "Voici un aperçu de votre activité",
      welcome: "Bienvenue",
      stats: "Statistiques",
      volume: "Volume total",
      trades: "Trades",
      xp: "XP",
      level: "Niveau",
      tickets: "Tickets",
      history: "Historique",
      loginRequired: "Connexion requise",
      loginSubtitle: "Vous devez être connecté pour accéder à votre dashboard.",
      currentLevel: "Niveau",
      nextLevel: "pour le niveau",
      totalXp: "XP",
      xpForNext: "XP pour le niveau",
    },
    kyc: {
      title: "Vérification KYC",
      required: "Vérification requise pour les paiements",
      upload: "Télécharger les documents",
      pending: "En attente de vérification",
      approved: "Vérifié",
      rejected: "Rejeté",
    },
    payments: {
      sepa: "Virement SEPA",
      crypto: "Cryptomonnaie",
      addMethod: "Ajouter un moyen de paiement",
      verify: "Vérifier",
      otp: "Code OTP",
    },
    common: {
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      cancel: "Annuler",
      continue: "Continuer",
      back: "Retour",
      connecting: "Connexion...",
      online: "En ligne",
      steamLogin: "Steam Login",
      confirmed: "Confirmé",
      marketplace: "CS2 Marketplace",
    },
  },
  en: {
    nav: {
      home: "Home",
      sell: "Sell",
      dashboard: "Dashboard",
      giveaways: "Giveaways",
      support: "Support",
      login: "Steam Login",
      logout: "Logout",
    },
    hero: {
      title: "Sell your CS2 skins easily",
      subtitle:
        "The fastest and most secure platform to convert your Counter-Strike 2 skins into real money",
      cta: "Sell now",
      secondaryCta: "How it works",
      badge: "Certified and secure platform",
      features: {
        instant: "Instant estimation",
        secure: "Secure payments",
        transparent: "Transparent fees",
      },
      stats: {
        users: "Active users",
        volume: "Million € traded",
        trades: "Trades completed",
        satisfaction: "Satisfaction rate",
      },
    },
    trade: {
      title: "Sell my skins",
      subtitle: "Sell your CS2 skins in a few simple steps",
      tradeLink: "Steam Trade Link",
      estimation: "Instant estimation",
      fees: "Fees",
      cashoutFee: "Cashout fee (0.5%)",
      networkFee: "SEPA network fee",
      total: "Net total",
      confirm: "Confirm sale",
      timeline: "Process (7 days)",
      loginRequired: "Login required",
      loginSubtitle: "You must be logged in with Steam to sell your skins.",
      steamLogin: "Login with Steam",
      analyzing: "Loading items...",
      confirming: "Creating trade...",
      created: "Trade created successfully!",
      accepted:
        "Your trade has been created and sent. Accept the offer on Steam to continue.",
      tradeLinkPlaceholder:
        "https://steamcommunity.com/tradeoffer/new/?partner=...",
      tradeLinkHelp: "How to get my Trade Link?",
      tradeLinkInfo:
        'Open Steam and go to your inventory. Click on "Privacy Settings". Copy the Trade Link URL',
      tradeLinkWarning:
        "Make sure your Steam inventory is public and your Trade Link is valid. We cannot access a private inventory.",
      automaticPayment: "Automatic payment in 7 days",
      status: {
        créé: "Created",
        accepté_par_bot: "Accepted",
        en_trade_hold: "Trade Hold (7d)",
        disponible: "Ready to pay",
        paiement_en_cours: "Payment processing",
        payé: "Paid",
        échoué: "Failed",
      },
    },
    dashboard: {
      title: "My Dashboard",
      subtitle: "Here's an overview of your activity",
      welcome: "Welcome",
      stats: "Statistics",
      volume: "Total volume",
      trades: "Trades",
      xp: "XP",
      level: "Level",
      tickets: "Tickets",
      history: "History",
      loginRequired: "Login required",
      loginSubtitle: "You must be logged in to access your dashboard.",
      currentLevel: "Level",
      nextLevel: "to level",
      totalXp: "XP",
      xpForNext: "XP to level",
    },
    kyc: {
      title: "KYC Verification",
      required: "Verification required for payments",
      upload: "Upload documents",
      pending: "Pending verification",
      approved: "Verified",
      rejected: "Rejected",
    },
    payments: {
      sepa: "SEPA Transfer",
      crypto: "Cryptocurrency",
      addMethod: "Add payment method",
      verify: "Verify",
      otp: "OTP Code",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      continue: "Continue",
      back: "Back",
      connecting: "Connecting...",
      online: "Online",
      steamLogin: "Steam Login",
      confirmed: "Confirmed",
      marketplace: "CS2 Marketplace",
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale];
}
