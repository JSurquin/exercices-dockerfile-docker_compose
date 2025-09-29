export const locales = ["fr", "en", "cn"] as const;
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
    uploaded: string;
    kycSubmitted: string;
    saveError: string;
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
  about: {
    title: string;
    subtitle: string;
    mission: {
      title: string;
      description1: string;
      description2: string;
      description3: string;
    };
    values: {
      title: string;
      subtitle: string;
      security: {
        title: string;
        description: string;
      };
      community: {
        title: string;
        description: string;
      };
      innovation: {
        title: string;
        description: string;
      };
      simplicity: {
        title: string;
        description: string;
      };
    };
    team: {
      title: string;
      subtitle: string;
      members: {
        ceo: {
          name: string;
          role: string;
          bio: string;
        };
        cto: {
          name: string;
          role: string;
          bio: string;
        };
        product: {
          name: string;
          role: string;
          bio: string;
        };
        compliance: {
          name: string;
          role: string;
          bio: string;
        };
      };
    };
    timeline: {
      title: string;
      subtitle: string;
      events: {
        founding: {
          year: string;
          title: string;
          description: string;
        };
        mvp: {
          year: string;
          title: string;
          description: string;
        };
        crypto: {
          year: string;
          title: string;
          description: string;
        };
        gamification: {
          year: string;
          title: string;
          description: string;
        };
        international: {
          year: string;
          title: string;
          description: string;
        };
        future: {
          year: string;
          title: string;
          description: string;
        };
      };
    };
    cta: {
      title: string;
      description: string;
      start: string;
      discord: string;
    };
    stats: {
      users: string;
      volume: string;
      trades: string;
      countries: string;
    };
  };
  terms: {
    title: string;
    subtitle: string;
    lastUpdated: string;
    version: string;
    importantNotice: {
      title: string;
      content: string;
    };
    tableOfContents: string;
    sections: {
      acceptance: {
        title: string;
        content: string;
      };
      eligibility: {
        title: string;
        content: string;
      };
      services: {
        title: string;
        content: string;
      };
      trading: {
        title: string;
        content: string;
      };
      payments: {
        title: string;
        content: string;
      };
      kycSection: {
        title: string;
        content: string;
      };
      security: {
        title: string;
        content: string;
      };
      restrictions: {
        title: string;
        content: string;
      };
      liability: {
        title: string;
        content: string;
      };
      data: {
        title: string;
        content: string;
      };
      termination: {
        title: string;
        content: string;
      };
      governing: {
        title: string;
        content: string;
      };
    };
    contactInfo: {
      title: string;
      description: string;
      email: string;
      phone: string;
      support: string;
    };
  };
  privacy: {
    title: string;
    subtitle: string;
    lastUpdated: string;
    gdprCompliant: string;
    commitment: {
      title: string;
      description1: string;
      description2: string;
    };
    dataTypes: {
      title: string;
      identity: {
        category: string;
        data: string[];
        purpose: string;
        retention: string;
      };
      kyc: {
        category: string;
        data: string[];
        purpose: string;
        retention: string;
      };
      financial: {
        category: string;
        data: string[];
        purpose: string;
        retention: string;
      };
      usage: {
        category: string;
        data: string[];
        purpose: string;
        retention: string;
      };
    };
    legalBasis: {
      title: string;
      contract: {
        title: string;
        description: string;
      };
      legal: {
        title: string;
        description: string;
      };
      legitimate: {
        title: string;
        description: string;
      };
    };
    rights: {
      title: string;
      access: {
        title: string;
        description: string;
        action: string;
      };
      rectification: {
        title: string;
        description: string;
        action: string;
      };
      erasure: {
        title: string;
        description: string;
        action: string;
      };
      portability: {
        title: string;
        description: string;
        action: string;
      };
    };
    security: {
      title: string;
      description: string;
      technical: {
        title: string;
        measures: string[];
      };
      organizational: {
        title: string;
        measures: string[];
      };
    };
    sharing: {
      title: string;
      description: string;
      providers: {
        title: string;
        description: string;
      };
      legal: {
        title: string;
        description: string;
      };
      consent: {
        title: string;
        description: string;
      };
    };
    contact: {
      title: string;
      description: string;
      email: string;
      address: string;
      cnil: string;
    };
  };
  status: {
    title: string;
    subtitle: string;
    overall: {
      title: string;
      operational: string;
      degraded: string;
      partialOutage: string;
      majorOutage: string;
      maintenance: string;
    };
    stats: {
      uptime: string;
      operational: string;
      incidents: string;
    };
    services: {
      title: string;
      website: {
        name: string;
        description: string;
      };
      api: {
        name: string;
        description: string;
      };
      database: {
        name: string;
        description: string;
      };
      sepaPayments: {
        name: string;
        description: string;
      };
      cryptoPayments: {
        name: string;
        description: string;
      };
      steamApi: {
        name: string;
        description: string;
      };
    };
    incidents: {
      title: string;
      impact: {
        low: string;
        medium: string;
        high: string;
      };
      status: {
        investigating: string;
        identified: string;
        monitoring: string;
        resolved: string;
      };
      updates: string;
    };
    footer: {
      updateFrequency: string;
      lastUpdate: string;
      emailAlerts: string;
      apiStatus: string;
    };
  };
  settings: {
    title: string;
    subtitle: string;
    profile: {
      title: string;
      steamUsername: string;
      steamSync: string;
      memberSince: string;
      statistics: string;
      level: string;
      totalXp: string;
      tickets: string;
      volume: string;
    };
    security: {
      title: string;
      twoFactor: {
        title: string;
        description: string;
        enabled: string;
        configure: string;
      };
      kyc: {
        title: string;
        description: string;
        verified: string;
        pending: string;
        start: string;
      };
      sessions: {
        title: string;
        description: string;
        view: string;
      };
      gdpr: {
        title: string;
        description: string;
        export: string;
        delete: string;
      };
    };
    notifications: {
      title: string;
      email: {
        title: string;
        description: string;
      };
      trades: {
        title: string;
        description: string;
      };
      payments: {
        title: string;
        description: string;
      };
      push: {
        title: string;
        description: string;
      };
      marketing: {
        title: string;
        description: string;
      };
      save: string;
    };
    payments: {
      title: string;
      sepa: string;
      bitcoin: string;
      verified: string;
      default: string;
      modify: string;
      add: string;
      important: string;
      ibanWarning: string;
    };
    preferences: {
      title: string;
      language: {
        title: string;
        description: string;
        french: string;
        english: string;
      };
      theme: {
        title: string;
        description: string;
        light: string;
        dark: string;
        system: string;
      };
      save: string;
    };
    loginRequired: {
      title: string;
      description: string;
      login: string;
    };
    saveError: string;
  };
  admin: {
    title: string;
    subtitle: string;
    accessDenied: {
      title: string;
      description: string;
      home: string;
    };
    export: {
      users: string;
      trades: string;
      payouts: string;
    };
    stats: {
      totalUsers: string;
      totalVolume: string;
      totalTrades: string;
      revenue: string;
      monthly: string;
    };
    charts: {
      volume: string;
      newUsers: string;
    };
      users: {
        title: string;
        user: string;
        search: string;
        email: string;
        kyc: string;
        volume: string;
        trades: string;
        lastLogin: string;
        actions: string;
        allStatuses: string;
        verified: string;
        pending: string;
        rejected: string;
      };
    trades: {
      title: string;
      id: string;
      user: string;
      status: string;
      items: string;
      amount: string;
      date: string;
      actions: string;
    };
    payouts: {
      title: string;
      id: string;
      user: string;
      amount: string;
      method: string;
      status: string;
      date: string;
      actions: string;
    };
    kyc: {
      title: string;
      user: string;
      documents: string;
      status: string;
      submission: string;
      actions: string;
      pending: string;
      verified: string;
      rejected: string;
      id: string;
      selfie: string;
      address: string;
    };
  };
  kycPage: {
    title: string;
    subtitle: string;
    steps: {
      info: string;
      documents: string;
      selfie: string;
      address: string;
      review: string;
    };
    info: {
      title: string;
      description: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      address: string;
      city: string;
      postalCode: string;
      country: string;
      firstNamePlaceholder: string;
      lastNamePlaceholder: string;
      addressPlaceholder: string;
      cityPlaceholder: string;
      postalCodePlaceholder: string;
      countries: {
        france: string;
        belgium: string;
        switzerland: string;
        canada: string;
        usa: string;
      };
    };
    documents: {
      type: string;
      upload: string;
      description: string;
      tips: {
        title: string;
        lighting: string;
        readable: string;
        reflection: string;
        complete: string;
      };
      types: {
        id: string;
        passport: string;
        license: string;
      };
      uploaded: string;
    };
    selfie: {
      title: string;
      description: string;
      uploaded: string;
      instructions: {
        title: string;
        camera: string;
        visible: string;
        accessories: string;
        lighting: string;
      };
    };
    addressDoc: {
      title: string;
      optional: string;
      description: string;
      uploaded: string;
      skip: string;
    };
    review: {
      complete: string;
      description: string;
      personalInfo: string;
      documents: string;
      identity: string;
      selfie: string;
      addressDocument: string;
      delay: {
        title: string;
        description: string;
      };
      fullName: string;
      nationality: string;
      address: string;
    };
    navigation: {
      previous: string;
      next: string;
      submit: string;
      loading: string;
    };
    status: {
      verified: {
        title: string;
        description: string;
        dashboard: string;
      };
      inProgress: {
        title: string;
        description: string;
        dashboard: string;
      };
      rejected: {
        title: string;
        description: string;
        restart: string;
      };
      loginRequired: {
        title: string;
        description: string;
        login: string;
      };
    };
    toasts: {
      uploaded: string;
      submitted: string;
      error: string;
    };
  };
  sellPage: {
    helpSteps: string[];
    successMessages: {
      tradeCreated: string;
      followInstructions: string;
    };
  };
  giveawaysPage: {
    participationSuccess: string;
    available: string;
    myEntries: {
      title: string;
      inProgress: string;
      lost: string;
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
      youHave: string;
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
      uploaded: "téléchargé avec succès",
      kycSubmitted: "Dossier KYC soumis avec succès ! Vous recevrez une réponse sous 24-48h.",
      saveError: "Erreur lors de la sauvegarde",
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
      youHave: "Vous avez",
    },
    about: {
      title: "À propos de",
      subtitle: "Nous révolutionnons la façon dont les joueurs de Counter-Strike 2 transforment leurs skins en argent réel. Une plateforme sécurisée, transparente et innovante créée par des passionnés pour des passionnés.",
      mission: {
        title: "Notre Mission",
        description1: "Fondée en 2023 par une équipe de développeurs et de traders passionnés, CashTrade est née d'un constat simple : le trading de skins CS était trop complexe, peu sécurisé et souvent opaque.",
        description2: "Notre mission est de créer la plateforme de référence pour convertir vos skins en argent réel, en alliant sécurité maximale, transparence totale et expérience utilisateur exceptionnelle.",
        description3: "Nous croyons que chaque joueur devrait pouvoir monétiser facilement ses items virtuels, sans compromis sur la sécurité ou la simplicité."
      },
      values: {
        title: "Nos Valeurs",
        subtitle: "Les principes qui guident chacune de nos décisions et innovations",
        security: {
          title: "Sécurité avant tout",
          description: "Chaque transaction est protégée par les plus hauts standards de sécurité. KYC obligatoire, chiffrement SSL, et conformité européenne."
        },
        community: {
          title: "Communauté first",
          description: "Notre communauté de gamers est au cœur de tout ce que nous faisons. Support 24/7, écoute active, et amélioration continue."
        },
        innovation: {
          title: "Innovation continue",
          description: "Nous repoussons constamment les limites de ce qui est possible dans le trading de skins avec les dernières technologies."
        },
        simplicity: {
          title: "Simplicité",
          description: "Rendre le trading de skins accessible à tous, du débutant au trader expérimenté, avec une interface intuitive."
        }
      },
      team: {
        title: "Notre Équipe",
        subtitle: "Des experts passionnés qui travaillent chaque jour pour améliorer votre expérience",
        members: {
          ceo: {
            name: "Alexandre Martin",
            role: "CEO & Fondateur",
            bio: "Ex-ingénieur Steam, passionné de CS depuis 2003. Vision : démocratiser le trading de skins."
          },
          cto: {
            name: "Sophie Chen",
            role: "CTO",
            bio: "Experte sécurité blockchain, ex-Binance. Garantit la sécurité de chaque transaction."
          },
          product: {
            name: "Thomas Dubois",
            role: "Head of Product",
            bio: "Designer UX/UI passionné. Créateur des interfaces les plus intuitives du gaming."
          },
          compliance: {
            name: "Marie Leroy",
            role: "Head of Compliance",
            bio: "Ex-juriste fintech, spécialiste réglementation européenne. Assure la conformité légale."
          }
        }
      },
      timeline: {
        title: "Notre Histoire",
        subtitle: "De l'idée initiale aux perspectives d'avenir",
        events: {
          founding: {
            year: "2023",
            title: "Fondation de CashTrade",
            description: "Lancement de la startup avec une vision claire : révolutionner le trading de skins CS."
          },
          mvp: {
            year: "2024 Q1",
            title: "Première version",
            description: "Lancement de la plateforme MVP avec support SEPA et premiers 1000 utilisateurs."
          },
          crypto: {
            year: "2024 Q2",
            title: "Expansion crypto",
            description: "Ajout du support Bitcoin, Ethereum et stablecoins. Partenariat avec Binance."
          },
          gamification: {
            year: "2024 Q3",
            title: "Gamification",
            description: "Lancement du système XP, tickets et giveaways. Engagement utilisateur +300%."
          },
          international: {
            year: "2024 Q4",
            title: "International",
            description: "Expansion européenne, support multilingue, conformité RGPD complète."
          },
          future: {
            year: "2025",
            title: "Vision future",
            description: "Application mobile, API publique, support multi-jeux (Dota 2, TF2)."
          }
        }
      },
      cta: {
        title: "Rejoignez l'aventure CashTrade",
        description: "Faites partie de la révolution du trading de skins CS2. Une communauté de plus de 15,000 traders vous attend.",
        start: "Commencer à trader",
        discord: "Rejoindre Discord"
      },
      stats: {
        users: "Utilisateurs actifs",
        volume: "Volume traité",
        trades: "Trades réalisés",
        countries: "Pays supportés"
      }
    },
    terms: {
      title: "Conditions d'utilisation",
      subtitle: "Conditions générales d'utilisation de la plateforme CashTrade",
      lastUpdated: "Dernière mise à jour : 21 septembre 2024",
      version: "Version 1.2",
      importantNotice: {
        title: "Information importante",
        content: "Ces conditions d'utilisation constituent un contrat légalement contraignant entre vous et CashTrade. En utilisant nos services, vous acceptez d'être lié par l'ensemble de ces conditions. Veuillez les lire attentivement avant d'utiliser notre plateforme."
      },
      tableOfContents: "Table des matières",
      sections: {
        acceptance: {
          title: "1. Acceptation des conditions",
          content: "En utilisant CashTrade, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.\n\nCes conditions peuvent être modifiées à tout moment. Les modifications entreront en vigueur dès leur publication sur notre site. Il est de votre responsabilité de consulter régulièrement ces conditions."
        },
        eligibility: {
          title: "2. Conditions d'éligibilité",
          content: "Pour utiliser CashTrade, vous devez :\n• Être âgé d'au moins 18 ans\n• Avoir la capacité juridique de conclure des contrats\n• Résider dans un pays où nos services sont légalement disponibles\n• Posséder un compte Steam en règle\n• Compléter avec succès notre processus KYC (Know Your Customer)\n\nNous nous réservons le droit de refuser ou de suspendre l'accès à tout utilisateur ne respectant pas ces critères."
        },
        services: {
          title: "3. Description des services",
          content: "CashTrade fournit une plateforme permettant de :\n• Vendre des skins Counter-Strike 2 contre de l'argent réel\n• Recevoir des paiements via SEPA ou cryptomonnaies\n• Participer à des giveaways et concours\n• Accéder à des statistiques de trading\n\nNos services sont fournis \"en l'état\" et nous ne garantissons pas leur disponibilité ininterrompue."
        },
        trading: {
          title: "4. Processus de trading",
          content: "Le processus de vente comprend :\n• Connexion Steam et ajout du Trade Link\n• Estimation automatique des skins via API Skinplace\n• Acceptation des conditions de vente\n• Trade automatique avec notre bot\n• Période de trade hold Steam (7 jours obligatoires)\n• Paiement automatique après validation\n\nLes prix sont indicatifs et peuvent varier selon les conditions de marché. Une fois le trade accepté sur Steam, la vente est définitive."
        },
        payments: {
          title: "5. Paiements et frais",
          content: "Frais applicables :\n• Frais de cashout : 0,5% du montant brut\n• Frais de réseau variables selon la méthode de paiement\n• Aucun frais caché\n\nDélais de paiement :\n• SEPA : 24-48h ouvrées après trade hold\n• Crypto : Quelques heures après trade hold\n\nTous les montants sont calculés en centimes pour éviter les erreurs d'arrondi."
        },
        kycSection: {
          title: "6. Vérification KYC",
          content: "La vérification KYC est obligatoire pour :\n• Effectuer tout paiement\n• Respecter la réglementation anti-blanchiment\n• Assurer la sécurité de la plateforme\n\nDocuments requis :\n• Pièce d'identité valide (carte d'identité, passeport)\n• Selfie de vérification\n• Justificatif de domicile (optionnel)\n\nVos documents sont traités par un prestataire certifié et nous ne conservons que les références de vérification."
        },
        security: {
          title: "7. Sécurité et protection",
          content: "Nous mettons en place :\n• Chiffrement SSL 256-bit pour toutes les communications\n• Authentification à deux facteurs recommandée\n• Surveillance anti-fraude 24/7\n• Conformité aux standards de sécurité bancaires\n\nL'utilisateur s'engage à :\n• Protéger ses identifiants de connexion\n• Signaler immédiatement toute activité suspecte\n• Ne pas partager son compte avec des tiers"
        },
        restrictions: {
          title: "8. Utilisations interdites",
          content: "Il est strictement interdit de :\n• Utiliser la plateforme pour blanchir de l'argent\n• Créer plusieurs comptes pour contourner les limites\n• Utiliser des bots ou scripts automatisés\n• Tenter de manipuler les prix ou le système\n• Violer les conditions d'utilisation de Steam\n• Effectuer des activités frauduleuses\n\nToute violation peut entraîner la suspension immédiate du compte."
        },
        liability: {
          title: "9. Limitation de responsabilité",
          content: "CashTrade ne peut être tenu responsable :\n• Des fluctuations de prix des skins\n• Des interruptions de service temporaires\n• Des décisions de Steam concernant les trades\n• Des pertes indirectes ou consécutives\n• Des erreurs d'estimation dues aux conditions de marché\n\nNotre responsabilité est limitée au montant des frais payés pour le service concerné."
        },
        data: {
          title: "10. Protection des données",
          content: "Conformément au RGPD, vous avez le droit de :\n• Accéder à vos données personnelles\n• Demander leur rectification ou suppression\n• Vous opposer à leur traitement\n• Demander la portabilité de vos données\n\nNous conservons vos données uniquement le temps nécessaire aux obligations légales et réglementaires."
        },
        termination: {
          title: "11. Résiliation",
          content: "Vous pouvez résilier votre compte à tout moment via les paramètres.\n\nNous pouvons suspendre ou résilier votre compte en cas de :\n• Violation des présentes conditions\n• Activité frauduleuse ou suspecte\n• Non-respect des exigences KYC\n• Demande des autorités compétentes\n\nEn cas de résiliation, les trades en cours seront finalisés selon les conditions acceptées."
        },
        governing: {
          title: "12. Droit applicable",
          content: "Ces conditions sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux de Paris.\n\nEn cas de litige, nous encourageons la résolution amiable via notre service client avant toute action judiciaire."
        }
      },
      contactInfo: {
        title: "Questions sur ces conditions ?",
        description: "Notre équipe légale est disponible pour répondre à toutes vos questions concernant ces conditions d'utilisation.",
        email: "legal@cashtrade.gg",
        phone: "+33 1 23 45 67 89",
        support: "Support 24/7"
      }
    },
    privacy: {
      title: "Politique de confidentialité",
      subtitle: "Comment nous collectons, utilisons et protégeons vos données personnelles",
      lastUpdated: "Dernière mise à jour : 21 septembre 2024",
      gdprCompliant: "Conforme RGPD",
      commitment: {
        title: "Notre engagement",
        description1: "Chez CashTrade, la protection de vos données personnelles est notre priorité absolue. Cette politique explique comment nous collectons, utilisons, stockons et protégeons vos informations en conformité avec le Règlement Général sur la Protection des Données (RGPD) et les lois françaises.",
        description2: "Nous appliquons le principe de minimisation des données : nous ne collectons que les informations strictement nécessaires au fonctionnement de notre service et à nos obligations légales."
      },
      dataTypes: {
        title: "Types de données collectées",
        identity: {
          category: "Données d'identification",
          data: ["Nom et prénom", "Date de naissance", "Adresse email", "Steam ID", "Adresse IP"],
          purpose: "Authentification et vérification d'identité (KYC)",
          retention: "5 ans après fermeture du compte"
        },
        kyc: {
          category: "Données KYC",
          data: ["Pièce d'identité", "Selfie de vérification", "Justificatif de domicile"],
          purpose: "Conformité réglementaire anti-blanchiment",
          retention: "10 ans (obligation légale)"
        },
        financial: {
          category: "Données financières",
          data: ["IBAN (haché)", "Adresses crypto", "Historique transactions"],
          purpose: "Traitement des paiements et audit",
          retention: "7 ans (obligation comptable)"
        },
        usage: {
          category: "Données d'usage",
          data: ["Logs de connexion", "Activité de trading", "Préférences utilisateur"],
          purpose: "Amélioration du service et sécurité",
          retention: "2 ans maximum"
        }
      },
      legalBasis: {
        title: "Base légale du traitement",
        contract: {
          title: "Contrat",
          description: "Exécution de nos services de trading et paiement"
        },
        legal: {
          title: "Obligation légale",
          description: "Conformité KYC, lutte anti-blanchiment, obligations fiscales"
        },
        legitimate: {
          title: "Intérêt légitime",
          description: "Sécurité, prévention fraude, amélioration du service"
        }
      },
      rights: {
        title: "Vos droits RGPD",
        access: {
          title: "Droit d'accès",
          description: "Demander une copie de toutes vos données personnelles",
          action: "Télécharger mes données"
        },
        rectification: {
          title: "Droit de rectification",
          description: "Corriger ou mettre à jour vos informations personnelles",
          action: "Modifier mes données"
        },
        erasure: {
          title: "Droit à l'effacement",
          description: "Supprimer vos données (sauf obligations légales)",
          action: "Supprimer mon compte"
        },
        portability: {
          title: "Droit à la portabilité",
          description: "Récupérer vos données dans un format lisible",
          action: "Exporter mes données"
        }
      },
      security: {
        title: "Sécurité des données",
        description: "Nous mettons en œuvre des mesures de sécurité strictes pour protéger vos données :",
        technical: {
          title: "Mesures techniques :",
          measures: ["Chiffrement SSL/TLS 256-bit", "Chiffrement des données sensibles en base", "Authentification à deux facteurs", "Surveillance 24/7 des accès"]
        },
        organizational: {
          title: "Mesures organisationnelles :",
          measures: ["Accès limité aux données (need-to-know)", "Formation sécurité des employés", "Audits de sécurité réguliers", "Plan de réponse aux incidents"]
        }
      },
      sharing: {
        title: "Partage des données",
        description: "Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement dans les cas suivants :",
        providers: {
          title: "Prestataires de services",
          description: "Qonto (paiements SEPA), prestataire KYC, hébergeur cloud - sous contrat de confidentialité strict"
        },
        legal: {
          title: "Obligations légales",
          description: "Autorités fiscales, TRACFIN (lutte anti-blanchiment), autorités judiciaires sur réquisition"
        },
        consent: {
          title: "Votre consentement",
          description: "Avec votre accord explicite pour des services additionnels (partenariats, etc.)"
        }
      },
      contact: {
        title: "Contact Délégué à la Protection des Données",
        description: "Pour toute question concernant vos données personnelles ou pour exercer vos droits, contactez notre DPO.",
        email: "dpo@cashtrade.gg",
        address: "CashTrade - DPO, 123 Rue de la Tech, 75001 Paris",
        cnil: "Vous avez également le droit de déposer une plainte auprès de la CNIL en cas de manquement."
      }
    },
    status: {
      title: "Statut des services CashTrade",
      subtitle: "Surveillez en temps réel la disponibilité de nos services",
      overall: {
        title: "Statut global",
        operational: "Opérationnel",
        degraded: "Dégradé",
        partialOutage: "Panne partielle",
        majorOutage: "Panne majeure",
        maintenance: "Maintenance"
      },
      stats: {
        uptime: "Disponibilité moyenne (30j)",
        operational: "Services opérationnels",
        incidents: "Incidents actifs"
      },
      services: {
        title: "Services",
        website: {
          name: "Site Web",
          description: "Interface utilisateur principale"
        },
        api: {
          name: "API CashTrade",
          description: "API principal pour les trades"
        },
        database: {
          name: "Base de données",
          description: "Stockage des données utilisateur"
        },
        sepaPayments: {
          name: "Paiements SEPA",
          description: "Traitement des virements bancaires"
        },
        cryptoPayments: {
          name: "Paiements Crypto",
          description: "Traitement des cryptomonnaies"
        },
        steamApi: {
          name: "API Steam",
          description: "Intégration avec Steam"
        }
      },
      incidents: {
        title: "Incidents récents",
        impact: {
          low: "faible",
          medium: "moyen",
          high: "élevé"
        },
        status: {
          investigating: "Enquête",
          identified: "Identifié",
          monitoring: "Surveillance",
          resolved: "Résolu"
        },
        updates: "Mises à jour :"
      },
      footer: {
        updateFrequency: "Cette page est mise à jour automatiquement toutes les 30 secondes",
        lastUpdate: "Dernière mise à jour :",
        emailAlerts: "Alertes email disponibles",
        apiStatus: "API Status disponible"
      }
    },
    settings: {
      title: "Paramètres",
      subtitle: "Gérez vos préférences et paramètres de compte",
      profile: {
        title: "Informations du profil",
        steamUsername: "Nom d'utilisateur Steam",
        steamSync: "Synchronisé automatiquement avec Steam",
        memberSince: "Membre depuis",
        statistics: "Statistiques",
        level: "Niveau",
        totalXp: "XP Total",
        tickets: "Tickets",
        volume: "Volume"
      },
      security: {
        title: "Sécurité du compte",
        twoFactor: {
          title: "Authentification à deux facteurs (2FA)",
          description: "Protection supplémentaire de votre compte",
          enabled: "Activé",
          configure: "Configurer"
        },
        kyc: {
          title: "Vérification KYC",
          description: "Statut de vérification de votre identité",
          verified: "Vérifié",
          pending: "En attente",
          start: "Commencer KYC"
        },
        sessions: {
          title: "Sessions actives",
          description: "Gérez vos connexions actives",
          view: "Voir les sessions"
        },
        gdpr: {
          title: "Conformité RGPD",
          description: "Vous avez le droit d'accéder, modifier ou supprimer vos données personnelles.",
          export: "Exporter mes données",
          delete: "Supprimer mon compte"
        }
      },
      notifications: {
        title: "Préférences de notification",
        email: {
          title: "Notifications par email",
          description: "Recevoir des notifications importantes par email"
        },
        trades: {
          title: "Alertes de trade",
          description: "Notifications lors des changements d'état de vos trades"
        },
        payments: {
          title: "Alertes de paiement",
          description: "Notifications lors des paiements et transactions"
        },
        push: {
          title: "Notifications push",
          description: "Notifications push dans le navigateur"
        },
        marketing: {
          title: "Emails marketing",
          description: "Recevoir des informations sur les nouveautés et promotions"
        },
        save: "Sauvegarder les préférences"
      },
      payments: {
        title: "Méthodes de paiement",
        sepa: "SEPA - Qonto",
        bitcoin: "Bitcoin",
        verified: "Vérifié",
        default: "Par défaut",
        modify: "Modifier",
        add: "Ajouter une méthode de paiement",
        important: "Important",
        ibanWarning: "Tout changement d'IBAN nécessite une nouvelle vérification et un délai de 7 jours."
      },
      preferences: {
        title: "Préférences d'affichage",
        language: {
          title: "Langue",
          description: "Choisissez votre langue préférée",
          french: "🇫🇷 Français",
          english: "🇺🇸 English"
        },
        theme: {
          title: "Thème",
          description: "Choisissez votre thème d'affichage",
          light: "Clair",
          dark: "Sombre",
          system: "Système"
        },
        save: "Sauvegarder les préférences"
      },
      loginRequired: {
        title: "Connexion requise",
        description: "Vous devez être connecté pour accéder aux paramètres.",
        login: "Se connecter avec Steam"
      },
      saveError: "Erreur lors de la sauvegarde"
    },
    admin: {
      title: "Administration CashTrade",
      subtitle: "Gestion et supervision de la plateforme",
      accessDenied: {
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
        home: "Retour à l'accueil"
      },
      export: {
        users: "Export Utilisateurs",
        trades: "Export Trades",
        payouts: "Export Paiements"
      },
      stats: {
        totalUsers: "Utilisateurs totaux",
        totalVolume: "Volume total",
        totalTrades: "Trades totaux",
        revenue: "Revenus (frais)",
        monthly: "ce mois"
      },
      charts: {
        volume: "Volume de trading",
        newUsers: "Nouveaux utilisateurs"
      },
      users: {
        title: "Gestion des utilisateurs",
        user: "Utilisateur",
        search: "Rechercher un utilisateur...",
        email: "Email",
        kyc: "KYC",
        volume: "Volume",
        trades: "Trades",
        lastLogin: "Dernière connexion",
        actions: "Actions",
        allStatuses: "Tous les statuts",
        verified: "Vérifié",
        pending: "En attente",
        rejected: "Rejeté"
      },
      trades: {
        title: "Gestion des trades",
        id: "ID",
        user: "Utilisateur",
        status: "Statut",
        items: "Items",
        amount: "Montant",
        date: "Date",
        actions: "Actions"
      },
      payouts: {
        title: "Gestion des paiements",
        id: "ID",
        user: "Utilisateur",
        amount: "Montant",
        method: "Méthode",
        status: "Statut",
        date: "Date",
        actions: "Actions"
      },
      kyc: {
        title: "Gestion KYC",
        user: "Utilisateur",
        documents: "Documents",
        status: "Statut",
        submission: "Date de soumission",
        actions: "Actions",
        pending: "En attente",
        verified: "Vérifiés",
        rejected: "Rejetés",
        id: "ID",
        selfie: "Selfie",
        address: "Adresse"
      }
    },
    kycPage: {
      title: "Vérification KYC",
      subtitle: "Vérifiez votre identité pour accéder aux paiements sécurisés",
      steps: {
        info: "Informations personnelles",
        documents: "Pièce d'identité",
        selfie: "Selfie de vérification",
        address: "Justificatif de domicile",
        review: "Vérification"
      },
      info: {
        title: "Pourquoi ces informations ?",
        description: "Ces informations sont requises par la réglementation européenne pour lutter contre le blanchiment d'argent et garantir la sécurité des transactions.",
        firstName: "Prénom",
        lastName: "Nom de famille",
        dateOfBirth: "Date de naissance",
        nationality: "Nationalité",
        address: "Adresse complète",
        city: "Ville",
        postalCode: "Code postal",
        country: "Pays",
        firstNamePlaceholder: "Jean",
        lastNamePlaceholder: "Dupont",
        addressPlaceholder: "123 Rue de la Paix",
        cityPlaceholder: "Paris",
        postalCodePlaceholder: "75001",
        countries: {
          france: "France",
          belgium: "Belgique",
          switzerland: "Suisse",
          canada: "Canada",
          usa: "États-Unis"
        }
      },
      documents: {
        type: "Type de document",
        upload: "Télécharger votre pièce d'identité",
        description: "Assurez-vous que le document est lisible et que toutes les informations sont visibles",
        tips: {
          title: "Conseils pour une photo de qualité",
          lighting: "Prenez la photo dans un endroit bien éclairé",
          readable: "Assurez-vous que tous les textes sont lisibles",
          reflection: "Évitez les reflets et les ombres",
          complete: "Le document doit être entièrement visible"
        },
        types: {
          id: "Carte d'identité",
          passport: "Passeport",
          license: "Permis de conduire"
        },
        uploaded: "téléchargé"
      },
      selfie: {
        title: "Selfie de vérification",
        description: "Prenez un selfie clair de votre visage pour vérifier votre identité",
        uploaded: "Selfie téléchargé",
        instructions: {
          title: "Instructions pour le selfie",
          camera: "Regardez directement la caméra",
          visible: "Votre visage doit être entièrement visible",
          accessories: "Évitez les lunettes de soleil ou chapeaux",
          lighting: "L'éclairage doit être naturel et uniforme"
        }
      },
      addressDoc: {
        title: "Justificatif de domicile",
        optional: "Justificatif de domicile (optionnel)",
        description: "Cette étape est optionnelle mais peut accélérer la vérification. Documents acceptés : facture d'électricité, de gaz, d'eau, relevé bancaire, avis d'imposition (datant de moins de 3 mois).",
        uploaded: "téléchargé",
        skip: "Passer cette étape"
      },
      review: {
        complete: "Dossier complet",
        description: "Vérifiez vos informations avant de soumettre votre dossier KYC.",
        personalInfo: "Informations personnelles",
        documents: "Documents téléchargés",
        identity: "Pièce d'identité:",
        selfie: "Selfie de vérification",
        addressDocument: "Justificatif de domicile:",
        delay: {
          title: "Délai de vérification",
          description: "Votre dossier sera vérifié sous 24-48h ouvrées. Vous recevrez une notification par email une fois la vérification terminée."
        },
        fullName: "Nom complet:",
        nationality: "Nationalité:",
        address: "Adresse:"
      },
      navigation: {
        previous: "Précédent",
        next: "Suivant",
        submit: "Soumettre le dossier",
        loading: "Chargement..."
      },
      status: {
        verified: {
          title: "KYC Vérifié",
          description: "Votre identité a été vérifiée avec succès. Vous pouvez maintenant effectuer des paiements.",
          dashboard: "Retour au dashboard"
        },
        inProgress: {
          title: "KYC en cours de vérification",
          description: "Votre dossier KYC est en cours de vérification. Vous recevrez une réponse sous 24-48h.",
          dashboard: "Retour au dashboard"
        },
        rejected: {
          title: "KYC Rejeté",
          description: "Votre dossier KYC a été rejeté. Veuillez recommencer le processus avec des documents valides.",
          restart: "Recommencer le KYC"
        },
        loginRequired: {
          title: "Connexion requise",
          description: "Vous devez être connecté pour accéder au processus KYC.",
          login: "Se connecter avec Steam"
        }
      },
      toasts: {
        uploaded: "téléchargé avec succès",
        submitted: "Dossier KYC soumis avec succès ! Vous recevrez une réponse sous 24-48h.",
        error: "Erreur lors de la soumission du dossier KYC"
      }
    },
    sellPage: {
      helpSteps: ["Ouvrez Steam et allez dans votre inventaire", "Cliquez sur \"Paramètres de confidentialité\"", "Copiez l'URL du Trade Link"],
      successMessages: {
        tradeCreated: "Trade créé avec succès !",
        followInstructions: "Votre trade a été créé et envoyé. Acceptez l'offre sur Steam pour continuer."
      }
    },
    giveawaysPage: {
      participationSuccess: "Participation enregistrée !",
      available: "tickets disponibles",
      myEntries: {
        title: "Mes participations",
        inProgress: "En cours",
        lost: "Perdu"
      }
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
      uploaded: "uploaded successfully",
      kycSubmitted: "KYC file submitted successfully! You will receive a response within 24-48h.",
      saveError: "Error saving settings",
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
      youHave: "You have",
    },
    about: {
      title: "About",
      subtitle: "We revolutionize the way Counter-Strike 2 players turn their skins into real money. A secure, transparent and innovative platform created by enthusiasts for enthusiasts.",
      mission: {
        title: "Our Mission",
        description1: "Founded in 2023 by a team of passionate developers and traders, CashTrade was born from a simple observation: CS skin trading was too complex, not secure enough and often opaque.",
        description2: "Our mission is to create the reference platform to convert your skins into real money, combining maximum security, total transparency and exceptional user experience.",
        description3: "We believe that every player should be able to easily monetize their virtual items, without compromising on security or simplicity."
      },
      values: {
        title: "Our Values",
        subtitle: "The principles that guide each of our decisions and innovations",
        security: {
          title: "Security first",
          description: "Every transaction is protected by the highest security standards. Mandatory KYC, SSL encryption, and European compliance."
        },
        community: {
          title: "Community first",
          description: "Our gaming community is at the heart of everything we do. 24/7 support, active listening, and continuous improvement."
        },
        innovation: {
          title: "Continuous innovation",
          description: "We constantly push the boundaries of what's possible in skin trading with the latest technologies."
        },
        simplicity: {
          title: "Simplicity",
          description: "Making skin trading accessible to everyone, from beginner to experienced trader, with an intuitive interface."
        }
      },
      team: {
        title: "Our Team",
        subtitle: "Passionate experts who work every day to improve your experience",
        members: {
          ceo: {
            name: "Alexandre Martin",
            role: "CEO & Founder",
            bio: "Former Steam engineer, CS enthusiast since 2003. Vision: democratize skin trading."
          },
          cto: {
            name: "Sophie Chen",
            role: "CTO",
            bio: "Blockchain security expert, ex-Binance. Ensures the security of every transaction."
          },
          product: {
            name: "Thomas Dubois",
            role: "Head of Product",
            bio: "Passionate UX/UI designer. Creator of the most intuitive interfaces in gaming."
          },
          compliance: {
            name: "Marie Leroy",
            role: "Head of Compliance",
            bio: "Ex-fintech lawyer, European regulation specialist. Ensures legal compliance."
          }
        }
      },
      timeline: {
        title: "Our History",
        subtitle: "From the initial idea to future prospects",
        events: {
          founding: {
            year: "2023",
            title: "CashTrade Foundation",
            description: "Startup launch with a clear vision: revolutionize CS skin trading."
          },
          mvp: {
            year: "2024 Q1",
            title: "First version",
            description: "MVP platform launch with SEPA support and first 1000 users."
          },
          crypto: {
            year: "2024 Q2",
            title: "Crypto expansion",
            description: "Addition of Bitcoin, Ethereum and stablecoin support. Partnership with Binance."
          },
          gamification: {
            year: "2024 Q3",
            title: "Gamification",
            description: "Launch of XP system, tickets and giveaways. User engagement +300%."
          },
          international: {
            year: "2024 Q4",
            title: "International",
            description: "European expansion, multilingual support, complete GDPR compliance."
          },
          future: {
            year: "2025",
            title: "Future vision",
            description: "Mobile application, public API, multi-game support (Dota 2, TF2)."
          }
        }
      },
      cta: {
        title: "Join the CashTrade adventure",
        description: "Be part of the CS2 skin trading revolution. A community of over 15,000 traders awaits you.",
        start: "Start trading",
        discord: "Join Discord"
      },
      stats: {
        users: "Active users",
        volume: "Volume processed",
        trades: "Trades completed",
        countries: "Supported countries"
      }
    },
    terms: {
      title: "Terms of Service",
      subtitle: "General terms of use for the CashTrade platform",
      lastUpdated: "Last updated: September 21, 2024",
      version: "Version 1.2",
      importantNotice: {
        title: "Important information",
        content: "These terms of use constitute a legally binding contract between you and CashTrade. By using our services, you agree to be bound by all of these terms. Please read them carefully before using our platform."
      },
      tableOfContents: "Table of Contents",
      sections: {
        acceptance: {
          title: "1. Acceptance of terms",
          content: "By using CashTrade, you agree to be bound by these terms of use. If you do not accept these terms, please do not use our service.\n\nThese terms may be modified at any time. Changes will take effect upon publication on our site. It is your responsibility to regularly review these terms."
        },
        eligibility: {
          title: "2. Eligibility conditions",
          content: "To use CashTrade, you must:\n• Be at least 18 years old\n• Have the legal capacity to enter into contracts\n• Reside in a country where our services are legally available\n• Own a valid Steam account\n• Successfully complete our KYC (Know Your Customer) process\n\nWe reserve the right to refuse or suspend access to any user who does not meet these criteria."
        },
        services: {
          title: "3. Description of services",
          content: "CashTrade provides a platform that allows you to:\n• Sell Counter-Strike 2 skins for real money\n• Receive payments via SEPA or cryptocurrencies\n• Participate in giveaways and contests\n• Access trading statistics\n\nOur services are provided \"as is\" and we do not guarantee their uninterrupted availability."
        },
        trading: {
          title: "4. Trading process",
          content: "The selling process includes:\n• Steam connection and Trade Link addition\n• Automatic skin estimation via Skinplace API\n• Acceptance of sale conditions\n• Automatic trade with our bot\n• Steam trade hold period (mandatory 7 days)\n• Automatic payment after validation\n\nPrices are indicative and may vary according to market conditions. Once the trade is accepted on Steam, the sale is final."
        },
        payments: {
          title: "5. Payments and fees",
          content: "Applicable fees:\n• Cashout fees: 0.5% of gross amount\n• Network fees variable according to payment method\n• No hidden fees\n\nPayment times:\n• SEPA: 24-48 business hours after trade hold\n• Crypto: A few hours after trade hold\n\nAll amounts are calculated in cents to avoid rounding errors."
        },
        kycSection: {
          title: "6. KYC verification",
          content: "KYC verification is mandatory for:\n• Making any payment\n• Complying with anti-money laundering regulations\n• Ensuring platform security\n\nRequired documents:\n• Valid ID (identity card, passport)\n• Verification selfie\n• Proof of address (optional)\n\nYour documents are processed by a certified provider and we only keep verification references."
        },
        security: {
          title: "7. Security and protection",
          content: "We implement:\n• 256-bit SSL encryption for all communications\n• Two-factor authentication recommended\n• 24/7 anti-fraud monitoring\n• Compliance with banking security standards\n\nThe user agrees to:\n• Protect their login credentials\n• Immediately report any suspicious activity\n• Not share their account with third parties"
        },
        restrictions: {
          title: "8. Prohibited uses",
          content: "It is strictly forbidden to:\n• Use the platform for money laundering\n• Create multiple accounts to bypass limits\n• Use bots or automated scripts\n• Attempt to manipulate prices or the system\n• Violate Steam terms of use\n• Perform fraudulent activities\n\nAny violation may result in immediate account suspension."
        },
        liability: {
          title: "9. Limitation of liability",
          content: "CashTrade cannot be held responsible for:\n• Skin price fluctuations\n• Temporary service interruptions\n• Steam decisions regarding trades\n• Indirect or consequential losses\n• Estimation errors due to market conditions\n\nOur liability is limited to the amount of fees paid for the service concerned."
        },
        data: {
          title: "10. Data protection",
          content: "In accordance with GDPR, you have the right to:\n• Access your personal data\n• Request their correction or deletion\n• Object to their processing\n• Request data portability\n\nWe retain your data only for the time necessary for legal and regulatory obligations."
        },
        termination: {
          title: "11. Termination",
          content: "You can terminate your account at any time through settings.\n\nWe may suspend or terminate your account in case of:\n• Violation of these terms\n• Fraudulent or suspicious activity\n• Non-compliance with KYC requirements\n• Request from competent authorities\n\nIn case of termination, ongoing trades will be finalized according to accepted conditions."
        },
        governing: {
          title: "12. Applicable law",
          content: "These terms are governed by French law. Any dispute will be submitted to the exclusive jurisdiction of Paris courts.\n\nIn case of dispute, we encourage amicable resolution through our customer service before any legal action."
        }
      },
      contactInfo: {
        title: "Questions about these terms?",
        description: "Our legal team is available to answer all your questions regarding these terms of use.",
        email: "legal@cashtrade.gg",
        phone: "+33 1 23 45 67 89",
        support: "24/7 Support"
      }
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "How we collect, use and protect your personal data",
      lastUpdated: "Last updated: September 21, 2024",
      gdprCompliant: "GDPR Compliant",
      commitment: {
        title: "Our commitment",
        description1: "At CashTrade, protecting your personal data is our absolute priority. This policy explains how we collect, use, store and protect your information in compliance with the General Data Protection Regulation (GDPR) and French laws.",
        description2: "We apply the principle of data minimization: we only collect information strictly necessary for the operation of our service and our legal obligations."
      },
      dataTypes: {
        title: "Types of data collected",
        identity: {
          category: "Identification data",
          data: ["Full name", "Date of birth", "Email address", "Steam ID", "IP address"],
          purpose: "Authentication and identity verification (KYC)",
          retention: "5 years after account closure"
        },
        kyc: {
          category: "KYC data",
          data: ["Identity document", "Verification selfie", "Proof of address"],
          purpose: "Anti-money laundering regulatory compliance",
          retention: "10 years (legal obligation)"
        },
        financial: {
          category: "Financial data",
          data: ["IBAN (hashed)", "Crypto addresses", "Transaction history"],
          purpose: "Payment processing and audit",
          retention: "7 years (accounting obligation)"
        },
        usage: {
          category: "Usage data",
          data: ["Connection logs", "Trading activity", "User preferences"],
          purpose: "Service improvement and security",
          retention: "2 years maximum"
        }
      },
      legalBasis: {
        title: "Legal basis for processing",
        contract: {
          title: "Contract",
          description: "Execution of our trading and payment services"
        },
        legal: {
          title: "Legal obligation",
          description: "KYC compliance, anti-money laundering, tax obligations"
        },
        legitimate: {
          title: "Legitimate interest",
          description: "Security, fraud prevention, service improvement"
        }
      },
      rights: {
        title: "Your GDPR rights",
        access: {
          title: "Right of access",
          description: "Request a copy of all your personal data",
          action: "Download my data"
        },
        rectification: {
          title: "Right of rectification",
          description: "Correct or update your personal information",
          action: "Modify my data"
        },
        erasure: {
          title: "Right to erasure",
          description: "Delete your data (except legal obligations)",
          action: "Delete my account"
        },
        portability: {
          title: "Right to portability",
          description: "Retrieve your data in a readable format",
          action: "Export my data"
        }
      },
      security: {
        title: "Data security",
        description: "We implement strict security measures to protect your data:",
        technical: {
          title: "Technical measures:",
          measures: ["256-bit SSL/TLS encryption", "Sensitive data encryption in database", "Two-factor authentication", "24/7 access monitoring"]
        },
        organizational: {
          title: "Organizational measures:",
          measures: ["Limited data access (need-to-know)", "Employee security training", "Regular security audits", "Incident response plan"]
        }
      },
      sharing: {
        title: "Data sharing",
        description: "We never sell your personal data. We may share it only in the following cases:",
        providers: {
          title: "Service providers",
          description: "Qonto (SEPA payments), KYC provider, cloud host - under strict confidentiality contract"
        },
        legal: {
          title: "Legal obligations",
          description: "Tax authorities, TRACFIN (anti-money laundering), judicial authorities upon request"
        },
        consent: {
          title: "Your consent",
          description: "With your explicit agreement for additional services (partnerships, etc.)"
        }
      },
      contact: {
        title: "Data Protection Officer Contact",
        description: "For any questions regarding your personal data or to exercise your rights, contact our DPO.",
        email: "dpo@cashtrade.gg",
        address: "CashTrade - DPO, 123 Rue de la Tech, 75001 Paris",
        cnil: "You also have the right to file a complaint with the CNIL in case of breach."
      }
    },
    status: {
      title: "CashTrade Service Status",
      subtitle: "Monitor our services availability in real-time",
      overall: {
        title: "Overall Status",
        operational: "Operational",
        degraded: "Degraded",
        partialOutage: "Partial Outage",
        majorOutage: "Major Outage",
        maintenance: "Maintenance"
      },
      stats: {
        uptime: "Average uptime (30d)",
        operational: "Operational services",
        incidents: "Active incidents"
      },
      services: {
        title: "Services",
        website: {
          name: "Website",
          description: "Main user interface"
        },
        api: {
          name: "CashTrade API",
          description: "Main API for trades"
        },
        database: {
          name: "Database",
          description: "User data storage"
        },
        sepaPayments: {
          name: "SEPA Payments",
          description: "Bank transfer processing"
        },
        cryptoPayments: {
          name: "Crypto Payments",
          description: "Cryptocurrency processing"
        },
        steamApi: {
          name: "Steam API",
          description: "Steam integration"
        }
      },
      incidents: {
        title: "Recent incidents",
        impact: {
          low: "low",
          medium: "medium",
          high: "high"
        },
        status: {
          investigating: "Investigating",
          identified: "Identified",
          monitoring: "Monitoring",
          resolved: "Resolved"
        },
        updates: "Updates:"
      },
      footer: {
        updateFrequency: "This page is automatically updated every 30 seconds",
        lastUpdate: "Last update:",
        emailAlerts: "Email alerts available",
        apiStatus: "API Status available"
      }
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your preferences and account settings",
      profile: {
        title: "Profile information",
        steamUsername: "Steam username",
        steamSync: "Automatically synced with Steam",
        memberSince: "Member since",
        statistics: "Statistics",
        level: "Level",
        totalXp: "Total XP",
        tickets: "Tickets",
        volume: "Volume"
      },
      security: {
        title: "Account security",
        twoFactor: {
          title: "Two-factor authentication (2FA)",
          description: "Additional protection for your account",
          enabled: "Enabled",
          configure: "Configure"
        },
        kyc: {
          title: "KYC verification",
          description: "Your identity verification status",
          verified: "Verified",
          pending: "Pending",
          start: "Start KYC"
        },
        sessions: {
          title: "Active sessions",
          description: "Manage your active connections",
          view: "View sessions"
        },
        gdpr: {
          title: "GDPR compliance",
          description: "You have the right to access, modify or delete your personal data.",
          export: "Export my data",
          delete: "Delete my account"
        }
      },
      notifications: {
        title: "Notification preferences",
        email: {
          title: "Email notifications",
          description: "Receive important notifications by email"
        },
        trades: {
          title: "Trade alerts",
          description: "Notifications when your trades status changes"
        },
        payments: {
          title: "Payment alerts",
          description: "Notifications for payments and transactions"
        },
        push: {
          title: "Push notifications",
          description: "Browser push notifications"
        },
        marketing: {
          title: "Marketing emails",
          description: "Receive news and promotions information"
        },
        save: "Save preferences"
      },
      payments: {
        title: "Payment methods",
        sepa: "SEPA - Qonto",
        bitcoin: "Bitcoin",
        verified: "Verified",
        default: "Default",
        modify: "Modify",
        add: "Add payment method",
        important: "Important",
        ibanWarning: "Any IBAN change requires new verification and a 7-day delay."
      },
      preferences: {
        title: "Display preferences",
        language: {
          title: "Language",
          description: "Choose your preferred language",
          french: "🇫🇷 Français",
          english: "🇺🇸 English"
        },
        theme: {
          title: "Theme",
          description: "Choose your display theme",
          light: "Light",
          dark: "Dark",
          system: "System"
        },
        save: "Save preferences"
      },
      loginRequired: {
        title: "Login required",
        description: "You must be logged in to access settings.",
        login: "Login with Steam"
      },
      saveError: "Error saving settings"
    },
    admin: {
      title: "CashTrade Administration",
      subtitle: "Platform management and supervision",
      accessDenied: {
        title: "Access denied",
        description: "You don't have the necessary permissions to access this page.",
        home: "Back to home"
      },
      export: {
        users: "Export Users",
        trades: "Export Trades",
        payouts: "Export Payouts"
      },
      stats: {
        totalUsers: "Total users",
        totalVolume: "Total volume",
        totalTrades: "Total trades",
        revenue: "Revenue (fees)",
        monthly: "this month"
      },
      charts: {
        volume: "Trading volume",
        newUsers: "New users"
      },
      users: {
        title: "User management",
        user: "User",
        search: "Search user...",
        email: "Email",
        kyc: "KYC",
        volume: "Volume",
        trades: "Trades",
        lastLogin: "Last login",
        actions: "Actions",
        allStatuses: "All statuses",
        verified: "Verified",
        pending: "Pending",
        rejected: "Rejected"
      },
      trades: {
        title: "Trade management",
        id: "ID",
        user: "User",
        status: "Status",
        items: "Items",
        amount: "Amount",
        date: "Date",
        actions: "Actions"
      },
      payouts: {
        title: "Payout management",
        id: "ID",
        user: "User",
        amount: "Amount",
        method: "Method",
        status: "Status",
        date: "Date",
        actions: "Actions"
      },
      kyc: {
        title: "KYC management",
        user: "User",
        documents: "Documents",
        status: "Status",
        submission: "Submission date",
        actions: "Actions",
        pending: "Pending",
        verified: "Verified",
        rejected: "Rejected",
        id: "ID",
        selfie: "Selfie",
        address: "Address"
      }
    },
    kycPage: {
      title: "KYC Verification",
      subtitle: "Verify your identity to access secure payments",
      steps: {
        info: "Personal information",
        documents: "Identity document",
        selfie: "Verification selfie",
        address: "Proof of address",
        review: "Review"
      },
      info: {
        title: "Why this information?",
        description: "This information is required by European regulations to combat money laundering and ensure transaction security.",
        firstName: "First name",
        lastName: "Last name",
        dateOfBirth: "Date of birth",
        nationality: "Nationality",
        address: "Full address",
        city: "City",
        postalCode: "Postal code",
        country: "Country",
        firstNamePlaceholder: "John",
        lastNamePlaceholder: "Doe",
        addressPlaceholder: "123 Main Street",
        cityPlaceholder: "Paris",
        postalCodePlaceholder: "75001",
        countries: {
          france: "France",
          belgium: "Belgium",
          switzerland: "Switzerland",
          canada: "Canada",
          usa: "United States"
        }
      },
      documents: {
        type: "Document type",
        upload: "Upload your identity document",
        description: "Make sure the document is readable and all information is visible",
        tips: {
          title: "Tips for quality photo",
          lighting: "Take the photo in a well-lit place",
          readable: "Make sure all text is readable",
          reflection: "Avoid reflections and shadows",
          complete: "The document must be fully visible"
        },
        types: {
          id: "Identity card",
          passport: "Passport",
          license: "Driving license"
        },
        uploaded: "uploaded"
      },
      selfie: {
        title: "Verification selfie",
        description: "Take a clear selfie of your face to verify your identity",
        uploaded: "Selfie uploaded",
        instructions: {
          title: "Selfie instructions",
          camera: "Look directly at the camera",
          visible: "Your face must be fully visible",
          accessories: "Avoid sunglasses or hats",
          lighting: "Lighting should be natural and uniform"
        }
      },
      addressDoc: {
        title: "Proof of address",
        optional: "Proof of address (optional)",
        description: "This step is optional but can speed up verification. Accepted documents: electricity, gas, water bill, bank statement, tax notice (less than 3 months old).",
        uploaded: "uploaded",
        skip: "Skip this step"
      },
      review: {
        complete: "Complete file",
        description: "Check your information before submitting your KYC file.",
        personalInfo: "Personal information",
        documents: "Uploaded documents",
        identity: "Identity document:",
        selfie: "Verification selfie",
        addressDocument: "Proof of address:",
        delay: {
          title: "Verification delay",
          description: "Your file will be verified within 24-48 business hours. You will receive an email notification once verification is complete."
        },
        fullName: "Full name:",
        nationality: "Nationality:",
        address: "Address:"
      },
      navigation: {
        previous: "Previous",
        next: "Next",
        submit: "Submit file",
        loading: "Loading..."
      },
      status: {
        verified: {
          title: "KYC Verified",
          description: "Your identity has been successfully verified. You can now make payments.",
          dashboard: "Back to dashboard"
        },
        inProgress: {
          title: "KYC under verification",
          description: "Your KYC file is under verification. You will receive a response within 24-48h.",
          dashboard: "Back to dashboard"
        },
        rejected: {
          title: "KYC Rejected",
          description: "Your KYC file has been rejected. Please restart the process with valid documents.",
          restart: "Restart KYC"
        },
        loginRequired: {
          title: "Login required",
          description: "You must be logged in to access the KYC process.",
          login: "Login with Steam"
        }
      },
      toasts: {
        uploaded: "uploaded successfully",
        submitted: "KYC file submitted successfully! You will receive a response within 24-48h.",
        error: "Error submitting KYC file"
      }
    },
    sellPage: {
      helpSteps: ["Open Steam and go to your inventory", "Click on \"Privacy settings\"", "Copy the Trade Link URL"],
      successMessages: {
        tradeCreated: "Trade created successfully!",
        followInstructions: "Your trade has been created and sent. Accept the offer on Steam to continue."
      }
    },
    giveawaysPage: {
      participationSuccess: "Entry registered!",
      available: "tickets available",
      myEntries: {
        title: "My entries",
        inProgress: "In progress",
        lost: "Lost"
      }
    },
  },
  cn: {
    nav: {
      home: "首页",
      sell: "出售",
      dashboard: "控制台",
      giveaways: "抽奖",
      support: "客服",
      login: "Steam 登录",
      logout: "登出",
      settings: "设置",
      language: "语言",
      lightMode: "浅色模式",
      darkMode: "深色模式",
    },
    user: {
      level: "等级",
      xp: "经验",
    },
    hero: {
      title: "轻松出售你的CS2皮肤",
      subtitle:
        "最快速、最安全的平台，将您的反恐精英2皮肤转换为真钱",
      cta: "立即出售",
      secondaryCta: "了解详情",
      badge: "认证安全平台",
      features: {
        instant: "即时估价",
        secure: "安全支付",
        transparent: "透明费用",
        instantDesc: "通过集成的Skinplace API实时定价",
        secureDesc: "SEPA、加密货币和强制KYC保障您的安全",
        transparentDesc: "仅收取0.5%提现费，无隐藏费用",
      },
      stats: {
        users: "活跃用户",
        volume: "百万欧元交易量",
        trades: "完成交易",
        satisfaction: "满意度",
      },
      tradeInterface: {
        estimation: "即时估价",
        totalBrut: "总额",
        cashoutFees: "提现费 (0.5%)",
        sepafees: "SEPA网络费",
        totalNet: "净额",
      },
      testimonials: {
        name: ["职业玩家2024", "皮肤大师", "CSGO之王"],
        comment: ["超级快！我出售了皮肤，在Steam交易锁定后仅2天就收到了付款。界面非常清晰，客服响应迅速。", "出售皮肤的最佳网站！流程简单，估价准确，SEPA付款超快。100%推荐。", "界面精美且非常专业。我能够实时跟踪交易，通知让我随时了解情况。太棒了！"],
        amount: ["1,234€", "987€", "2,156€"]
      },
    },
    features: {
      title: "为什么选择CashTrade？",
      subtitle: "拥有您所需全部功能的完整平台",
      items: {
        security: {
          category: "安全",
          title: "增强安全性",
          description: "强制KYC认证、256位SSL加密和欧盟GDPR合规。",
          highlights: ["强制KYC", "256位SSL", "GDPR合规"],
          badge: "认证"
        },
        payments: {
          category: "支付",
          title: "多种支付方式",
          description: "即时SEPA、比特币、以太坊、USDT和其他支持的加密货币。",
          highlights: ["即时SEPA", "比特币、ETH、USDT", "快速支付"],
          badge: "热门"
        },
        estimation: {
          category: "估价",
          title: "实时定价",
          description: "集成Skinplace API，提供准确估价和持续更新。",
          highlights: ["Skinplace API", "实时", "准确估价"],
          badge: "新功能"
        },
        support: {
          category: "客服",
          title: "24/7客服",
          description: "专业团队全天候为您解答所有问题。",
          highlights: ["24/7", "专业团队", "快速响应"],
          badge: "高级"
        },
        speed: {
          category: "速度",
          title: "快速流程",
          description: "7天Steam交易锁定后立即自动付款。",
          highlights: ["7天Steam", "自动付款", "优化流程"],
          badge: "高效"
        },
        international: {
          category: "国际化",
          title: "多语言支持",
          description: "为所有用户提供法语、英语和中文界面。",
          highlights: ["法语", "English", "中文"],
          badge: "全球"
        },
        gamification: {
          category: "游戏化",
          title: "经验值与票券系统",
          description: "每次交易获得经验值和票券，参与抽奖活动。",
          highlights: ["每次交易获得经验", "等级系统", "抽奖"],
          badge: "有趣"
        },
        affiliation: {
          category: "推广",
          title: "推广计划",
          description: "推荐每个用户获得2%佣金。",
          highlights: ["2%佣金", "每月付款", "详细跟踪"],
          badge: "有利可图"
        },
        analytics: {
          category: "分析",
          title: "完整控制台",
          description: "通过详细图表跟踪您的交易、收益和统计数据。",
          highlights: ["详细图表", "完整历史", "CSV导出"],
          badge: "专业"
        }
      },
      trustIndicators: "超过15,000名用户信任我们"
    },
    howItWorks: {
      title: "如何使用？",
      subtitle: "通过几个简单步骤安全出售您的CS2皮肤",
      steps: {
        addTradeLink: {
          title: "添加您的交易链接",
          description: "使用Steam连接并添加您的安全交易链接。",
          details: ["Steam OpenID连接", "自动链接验证", "最高安全性"]
        },
        estimation: {
          title: "即时估价",
          description: "我们的AI分析您的皮肤并实时给出价格。",
          details: ["基于Skinplace API的价格", "实时更新", "准确估价"]
        },
        kyc: {
          title: "KYC验证",
          description: "验证您的身份以确保支付安全。",
          details: ["快速简单的流程", "安全文档", "法律合规"]
        },
        tradeHold: {
          title: "Steam交易锁定 (7天)",
          description: "Steam强制的7天安全期。",
          details: ["Steam安全", "实时跟踪", "自动通知"]
        },
        payment: {
          title: "自动付款",
          description: "期限结束后通过SEPA或加密货币接收您的资金。",
          details: ["快速SEPA付款", "多种加密货币支持", "透明费用"]
        }
      },
      benefits: {
        automated: {
          title: "完全自动化流程",
          description: "从交易到收款，一切都是自动的。"
        },
        security: {
          title: "最高安全性",
          description: "强制KYC、SSL加密和欧洲合规。"
        },
        transparent: {
          title: "透明费用",
          description: "仅收取0.5%提现费，无隐藏费用。"
        }
      },
      cta: {
        title: "准备开始了吗？",
        description: "加入数千名已安全出售皮肤的用户",
        primary: "立即开始",
        secondary: "查看我们的定价"
      }
    },
    testimonials: {
      title: "用户评价",
      subtitle: "超过15,000名用户信任我们出售他们的皮肤",
      rating: "4.9",
      basedOn: "基于",
      reviews: "评价",
      items: {
        name: ["职业玩家2024", "皮肤大师", "CSGO之王", "法国交易员", "技术达人", "加密粉丝"],
        comment: [
          "超级快！我出售了皮肤，在Steam交易锁定后仅2天就收到了付款。界面非常清晰，客服响应迅速。",
          "出售皮肤的最佳网站！流程简单，估价准确，SEPA付款超快。100%推荐。",
          "界面精美且非常专业。我能够实时跟踪交易，通知让我随时了解情况。太棒了！",
          "对法国人来说很完美！法语客服、SEPA付款和欧洲合规。终于有了一个认真的平台。",
          "我喜欢游戏化系统！每次交易获得经验值和票券，太棒了。而且抽奖也很不错。",
          "出色的加密货币支持！比特币、以太坊、USDT...应有尽有。费用透明，没有意外。"
        ],
        amount: ["1,234€", "987€", "2,156€", "675€", "445€", "1,789€"],
        items: ["AK-47 红线 + AWP 亚洲二元", "格洛克 渐变 StatTrak™", "卡拉曼比特 渐变 + M4A4 怒吼", "USP-S 死亡确认", "AK-47 火神", "Dragon Lore 崭新出厂"],
        date: ["2天前", "5天前", "1周前", "1周前", "2周前", "2周前"]
      },
      trustStats: {
        satisfaction: "满意度",
        users: "活跃用户",
        volume: "处理量",
        support: "客服可用"
      }
    },
    trade: {
      title: "出售我的皮肤",
      subtitle: "通过几个简单步骤出售您的CS2皮肤",
      tradeLink: "Steam交易链接",
      estimation: "即时估价",
      fees: "费用",
      cashoutFee: "提现费 (0.5%)",
      networkFee: "SEPA网络费",
      total: "净总额",
      confirm: "确认出售",
      timeline: "流程 (7天)",
      loginRequired: "需要登录",
      loginSubtitle: "您必须使用Steam登录才能出售皮肤。",
      steamLogin: "使用Steam登录",
      analyzing: "加载物品中...",
      confirming: "创建交易中...",
      created: "交易创建成功！",
      accepted: "您的交易已创建并发送。在Steam上接受报价以继续。",
      tradeLinkPlaceholder: "https://steamcommunity.com/tradeoffer/new/?partner=...",
      tradeLinkHelp: "如何获取我的交易链接？",
      tradeLinkInfo: '打开Steam并进入您的库存。点击"隐私设置"。复制交易链接URL',
      tradeLinkWarning: "确保您的Steam库存是公开的，交易链接是有效的。我们无法访问私人库存。",
      automaticPayment: "7天后自动付款",
      steps: {
        tradelink: "Steam交易链接",
        estimation: "估价",
        confirmation: "确认",
      },
      tradelink: {
        title: "Steam交易链接",
        helpTitle: "如何找到您的交易链接？",
        helpSteps: [
          "打开Steam并进入您的库存",
          "点击\"隐私设置\"",
          "复制交易链接URL"
        ],
        placeholder: "https://steamcommunity.com/tradeoffer/new/?partner=...",
        important: "重要",
        importantText: "确保您的Steam库存是公开的，交易链接是有效的。我们无法访问私人库存。",
        analyzeButton: "分析库存",
        analyzingButton: "加载物品中...",
      },
      items: {
        selected: "选定物品",
        totalBrut: "总额",
        cashoutFees: "提现费 (0.5%)",
        networkFees: "网络费",
        totalNet: "净额",
        timeline: "时间线",
        timelineText: "Steam交易锁定7天后自动付款",
        confirmButton: "确认出售",
        creatingButton: "创建交易中...",
      },
      success: {
        title: "交易创建成功！",
        subtitle: "您的交易已创建并发送。在Steam上接受报价以继续。",
        tradeId: "交易ID：",
        netAmount: "净金额：",
        followTrade: "跟踪交易",
        openSteam: "打开Steam",
      },
      status: {
        créé: "已创建",
        accepté_par_bot: "已接受",
        en_trade_hold: "交易锁定 (7天)",
        disponible: "准备付款",
        paiement_en_cours: "付款处理中",
        payé: "已付款",
        échoué: "失败",
      },
    },
    dashboard: {
      title: "我的控制台",
      subtitle: "这是您活动的概览",
      welcome: "欢迎",
      stats: "统计",
      volume: "总交易量",
      trades: "交易",
      xp: "经验值",
      level: "等级",
      tickets: "票券",
      history: "历史",
      loginRequired: "需要登录",
      loginSubtitle: "您必须登录才能访问控制台。",
      currentLevel: "等级",
      nextLevel: "至等级",
      totalXp: "经验值",
      xpForNext: "经验值至等级",
      tabs: {
        trades: "我的交易",
        analytics: "分析",
        payments: "支付",
        settings: "设置",
      },
      tradeHistory: {
        title: "交易历史",
        items: "物品",
        fees: "费用：",
        timeline: "时间线：",
        cashout: "提现：",
        network: "网络：",
        accepted: "已接受：",
        available: "可用：",
        others: "其他",
      },
      analytics: {
        tradingVolume: "交易量",
        tradeStatus: "交易状态",
      },
      payments: {
        title: "支付方式",
        methods: "支付方式",
        verified: "已验证",
        default: "默认",
        addMethod: "添加支付方式",
      },
      settings: {
        profile: "资料",
        security: "安全",
        twoFactor: "双因素认证",
        twoFactorDesc: "额外保护",
        emailNotifications: "邮件通知",
        emailNotificationsDesc: "交易提醒",
        enabled: "已启用",
      },
    },
    kyc: {
      title: "KYC验证",
      required: "支付需要验证",
      upload: "上传文档",
      pending: "等待验证",
      approved: "已验证",
      rejected: "已拒绝",
    },
    payments: {
      sepa: "SEPA转账",
      crypto: "加密货币",
      addMethod: "添加支付方式",
      verify: "验证",
      otp: "OTP验证码",
    },
    common: {
      loading: "加载中...",
      error: "错误",
      success: "成功",
      cancel: "取消",
      continue: "继续",
      back: "返回",
      connecting: "连接中...",
      online: "在线",
      steamLogin: "Steam登录",
      confirmed: "已确认",
      marketplace: "CS2市场",
    },
    toast: {
      itemsLoadedSuccess: "物品加载成功！",
      itemsLoadError: "加载物品时出错",
      tradeCreatedSuccess: "交易创建成功！",
      tradeCreationError: "创建交易时出错",
      settingsSavedSuccess: "设置保存成功",
      invalidTradeLink: "无效的交易链接。请从Steam复制链接。",
    },
    footer: {
      description: "最快速、最安全的平台，将您的CS2皮肤转换为真钱。使用我们的安全支付系统放心出售您的皮肤。",
      securedBy: "安全保障：",
      company: "公司",
      support: "客服",
      legal: "法律",
      links: {
        about: "关于我们",
        blog: "博客",
        careers: "招聘",
        press: "新闻",
        helpCenter: "帮助中心",
        contact: "联系我们",
        status: "状态",
        api: "API",
        terms: "服务条款",
        privacy: "隐私政策",
        kycPolicy: "KYC政策",
        amlPolicy: "反洗钱政策",
      },
      stats: {
        activeUsers: "活跃用户",
        volumeProcessed: "处理量",
        tradesCompleted: "完成交易",
        satisfactionRate: "满意度",
      },
      disclaimer: "免责声明：CashTrade与Valve Corporation或Steam无关。反恐精英和Steam是Valve Corporation的注册商标。皮肤交易存在风险，价格可能波动。请负责任地交易，永远不要投资超过您承受损失能力的资金。",
      copyright: "© 2024 CashTrade. 保留所有权利。| 欧盟许可证：CT-2024-001",
      socialLinks: {
        discord: "Discord",
        twitter: "Twitter",
        reddit: "Reddit",
        youtube: "YouTube",
      },
    },
    support: {
      title: "帮助中心",
      subtitle: "找到问题答案或联系我们的客服团队",
      stats: {
        responseTime: "平均响应时间",
        resolutionRate: "解决率",
        supportAvailable: "客服可用",
        languagesSupported: "支持语言",
      },
      faq: {
        title: "常见问题",
        categories: {
          general: "一般问题",
          security: "安全与KYC",
          payments: "支付",
          trading: "交易与皮肤",
        },
        questions: {
          howItWorks: "CashTrade如何工作？",
          howItWorksAnswer: "CashTrade是一个允许您将CS2皮肤出售换取真钱的平台。您连接Steam账户，添加交易链接，我们通过Skinplace API实时估价您的皮肤，然后创建交易。在7天Steam交易锁定后，您会自动收到付款。",
          fees: "费用是多少？",
          feesAnswer: "我们仅对您出售的总金额收取0.5%的提现费。根据您的支付方式可能会产生网络费（SEPA约20€，加密货币费用可变）。无隐藏费用！",
          processTime: "整个流程需要多长时间？",
          processTimeAnswer: "完整流程需要大约7-9天：即时估价，创建交易（几分钟），强制Steam交易锁定（7天），然后自动付款（24-48小时）。您可以在控制台实时跟踪状态。",
          priceCalculation: "皮肤价格如何计算？",
          priceCalculationAnswer: "我们的价格基于Skinplace API，该API汇总实时市场数据。价格每5分钟更新一次以反映市场波动。我们使用最近销售价格的平均值。",
          whyKyc: "为什么我需要进行KYC？",
          whyKycAnswer: "根据欧洲法规，KYC（了解您的客户）是打击洗钱的强制要求。它允许我们验证您的身份并确保所有付款的安全。流程简单，通常需要24-48小时。",
          dataSecurity: "我的数据安全吗？",
          dataSecurityAnswer: "绝对安全。我们对所有通信使用256位SSL加密。您的KYC文档安全存储，我们只保留KYC提供商提供的参考ID。我们符合GDPR。",
          kycRejected: "如果我的KYC被拒绝怎么办？",
          kycRejectedAnswer: "如果您的KYC被拒绝，您将收到一封包含拒绝原因的邮件。然后您可以纠正问题并重新提交文档。常见原因是：文档不清晰、信息不一致或文档过期。",
          fraudProtection: "您如何防范欺诈？",
          fraudProtectionAnswer: "我们有多个保护系统：每日交易限制、可疑活动峰值检测、交易链接验证、IBAN更改后的冷却期，以及新账户的增强验证系统。",
          paymentMethods: "您接受哪些支付方式？",
          paymentMethodsAnswer: "我们支持SEPA转账（通过Qonto）和加密货币（比特币、以太坊、USDT、USDC）。SEPA付款在首次付款或IBAN更改时需要增强验证（OTP或微转账）。",
          paymentTime: "付款需要多长时间？",
          paymentTimeAnswer: "SEPA转账需要24-48个工作小时。加密货币付款通常在区块链确认验证后几小时内处理。一旦付款启动，您会收到通知。",
          changePaymentMethod: "我可以更改我的支付方式吗？",
          changePaymentMethodAnswer: "是的，您可以在控制台中添加和修改支付方式。对于SEPA，新的IBAN更改需要新的验证和7天冷却期（除非微验证已验证）。",
          minimumAmount: "有最低金额吗？",
          minimumAmountAnswer: "付款的最低金额是净20€（扣除费用后）。这涵盖了处理和网络费用。您可以在请求付款前累积多次交易。",
          acceptedSkins: "您接受哪些皮肤？",
          acceptedSkinsAnswer: "我们接受所有可交易的CS2皮肤（非账户绑定）。皮肤必须在您的Steam库存中，您的库存必须是公开的。也接受StatTrak™皮肤和带贴纸的皮肤。",
          steamRefusesTrade: "如果Steam拒绝交易怎么办？",
          steamRefusesTradeAnswer: "如果Steam拒绝交易（私人库存、无效交易链接、不可交易皮肤），我们会自动取消请求并通知您。然后您可以纠正问题并重新开始流程。",
          cancelTrade: "我可以取消进行中的交易吗？",
          cancelTradeAnswer: "只要交易没有在Steam上被接受，您就可以取消交易。一旦交易被接受并处于交易锁定状态，根据Steam规则就无法取消了。如果您有紧急问题，请联系客服。",
          xpSystem: "经验值和票券系统如何工作？",
          xpSystemAnswer: "您在每次交易中根据交易量获得经验值（1经验值=1€交易量）。每个等级会给您票券，您可以在我们的抽奖中使用这些票券赢得免费皮肤。交易越多，等级越高！",
        },
      },
      quickActions: {
        title: "快速操作",
        checkTradeStatus: "检查我的交易状态",
        paymentProblem: "付款问题",
        kycQuestions: "KYC问题",
        technicalIssue: "报告技术问题",
      },
      contactForm: {
        title: "联系客服",
        connectedAs: "连接为：",
        subject: "主题",
        subjectPlaceholder: "简要描述您的问题",
        category: "类别",
        categoryPlaceholder: "选择类别",
        categories: {
          trading: "交易问题",
          payment: "付款问题",
          kyc: "KYC问题",
          technical: "技术问题",
          account: "用户账户",
          other: "其他",
        },
        priority: "优先级",
        priorities: {
          low: "低",
          normal: "正常",
          high: "高",
          urgent: "紧急",
        },
        message: "消息",
        messagePlaceholder: "详细描述您的问题...",
        submit: "发送工单",
        submitting: "发送中...",
        success: "客服工单创建成功！您将在2小时内收到回复。",
        error: "创建工单时出错",
      },
      otherContact: {
        title: "其他联系方式",
        discord: {
          title: "Discord社区",
          description: "加入我们的Discord服务器获得快速帮助",
          button: "加入Discord",
        },
        email: {
          title: "直接邮件",
          address: "support@cashtrade.gg",
          responseTime: "24小时内回复",
        },
        hours: {
          title: "营业时间",
          weekdays: "周一至周五：9点-18点 (CET)",
          weekend: "周六至周日：10点-16点 (CET)",
          emergency: "紧急情况24/7客服",
        },
      },
    },
    giveaways: {
      title: "抽奖",
      subtitle: "使用您的票券参与抽奖，赢取exceptional皮肤",
      userTickets: {
        level: "等级",
        tickets: "票券",
        description: "通过出售皮肤获得更多票券！",
      },
      howTicketsWork: {
        title: "票券如何工作？",
        earn: {
          title: "获得票券",
          description: "根据交易量在每次交易中获得票券",
        },
        participate: {
          title: "参与抽奖",
          description: "使用您的票券参与抽奖",
        },
        win: {
          title: "赢取奖品",
          description: "赢得exceptional皮肤和独家奖励",
        },
      },
      tabs: {
        active: "进行中",
        ended: "已结束",
        myEntries: "我的参与",
      },
      card: {
        status: {
          active: "进行中",
          ended: "已结束",
          cancelled: "已取消",
        },
        prize: "奖品",
        price: "价格：",
        participants: "参与者",
        timeRemaining: "剩余时间",
        endDate: "结束日期",
        ticketsSold: "已售票券",
        winner: "获胜者：",
        ticketsToUse: "使用票券数量：",
        participate: "参与",
        ticketsAvailable: "票券可用",
      },
      empty: {
        noActive: "没有进行中的抽奖",
        noActiveDescription: "请稍后回来发现新的抽奖！",
        loginRequired: "需要登录",
        loginRequiredDescription: "登录查看您的参与",
        loginButton: "使用Steam登录",
      },
      myEntries: {
        title: "我的参与",
        entries: {
          inProgress: "进行中",
          lost: "失败",
        },
      },
      participation: {
        success: "参与已记录！",
        notEnoughTickets: "您没有足够的票券",
        loginRequired: "您必须登录才能参与",
      },
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale] || messages[defaultLocale];
}
