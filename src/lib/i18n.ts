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
    settings: string;
    language: string;
    lightMode: string;
    darkMode: string;
  };
  user: {
    level: string;
    xp: string;
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
      instantDesc: string;
      secureDesc: string;
      transparentDesc: string;
    };
    stats: {
      users: string;
      volume: string;
      trades: string;
      satisfaction: string;
    };
    tradeInterface: {
      estimation: string;
      totalBrut: string;
      cashoutFees: string;
      sepafees: string;
      totalNet: string;
    };
    testimonials: {
      name: string[];
      comment: string[];
      amount: string[];
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
    steps: {
      tradelink: string;
      estimation: string;
      confirmation: string;
    };
    tradelink: {
      title: string;
      helpTitle: string;
      helpSteps: string[];
      placeholder: string;
      important: string;
      importantText: string;
      analyzeButton: string;
      analyzingButton: string;
    };
    items: {
      selected: string;
      totalBrut: string;
      cashoutFees: string;
      networkFees: string;
      totalNet: string;
      timeline: string;
      timelineText: string;
      confirmButton: string;
      creatingButton: string;
    };
    success: {
      title: string;
      subtitle: string;
      tradeId: string;
      netAmount: string;
      followTrade: string;
      openSteam: string;
    };
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
  features: {
    title: string;
    subtitle: string;
    items: {
      security: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      payments: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      estimation: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      support: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      speed: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      international: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      gamification: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      affiliation: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
      analytics: {
        category: string;
        title: string;
        description: string;
        highlights: string[];
        badge: string;
      };
    };
    trustIndicators: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: {
      addTradeLink: {
        title: string;
        description: string;
        details: string[];
      };
      estimation: {
        title: string;
        description: string;
        details: string[];
      };
      kyc: {
        title: string;
        description: string;
        details: string[];
      };
      tradeHold: {
        title: string;
        description: string;
        details: string[];
      };
      payment: {
        title: string;
        description: string;
        details: string[];
      };
    };
    benefits: {
      automated: {
        title: string;
        description: string;
      };
      security: {
        title: string;
        description: string;
      };
      transparent: {
        title: string;
        description: string;
      };
    };
    cta: {
      title: string;
      description: string;
      primary: string;
      secondary: string;
    };
  };
  testimonials: {
    title: string;
    subtitle: string;
    rating: string;
    basedOn: string;
    reviews: string;
    items: {
      name: string[];
      comment: string[];
      amount: string[];
      items: string[];
      date: string[];
    };
    trustStats: {
      satisfaction: string;
      users: string;
      volume: string;
      support: string;
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
      tabs: {
        trades: string;
        analytics: string;
        payments: string;
        settings: string;
      };
      tradeHistory: {
        title: string;
        items: string;
        fees: string;
        timeline: string;
        cashout: string;
        network: string;
        accepted: string;
        available: string;
        others: string;
      };
      analytics: {
        tradingVolume: string;
        tradeStatus: string;
      };
      payments: {
        title: string;
        methods: string;
        verified: string;
        default: string;
        addMethod: string;
      };
      settings: {
        profile: string;
        security: string;
        twoFactor: string;
        twoFactorDesc: string;
        emailNotifications: string;
        emailNotificationsDesc: string;
        enabled: string;
      };
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
  toast: {
    itemsLoadedSuccess: string;
    itemsLoadError: string;
    tradeCreatedSuccess: string;
    tradeCreationError: string;
    settingsSavedSuccess: string;
    invalidTradeLink: string;
  };
  footer: {
    description: string;
    securedBy: string;
    company: string;
    support: string;
    legal: string;
    links: {
      about: string;
      blog: string;
      careers: string;
      press: string;
      helpCenter: string;
      contact: string;
      status: string;
      api: string;
      terms: string;
      privacy: string;
      kycPolicy: string;
      amlPolicy: string;
    };
    stats: {
      activeUsers: string;
      volumeProcessed: string;
      tradesCompleted: string;
      satisfactionRate: string;
    };
    disclaimer: string;
    copyright: string;
    socialLinks: {
      discord: string;
      twitter: string;
      reddit: string;
      youtube: string;
    };
  };
  support: {
    title: string;
    subtitle: string;
    stats: {
      responseTime: string;
      resolutionRate: string;
      supportAvailable: string;
      languagesSupported: string;
    };
    faq: {
      title: string;
      categories: {
        general: string;
        security: string;
        payments: string;
        trading: string;
      };
      questions: {
        howItWorks: string;
        howItWorksAnswer: string;
        fees: string;
        feesAnswer: string;
        processTime: string;
        processTimeAnswer: string;
        priceCalculation: string;
        priceCalculationAnswer: string;
        whyKyc: string;
        whyKycAnswer: string;
        dataSecurity: string;
        dataSecurityAnswer: string;
        kycRejected: string;
        kycRejectedAnswer: string;
        fraudProtection: string;
        fraudProtectionAnswer: string;
        paymentMethods: string;
        paymentMethodsAnswer: string;
        paymentTime: string;
        paymentTimeAnswer: string;
        changePaymentMethod: string;
        changePaymentMethodAnswer: string;
        minimumAmount: string;
        minimumAmountAnswer: string;
        acceptedSkins: string;
        acceptedSkinsAnswer: string;
        steamRefusesTrade: string;
        steamRefusesTradeAnswer: string;
        cancelTrade: string;
        cancelTradeAnswer: string;
        xpSystem: string;
        xpSystemAnswer: string;
      };
    };
    quickActions: {
      title: string;
      checkTradeStatus: string;
      paymentProblem: string;
      kycQuestions: string;
      technicalIssue: string;
    };
    contactForm: {
      title: string;
      connectedAs: string;
      subject: string;
      subjectPlaceholder: string;
      category: string;
      categoryPlaceholder: string;
      categories: {
        trading: string;
        payment: string;
        kyc: string;
        technical: string;
        account: string;
        other: string;
      };
      priority: string;
      priorities: {
        low: string;
        normal: string;
        high: string;
        urgent: string;
      };
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
    };
    otherContact: {
      title: string;
      discord: {
        title: string;
        description: string;
        button: string;
      };
      email: {
        title: string;
        address: string;
        responseTime: string;
      };
      hours: {
        title: string;
        weekdays: string;
        weekend: string;
        emergency: string;
      };
    };
  };
  giveaways: {
    title: string;
    subtitle: string;
    userTickets: {
      level: string;
      tickets: string;
      description: string;
    };
    howTicketsWork: {
      title: string;
      earn: {
        title: string;
        description: string;
      };
      participate: {
        title: string;
        description: string;
      };
      win: {
        title: string;
        description: string;
      };
    };
    tabs: {
      active: string;
      ended: string;
      myEntries: string;
    };
    card: {
      status: {
        active: string;
        ended: string;
        cancelled: string;
      };
      prize: string;
      price: string;
      participants: string;
      timeRemaining: string;
      endDate: string;
      ticketsSold: string;
      winner: string;
      ticketsToUse: string;
      participate: string;
      ticketsAvailable: string;
    };
    empty: {
      noActive: string;
      noActiveDescription: string;
      loginRequired: string;
      loginRequiredDescription: string;
      loginButton: string;
    };
    myEntries: {
      title: string;
      entries: {
        inProgress: string;
        lost: string;
      };
    };
    participation: {
      success: string;
      notEnoughTickets: string;
      loginRequired: string;
    };
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
      settings: "Paramètres",
      language: "Langue",
      lightMode: "Mode Clair",
      darkMode: "Mode Sombre",
    },
    user: {
      level: "Niveau",
      xp: "XP",
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
      instantDesc: "Prix en temps réel via notre API Skinplace intégrée",
      secureDesc: "SEPA, crypto, et KYC obligatoire pour votre sécurité",
      transparentDesc: "Seulement 0,5% de frais de cashout, pas de frais cachés",
    },
      stats: {
        users: "Utilisateurs actifs",
        volume: "Millions d'€ traités",
        trades: "Trades réalisés",
        satisfaction: "Taux de satisfaction",
      },
      tradeInterface: {
        estimation: "Estimation instantanée",
        totalBrut: "Total brut",
        cashoutFees: "Frais de cashout (0.5%)",
        sepafees: "Frais réseau SEPA",
        totalNet: "Total net",
      },
      testimonials: {
        name: ["ProGamer2024", "SkinMaster", "CSGOKing"],
        comment: ["Super rapide ! J'ai vendu mes skins et reçu mon paiement en seulement 2 jours après le trade hold Steam. Interface très claire et support réactif.", "Meilleur site pour vendre ses skins ! Processus simple, estimation précise, et paiement SEPA ultra rapide. Je recommande à 100%.", "Interface magnifique et très professionnelle. J'ai pu suivre mon trade en temps réel et les notifications m'ont tenu informé. Top !"],
        amount: ["1,234€", "987€", "2,156€"]
      },
    },
    features: {
      title: "Pourquoi choisir CashTrade ?",
      subtitle: "Une plateforme complète avec toutes les fonctionnalités dont vous avez besoin",
      items: {
        security: {
          category: "Sécurité",
          title: "Sécurité renforcée",
          description: "KYC obligatoire, chiffrement SSL 256-bit, et conformité RGPD européenne.",
          highlights: ["KYC obligatoire", "SSL 256-bit", "Conformité RGPD"],
          badge: "Certifié"
        },
        payments: {
          category: "Paiements",
          title: "Paiements multiples",
          description: "SEPA instantané, Bitcoin, Ethereum, USDT, et autres cryptomonnaies supportées.",
          highlights: ["SEPA instantané", "Bitcoin, ETH, USDT", "Paiements rapides"],
          badge: "Populaire"
        },
        estimation: {
          category: "Estimation",
          title: "Prix en temps réel",
          description: "API Skinplace intégrée pour des estimations précises et mises à jour en continu.",
          highlights: ["API Skinplace", "Temps réel", "Estimation précise"],
          badge: "Nouveau"
        },
        support: {
          category: "Support",
          title: "Support 24/7",
          description: "Équipe dédiée disponible 24h/24 et 7j/7 pour répondre à toutes vos questions.",
          highlights: ["24h/24 - 7j/7", "Équipe dédiée", "Réponse rapide"],
          badge: "Premium"
        },
        speed: {
          category: "Rapidité",
          title: "Processus rapide",
          description: "Trade hold Steam de 7 jours puis paiement automatique immédiat.",
          highlights: ["7 jours Steam", "Paiement auto", "Processus optimisé"],
          badge: "Efficace"
        },
        international: {
          category: "International",
          title: "Support multilingue",
          description: "Interface disponible en français, anglais, et chinois pour tous nos utilisateurs.",
          highlights: ["Français", "English", "中文"],
          badge: "Global"
        },
        gamification: {
          category: "Gamification",
          title: "Système XP & Tickets",
          description: "Gagnez de l'XP à chaque trade et des tickets pour participer aux giveaways.",
          highlights: ["XP par trade", "Système de niveaux", "Giveaways"],
          badge: "Fun"
        },
        affiliation: {
          category: "Affiliation",
          title: "Programme d'affiliation",
          description: "Gagnez 2% de commission sur chaque utilisateur que vous parrainez.",
          highlights: ["2% commission", "Paiements mensuels", "Suivi détaillé"],
          badge: "Lucratif"
        },
        analytics: {
          category: "Analytics",
          title: "Dashboard complet",
          description: "Suivez vos trades, vos gains, et vos statistiques avec des graphiques détaillés.",
          highlights: ["Graphiques détaillés", "Historique complet", "Export CSV"],
          badge: "Pro"
        }
      },
      trustIndicators: "Plus de 15,000 utilisateurs nous font confiance"
    },
    howItWorks: {
      title: "Comment ça marche ?",
      subtitle: "Un processus simple et sécurisé pour vendre vos skins CS2 en quelques étapes",
      steps: {
        addTradeLink: {
          title: "Ajoutez votre Trade Link",
          description: "Connectez-vous avec Steam et ajoutez votre lien de trade sécurisé.",
          details: ["Connexion Steam OpenID", "Validation automatique du lien", "Sécurité maximale"]
        },
        estimation: {
          title: "Estimation instantanée",
          description: "Notre IA analyse vos skins et vous donne le prix en temps réel.",
          details: ["Prix basés sur Skinplace API", "Mise à jour en temps réel", "Estimation précise"]
        },
        kyc: {
          title: "Vérification KYC",
          description: "Vérifiez votre identité pour sécuriser les paiements.",
          details: ["Processus rapide et simple", "Documents sécurisés", "Conformité légale"]
        },
        tradeHold: {
          title: "Trade Hold Steam (7j)",
          description: "Période de sécurité Steam obligatoire de 7 jours.",
          details: ["Sécurité Steam", "Suivi en temps réel", "Notifications automatiques"]
        },
        payment: {
          title: "Paiement automatique",
          description: "Recevez votre argent via SEPA ou crypto après la période.",
          details: ["Paiement SEPA rapide", "Support crypto multiple", "Frais transparents"]
        }
      },
      benefits: {
        automated: {
          title: "Processus entièrement automatisé",
          description: "Du trade à la réception de l'argent, tout est automatique."
        },
        security: {
          title: "Sécurité maximale",
          description: "KYC obligatoire, chiffrement SSL, et conformité européenne."
        },
        transparent: {
          title: "Frais transparents",
          description: "Seulement 0,5% de frais de cashout, pas de frais cachés."
        }
      },
      cta: {
        title: "Prêt à commencer ?",
        description: "Rejoignez des milliers d'utilisateurs qui ont déjà vendu leurs skins en toute sécurité",
        primary: "Commencer maintenant",
        secondary: "Voir nos tarifs"
      }
    },
    testimonials: {
      title: "Ce que disent nos utilisateurs",
      subtitle: "Plus de 15,000 utilisateurs nous font confiance pour vendre leurs skins",
      rating: "4.9",
      basedOn: "Basé sur",
      reviews: "avis",
      items: {
        name: ["ProGamer2024", "SkinMaster", "CSGOKing", "FrenchTrader", "TechSavvy", "CryptoFan"],
        comment: [
          "Super rapide ! J'ai vendu mes skins et reçu mon paiement en seulement 2 jours après le trade hold Steam. Interface très claire et support réactif.",
          "Meilleur site pour vendre ses skins ! Processus simple, estimation précise, et paiement SEPA ultra rapide. Je recommande à 100%.",
          "Interface magnifique et très professionnelle. J'ai pu suivre mon trade en temps réel et les notifications m'ont tenu informé. Top !",
          "Parfait pour les français ! Support en français, paiement SEPA, et conformité européenne. Enfin une plateforme sérieuse.",
          "J'adore le système de gamification ! Gagner de l'XP et des tickets à chaque trade, c'est génial. En plus les giveaways sont top.",
          "Support crypto excellent ! Bitcoin, Ethereum, USDT... tout y est. Frais transparents et pas de mauvaises surprises."
        ],
        amount: ["1,234€", "987€", "2,156€", "675€", "445€", "1,789€"],
        items: ["AK-47 Redline + AWP Asiimov", "Glock Fade StatTrak™", "Karambit Fade + M4A4 Howl", "USP-S Kill Confirmed", "AK-47 Vulcan", "Dragon Lore Factory New"],
        date: ["Il y a 2 jours", "Il y a 5 jours", "Il y a 1 semaine", "Il y a 1 semaine", "Il y a 2 semaines", "Il y a 2 semaines"]
      },
      trustStats: {
        satisfaction: "Taux de satisfaction",
        users: "Utilisateurs actifs", 
        volume: "Volume traité",
        support: "Support disponible"
      }
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
      steps: {
        tradelink: "Trade Link Steam",
        estimation: "Estimation",
        confirmation: "Confirmation",
      },
      tradelink: {
        title: "Lien de Trade Steam",
        helpTitle: "Comment trouver votre Trade Link ?",
        helpSteps: [
          "Ouvrez Steam et allez dans votre inventaire",
          "Cliquez sur \"Paramètres de confidentialité\"",
          "Copiez l'URL du Trade Link"
        ],
        placeholder: "https://steamcommunity.com/tradeoffer/new/?partner=...",
        important: "Important",
        importantText: "Assurez-vous que votre inventaire Steam est public et que votre Trade Link est valide. Nous ne pouvons pas accéder à un inventaire privé.",
        analyzeButton: "Analyser l'inventaire",
        analyzingButton: "Chargement des items...",
      },
      items: {
        selected: "Items sélectionnés",
        totalBrut: "Total brut",
        cashoutFees: "Frais de cashout (0,5%)",
        networkFees: "Frais réseau",
        totalNet: "Total net",
        timeline: "Timeline",
        timelineText: "Trade hold Steam de 7 jours puis paiement automatique",
        confirmButton: "Confirmer la vente",
        creatingButton: "Création du trade...",
      },
      success: {
        title: "Trade créé avec succès !",
        subtitle: "Votre trade a été créé et envoyé. Acceptez l'offre sur Steam pour continuer.",
        tradeId: "ID du trade:",
        netAmount: "Montant net:",
        followTrade: "Suivre le trade",
        openSteam: "Ouvrir Steam",
      },
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
      tabs: {
        trades: "Mes Trades",
        analytics: "Analytics",
        payments: "Paiements",
        settings: "Paramètres",
      },
      tradeHistory: {
        title: "Historique des trades",
        items: "Items",
        fees: "Frais:",
        timeline: "Timeline:",
        cashout: "Cashout:",
        network: "Réseau:",
        accepted: "Accepté:",
        available: "Disponible:",
        others: "autres",
      },
      analytics: {
        tradingVolume: "Volume de trading",
        tradeStatus: "Statut des trades",
      },
      payments: {
        title: "Méthodes de paiement",
        methods: "Méthodes de paiement",
        verified: "Vérifié",
        default: "Par défaut",
        addMethod: "Ajouter une méthode de paiement",
      },
      settings: {
        profile: "Profil",
        security: "Sécurité",
        twoFactor: "Authentification 2FA",
        twoFactorDesc: "Protection supplémentaire",
        emailNotifications: "Notifications Email",
        emailNotificationsDesc: "Alertes de trading",
        enabled: "Activé",
      },
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
    toast: {
      itemsLoadedSuccess: "Items chargés avec succès !",
      itemsLoadError: "Erreur lors de la récupération des items",
      tradeCreatedSuccess: "Trade créé avec succès !",
      tradeCreationError: "Erreur lors de la création du trade",
      settingsSavedSuccess: "Paramètres sauvegardés avec succès",
      invalidTradeLink: "Lien de trade invalide. Veuillez copier le lien depuis Steam.",
    },
    footer: {
      description: "La plateforme la plus rapide et sécurisée pour convertir vos skins CS2 en argent réel. Vendez vos skins en toute confiance avec notre système de paiement sécurisé.",
      securedBy: "Sécurisé par :",
      company: "Entreprise",
      support: "Support",
      legal: "Légal",
      links: {
        about: "À propos",
        blog: "Blog",
        careers: "Carrières",
        press: "Presse",
        helpCenter: "Centre d'aide",
        contact: "Contact",
        status: "Status",
        api: "API",
        terms: "Conditions d'utilisation",
        privacy: "Politique de confidentialité",
        kycPolicy: "Politique KYC",
        amlPolicy: "Politique anti-blanchiment",
      },
      stats: {
        activeUsers: "Utilisateurs actifs",
        volumeProcessed: "Volume traité",
        tradesCompleted: "Trades réalisés",
        satisfactionRate: "Taux de satisfaction",
      },
      disclaimer: "Avertissement : CashTrade n'est pas affilié à Valve Corporation ou Steam. Counter-Strike et Steam sont des marques déposées de Valve Corporation. Le trading de skins comporte des risques et les prix peuvent fluctuer. Veuillez trader de manière responsable et ne jamais investir plus que ce que vous pouvez vous permettre de perdre.",
      copyright: "© 2024 CashTrade. Tous droits réservés. | Licence EU: CT-2024-001",
      socialLinks: {
        discord: "Discord",
        twitter: "Twitter",
        reddit: "Reddit",
        youtube: "YouTube",
      },
    },
    support: {
      title: "Centre d'aide",
      subtitle: "Trouvez des réponses à vos questions ou contactez notre équipe support",
      stats: {
        responseTime: "Temps de réponse moyen",
        resolutionRate: "Taux de résolution",
        supportAvailable: "Support disponible",
        languagesSupported: "Langues supportées",
      },
      faq: {
        title: "Questions fréquentes",
        categories: {
          general: "Questions générales",
          security: "Sécurité & KYC",
          payments: "Paiements",
          trading: "Trading & Skins",
        },
        questions: {
          howItWorks: "Comment fonctionne CashTrade ?",
          howItWorksAnswer: "CashTrade est une plateforme qui vous permet de vendre vos skins CS2 contre de l'argent réel. Vous connectez votre compte Steam, ajoutez votre Trade Link, nous estimons vos skins en temps réel via l'API Skinplace, puis nous créons un trade. Après le trade hold Steam de 7 jours, vous recevez automatiquement votre paiement.",
          fees: "Quels sont les frais ?",
          feesAnswer: "Nous appliquons seulement 0,5% de frais de cashout sur le montant brut de votre vente. Des frais de réseau peuvent s'appliquer selon votre méthode de paiement (environ 20€ pour SEPA, variable pour les cryptomonnaies). Aucun frais caché !",
          processTime: "Combien de temps prend le processus ?",
          processTimeAnswer: "Le processus complet prend environ 7-9 jours : estimation instantanée, création du trade (quelques minutes), trade hold Steam obligatoire (7 jours), puis paiement automatique (24-48h). Vous pouvez suivre l'état en temps réel sur votre dashboard.",
          priceCalculation: "Comment sont calculés les prix des skins ?",
          priceCalculationAnswer: "Nos prix sont basés sur l'API Skinplace qui agrège les données de marché en temps réel. Les prix sont mis à jour toutes les 5 minutes pour refléter les fluctuations du marché. Nous utilisons la moyenne des prix de vente récents.",
          whyKyc: "Pourquoi dois-je faire un KYC ?",
          whyKycAnswer: "Le KYC (Know Your Customer) est obligatoire selon la réglementation européenne pour lutter contre le blanchiment d'argent. Il nous permet de vérifier votre identité et de sécuriser tous les paiements. Le processus est simple et prend généralement 24-48h.",
          dataSecurity: "Mes données sont-elles sécurisées ?",
          dataSecurityAnswer: "Absolument. Nous utilisons un chiffrement SSL 256-bit pour toutes les communications. Vos documents KYC sont stockés de manière sécurisée et nous ne conservons que les références ID fournies par notre prestataire KYC. Nous sommes conformes RGPD.",
          kycRejected: "Que faire si mon KYC est rejeté ?",
          kycRejectedAnswer: "Si votre KYC est rejeté, vous recevrez un email avec les raisons du rejet. Vous pourrez alors corriger les problèmes et soumettre à nouveau vos documents. Les raisons courantes sont : documents illisibles, informations incohérentes, ou documents expirés.",
          fraudProtection: "Comment protégez-vous contre la fraude ?",
          fraudProtectionAnswer: "Nous avons plusieurs systèmes de protection : limitation du nombre de trades par jour, détection des pics d'activité suspects, vérification des Trade Links, cooldown après changement d'IBAN, et système de vérification renforcée pour les nouveaux comptes.",
          paymentMethods: "Quelles méthodes de paiement acceptez-vous ?",
          paymentMethodsAnswer: "Nous supportons les virements SEPA (via Qonto) et les cryptomonnaies (Bitcoin, Ethereum, USDT, USDC). Les paiements SEPA nécessitent une vérification renforcée (OTP ou micro-virement) lors du premier paiement ou changement d'IBAN.",
          paymentTime: "Combien de temps prend un paiement ?",
          paymentTimeAnswer: "Les virements SEPA prennent 24-48h ouvrées. Les paiements crypto sont généralement traités en quelques heures une fois les confirmations blockchain validées. Vous recevez une notification dès que le paiement est initié.",
          changePaymentMethod: "Puis-je changer ma méthode de paiement ?",
          changePaymentMethodAnswer: "Oui, vous pouvez ajouter et modifier vos méthodes de paiement dans votre dashboard. Pour SEPA, un nouveau changement d'IBAN nécessite une nouvelle vérification et un cooldown de 7 jours (sauf si micro-vérification validée).",
          minimumAmount: "Y a-t-il un montant minimum ?",
          minimumAmountAnswer: "Le montant minimum pour un paiement est de 20€ nets (après déduction des frais). Cela permet de couvrir les frais de traitement et de réseau. Vous pouvez accumuler plusieurs trades avant de demander un paiement.",
          acceptedSkins: "Quels skins acceptez-vous ?",
          acceptedSkinsAnswer: "Nous acceptons tous les skins CS2 tradables (non liés au compte). Les skins doivent être dans votre inventaire Steam et votre inventaire doit être public. Les skins StatTrak™ et avec stickers sont également acceptés.",
          steamRefusesTrade: "Que se passe-t-il si Steam refuse le trade ?",
          steamRefusesTradeAnswer: "Si Steam refuse le trade (inventaire privé, Trade Link invalide, skins non tradables), nous annulons automatiquement la demande et vous en informons. Vous pouvez alors corriger le problème et relancer le processus.",
          cancelTrade: "Puis-je annuler un trade en cours ?",
          cancelTradeAnswer: "Vous pouvez annuler un trade tant qu'il n'a pas été accepté sur Steam. Une fois le trade accepté et en trade hold, l'annulation n'est plus possible selon les règles de Steam. Contactez le support si vous avez un problème urgent.",
          xpSystem: "Comment fonctionne le système XP et tickets ?",
          xpSystemAnswer: "Vous gagnez de l'XP à chaque trade en fonction du volume (1 XP = 1€ de volume). Chaque niveau vous donne des tickets que vous pouvez utiliser dans nos giveaways pour gagner des skins gratuits. Plus vous tradez, plus vous montez de niveau !",
        },
      },
      quickActions: {
        title: "Actions rapides",
        checkTradeStatus: "Vérifier le statut de mon trade",
        paymentProblem: "Problème de paiement",
        kycQuestions: "Questions KYC",
        technicalIssue: "Signaler un problème technique",
      },
      contactForm: {
        title: "Contacter le support",
        connectedAs: "Connecté en tant que:",
        subject: "Sujet",
        subjectPlaceholder: "Décrivez brièvement votre problème",
        category: "Catégorie",
        categoryPlaceholder: "Sélectionnez une catégorie",
        categories: {
          trading: "Problème de trade",
          payment: "Problème de paiement",
          kyc: "Question KYC",
          technical: "Problème technique",
          account: "Compte utilisateur",
          other: "Autre",
        },
        priority: "Priorité",
        priorities: {
          low: "Faible",
          normal: "Normal",
          high: "Élevée",
          urgent: "Urgente",
        },
        message: "Message",
        messagePlaceholder: "Décrivez votre problème en détail...",
        submit: "Envoyer le ticket",
        submitting: "Envoi en cours...",
        success: "Ticket de support créé avec succès ! Vous recevrez une réponse sous 2h.",
        error: "Erreur lors de la création du ticket",
      },
      otherContact: {
        title: "Autres moyens de contact",
        discord: {
          title: "Discord Community",
          description: "Rejoignez notre serveur Discord pour une aide rapide",
          button: "Rejoindre Discord",
        },
        email: {
          title: "Email Direct",
          address: "support@cashtrade.gg",
          responseTime: "Réponse sous 24h",
        },
        hours: {
          title: "Heures d'ouverture",
          weekdays: "Lun-Ven: 9h-18h (CET)",
          weekend: "Sam-Dim: 10h-16h (CET)",
          emergency: "Support 24/7 pour urgences",
        },
      },
    },
    giveaways: {
      title: "Giveaways",
      subtitle: "Utilisez vos tickets pour participer aux giveaways et gagner des skins exceptionnels",
      userTickets: {
        level: "Niveau",
        tickets: "tickets",
        description: "Gagnez plus de tickets en vendant vos skins !",
      },
      howTicketsWork: {
        title: "Comment fonctionnent les tickets ?",
        earn: {
          title: "Gagnez des tickets",
          description: "Recevez des tickets à chaque trade en fonction du volume",
        },
        participate: {
          title: "Participez aux giveaways",
          description: "Utilisez vos tickets pour participer aux tirages au sort",
        },
        win: {
          title: "Remportez des prix",
          description: "Gagnez des skins exceptionnels et des récompenses exclusives",
        },
      },
      tabs: {
        active: "En cours",
        ended: "Terminés",
        myEntries: "Mes participations",
      },
      card: {
        status: {
          active: "En cours",
          ended: "Terminé",
          cancelled: "Annulé",
        },
        prize: "Prix à gagner",
        price: "Prix:",
        participants: "participants",
        timeRemaining: "Temps restant",
        endDate: "Date de fin",
        ticketsSold: "Tickets vendus",
        winner: "Gagnant:",
        ticketsToUse: "Nombre de tickets à utiliser:",
        participate: "Participer",
        ticketsAvailable: "tickets disponibles",
      },
      empty: {
        noActive: "Aucun giveaway actif",
        noActiveDescription: "Revenez bientôt pour découvrir de nouveaux giveaways !",
        loginRequired: "Connexion requise",
        loginRequiredDescription: "Connectez-vous pour voir vos participations",
        loginButton: "Se connecter avec Steam",
      },
      myEntries: {
        title: "Mes participations",
        entries: {
          inProgress: "En cours",
          lost: "Perdu",
        },
      },
      participation: {
        success: "Participation enregistrée !",
        notEnoughTickets: "Vous n'avez pas assez de tickets",
        loginRequired: "Vous devez être connecté pour participer",
      },
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
      settings: "Settings",
      language: "Language",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
    },
    user: {
      level: "Level",
      xp: "XP",
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
        instantDesc: "Real-time pricing via our integrated Skinplace API",
        secureDesc: "SEPA, crypto, and mandatory KYC for your security",
        transparentDesc: "Only 0.5% cashout fees, no hidden costs",
      },
      stats: {
        users: "Active users",
        volume: "Million € traded",
        trades: "Trades completed",
        satisfaction: "Satisfaction rate",
      },
      tradeInterface: {
        estimation: "Instant estimation",
        totalBrut: "Gross total",
        cashoutFees: "Cashout fees (0.5%)",
        sepafees: "SEPA network fees",
        totalNet: "Net total",
      },
      testimonials: {
        name: ["ProGamer2024", "SkinMaster", "CSGOKing"],
        comment: ["Super fast! I sold my skins and received my payment in just 2 days after the Steam trade hold. Very clear interface and responsive support.", "Best site to sell skins! Simple process, accurate estimation, and ultra-fast SEPA payment. I recommend 100%.", "Magnificent and very professional interface. I was able to follow my trade in real time and the notifications kept me informed. Top notch!"],
        amount: ["1,234€", "987€", "2,156€"]
      },
    },
    features: {
      title: "Why choose CashTrade?",
      subtitle: "A complete platform with all the features you need",
      items: {
        security: {
          category: "Security",
          title: "Enhanced security",
          description: "Mandatory KYC, 256-bit SSL encryption, and European GDPR compliance.",
          highlights: ["Mandatory KYC", "256-bit SSL", "GDPR Compliance"],
          badge: "Certified"
        },
        payments: {
          category: "Payments",
          title: "Multiple payments",
          description: "Instant SEPA, Bitcoin, Ethereum, USDT, and other supported cryptocurrencies.",
          highlights: ["Instant SEPA", "Bitcoin, ETH, USDT", "Fast payments"],
          badge: "Popular"
        },
        estimation: {
          category: "Estimation",
          title: "Real-time pricing",
          description: "Integrated Skinplace API for accurate estimates and continuous updates.",
          highlights: ["Skinplace API", "Real-time", "Accurate estimation"],
          badge: "New"
        },
        support: {
          category: "Support",
          title: "24/7 Support",
          description: "Dedicated team available 24/7 to answer all your questions.",
          highlights: ["24/7", "Dedicated team", "Quick response"],
          badge: "Premium"
        },
        speed: {
          category: "Speed",
          title: "Fast process",
          description: "7-day Steam trade hold then automatic immediate payment.",
          highlights: ["7 days Steam", "Auto payment", "Optimized process"],
          badge: "Efficient"
        },
        international: {
          category: "International",
          title: "Multilingual support",
          description: "Interface available in French, English, and Chinese for all our users.",
          highlights: ["French", "English", "中文"],
          badge: "Global"
        },
        gamification: {
          category: "Gamification",
          title: "XP & Tickets System",
          description: "Earn XP with each trade and tickets to participate in giveaways.",
          highlights: ["XP per trade", "Level system", "Giveaways"],
          badge: "Fun"
        },
        affiliation: {
          category: "Affiliation",
          title: "Affiliate program",
          description: "Earn 2% commission on each user you refer.",
          highlights: ["2% commission", "Monthly payments", "Detailed tracking"],
          badge: "Profitable"
        },
        analytics: {
          category: "Analytics",
          title: "Complete dashboard",
          description: "Track your trades, earnings, and statistics with detailed charts.",
          highlights: ["Detailed charts", "Complete history", "CSV export"],
          badge: "Pro"
        }
      },
      trustIndicators: "Over 15,000 users trust us"
    },
    howItWorks: {
      title: "How does it work?",
      subtitle: "A simple and secure process to sell your CS2 skins in a few steps",
      steps: {
        addTradeLink: {
          title: "Add your Trade Link",
          description: "Connect with Steam and add your secure trade link.",
          details: ["Steam OpenID connection", "Automatic link validation", "Maximum security"]
        },
        estimation: {
          title: "Instant estimation",
          description: "Our AI analyzes your skins and gives you the price in real time.",
          details: ["Skinplace API-based prices", "Real-time updates", "Accurate estimation"]
        },
        kyc: {
          title: "KYC verification",
          description: "Verify your identity to secure payments.",
          details: ["Quick and simple process", "Secure documents", "Legal compliance"]
        },
        tradeHold: {
          title: "Steam Trade Hold (7d)",
          description: "Mandatory 7-day Steam security period.",
          details: ["Steam security", "Real-time tracking", "Automatic notifications"]
        },
        payment: {
          title: "Automatic payment",
          description: "Receive your money via SEPA or crypto after the period.",
          details: ["Fast SEPA payment", "Multiple crypto support", "Transparent fees"]
        }
      },
      benefits: {
        automated: {
          title: "Fully automated process",
          description: "From trade to receiving money, everything is automatic."
        },
        security: {
          title: "Maximum security",
          description: "Mandatory KYC, SSL encryption, and European compliance."
        },
        transparent: {
          title: "Transparent fees",
          description: "Only 0.5% cashout fees, no hidden costs."
        }
      },
      cta: {
        title: "Ready to start?",
        description: "Join thousands of users who have already sold their skins securely",
        primary: "Start now",
        secondary: "View our pricing"
      }
    },
    testimonials: {
      title: "What our users say",
      subtitle: "Over 15,000 users trust us to sell their skins",
      rating: "4.9",
      basedOn: "Based on",
      reviews: "reviews",
      items: {
        name: ["ProGamer2024", "SkinMaster", "CSGOKing", "FrenchTrader", "TechSavvy", "CryptoFan"],
        comment: [
          "Super fast! I sold my skins and received my payment in just 2 days after the Steam trade hold. Very clear interface and responsive support.",
          "Best site to sell skins! Simple process, accurate estimation, and ultra-fast SEPA payment. I recommend 100%.",
          "Magnificent and very professional interface. I was able to follow my trade in real time and notifications kept me informed. Top notch!",
          "Perfect for French! French support, SEPA payment, and European compliance. Finally, a serious platform.",
          "I love the gamification system! Earning XP and tickets on each trade, it's great. Plus the giveaways are awesome.",
          "Excellent crypto support! Bitcoin, Ethereum, USDT... everything is there. Transparent fees and no surprises."
        ],
        amount: ["1,234€", "987€", "2,156€", "675€", "445€", "1,789€"],
        items: ["AK-47 Redline + AWP Asiimov", "Glock Fade StatTrak™", "Karambit Fade + M4A4 Howl", "USP-S Kill Confirmed", "AK-47 Vulcan", "Dragon Lore Factory New"],
        date: ["2 days ago", "5 days ago", "1 week ago", "1 week ago", "2 weeks ago", "2 weeks ago"]
      },
      trustStats: {
        satisfaction: "Satisfaction rate",
        users: "Active users",
        volume: "Volume processed",
        support: "Support available"
      }
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
      steps: {
        tradelink: "Steam Trade Link",
        estimation: "Estimation",
        confirmation: "Confirmation",
      },
      tradelink: {
        title: "Steam Trade Link",
        helpTitle: "How to find your Trade Link?",
        helpSteps: [
          "Open Steam and go to your inventory",
          "Click on \"Privacy settings\"",
          "Copy the Trade Link URL"
        ],
        placeholder: "https://steamcommunity.com/tradeoffer/new/?partner=...",
        important: "Important",
        importantText: "Make sure your Steam inventory is public and your Trade Link is valid. We cannot access a private inventory.",
        analyzeButton: "Analyze inventory",
        analyzingButton: "Loading items...",
      },
      items: {
        selected: "Selected items",
        totalBrut: "Gross total",
        cashoutFees: "Cashout fees (0.5%)",
        networkFees: "Network fees",
        totalNet: "Net total",
        timeline: "Timeline",
        timelineText: "Steam trade hold of 7 days then automatic payment",
        confirmButton: "Confirm sale",
        creatingButton: "Creating trade...",
      },
      success: {
        title: "Trade created successfully!",
        subtitle: "Your trade has been created and sent. Accept the offer on Steam to continue.",
        tradeId: "Trade ID:",
        netAmount: "Net amount:",
        followTrade: "Follow trade",
        openSteam: "Open Steam",
      },
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
      tabs: {
        trades: "My Trades",
        analytics: "Analytics",
        payments: "Payments",
        settings: "Settings",
      },
      tradeHistory: {
        title: "Trade History",
        items: "Items",
        fees: "Fees:",
        timeline: "Timeline:",
        cashout: "Cashout:",
        network: "Network:",
        accepted: "Accepted:",
        available: "Available:",
        others: "others",
      },
      analytics: {
        tradingVolume: "Trading Volume",
        tradeStatus: "Trade Status",
      },
      payments: {
        title: "Payment Methods",
        methods: "Payment Methods",
        verified: "Verified",
        default: "Default",
        addMethod: "Add payment method",
      },
      settings: {
        profile: "Profile",
        security: "Security",
        twoFactor: "2FA Authentication",
        twoFactorDesc: "Additional protection",
        emailNotifications: "Email Notifications",
        emailNotificationsDesc: "Trading alerts",
        enabled: "Enabled",
      },
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
    toast: {
      itemsLoadedSuccess: "Items loaded successfully!",
      itemsLoadError: "Error loading items",
      tradeCreatedSuccess: "Trade created successfully!",
      tradeCreationError: "Error creating trade",
      settingsSavedSuccess: "Settings saved successfully",
      invalidTradeLink: "Invalid trade link. Please copy the link from Steam.",
    },
    footer: {
      description: "The fastest and most secure platform to convert your CS2 skins into real money. Sell your skins with confidence using our secure payment system.",
      securedBy: "Secured by:",
      company: "Company",
      support: "Support",
      legal: "Legal",
      links: {
        about: "About",
        blog: "Blog",
        careers: "Careers",
        press: "Press",
        helpCenter: "Help Center",
        contact: "Contact",
        status: "Status",
        api: "API",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        kycPolicy: "KYC Policy",
        amlPolicy: "AML Policy",
      },
      stats: {
        activeUsers: "Active users",
        volumeProcessed: "Volume processed",
        tradesCompleted: "Trades completed",
        satisfactionRate: "Satisfaction rate",
      },
      disclaimer: "Disclaimer: CashTrade is not affiliated with Valve Corporation or Steam. Counter-Strike and Steam are registered trademarks of Valve Corporation. Skin trading involves risks and prices may fluctuate. Please trade responsibly and never invest more than you can afford to lose.",
      copyright: "© 2024 CashTrade. All rights reserved. | EU License: CT-2024-001",
      socialLinks: {
        discord: "Discord",
        twitter: "Twitter",
        reddit: "Reddit",
        youtube: "YouTube",
      },
    },
    support: {
      title: "Help Center",
      subtitle: "Find answers to your questions or contact our support team",
      stats: {
        responseTime: "Average response time",
        resolutionRate: "Resolution rate",
        supportAvailable: "Support available",
        languagesSupported: "Supported languages",
      },
      faq: {
        title: "Frequently Asked Questions",
        categories: {
          general: "General Questions",
          security: "Security & KYC",
          payments: "Payments",
          trading: "Trading & Skins",
        },
        questions: {
          howItWorks: "How does CashTrade work?",
          howItWorksAnswer: "CashTrade is a platform that allows you to sell your CS2 skins for real money. You connect your Steam account, add your Trade Link, we estimate your skins in real time via the Skinplace API, then we create a trade. After the 7-day Steam trade hold, you automatically receive your payment.",
          fees: "What are the fees?",
          feesAnswer: "We only apply 0.5% cashout fees on the gross amount of your sale. Network fees may apply depending on your payment method (around €20 for SEPA, variable for cryptocurrencies). No hidden fees!",
          processTime: "How long does the process take?",
          processTimeAnswer: "The complete process takes about 7-9 days: instant estimation, trade creation (a few minutes), mandatory Steam trade hold (7 days), then automatic payment (24-48h). You can track the status in real time on your dashboard.",
          priceCalculation: "How are skin prices calculated?",
          priceCalculationAnswer: "Our prices are based on the Skinplace API which aggregates real-time market data. Prices are updated every 5 minutes to reflect market fluctuations. We use the average of recent sale prices.",
          whyKyc: "Why do I need to do KYC?",
          whyKycAnswer: "KYC (Know Your Customer) is mandatory under European regulations to combat money laundering. It allows us to verify your identity and secure all payments. The process is simple and usually takes 24-48h.",
          dataSecurity: "Is my data secure?",
          dataSecurityAnswer: "Absolutely. We use 256-bit SSL encryption for all communications. Your KYC documents are stored securely and we only keep reference IDs provided by our KYC provider. We are GDPR compliant.",
          kycRejected: "What if my KYC is rejected?",
          kycRejectedAnswer: "If your KYC is rejected, you will receive an email with the reasons for rejection. You can then correct the issues and resubmit your documents. Common reasons are: unreadable documents, inconsistent information, or expired documents.",
          fraudProtection: "How do you protect against fraud?",
          fraudProtectionAnswer: "We have several protection systems: daily trade limits, suspicious activity spike detection, Trade Link verification, cooldown after IBAN changes, and enhanced verification system for new accounts.",
          paymentMethods: "What payment methods do you accept?",
          paymentMethodsAnswer: "We support SEPA transfers (via Qonto) and cryptocurrencies (Bitcoin, Ethereum, USDT, USDC). SEPA payments require enhanced verification (OTP or micro-transfer) for first payment or IBAN changes.",
          paymentTime: "How long does a payment take?",
          paymentTimeAnswer: "SEPA transfers take 24-48 business hours. Crypto payments are usually processed within a few hours once blockchain confirmations are validated. You receive a notification as soon as payment is initiated.",
          changePaymentMethod: "Can I change my payment method?",
          changePaymentMethodAnswer: "Yes, you can add and modify your payment methods in your dashboard. For SEPA, a new IBAN change requires new verification and a 7-day cooldown (unless micro-verification is validated).",
          minimumAmount: "Is there a minimum amount?",
          minimumAmountAnswer: "The minimum amount for a payment is €20 net (after deducting fees). This covers processing and network fees. You can accumulate multiple trades before requesting a payment.",
          acceptedSkins: "What skins do you accept?",
          acceptedSkinsAnswer: "We accept all tradable CS2 skins (not account-bound). Skins must be in your Steam inventory and your inventory must be public. StatTrak™ skins and those with stickers are also accepted.",
          steamRefusesTrade: "What happens if Steam refuses the trade?",
          steamRefusesTradeAnswer: "If Steam refuses the trade (private inventory, invalid Trade Link, non-tradable skins), we automatically cancel the request and inform you. You can then correct the problem and restart the process.",
          cancelTrade: "Can I cancel a trade in progress?",
          cancelTradeAnswer: "You can cancel a trade as long as it hasn't been accepted on Steam. Once the trade is accepted and in trade hold, cancellation is no longer possible according to Steam rules. Contact support if you have an urgent problem.",
          xpSystem: "How does the XP and tickets system work?",
          xpSystemAnswer: "You earn XP with each trade based on volume (1 XP = €1 volume). Each level gives you tickets that you can use in our giveaways to win free skins. The more you trade, the more you level up!",
        },
      },
      quickActions: {
        title: "Quick Actions",
        checkTradeStatus: "Check my trade status",
        paymentProblem: "Payment problem",
        kycQuestions: "KYC questions",
        technicalIssue: "Report a technical issue",
      },
      contactForm: {
        title: "Contact Support",
        connectedAs: "Connected as:",
        subject: "Subject",
        subjectPlaceholder: "Briefly describe your problem",
        category: "Category",
        categoryPlaceholder: "Select a category",
        categories: {
          trading: "Trading problem",
          payment: "Payment problem",
          kyc: "KYC question",
          technical: "Technical problem",
          account: "User account",
          other: "Other",
        },
        priority: "Priority",
        priorities: {
          low: "Low",
          normal: "Normal",
          high: "High",
          urgent: "Urgent",
        },
        message: "Message",
        messagePlaceholder: "Describe your problem in detail...",
        submit: "Send ticket",
        submitting: "Sending...",
        success: "Support ticket created successfully! You will receive a response within 2 hours.",
        error: "Error creating ticket",
      },
      otherContact: {
        title: "Other ways to contact",
        discord: {
          title: "Discord Community",
          description: "Join our Discord server for quick help",
          button: "Join Discord",
        },
        email: {
          title: "Direct Email",
          address: "support@cashtrade.gg",
          responseTime: "Response within 24h",
        },
        hours: {
          title: "Opening hours",
          weekdays: "Mon-Fri: 9am-6pm (CET)",
          weekend: "Sat-Sun: 10am-4pm (CET)",
          emergency: "24/7 support for emergencies",
        },
      },
    },
    giveaways: {
      title: "Giveaways",
      subtitle: "Use your tickets to participate in giveaways and win exceptional skins",
      userTickets: {
        level: "Level",
        tickets: "tickets",
        description: "Earn more tickets by selling your skins!",
      },
      howTicketsWork: {
        title: "How do tickets work?",
        earn: {
          title: "Earn tickets",
          description: "Receive tickets with each trade based on volume",
        },
        participate: {
          title: "Participate in giveaways",
          description: "Use your tickets to participate in raffles",
        },
        win: {
          title: "Win prizes",
          description: "Win exceptional skins and exclusive rewards",
        },
      },
      tabs: {
        active: "Active",
        ended: "Ended",
        myEntries: "My entries",
      },
      card: {
        status: {
          active: "Active",
          ended: "Ended",
          cancelled: "Cancelled",
        },
        prize: "Prize to win",
        price: "Price:",
        participants: "participants",
        timeRemaining: "Time remaining",
        endDate: "End date",
        ticketsSold: "Tickets sold",
        winner: "Winner:",
        ticketsToUse: "Number of tickets to use:",
        participate: "Participate",
        ticketsAvailable: "tickets available",
      },
      empty: {
        noActive: "No active giveaways",
        noActiveDescription: "Come back soon to discover new giveaways!",
        loginRequired: "Login required",
        loginRequiredDescription: "Log in to see your entries",
        loginButton: "Login with Steam",
      },
      myEntries: {
        title: "My entries",
        entries: {
          inProgress: "In progress",
          lost: "Lost",
        },
      },
      participation: {
        success: "Entry registered!",
        notEnoughTickets: "You don't have enough tickets",
        loginRequired: "You must be logged in to participate",
      },
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale];
}
