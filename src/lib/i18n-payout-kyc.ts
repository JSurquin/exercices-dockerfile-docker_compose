// =============================================================================
// TRADUCTIONS PAYOUT & KYC
// À ajouter dans le fichier i18n.ts principal
// =============================================================================

export const payoutKycTranslations = {
  fr: {
    payout: {
      title: "Demander un paiement",
      description: "Choisissez votre méthode de paiement préférée",
      amount: "Montant brut",
      netAmount: "Montant net",
      submit: "Recevoir",
      terms: "En confirmant, vous acceptez nos conditions de paiement.",
      firstName: "Prénom",
      lastName: "Nom",
      
      sepa: {
        title: "Virement SEPA",
        iban: "IBAN",
        bic: "BIC/SWIFT (optionnel)",
        info: "Les virements SEPA sont sécurisés et arrivent sous 1-2 jours ouvrés.",
      },
      
      card: {
        title: "Carte bancaire",
        number: "Numéro de carte",
        holder: "Nom sur la carte",
        expiryMonth: "Mois",
        expiryYear: "Année",
        info: "Les paiements par carte sont traités instantanément ou sous 24h.",
      },
      
      fees: {
        processing: "Frais de traitement",
        network: "Frais réseau",
        total: "Total des frais",
      },
      
      success: {
        title: "Paiement initié avec succès !",
        sepa: "Votre virement sera traité dans 1-2 jours ouvrés.",
        card: "Votre paiement sera traité dans les 24h.",
      },
      
      status: {
        pending: "En attente",
        processing: "En cours",
        verification: "Vérification requise",
        paid: "Payé",
        failed: "Échoué",
      },
      
      history: {
        title: "Historique des paiements",
        description: "Tous vos paiements reçus et en cours",
        empty: "Aucun paiement pour le moment",
        total: "paiement(s)",
        paidAt: "Payé le",
      },
    },
    
    kyc: {
      title: "Vérification d'identité",
      description: "La vérification de votre identité est requise pour recevoir des paiements.",
      
      status: {
        pending: "En attente",
        verified: "Vérifié",
        rejected: "Refusé",
      },
      
      start: "Commencer la vérification",
      continue: "Continuer la vérification",
      retry: "Réessayer la vérification",
      
      verified: {
        title: "Identité vérifiée",
        description: "Vous pouvez maintenant recevoir des paiements.",
      },
      
      declineReasons: "Raisons du refus",
      
      steps: {
        title: "Comment ça marche ?",
        step1: {
          title: "Préparez vos documents",
          description: "Carte d'identité ou passeport en cours de validité.",
        },
        step2: {
          title: "Prenez un selfie",
          description: "Une photo de vous pour confirmer votre identité.",
        },
        step3: {
          title: "Vérification automatique",
          description: "La vérification prend généralement moins de 5 minutes.",
        },
      },
      
      privacy: "Vos données sont sécurisées et utilisées uniquement pour vérifier votre identité conformément aux réglementations anti-blanchiment.",
    },
    
    common: {
      error: "Erreur",
      loading: "Chargement...",
      previous: "Précédent",
      next: "Suivant",
      page: "Page",
    },
  },
  
  en: {
    payout: {
      title: "Request a payment",
      description: "Choose your preferred payment method",
      amount: "Gross amount",
      netAmount: "Net amount",
      submit: "Receive",
      terms: "By confirming, you accept our payment terms.",
      firstName: "First name",
      lastName: "Last name",
      
      sepa: {
        title: "SEPA Transfer",
        iban: "IBAN",
        bic: "BIC/SWIFT (optional)",
        info: "SEPA transfers are secure and arrive within 1-2 business days.",
      },
      
      card: {
        title: "Bank card",
        number: "Card number",
        holder: "Name on card",
        expiryMonth: "Month",
        expiryYear: "Year",
        info: "Card payments are processed instantly or within 24 hours.",
      },
      
      fees: {
        processing: "Processing fees",
        network: "Network fees",
        total: "Total fees",
      },
      
      success: {
        title: "Payment initiated successfully!",
        sepa: "Your transfer will be processed within 1-2 business days.",
        card: "Your payment will be processed within 24 hours.",
      },
      
      status: {
        pending: "Pending",
        processing: "Processing",
        verification: "Verification required",
        paid: "Paid",
        failed: "Failed",
      },
      
      history: {
        title: "Payment history",
        description: "All your received and pending payments",
        empty: "No payments yet",
        total: "payment(s)",
        paidAt: "Paid on",
      },
    },
    
    kyc: {
      title: "Identity verification",
      description: "Identity verification is required to receive payments.",
      
      status: {
        pending: "Pending",
        verified: "Verified",
        rejected: "Rejected",
      },
      
      start: "Start verification",
      continue: "Continue verification",
      retry: "Retry verification",
      
      verified: {
        title: "Identity verified",
        description: "You can now receive payments.",
      },
      
      declineReasons: "Decline reasons",
      
      steps: {
        title: "How does it work?",
        step1: {
          title: "Prepare your documents",
          description: "Valid ID card or passport.",
        },
        step2: {
          title: "Take a selfie",
          description: "A photo of yourself to confirm your identity.",
        },
        step3: {
          title: "Automatic verification",
          description: "Verification usually takes less than 5 minutes.",
        },
      },
      
      privacy: "Your data is secure and used only to verify your identity in compliance with anti-money laundering regulations.",
    },
    
    common: {
      error: "Error",
      loading: "Loading...",
      previous: "Previous",
      next: "Next",
      page: "Page",
    },
  },
  
  cn: {
    payout: {
      title: "申请付款",
      description: "选择您喜欢的付款方式",
      amount: "总金额",
      netAmount: "净金额",
      submit: "接收",
      terms: "确认即表示您接受我们的付款条款。",
      firstName: "名",
      lastName: "姓",
      
      sepa: {
        title: "SEPA转账",
        iban: "IBAN",
        bic: "BIC/SWIFT（可选）",
        info: "SEPA转账安全可靠，1-2个工作日到账。",
      },
      
      card: {
        title: "银行卡",
        number: "卡号",
        holder: "卡上姓名",
        expiryMonth: "月",
        expiryYear: "年",
        info: "银行卡付款即时处理或24小时内到账。",
      },
      
      fees: {
        processing: "处理费",
        network: "网络费",
        total: "总费用",
      },
      
      success: {
        title: "付款已成功发起！",
        sepa: "您的转账将在1-2个工作日内处理。",
        card: "您的付款将在24小时内处理。",
      },
      
      status: {
        pending: "待处理",
        processing: "处理中",
        verification: "需要验证",
        paid: "已付款",
        failed: "失败",
      },
      
      history: {
        title: "付款历史",
        description: "您所有已收到和待处理的付款",
        empty: "暂无付款记录",
        total: "笔付款",
        paidAt: "付款日期",
      },
    },
    
    kyc: {
      title: "身份验证",
      description: "接收付款需要进行身份验证。",
      
      status: {
        pending: "待验证",
        verified: "已验证",
        rejected: "已拒绝",
      },
      
      start: "开始验证",
      continue: "继续验证",
      retry: "重新验证",
      
      verified: {
        title: "身份已验证",
        description: "您现在可以接收付款了。",
      },
      
      declineReasons: "拒绝原因",
      
      steps: {
        title: "如何操作？",
        step1: {
          title: "准备您的证件",
          description: "有效身份证或护照。",
        },
        step2: {
          title: "拍摄自拍照",
          description: "一张您本人的照片以确认身份。",
        },
        step3: {
          title: "自动验证",
          description: "验证通常需要不到5分钟。",
        },
      },
      
      privacy: "您的数据安全受到保护，仅用于根据反洗钱法规验证您的身份。",
    },
    
    common: {
      error: "错误",
      loading: "加载中...",
      previous: "上一页",
      next: "下一页",
      page: "页",
    },
  },
};

// Instructions d'intégration:
// 1. Importer ce fichier dans i18n.ts
// 2. Fusionner les traductions avec les messages existants
// Exemple:
// import { payoutKycTranslations } from './i18n-payout-kyc';
// export const messages = {
//   fr: { ...existingFrMessages, ...payoutKycTranslations.fr },
//   en: { ...existingEnMessages, ...payoutKycTranslations.en },
//   cn: { ...existingCnMessages, ...payoutKycTranslations.cn },
// };



