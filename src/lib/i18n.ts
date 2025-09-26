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
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale];
}
