export type UserRole = "ADMIN" | "USER" | "AFFILIATE";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "IN_PROGRESS";
export type AffiliateStats = {
  totalReferrals: number;
  totalEarnings: number;
};
export type GiveawayEntry = {
  id: string;
  userId: string;
};
export type KycDocument = {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
};
export type PaymentMethod = {
  id: string;
  userId: string;
  methodType: string;
  methodDetails: string;
};
export type Payout = {
  id: string;
  userId: string;
  amount: number;
  status: string;
};
export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
};

export type User = {
  id: string
  email: string
  name: string
  image: string
  updatedAt: Date
  createdAt: Date
  steamId?: string
  steamUsername?: string
  steamAvatar?: string
  level?: number
  xp?: number
  tickets?: number
  role?: UserRole
  totalVolumeCents?: number
  kycStatus?: KycStatus
  acceptedTermsAt?: Date
  paymentMethods?: PaymentMethod[]
  payouts?: Payout[]
  trades?: Trade[]
  auditLogs?: AuditLog[]
  affiliateStats?: AffiliateStats
  giveawayEntries?: GiveawayEntry[]
  kycDocuments?: KycDocument[]
}   

export type Trade = {
  id: string
}

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
    affiliation: string;
    moderation: string;
    platform: string;
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
      annulé: string;
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
        noTrades: string;
        loadingError: string;
        noTradesDescription: string;
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
        preferredMethod: string;
        selectPreferred: string;
        stripe: string;
        qonto: string;
        binance: string;
        bitcoin: string;
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
      toasts: {
        statusUpdated: string;
        statusVerified: string;
        error: string;
        statusCheckFailed: string;
        statusCheckError: string;
      };
      kycVerification: string;
      kycVerified: string;
      kycInProgress: string;
      kycRequired: string;
      withdrawFunds: string;
      sepaOrCard: string;
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
    withdraw: string;
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
    verified: string;
    pending: string;
    startKyc: string;
    current: string;
    conversionError: string;
    personalData: string;
    selectPlaceholder: string;
  };
  currencies: {
    usd: string;
    eur: string;
    cny: string;
  };
  toast: {
    itemsLoadedSuccess: string;
    itemsLoadError: string;
    tradeCreatedSuccess: string;
    tradeCreationError: string;
    settingsSavedSuccess: string;
    steamLoginSuccess: string;
    steamLoginInProgress: string;
    steamLoginInProgressDesc: string;
    steamLoginError: string;
    steamLoginErrorDesc: string;
    discordLoginSuccess: string;
    discordLoginSuccessDesc: string;
    discordLoginInProgress: string;
    discordLoginInProgressDesc: string;
    discordLoginError: string;
    discordLoginErrorDesc: string;
    logoutSuccess: string;
    logoutSuccessDesc: string;
    logoutError: string;
    logoutErrorDesc: string;
    settingsSaveError: string;
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
      login: string;
      admin: string;
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
          skills: string[];
        };
        cto: {
          name: string;
          role: string;
          bio: string;
          skills: string[];
        };
        product: {
          name: string;
          role: string;
          bio: string;
          skills: string[];
        };
        compliance: {
          name: string;
          role: string;
          bio: string;
          skills: string[];
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
    warningText: string;
    sections: {
      object: {
        title: string;
        content: string;
      };
      access: {
        title: string;
        content: string;
      };
      kycCompliance: {
        title: string;
        content: string;
      };
      servicesDescription: {
        title: string;
        content: string;
      };
      transactionsRisks: {
        title: string;
        content: string;
      };
      noFinancialAdvice: {
        title: string;
        content: string;
      };
      liability: {
        title: string;
        content: string;
      };
      userConduct: {
        title: string;
        content: string;
      };
      personalData: {
        title: string;
        content: string;
      };
      modifications: {
        title: string;
        content: string;
      };
      governingLaw: {
        title: string;
        content: string;
      };
      contactSection: {
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
    intro: string;
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
    sections: {
      introduction: { title: string; content: string };
      controller: { title: string; content: string };
      dataCollected: { title: string; content: string };
      purposes: { title: string; content: string };
      legalBasisSection: { title: string; content: string };
      sharingSection: { title: string; content: string };
      retention: { title: string; content: string };
      securitySection: { title: string; content: string };
      yourRights: { title: string; content: string };
      cookies: { title: string; content: string };
      modifications: { title: string; content: string };
      contactSection: { title: string; content: string };
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
    tabs: {
      profile: string;
      security: string;
      notifications: string;
      payments: string;
      preferences: string;
    };
    profile: {
      title: string;
      steamUsername: string;
      steamId: string;
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
    loginDescription: string;
    saveError: string;
    tradeLink: {
      title: string;
      configured: string;
      howToGetTitle: string;
      instructions: string[];
      openSteam: string;
      copyExample: string;
      urlLabel: string;
      placeholder: string;
      hideInstructions: string;
      showInstructions: string;
      invalidFormat: string;
      invalidFormatDesc: string;
      validFormat: string;
      currentTradeLink: string;
      saving: string;
      save: string;
      clear: string;
      savedSuccess: string;
      saveError: string;
      copiedToClipboard: string;
      warningTitle: string;
      warningText: string;
    };
    steamId: {
      title: string;
      configured: string;
      howToGetTitle: string;
      method1Title: string;
      method1Steps: string[];
      method2Title: string;
      method2Desc: string;
      findSteamId: string;
      copyExample: string;
      label: string;
      placeholder: string;
      hideInstructions: string;
      showInstructions: string;
      invalidFormat: string;
      invalidFormatDesc: string;
      validFormat: string;
      currentSteamId: string;
      saving: string;
      save: string;
      clear: string;
      savedSuccess: string;
      saveError: string;
      copiedToClipboard: string;
      whyTitle: string;
      whyText: string;
    };
  };
  admin: {
    title: string;
    subtitle: string;
    loading: {
      redirecting: string;
      verifyingPermissions: string;
      loading: string;
    };
    accessDenied: {
      title: string;
      description: string;
      home: string;
      loginAdmin: string;
    };
    login: {
      title: string;
      subtitle: string;
      adminLogin: string;
      adminAccess: string;
      emailLabel: string;
      passwordLabel: string;
      emailPlaceholder: string;
      passwordPlaceholder: string;
      loginButton: string;
      loggingIn: string;
      steamLogin: string;
      loginProblem: string;
      contactSupport: string;
      secureAccess: string;
      or: string;
      connectionError: string;
      loginFailed: string;
      checkCredentials: string;
      loginSuccess: string;
      welcomeMessage: string;
    };
    dashboard: {
      title: string;
      subtitle: string;
      exportData: string;
      fullReport: string;
      overview: string;
      trades: string;
      users: string;
      payouts: string;
      kyc: string;
      analytics: string;
      exports: string;
      affiliates: string;
      commissions: string;
      volumeChart: string;
      tradesDistribution: string;
      recentActivity: string;
      tradesManagement: string;
      tradesDescription: string;
      usersManagement: string;
      usersDescription: string;
      payoutsManagement: string;
      payoutsDescription: string;
      kycValidation: string;
      kycDescription: string;
      exportConfiguration: string;
      exportDescription: string;
      affiliatesManagement: string;
      affiliatesDescription: string;
      commissionsManagement: string;
      commissionsDescription: string;
    };
    userCreation: {
      title: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      nameLabel: string;
      namePlaceholder: string;
      roleLabel: string;
      sendEmailLabel: string;
      createButton: string;
      creating: string;
      successTitle: string;
      successMessage: string;
      errorTitle: string;
      errorMessage: string;
      errorEmailExists: string;
      roles: {
        user: string;
        admin: string;
        moderator: string;
        affiliate: string;
      };
    };
    affiliateCreation: {
      title: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      nameLabel: string;
      namePlaceholder: string;
      codeLabel: string;
      codePlaceholder: string;
      codeHelper: string;
      commissionRateLabel: string;
      commissionRatePlaceholder: string;
      commissionRateHelper: string;
      sendEmailLabel: string;
      createButton: string;
      creating: string;
      successTitle: string;
      successMessage: string;
      errorTitle: string;
      errorMessage: string;
      errorEmailExists: string;
      errorCodeExists: string;
      errorInvalidRate: string;
    };
    promoteAffiliate: {
      buttonLabel: string;
      dialogTitle: string;
      dialogDescription: string;
      codeLabel: string;
      codePlaceholder: string;
      commissionRateLabel: string;
      commissionRatePlaceholder: string;
      confirmButton: string;
      promoting: string;
      successTitle: string;
      successMessage: string;
      errorTitle: string;
      errorMessage: string;
      errorAlreadyAffiliate: string;
      errorCodeExists: string;
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
      thisMonth: string;
      kycPending: string;
      successRate: string;
      topUser: string;
      recentTrades: string;
      last24h: string;
      toProcess: string;
      upToDate: string;
      tradesSuccessful: string;
    };
    charts: {
      volume: string;
      newUsers: string;
    };
    users: {
      title: string;
      user: string;
      search: string;
      searchPlaceholder: string;
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
      steamId: string;
      level: string;
      tickets: string;
      joinedAt: string;
      refresh: string;
      export: string;
      noUsers: string;
      filterByKyc: string;
      allKycStatuses: string;
      inProgress: string;
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
      ticketId: string;
      searchPlaceholder: string;
      filterByStatus: string;
      allStatuses: string;
      created: string;
      accepted: string;
      tradeHold: string;
      available: string;
      paymentProcessing: string;
      paid: string;
      failed: string;
      refresh: string;
      export: string;
      noTrades: string;
      gross: string;
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
      searchPlaceholder: string;
      filterByStatus: string;
      allStatuses: string;
      pending: string;
      verificationRequired: string;
      verified: string;
      scheduled: string;
      executed: string;
      paid: string;
      failed: string;
      refresh: string;
      export: string;
      noPayouts: string;
      reference: string;
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
      type: string;
      uploaded: string;
      reviewed: string;
      searchPlaceholder: string;
      filterByStatus: string;
      allStatuses: string;
      approved: string;
      refresh: string;
      export: string;
      noDocuments: string;
      idCard: string;
      passport: string;
      proofOfAddress: string;
      nonCompliantDocument: string;
    };
    exports: {
      title: string;
      subtitle: string;
      configuration: string;
      configurationDescription: string;
      dataType: string;
      dateFrom: string;
      dateTo: string;
      selectDate: string;
      exportFormat: string;
      csv: string;
      excel: string;
      exportData: string;
      exporting: string;
      history: string;
      historyDescription: string;
      allData: string;
      tradesExport: string;
      tradesDescription: string;
      usersExport: string;
      usersDescription: string;
      payoutsExport: string;
      payoutsDescription: string;
      kycExport: string;
      kycDescription: string;
      affiliatesExport: string;
      affiliatesDescription: string;
      giveawaysExport: string;
      giveawaysDescription: string;
    };
    affiliates: {
      title: string;
      description: string;
    };
    commissions: {
      title: string;
      description: string;
    };
    settings: {
      title: string;
      subtitle: string;
      badge: string;
      accountVerified: string;
      notLinked: string;
      tabs: {
        personal: string;
        security: string;
        notifications: string;
        preferences: string;
      };
      personal: {
        title: string;
        fullName: string;
        fullNamePlaceholder: string;
        email: string;
        emailPlaceholder: string;
        steamUsername: string;
        steamUsernamePlaceholder: string;
        steamSync: string;
        saving: string;
        save: string;
        success: string;
        error: string;
      };
      passwordChange: {
        title: string;
        warning: string;
        currentPassword: string;
        currentPasswordPlaceholder: string;
        newPassword: string;
        newPasswordPlaceholder: string;
        confirmPassword: string;
        confirmPasswordPlaceholder: string;
        changing: string;
        change: string;
        success: string;
        error: string;
        passwordMismatch: string;
        passwordTooShort: string;
      };
      securitySettings: {
        title: string;
        twoFactor: string;
        twoFactorDesc: string;
        sessionTimeout: string;
        "15min": string;
        "30min": string;
        "1hour": string;
        "2hours": string;
        "8hours": string;
      };
      notificationPrefs: {
        title: string;
        emailNotifications: string;
        emailNotificationsDesc: string;
        tradeAlerts: string;
        tradeAlertsDesc: string;
        securityAlerts: string;
        securityAlertsDesc: string;
        weeklyReports: string;
        weeklyReportsDesc: string;
        save: string;
        success: string;
        error: string;
      };
      interfacePrefs: {
        title: string;
        theme: string;
        themeLight: string;
        themeDark: string;
        themeAuto: string;
        language: string;
        french: string;
        english: string;
        timezone: string;
        parisCET: string;
        londonGMT: string;
        newYorkEST: string;
        tokyoJST: string;
        dashboardLayout: string;
        layoutGrid: string;
        layoutList: string;
        layoutCompact: string;
        save: string;
        success: string;
        error: string;
      };
    };
    chat: {
      title: string;
      subtitle: string;
      accessDenied: string;
      accessDeniedDesc: string;
      stats: {
        totalConversations: string;
        activeConversations: string;
        unassigned: string;
        responseTime: string;
      };
      tabs: {
        conversations: string;
        moderators: string;
        stats: string;
      };
      conversations: {
        title: string;
        loading: string;
        noConversations: string;
        noSubject: string;
        anonymousUser: string;
        assignedTo: string;
        createdOn: string;
        messages: string;
        view: string;
      };
      moderators: {
        title: string;
        addModerator: string;
        promotUser: string;
        searchPlaceholder: string;
        noName: string;
        promote: string;
        promoting: string;
        noModerators: string;
        conversations: string;
        successPromote: string;
        errorPromote: string;
        successDemote: string;
        errorDemote: string;
        errorLoading: string;
        errorLoadingData: string;
        errorSearch: string;
      };
      performance: {
        title: string;
        noStats: string;
        assigned: string;
        closed: string;
        messages: string;
        avgTime: string;
      };
      priority: {
        title: string;
      };
      category: {
        title: string;
      };
    };
    errors: {
      loadingStats: string;
      loadingTrades: string;
      loadingUsers: string;
      loadingPayouts: string;
      loadingKyc: string;
      unknown: string;
      approval: string;
      rejection: string;
      export: string;
    };
    toast: {
      exportSuccess: {
        title: string;
        description: string;
      };
      exportError: {
        title: string;
        description: string;
      };
      reportSuccess: {
        title: string;
        description: string;
      };
      reportError: {
        title: string;
        description: string;
      };
    };
    giveaways: {
      descriptionPlaceholder: string;
      title: string;
      subtitle: string;
      stats: {
        active: string;
        ended: string;
        totalParticipants: string;
      };
      tabs: {
        list: string;
        create: string;
        manage: string;
      };
      list: {
        title: string;
        refresh: string;
        loading: string;
        price: string;
        ticketPrice: string;
        tickets: string;
        participants: string;
        ticketsSold: string;
        winner: string;
        drawNow: string;
        delete: string;
        noGiveaways: string;
        noGiveawaysDesc: string;
        createGiveaway: string;
      };
      create: {
        title: string;
        titleLabel: string;
        titlePlaceholder: string;
        prizeLabel: string;
        prizePlaceholder: string;
        ticketPriceLabel: string;
        maxTicketsLabel: string;
        durationLabel: string;
        durationHelp: string;
        descriptionLabel: string;
        cancel: string;
        creating: string;
        create: string;
        errorRequired: string;
      };
      info: {
        title: string;
        autoTitle: string;
        autoPoint1: string;
        autoPoint2: string;
        autoPoint3: string;
        autoPoint4: string;
        manualTitle: string;
        manualPoint1: string;
        manualPoint2: string;
        manualPoint3: string;
      };
    };
    newsletter: {
      title: string;
      subtitle: string;
      loading: string;
      stats: {
        total: string;
        active: string;
        unsubscribed: string;
      };
      tabs: {
        subscribers: string;
        campaigns: string;
      };
      subscribers: {
        title: string;
        subtitle: string;
        exportCSV: string;
        searchPlaceholder: string;
        allStatuses: string;
        active: string;
        inactive: string;
        email: string;
        status: string;
        subscriptionDate: string;
        actions: string;
        statusActive: string;
        statusInactive: string;
        noSubscribers: string;
        deleteConfirm: string;
        deleteSuccess: string;
        deleteError: string;
        loadError: string;
        exportSuccess: string;
        exportError: string;
      };
      campaigns: {
        title: string;
        subtitle: string;
        createdOn: string;
        statusSent: string;
        statusScheduled: string;
        statusDraft: string;
      };
    };
    exports2: {
      error: string;
      success: string;
      successDesc: string;
      errorDesc: string;
      reportGenerated: string;
      reportGeneratedDesc: string;
      reportError: string;
    };
    sidebar: {
      overview: string;
      management: string;
      affiliation: string;
      engagement: string;
      support: string;
      system: string;
      dashboard: string;
      analytics: string;
      users: string;
      trades: string;
      payouts: string;
      kyc: string;
      affiliates: string;
      commissions: string;
      performances: string;
      giveaways: string;
      newsletter: string;
      chat: string;
      audit: string;
      exports: string;
      settings: string;
      overviewGroup: string;
      managementGroup: string;
      affiliateGroup: string;
      marketingGroup: string;
      supportGroup: string;
      systemGroup: string;
      collapse: string;
    };
    exportMessages: {
      error: string;
      success: string;
      successDesc: string;
      errorDesc: string;
      reportGenerated: string;
      reportGeneratedDesc: string;
      reportError: string;
    };
    audit: {
      title: string;
      subtitle: string;
      loading: string;
      refresh: string;
      export: string;
      metrics: {
        totalLogs: string;
        criticalAlerts: string;
        suspiciousActivities: string;
        failedLogins: string;
        last24h: string;
        needsAttention: string;
        detectedAutomatically: string;
        failedAttempts: string;
      };
      tabs: {
        logs: string;
        analytics: string;
        alerts: string;
      };
      filters: {
        title: string;
        action: string;
        severity: string;
        user: string;
        period: string;
        allActions: string;
        allSeverities: string;
        userIdPlaceholder: string;
        lastHour: string;
        last24h: string;
        last7days: string;
        last30days: string;
      };
      table: {
        date: string;
        user: string;
        action: string;
        severity: string;
        ip: string;
        details: string;
        system: string;
        entriesFound: string;
      };
      analytics: {
        title: string;
        subtitle: string;
        topIPs: string;
        activeUsers: string;
        fraudTrend: string;
        activitySpike: string;
        currentActivity: string;
        threshold: string;
        requests: string;
        actions: string;
        vsPreviousPeriod: string;
      };
      alerts: {
        title: string;
        subtitle: string;
        inDevelopment: string;
      };
      actions: {
        "user.login": string;
        "user.logout": string;
        "user.login_failed": string;
        "trade.created": string;
        "trade.completed": string;
        "payout.requested": string;
        "payout.processed": string;
        "admin.action": string;
        "security.suspicious_activity": string;
        "security.rate_limit_exceeded": string;
      };
      severity: {
        low: string;
        medium: string;
        high: string;
        critical: string;
      };
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
    privacy: {
      badge: string;
      title: string;
      description: string;
      points: {
        noStorage: string;
        directTransfer: string;
        certifiedPartner: string;
        referenceOnly: string;
      };
    };
  };
  sellPage: {
    title: string;
    subtitle: string;
    loginDescription: string;
    steps: {
      inventory: string;
      trade: string;
      confirmation: string;
    };
    confirmation: {
      title: string;
      description: string;
      tradeId: string;
      tradeIdSteam: string;
      grossValue: string;
      totalFees: string;
      youWillReceive: string;
      trackTrade: string;
      openSteam: string;
      acceptTrade: string;
      howItWorksTitle: string;
      steps: {
        step1: { title: string; description: string; };
        step2: { title: string; description: string; };
        step3: { title: string; description: string; };
        step4: { title: string; description: string; };
      };
      tip: string;
    };
    helpSteps: string[];
    successMessages: {
      tradeCreated: string;
      followInstructions: string;
    };
  };
  giveawaysPage: {
    participationSuccess: string;
    available: string;
    loading: string;
    refreshGiveaways: string;
    loadingGiveaways: string;
    loadingEndedGiveaways: string;
    loadingParticipations: string;
    ticketsUsed: string;
    ticketUsed: string;
    participatedOn: string;
    endedOn: string;
    viewDetails: string;
    comingSoon: string;
    temporarilyClosed: string;
    comingSoonDescription: string;
    keepAccumulating: string;
    keepAccumulatingDescription: string;
    ticketsPending: string;
    viewDashboard: string;
    sellMySkins: string;
    noEntries: string;
    noEntriesDescription: string;
    viewActive: string;
    giveawayNotFound: string;
    giveawayNotFoundDesc: string;
    totalTicketsSold: string;
    participantCount: string;
    avgTicketsPerParticipant: string;
    fillRate: string;
    myEntries: {
      title: string;
      inProgress: string;
      lost: string;
      won: string;
    };
    detail: {
      title: string;
      status: {
        active: string;
        ended: string;
        cancelled: string;
      };
      prizeTitle: string;
      ticketPrice: string;
      participants: string;
      timeRemaining: string;
      endsOn: string;
      ticketsSold: string;
      statistics: string;
      backToGiveaways: string;
      errorOccurred: string;
      finished: string;
      winnerTitle: string;
      usedTickets: string;
      probability: string;
      participantsCount: string;
      noParticipants: string;
      user: string;
      tickets: string;
      drawSeed: string;
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
        won: string;
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
  chatWidget: {
    support: string;
    online: string;
    responseTime: string;
    quickActions: string;
    tradeProblem: string;
    urgentSupport: string;
    kycStatus: string;
    quickMessages: {
      tradeProblem: string;
      urgentHelp: string;
      kycStatusCheck: string;
    };
    responses: {
      welcomeMessage: string;
      expertResponse: string;
      thankYouMessage: string;
    };
    placeholder: string;
    poweredBy: string;
    responseTimeInfo: string;
    tooltip: string;
  };
  ui: {
    search: string;
    filter: string;
    refresh: string;
    export: string;
    actions: string;
    view: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    previous: string;
    next: string;
    page: string;
    of: string;
    noResults: string;
    loading: string;
    error: string;
    success: string;
    info: string;
    all: string;
    active: string;
    inactive: string;
    approved: string;
    rejected: string;
    pending: string;
    paid: string;
    failed: string;
    created: string;
    updated: string;
    deleted: string;
    enabled: string;
    disabled: string;
    yes: string;
    no: string;
    confirm: string;
    close: string;
    open: string;
    select: string;
    selectAll: string;
    deselectAll: string;
    copy: string;
    copied: string;
    download: string;
    upload: string;
    submit: string;
    reset: string;
    clear: string;
    apply: string;
    remove: string;
    add: string;
    create: string;
    update: string;
    manage: string;
    settings: string;
    tools: string;
    status: string;
    date: string;
    time: string;
    amount: string;
    total: string;
    subtotal: string;
    fees: string;
    commission: string;
    volume: string;
    count: string;
    items: string;
    users: string;
    trades: string;
    payouts: string;
    affiliates: string;
    commissions: string;
    documents: string;
    type: string;
    name: string;
    email: string;
    username: string;
    avatar: string;
    profile: string;
    account: string;
    security: string;
    privacy: string;
    notifications: string;
    preferences: string;
    language: string;
    theme: string;
    currency: string;
    timezone: string;
    country: string;
    address: string;
    phone: string;
    website: string;
    description: string;
    notes: string;
    tags: string;
    categories: string;
    priority: string;
    urgency: string;
    severity: string;
    impact: string;
    resolution: string;
    feedback: string;
    rating: string;
    review: string;
    comment: string;
    message: string;
    subject: string;
    content: string;
    title: string;
    subtitle: string;
    header: string;
    footer: string;
    sidebar: string;
    menu: string;
    navigation: string;
    breadcrumb: string;
    pagination: string;
    table: string;
    list: string;
    card: string;
    modal: string;
    dialog: string;
    popup: string;
    tooltip: string;      
    banner: string;
    badge: string;
    label: string;
    tag: string;
    chip: string;
    button: string;
    link: string;
    textarea: string;
    checkbox: string;
    radio: string;
    slider: string;
    spinner: string;
    loader: string;
    skeleton: string;
    placeholder: string;
    empty: string;
    noData: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    networkError: string;
    timeout: string;
    maintenance: string;
    comingSoon: string;
    underConstruction: string;
    beta: string;
    alpha: string;
    draft: string;
    published: string;
    archived: string;
    restored: string;
    backup: string;
    restore: string;
    import: string;
    sync: string;
    reload: string;
    retry: string;
    undo: string;
    redo: string;
    cut: string;
    paste: string;
    duplicate: string;
    clone: string;
    move: string;
    rename: string;
    sort: string;
    find: string;
    replace: string;
    match: string;
    compare: string;
    merge: string;
    split: string;
    join: string;
    ungroup: string;
    expand: string;
    collapse: string;
    show: string;
    hide: string;
    toggle: string;
    maximize: string;
    minimize: string;
    fullscreen: string;
    windowed: string;
    zoom: string;
    pan: string;
    rotate: string;
    flip: string;
    crop: string;
    resize: string;
    scale: string;
    fit: string;
    fill: string;
    stretch: string;
    center: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
    middle: string;
    start: string;
    end: string;
    first: string;
    last: string;
    forward: string;
    backward: string;
    up: string;
    down: string;
    ascending: string;
    descending: string;
    alphabetical: string;
    numerical: string;
    chronological: string;
    random: string;
    shuffle: string;
    reverse: string;
    invert: string;
    mirror: string;
    transform: string;
    animate: string;
    transition: string;
    effect: string;
    style: string;
    color: string;
    background: string;
    foreground: string;
    border: string;
    shadow: string;
    gradient: string;
    pattern: string;
    texture: string;
    image: string;
    icon: string;
    logo: string;
    thumbnail: string;
    preview: string;
    gallery: string;
    slideshow: string;
    carousel: string;
    tabs: string;
    accordion: string;
    dropdown: string;
    toolbar: string;
    statusbar: string;
    panel: string;
    widget: string;
    component: string;
    element: string;
    container: string;
    wrapper: string;
    layout: string;
    template: string;
    skin: string;
    appearance: string;
    design: string;
    interaction: string;
    behavior: string;
    functionality: string;
    feature: string;
    capability: string;
    option: string;
    setting: string;
    configuration: string;
    parameter: string;
    property: string;
    attribute: string;
    value: string;
    data: string;
    information: string;
    text: string;
    number: string;
    integer: string;
    decimal: string;
    float: string;
    boolean: string;
    array: string;
    object: string;
    json: string;
    xml: string;
    html: string;
    css: string;
    javascript: string;
    typescript: string;
    react: string;
    vue: string;
    angular: string;
    express: string;
    database: string;
    sql: string;
    nosql: string;
    mongodb: string;
    postgresql: string;
    mysql: string;
    sqlite: string;
    redis: string;
    api: string;
    rest: string;
    graphql: string;
    websocket: string;
    http: string;
    https: string;
    ssl: string;
    tls: string;
    auth: string;
    authentication: string;
    authorization: string;
    login: string;
    logout: string;
    signup: string;
    signin: string;
    register: string;
    unregister: string;
    activate: string;
    deactivate: string;
    enable: string;
    disable: string;
    lock: string;
    unlock: string;
    block: string;
    unblock: string;
    ban: string;
    unban: string;
    suspend: string;
    unsuspend: string;
    verify: string;
    unverify: string;
    approve: string;
    reject: string;
    accept: string;
    decline: string;
    deny: string;
    allow: string;
    disallow: string;
    permit: string;
    forbid: string;
    grant: string;
    revoke: string;
    assign: string;
    unassign: string;
    subscribe: string;
    unsubscribe: string;
    follow: string;
    unfollow: string;
    like: string;
    unlike: string;
    favorite: string;
    unfavorite: string;
    bookmark: string;
    unbookmark: string;
    share: string;
    unshare: string;
    publish: string;
    unpublish: string;
    archive: string;
    unarchive: string;
    trash: string;
    untrash: string;
    undelete: string;
    insert: string;
    append: string;
    prepend: string;
    substitute: string;
    swap: string;
    exchange: string;
    change: string;
    modify: string;
    upgrade: string;
    downgrade: string;
    migrate: string;
    transfer: string;
    recover: string;
    repair: string;
    fix: string;
    debug: string;
    test: string;
    validate: string;
    check: string;
    inspect: string;
    audit: string;
    analyze: string;
    evaluate: string;
    assess: string;
    measure: string;
    calculate: string;
    compute: string;
    process: string;
    execute: string;
    run: string;
    stop: string;
    pause: string;
    resume: string;
    restart: string;
    initialize: string;
    setup: string;
    configure: string;
    install: string;
    uninstall: string;
    deploy: string;
    undeploy: string;
    build: string;
    compile: string;
    bundle: string;
    package: string;
    compress: string;
    decompress: string;
    zip: string;
    unzip: string;
    tar: string;
    untar: string;
    encrypt: string;
    decrypt: string;
    hash: string;
    sign: string;
    authenticate: string;
    authorize: string;
    sanitize: string;
    escape: string;
    unescape: string;
    encode: string;
    decode: string;
    serialize: string;
    deserialize: string;
    stringify: string;
    parse: string;
    format: string;
    normalize: string;
    standardize: string;
    optimize: string;
    improve: string;
    enhance: string;
    patch: string;
    hotfix: string;
    bugfix: string;
    enhancement: string;
    improvement: string;
    optimization: string;
    performance: string;
    speed: string;
    efficiency: string;
    reliability: string;
    stability: string;
    safety: string;
    confidentiality: string;
    integrity: string;
    availability: string;
    accessibility: string;
    usability: string;
    compatibility: string;
    interoperability: string;
    portability: string;
    scalability: string;
    maintainability: string;
    extensibility: string;
    flexibility: string;
    adaptability: string;
    modularity: string;
    reusability: string;
    testability: string;
    debuggability: string;
    monitorability: string;
    observability: string;
    traceability: string;
    auditability: string;
    compliance: string;
    governance: string;
    policy: string;
    procedure: string;
    workflow: string;
    pipeline: string;
    automation: string;
    orchestration: string;
    integration: string;
    synchronization: string;
    coordination: string;
    collaboration: string;
    communication: string;
    notification: string;
    alert: string;
    warning: string;
    exception: string;
    failure: string;
    completion: string;
    progress: string;
    state: string;
    condition: string;
    situation: string;
    context: string;
    environment: string;
    platform: string;
    system: string;
    application: string;
    service: string;
    module: string;
    library: string;
    framework: string;
    tool: string;
    utility: string;
    helper: string;
    assistant: string;
    guide: string;
    tutorial: string;
    documentation: string;
    manual: string;
    handbook: string;
    reference: string;
    glossary: string;
    encyclopedia: string;
    knowledge: string;
    resource: string;
    asset: string;
    file: string;
    document: string;
    report: string;
    log: string;
    record: string;
    entry: string;
    item: string;
    node: string;
    entity: string;
    instance: string;
    occurrence: string;
    event: string;
    action: string;
    operation: string;
    function: string;
    method: string;
    routine: string;
    algorithm: string;
    logic: string;
    rule: string;
    constraint: string;
    requirement: string;
    specification: string;
    definition: string;
    declaration: string;
    implementation: string;
    execution: string;
    invocation: string;
    call: string;
    request: string;
    response: string;
    result: string;
    output: string;
    input: string;
    argument: string;
    variable: string;
    constant: string;
    literal: string;
    expression: string;
    statement: string;
    instruction: string;
    command: string;
    directive: string;
    keyword: string;
    operator: string;
    symbol: string;
    token: string;
    identifier: string;
    marker: string;
    flag: string;
    indicator: string;
    signal: string;
    trigger: string;
    handler: string;
    listener: string;
    observer: string;
    publisher: string;
    producer: string;
    consumer: string;
    client: string;
    server: string;
    host: string;
    guest: string;
    user: string;
    admin: string;
    moderator: string;
    owner: string;
    member: string;
    visitor: string;
    anonymous: string;
    authenticated: string;
    authorized: string;
    verified: string;
    trusted: string;
    secure: string;
    safe: string;
    protected: string;
    private: string;
    public: string;
    internal: string;
    external: string;
    local: string;
    remote: string;
    global: string;
    universal: string;
    general: string;
    specific: string;
    particular: string;
    individual: string;
    unique: string;
    common: string;
    shared: string;
    distributed: string;
    centralized: string;
    decentralized: string;
    federated: string;
    clustered: string;
    replicated: string;
    mirrored: string;
    synchronized: string;
    asynchronous: string;
    concurrent: string;
    parallel: string;
    sequential: string;
    serial: string;
    batch: string;
    stream: string;
    queue: string;
    stack: string;
    heap: string;
    tree: string;
    graph: string;
    network: string;
    mesh: string;
    grid: string;
    matrix: string;
    vector: string;
    set: string;
    map: string;
    dictionary: string;
    index: string;
    key: string;
    pair: string;
    tuple: string;
    struct: string;
    class: string;
    interface: string;
    protocol: string;
    contract: string;
    agreement: string;
    treaty: string;
    pact: string;
    deal: string;
    transaction: string;
    trade: string;
    commerce: string;
    business: string;
    enterprise: string;
    company: string;
    organization: string;
    institution: string;
    agency: string;
    department: string;
    division: string;
    section: string;
    unit: string;
    team: string;
    squad: string;
    crew: string;
    staff: string;
    personnel: string;
    workforce: string;
    employee: string;
    worker: string;
    technician: string;
    specialist: string;
    expert: string;
    professional: string;
    consultant: string;
    advisor: string;
    analyst: string;
    developer: string;
    programmer: string;
    engineer: string;
    architect: string;
    designer: string;
    artist: string;
    creator: string;
    author: string;
    writer: string;
    editor: string;
    reviewer: string;
    tester: string;
    validator: string;
    auditor: string;
    inspector: string;
    supervisor: string;
    manager: string;
    director: string;
    executive: string;
    administrator: string;
    coordinator: string;
    facilitator: string;
    mediator: string;
    negotiator: string;
    representative: string;
    delegate: string;
    ambassador: string;
    agent: string;
    broker: string;
    dealer: string;
    vendor: string;
    supplier: string;
    provider: string;
    distributor: string;
    retailer: string;
    wholesaler: string;
    manufacturer: string;
    inventor: string;
    innovator: string;
    pioneer: string;
    leader: string;
    follower: string;
    supporter: string;
    advocate: string;
    champion: string;
    defender: string;
    protector: string;
    guardian: string;
    custodian: string;
    caretaker: string;
    maintainer: string;
    keeper: string;
    holder: string;
    possessor: string;
    bearer: string;
    carrier: string;
    transporter: string;
    deliverer: string;
    messenger: string;
    courier: string;
    dispatcher: string;
    sender: string;
    receiver: string;
    recipient: string;
    addressee: string;
    beneficiary: string;
    stakeholder: string;
    shareholder: string;
    investor: string;
    sponsor: string;
    patron: string;
    donor: string;
    contributor: string;
    participant: string;
    attendee: string;
    tourist: string;
    traveler: string;
    passenger: string;
    rider: string;
    driver: string;
    pilot: string;
    captain: string;
    commander: string;
    chief: string;
    head: string;
    boss: string;
    superior: string;
    subordinate: string;
    colleague: string;
    peer: string;
    partner: string;
    associate: string;
    ally: string;
    friend: string;
    enemy: string;
    opponent: string;
    rival: string;
    competitor: string;
    challenger: string;
    contender: string;
    candidate: string;
    applicant: string;
    nominee: string;
    volunteer: string;
    recruit: string;
    trainee: string;
    apprentice: string;
    intern: string;
    student: string;
    pupil: string;
    learner: string;
    scholar: string;
    researcher: string;
    scientist: string;
    academic: string;
    professor: string;
    teacher: string;
    instructor: string;
    tutor: string;
    mentor: string;
    coach: string;
    trainer: string;
    counselor: string;
    therapist: string;
    healer: string;
    doctor: string;
    physician: string;
    surgeon: string;
    nurse: string;
    medic: string;
    paramedic: string;
    authority: string;
    master: string;
    guru: string;
    sage: string;
    wise: string;
    smart: string;
    intelligent: string;
    clever: string;
    brilliant: string;
    genius: string;
    talented: string;
    skilled: string;
    experienced: string;
    seasoned: string;
    veteran: string;
    senior: string;
    junior: string;
    novice: string;
    beginner: string;
    amateur: string;
    hobbyist: string;
    enthusiast: string;
    fan: string;
    subscriber: string;
    collaborator: string;
    teammate: string;
    coworker: string;
    companion: string;
    buddy: string;
    pal: string;
    mate: string;
    comrade: string;
    confederate: string;
    accomplice: string;
    aide: string;
    backer: string;
    benefactor: string;
    proprietor: string;
    landlord: string;
    tenant: string;
    renter: string;
    lessee: string;
    lessor: string;
    borrower: string;
    lender: string;
    creditor: string;
    debtor: string;
    buyer: string;
    seller: string;
    customer: string;
  };
  // Nouvelles propriétés ajoutées
  affiliate: {
    title: string;
    subtitle: string;
    notAffiliate: string;
    applyNow: string;
    yourStats: string;
    totalEarnings: string;
    pendingCommissions: string;
    paidCommissions: string;
    referrals: string;
    conversionRate: string;
    averageOrderValue: string;
    affiliateLink: string;
    copyLink: string;
    linkCopied: string;
    shareOnSocial: string;
    recentReferrals: string;
    commissionHistory: string;
    marketingMaterials: string;
    banners: string;
    textAds: string;
    emailTemplates: string;
    dashboard: {
      title: string;
      active: string;
      inactive: string;
      codeLabel: string;
      commissionLabel: string;
      copyMyLink: string;
      copied: string;
      kpi: {
        referrals: string;
        referralsSub: string;
        totalVolume: string;
        totalVolumeSub: string;
        totalCommissions: string;
        pending: string;
      };
      performance: string;
      conversionRate: string;
      avgOrderValue: string;
      commissionRate: string;
      tabs: { referrals: string; commissions: string; tools: string };
      recentReferrals: string;
      recentReferralsSub: string;
      referredOn: string;
      noReferrals: string;
      noReferralsSub: string;
      pendingCommissionsTitle: string;
      pendingTotal: string;
      requestPayout: string;
      noPending: string;
      noPendingSub: string;
      paidCommissionsTitle: string;
      totalReceived: string;
      noPaid: string;
      noPaidSub: string;
      linkGenerator: string;
      linkGeneratorDesc: string;
      targetPage: string;
      targetPageOptional: string;
      targetPageHint: string;
      generateAndCopy: string;
      lastGenerated: string;
      quickLinks: string;
      quickHome: string;
      quickSell: string;
      quickGiveaways: string;
      partnerBenefits: string;
      benefitCommission: string;
      benefitPayments: string;
      benefitAnalytics: string;
      benefitMarketing: string;
      benefitSupport: string;
      contactSupport: string;
      commissionPaid: string;
      commissionPending: string;
      payoutRequested: string;
      payoutRequestedDesc: string;
      payoutError: string;
      invalidPath: string;
      invalidPathDesc: string;
      generateError: string;
      generateErrorDesc: string;
      copyError: string;
      copyErrorDesc: string;
      selfReferralWarning: string;
      selfReferralDesc: string;
      notAffiliate: string;
      notAffiliateDesc: string;
    };
    application: {
      title: string;
      description: string;
      fullName: string;
      email: string;
      website: string;
      socialMedia: string;
      youtubeUrlPlaceholder: string;
      twitchUsernamePlaceholder: string;
      twitterUsernamePlaceholder: string;
      instagramUsernamePlaceholder: string;
      trackingPixelPlaceholder: string;
      experience: string;
      motivation: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      pending: string;
      pendingDescription: string;
      rejected: string;
      rejectedDescription: string;
      reason: string;
      reapply: string;
      applicationDetails: string;
      commissionRate: string;
      benefits: {
        title: string;
        commission: string;
        payments: string;
        dashboard: string;
        support: string;
        marketing: string;
      };
    };
  };
  moderator: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
    loggingIn: string;
    loginSuccess: string;
    loginError: string;
    loginErrorDesc: string;
    accessDenied: string;
    accessDeniedDesc: string;
    reservedInterface: string;
  };
  moderation: {
    title: string;
    subtitle: string;
    accessDenied: {
      title: string;
      description: string;
    };
    stats: {
      activeConversations: string;
      unassigned: string;
      responseTime: string;
      closed: string;
    };
    filtersTitle: string;
    loading: string;
    noConversations: string;
    conversationsCount: string;
    filters: {
      statusPlaceholder: string;
      priorityPlaceholder: string;
      assignmentPlaceholder: string;
      searchPlaceholder: string;
      allStatuses: string;
      active: string;
      closed: string;
      archived: string;
      allPriorities: string;
      low: string;
      normal: string;
      high: string;
      urgent: string;
      all: string;
      myConversations: string;
      unassigned: string;
    };
    conversation: {
      typeYourReply: string;
      notFound: {
        title: string;
        backButton: string;
      };
      header: {
        noSubject: string;
        withUser: string;
        anonymousUser: string;
      };
      info: {
        title: string;
        userTitle: string;
        anonymous: string;
        steam: string;
        assignmentTitle: string;
        unassigned: string;
        assignToMe: string;
        datesTitle: string;
        created: string;
        updated: string;
        closed: string;
        actionsTitle: string;
        closeConversation: string;
        reopenConversation: string;
      };
      messages: {
        title: string;
        messageSent: string;
        sendError: string;
        loadError: string;
        statusUpdated: string;
        updateError: string;
        assigned: string;
        assignError: string;
      };
    };
  };
  help: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categories: {
      gettingStarted: string;
      trading: string;
      payments: string;
      security: string;
      technical: string;
    };
    popularArticles: string;
    recentlyUpdated: string;
    stillNeedHelp: string;
    contactSupport: string;
    communityForum: string;
    views: string;
    helpful: string;
  };
  contact: {
    title: string;
    subtitle: string;
    form: {
      name: string;
      email: string;
      subject: string;
      message: string;
      send: string;
      sending: string;
      success: string;
      error: string;
    };
    info: {
      title: string;
      email: string;
      response: string;
      hours: string;
      support: string;
      business: string;
    };
  };
  press: {
    title: string;
    subtitle: string;
    lastUpdate: string;
    statsTitle: string;
    pressReleases: string;
    readRelease: string;
    aboutTitle: string;
    aboutDescription1: string;
    aboutDescription2: string;
    sector: string;
    sectorValue: string;
    founded: string;
    foundedValue: string;
    employees: string;
    employeesValue: string;
    funding: string;
    fundingValue: string;
    mediaKit: string;
    download: string;
    managementTeam: string;
    pressContact: string;
    contactPress: string;
    workingHours: string;
    stats: {
      activeUsers: string;
      volumeProcessed: string;
      completedTrades: string;
      satisfactionRate: string;
    };
    mediaKitItems: {
      logos: {
        title: string;
        description: string;
      };
      screenshots: {
        title: string;
        description: string;
      };
      factsheet: {
        title: string;
        description: string;
      };
    };
  };
  apiDocs: {
    title: string;
    subtitle: string;
    quickStart: string;
    getApiKey: string;
    getApiKeyDesc: string;
    makeCall: string;
    makeCallDesc: string;
    integrate: string;
    integrateDesc: string;
    authentication: string;
    authDescription: string;
    important: string;
    securityWarning: string;
    availableEndpoints: string;
    codeExamples: string;
    responseExamples: string;
    rateLimits: string;
    rateLimitsDesc: string;
    statusCodes: string;
    officialSdks: string;
    needHelp: string;
    supportDesc: string;
    categories: {
      authentication: string;
      user: string;
      trading: string;
      skinplace: string;
    };
    endpoints: {
      steamAuth: string;
      logout: string;
      getProfile: string;
      updateProfile: string;
      getTradeHistory: string;
      estimatePrices: string;
      createTrade: string;
      getInventory: string;
      getItems: string;
      getBalance: string;
      purchaseItems: string;
    };
    statusCodesLabels: {
      success: string;
      badRequest: string;
      unauthorized: string;
      tooManyRequests: string;
      serverError: string;
    };
    rateLimitLabels: {
      default: string;
      authentication: string;
      trading: string;
      estimation: string;
    };
    tabLabels: {
      estimate: string;
      trade: string;
      error: string;
    };
  };
  policies: {
    kyc: {
      title: string;
      subtitle: string;
    };
    aml: {
      title: string;
      subtitle: string;
    };
    privacy: {
      title: string;
      subtitle: string;
    };
    terms: {
      title: string;
      subtitle: string;
    };
  };
  components: {
    wysiwyg: {
      placeholder: string;
      loading: string;
      imageUrl: string;
      linkUrl: string;
    };
    newsletter: {
      templatePlaceholder: string;
      visualEditorPlaceholder: string;
      textEditorPlaceholder: string;
      // Section publique
      title: string;
      description: string;
      emailPlaceholder: string;
      subscribeButton: string;
      subscribingButton: string;
      successTitle: string;
      successDescription: string;
      successBadge: string;
      noSpamText: string;
      feature1: string;
      feature2: string;
      feature3: string;
      // Messages d'erreur et de succès
      errors: {
        emailRequired: string;
        emailInvalid: string;
        subscriptionError: string;
        generalError: string;
      };
      messages: {
        subscriptionSuccess: string;
        alreadySubscribed: string;
      };
      unsubscribe: {
        title: string;
        loading: string;
        processing: string;
        success: string;
        successDesc: string;
        alreadyUnsubscribed: string;
        alreadyUnsubscribedDesc: string;
        error: string;
        errorDesc: string;
        confirmed: string;
        noMoreEmails: string;
        canResubscribe: string;
        home: string;
        backHome: string;
        resubscribe: string;
        missingToken: string;
        unexpectedError: string;
        defaultError: string;
      };
    };
    skinplace: {
      allRarities: string;
      loadingInventory: string;
      tradableItems: string;
      totalValue: string;
      averageValue: string;
      statTrak: string;
      yourInventory: string;
      filters: string;
      search: string;
      searchPlaceholder: string;
      sortBy: string;
      priceDescending: string;
      priceAscending: string;
      rarity: string;
      name: string;
      allExteriors: string;
      exterior: string;
      statTrakOnly: string;
      resetFilters: string;
      noItemsFiltered: string;
      noTradableItems: string;
      scrollForMore: string;
      selected: string;
      itemsSelected: string;
      totalValueLabel: string;
      deselectAll: string;
      continueWithSelection: string;
      inventoryPrivate: string;
      makePublic: string;
      error: string;
      items: string;
      skipReasons: {
        over_stock: string;
        low_demand: string;
        price_too_low: string;
        restricted_item: string;
        market_banned: string;
        trade_banned: string;
        untradable: string;
        unknown: string;
      };
      unavailable: string;
    };
    steam: {
      searchPlaceholder: string;
    };
    onboarding: {
      step2: string;
      sellTitle: string;
      securityTitle: string;
      welcome: {
        title: string;
        description: string;
        features: {
          secure: string;
          bestPrices: string;
          fastPayment: string;
          support: string;
        };
      };
      tradeLink: {
        title: string;
        description: string;
        howTo: {
          title: string;
          step1: string;
          step3: string;
          step4: string;
        };
        warning: string;
      };
      steamId: {
        title: string;
        description: string;
      };
      enterTradeLink: {
        title: string;
        description: string;
        label: string;
        placeholder: string;
        invalidUrl: string;
        getUrlHere: string;
        validUrl: string;
        tip: string;
      };
      sellProcess: {
        title: string;
        description: string;
        steps: {
          select: {
            title: string;
            description: string;
          };
          accept: {
            title: string;
            description: string;
          };
          receive: {
            title: string;
            description: string;
          };
        };
      };
      security: {
        title: string;
        description: string;
        kyc: {
          title: string;
          description: string;
        };
        payments: {
          title: string;
          description: string;
        };
        tradeHold: {
          title: string;
          description: string;
        };
      };
      navigation: {
        step: string;
        of: string;
        skip: string;
        previous: string;
        next: string;
        start: string;
        saving: string;
      };
      errors: {
        invalidTradeLink: string;
        saveError: string;
        invalidSteamId: string;
        steamIdSaveError: string;
      };
      success: {
        tradeLinkSaved: string;
        steamIdSaved: string;
      };
    };
    header: {
      french: string;
      english: string;
      chinese: string;
    };
    admin: {
      trades: {
        created: string;
        accepted: string;
        paid: string;
        failed: string;
      };
      payouts: {
        searchPlaceholder: string;
        verificationRequired: string;
        verified: string;
        scheduled: string;
        executed: string;
        paid: string;
        failed: string;
        pending?: string;
        pendingApproval?: string;
        approve?: string;
        approveSuccess?: string;
        autoApproveLabel?: string;
        autoApproveThresholdLabel?: string;
        save?: string;
        autoApproveSaved?: string;
        resyncFlexify?: string;
        resyncSuccess?: string;
      };
    };
  };
  paymentComponents: {
      methodSelector: {
        title: string;
        description: string;
        sepa: {
          title: string;
          description: string;
          delay: string;
          fees: string;
        };
        crypto: {
          title: string;
          description: string;
          delay: string;
          fees: string;
        };
        whitepayCrypto: {
          title: string;
          description: string;
          delay: string;
          fees: string;
        };
      };
      kyc: {
        title: string;
        description: string;
        status: {
          verified: string;
          rejected: string;
          pending: string;
        };
        identityVerified: string;
        identityVerifiedDesc: string;
        verificationPending: string;
        verificationPendingDesc: string;
        verificationRejected: string;
        verificationRejectedDesc: string;
        whyKyc: string;
        whyKycDesc: string;
        requiredDocuments: string;
        document1: string;
        document2: string;
        document3: string;
        restartVerification: string;
        startVerification: string;
        refreshStatus: string;
      };
      sepaForm: {
        title: string;
        description: string;
        amountToReceive: string;
        getQuote: string;
        quoteDetails: string;
        grossAmount: string;
        processingFees: string;
        networkFees: string;
        netAmount: string;
        redirectInfo: string;
        continuePayment: string;
      };
      cryptoForm: {
        title: string;
        description: string;
        selectCrypto: string;
        selectCryptoPlaceholder: string;
        walletAddress: string;
        walletWarning: string;
        equivalentAmount: string;
        getQuote: string;
        quoteDetails: string;
        amountEur: string;
        exchangeRate: string;
        networkFees: string;
        youWillReceive: string;
        transferInfo: string;
        continuePayment: string;
      };
      statusTracker: {
        title: string;
        sepaTransfer: string;
        cryptoPayment: string;
        status: {
          completed: string;
          failed: string;
          inProgress: string;
        };
        steps: {
          pending: { label: string; description: string };
          verificationRequired: { label: string; description: string };
          verified: { label: string; description: string };
          processing: { label: string; description: string };
          paid: { label: string; description: string };
          sent: { label: string; description: string };
        };
        refreshing: string;
        transactionDetails: string;
        cryptoAmount: string;
        fiatAmount: string;
        transaction: string;
      };
      gatefiWidget: {
        title: string;
      };
      errors: {
        quoteError: string;
        walletRequired: string;
        quoteRequired: string;
        paymentError: string;
        unknownError: string;
      };
      whitepayForm: {
        title: string;
        description: string;
        flowStandard: {
          title: string;
          description: string;
        };
        flowInstant: {
          title: string;
          description: string;
        };
        selectCrypto: string;
        selectCryptoPlaceholder: string;
        selectNetwork: string;
        selectNetworkPlaceholder: string;
        walletAddress: string;
        walletWarning: string;
        memoLabel: string;
        memoRequired: string;
        memoPlaceholder: string;
        memoWarning: string;
        amount: string;
        getQuoteButton: string;
        instantButton: string;
        disclaimer: string;
        confirm: {
          title: string;
          description: string;
          amount: string;
          exchangeRate: string;
          fee: string;
          youReceive: string;
          wallet: string;
          network: string;
          timeLeft: string;
          expired: string;
          expiredTitle: string;
          expiredDescription: string;
          refreshRate: string;
          confirmButton: string;
          cancel: string;
        };
        success: {
          title: string;
          description: string;
          amount: string;
          status: string;
          txHash: string;
          trackingInfo: string;
        };
        errors: {
          kycRequired: string;
          createError: string;
          confirmError: string;
          refreshError: string;
          unknownError: string;
        };
      };
    };
    legalPage: {
      pageNotAvailable: string;
      pageNotAvailableDesc: string;
      lastUpdated: string;
      importantNotice: string;
      questions: string;
      teamAvailable: string;
    };
    helpPage: {
      browseByCategory: string;
      supportOptions: {
        liveChat: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
        };
        ticket: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
        };
        phone: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
        };
      };
      response: string;
      contactSupport: string;
      cantFindAnswer: string;
      teamAvailable247: string;
      liveChat: string;
      createTicket: string;
      supportOnline: string;
      avgResponseTime: string;
      articles: {
        gettingStarted: {
          createAccount: string;
          steamConnection: string;
          kycStepByStep: string;
          firstTrade: string;
        };
        trading: {
          howToSell: string;
          priceEstimation: string;
          tradeHold: string;
          fees: string;
        };
        payments: {
          methods: string;
          delays: string;
          ibanVerification: string;
          paymentIssue: string;
        };
        security: {
          secureAccount: string;
          accountSuspended: string;
          reportSuspicious: string;
          accountRecovery: string;
        };
        technical: {
          siteNotLoading: string;
          steamTradeError: string;
          steamConnectionIssue: string;
          buggyInterface: string;
        };
      };
      popularArticles: {
        sellGuide: string;
        kycGuide: string;
        feesGuide: string;
      };
    };
    contactPage: {
      sendMessage: string;
      fullName: string;
      fullNamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      department: string;
      departmentPlaceholder: string;
      priority: string;
      priorityPlaceholder: string;
      priorities: {
        low: string;
        medium: string;
        high: string;
        urgent: string;
      };
      subject: string;
      subjectPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      privacyConsent: string;
      privacyPolicy: string;
      sendButton: string;
      contactMethods: string;
      response: string;
      departments: string;
      supportHours: string;
      offices: string;
      companyInfo: string;
      onlineStatus: string;
      methods: {
        liveChat: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
          action: string;
        };
        email: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
        };
        phone: {
          title: string;
          description: string;
          availability: string;
          responseTime: string;
        };
      };
      departmentsList: {
        technical: {
          name: string;
          description: string;
        };
        security: {
          name: string;
          description: string;
        };
        compliance: {
          name: string;
          description: string;
        };
        partnerships: {
          name: string;
          description: string;
        };
        press: {
          name: string;
          description: string;
        };
      };
      schedule: {
        weekdays: { day: string; hours: string; type: string };
        weekends: { day: string; hours: string; type: string };
        always: { day: string; hours: string; type: string };
      };
    };
    adminNav: {
      groups: {
        overview: string;
        management: string;
        affiliation: string;
        marketing: string;
        communication: string;
        content: string;
        system: string;
      };
      items: {
        dashboard: string;
        analytics: string;
        users: string;
        trades: string;
        payouts: string;
        kyc: string;
        applications: string;
        affiliates: string;
        commissions: string;
        performance: string;
        giveaways: string;
        points?: string;
        newsletter: string;
        chatSupport: string;
        legalPages: string;
        audit: string;
        exports: string;
        settings: string;
        help: string;
      };
      header: {
        adminPanel: string;
      };
      footer: {
        backToSite: string;
        logout: string;
        systemStatus: string;
        system: string;
        online: string;
        uptime: string;
      };
    };
  error: {
    title: string;
    message: string;
    errorDetails: string;
    retry: string;
    home: string;
    contactSupport: string;
    suggestions: string;
    tip1: string;
    tip2: string;
    tip3: string;
    tip4: string;
  };
  globalError: {
    title: string;
    message: string;
    errorDetails: string;
    reload: string;
    home: string;
    support: string;
    supportTitle: string;
    supportDesc: string;
  };
  loading: {
    title: string;
    subtitle: string;
    steam: string;
    inventory: string;
    skins: string;
  };
  notFound: {
    code: string;
    pageNotFound: string;
    title: string;
    description: string;
    message: string;
    backHome: string;
    home: string;
    previousPage: string;
    explore: string;
    usefulLinks: string;
    sellSkins: string;
    myDashboard: string;
    giveaways: string;
    support: string;
    randomStats: string;
    quickLinks: {
      title: string;
      sell: string;
      dashboard: string;
      giveaways: string;
      support: string;
    };
  };
  resetPassword: {
    tokenMissing: string;
    passwordTooShort: string;
    passwordMismatch: string;
    resetError: string;
    resetSuccess: string;
    resetSuccessTitle: string;
    resetSuccessMessage: string;
    resetSuccessRedirect: string;
    loginNow: string;
    newPassword: string;
    newPasswordSubtitle: string;
    accountLabel: string;
    resetPasswordTitle: string;
    resetPasswordDesc: string;
    confirmPassword: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    strength: string;
    strengthTooShort: string;
    strengthWeak: string;
    strengthMedium: string;
    strengthStrong: string;
    strengthVeryStrong: string;
    cancel: string;
    updating: string;
    reset: string;
  };
  authProvider: {
    steamLoginInProgress: string;
    steamLoginRedirect: string;
    steamLoginError: string;
    steamLoginErrorDesc: string;
    discordLoginInProgress: string;
    discordLoginRedirect: string;
    discordLoginSuccess: string;
    discordLoginSuccessDesc: string;
    discordLoginError: string;
    discordLoginErrorDesc: string;
    logoutSuccess: string;
    logoutSuccessDesc: string;
    logoutError: string;
    logoutErrorDesc: string;
  };
  tradeCreator: {
    invalidTradeLink: string;
    tradeLinkSaved: string;
    tradeLinkError: string;
    negativeNetValue: string;
    tradeCreatedSuccess: string;
    tradeCreationError: string;
    grossValue: string;
    networkFees: string;
    youReceive: string;
    negativeNetAlert: string;
  };
  paymentMethodsList: {
    loadingError: string;
    unknownError: string;
    loading: string;
    title: string;
    add: string;
    noMethods: string;
    addMethod: string;
    crypto: string;
    sepa: string;
    paymentMethod: string;
    sepaPrefix: string;
    walletPrefix: string;
  };
  payoutPage: {
    title: string;
    subtitle: string;
    loginRequired: {
      title: string;
      description: string;
      login: string;
    };
    kyc: {
      title: string;
      required: string;
      description: string;
      startKyc: string;
    };
    tabs: {
      request: string;
      history: string;
    };
      request: {
        title: string;
        availableBalance: string;
        selectMethod: string;
        amountLabel: string;
        amountPlaceholder: string;
        feesInfo: string;
        feesPreview: string;
        processingFee: string;
        networkFee: string;
        youReceive: string;
        getQuoteButton: string;
        submitButton: string;
        submitting: string;
        minAmount: string;
        maxAmount: string;
        grossAmount: string;
        estimatedDelay: string;
        ibanVerificationTitle: string;
        ibanLabel: string;
        ibanPlaceholder: string;
        bicLabel: string;
        bicPlaceholder: string;
        firstNameLabel?: string;
        firstNamePlaceholder?: string;
        lastNameLabel?: string;
        lastNamePlaceholder?: string;
        phoneLabel?: string;
        phonePlaceholder?: string;
        addressLabel?: string;
        addressPlaceholder?: string;
        cityLabel?: string;
        cityPlaceholder?: string;
        countryLabel?: string;
        beneficiaryEmailLabel?: string;
        // Crypto fields
        cryptoLabel: string;
        cryptoPlaceholder: string;
        networkLabel: string;
        networkPlaceholder: string;
        walletAddressLabel: string;
        walletAddressWarning: string;
        cryptoWalletRequired: string;
        cryptoMemoRequired: string;
        cryptoMinAmount: string;
        cardLabel: string;
        cardNumberRequired: string;
        cardHolderRequired: string;
        cardExpiryRequired: string;
        cardCvvRequired: string;
        cardNumberLabel: string;
        cardHolderLabel: string;
        cardExpireMonthLabel: string;
        cardExpireYearLabel: string;
        cardCvvLabel: string;
        memoLabel: string;
        memoRequired: string;
        memoPlaceholder: string;
        memoWarning: string;
        savedIbanLabel?: string;
        useSavedIban?: string;
        enterNewIban?: string;
        saveIbanHint?: string;
        savedCardLabel?: string;
        useSavedCard?: string;
        enterNewCard?: string;
        savedCardHint?: string;
        saveCardHint?: string;
        savedWalletLabel?: string;
        useSavedWallet?: string;
        enterNewWallet?: string;
        saveWalletHint?: string;
        security: {
          title: string;
          sepaInfo: string;
          cryptoInfo: string;
          cardInfo: string;
        };
      };
    history: {
      title: string;
      noPayout: string;
      noPayoutDesc: string;
      requestPayout: string;
      columns: {
        date: string;
        amount: string;
        method: string;
        status: string;
        reference: string;
      };
      status: {
        pending: string;
        pendingApproval: string;
        verificationRequired: string;
        verified: string;
        scheduled: string;
        executed: string;
        paid: string;
        failed: string;
        cancelled: string;
      };
    };
    toast: {
      amountTooLow: string;
      insufficientBalance: string;
      payoutCreated: string;
      payoutCreatedDesc: string;
      payoutError: string;
    };
  };
  kycPolicy: {
    title: string;
    subtitle: string;
    content: string;
    comingSoon: string;
    warning: string;
    warningText: string;
  };
  amlPolicy: {
    title: string;
    subtitle: string;
    content: string;
    comingSoon: string;
    warning: string;
    warningText: string;
  };
}
