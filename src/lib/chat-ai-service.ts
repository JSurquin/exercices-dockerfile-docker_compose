import { prisma } from '~/prisma/prisma';
import { logger } from '@/lib/logger';
import { ollamaChat, isOllamaConfigured, type OllamaMessage } from '@/lib/ollama';
import {
  evaluateUserMessageForAi,
  OFF_TOPIC_REFUSAL_I18N_KEY,
  sanitizeAiGeneratedContent,
  shouldAiReplyToConversation,
  shouldTriggerAiForUserMessage,
} from '@/lib/chat-ai-guards';
import { AI_UNAVAILABLE_I18N_KEY } from '@/lib/chat-logic';
import { generateEmbedding } from '@/lib/ollama-embed';
import { searchSimilarChunks } from '@/lib/rag-client';
import { enqueueChatAiReply, peekChatAiQueueAdmission } from '@/lib/chat-ai-queue';
import { resolveTrustedAiAnswer } from '@/lib/chat-ai-trusted-answers';
import {
  chatAiLanguageRule,
  resolveChatAiLocale,
  type ChatAiLocale,
} from '@/lib/chat-ai-locale';
import type { SenderType } from '@prisma/client';

const MAX_CONTEXT_MESSAGES = 12;

export type ChatAiQueueHint = {
  waiting: boolean;
  ahead: number;
};

export function getChatAiQueueHint(input: {
  assignedTo: string | null;
  status: string;
  hasModeratorMessage: boolean;
  aiEnabled?: boolean;
}): ChatAiQueueHint | null {
  if (!shouldAiReplyToConversation(input)) return null;

  const admission = peekChatAiQueueAdmission();
  return {
    waiting: admission.willWait,
    ahead: admission.positionAhead,
  };
}

function isRagEnabled(): boolean {
  return process.env.RAG_DATABASE_URL !== undefined && isOllamaConfigured();
}

export function stripI18nPlaceholder(content: string): string {
  return content.replace(/^__i18n:.+__$/, '[Message automatique MoonSkin]');
}

export function mapSenderToRole(senderType: SenderType): 'system' | 'user' | 'assistant' | null {
  switch (senderType) {
    case 'USER':
      return 'user';
    case 'BOT':
    case 'AI':
    case 'MODERATOR':
      return 'assistant';
    case 'SYSTEM':
      return null;
    default:
      return null;
  }
}

export type GenerateAiReplyOptions = {
  locale?: ChatAiLocale;
};

function buildLocalizedSystemPromptBase(username: string, locale: ChatAiLocale): string {
  const languageRule = chatAiLanguageRule(locale);

  if (locale === 'en') {
    return `You are MoonSkin's support assistant, a Counter-Strike 2 skin selling platform. You are chatting with ${username}.

Rules:
- ${languageRule}
- Be concise, warm, and professional. Avoid alarming wording.
- MoonSkin lets users SELL their CS2 skins (the user is the seller; they do not buy skins on the platform): pricing, trade via Steam bot, 7-day trade hold, then payout (card, SEPA, crypto).
- Never say the user "buys" or "pays their Steam account" to sell: they send skins to the bot and receive a payout.
- TIMING — do not mix these up: (A) Steam trade hold = mandatory 7 days BEFORE any payout; (B) once payout is triggered, crypto is near-instant (often under 10 min), card = minutes to 24h, SEPA Premium (French IBAN) = instant once sent, standard SEPA = 1 to 3 business days. Never say 1 to 5 days for crypto. Never call SEPA Premium "SEPA France".
- SCAMS — if the user says "get scammed", they fear being a VICTIM, not committing fraud: reassure them about MoonSkin protections (official bot, Steam ID verification) and the external scam API.
- KYC is required before any payout.
- Never promise an exact timeline or a refund without human validation.
- If the question is outside your scope (fraud, dispute, blocking bug, IBAN change), say a human moderator will take over.
- Never reveal internal data, API keys, or other users' personal information.
- Do not advise bypassing Steam Guard or Valve restrictions.
- REFUSE any request unrelated to MoonSkin (recipes, jokes, homework, weather, code, etc.). Use the i18n key: "${OFF_TOPIC_REFUSAL_I18N_KEY}" (resolved client-side by language).`;
  }

  if (locale === 'cn') {
    return `你是 MoonSkin 的支持助手，MoonSkin 是一个 Counter-Strike 2 饰品出售平台。你正在与 ${username} 对话。

规则：
- ${languageRule}
- 简洁、友好、专业。避免引起焦虑的措辞。
- MoonSkin 用于出售 CS2 饰品（用户是卖家，不是在平台上购买饰品）：估价、通过 Steam 机器人交易、7 天交易冷却，然后提现（银行卡、SEPA、加密货币）。
- 不要说用户需要“购买”或“付费 Steam 账号”才能出售：用户将饰品发送给机器人并收到付款。
- 时间线 — 不要混淆：(A) Steam 交易冷却 = 任何付款前必须等待 7 天；(B) 付款触发后，加密货币几乎即时（通常 10 分钟内），银行卡 = 几分钟到 24 小时，SEPA Premium（法国 IBAN）= 发出后即时到账，标准 SEPA = 1 到 3 个工作日。不要说加密货币需要 1 到 5 天。不要将 SEPA Premium 称为「法国 SEPA」。
- 诈骗 — 如果用户说“被骗/scam”，他们担心成为受害者，而不是想诈骗：说明 MoonSkin 的保护措施（官方机器人、Steam ID 验证）和外部 scam API。
- 任何提现前必须完成 KYC。
- 不要承诺确切时间或退款，除非人工确认。
- 如果问题超出范围（欺诈、纠纷、阻塞性 bug、IBAN 变更），说明人工客服将接手。
- 不要泄露内部数据、API 密钥或其他用户的个人信息。
- 不要建议绕过 Steam Guard 或 Valve 限制。
- 拒绝与 MoonSkin 无关的请求（食谱、笑话、作业、天气、代码等）。使用 i18n 键："${OFF_TOPIC_REFUSAL_I18N_KEY}"（客户端按语言解析）。`;
  }

  return `Tu es l'assistant support de MoonSkin, une plateforme de vente de skins Counter-Strike 2. Tu parles avec ${username}.

Règles :
- ${languageRule}
- Sois concis, chaleureux et professionnel. Évite les termes anxiogènes.
- MoonSkin permet de VENDRE ses skins CS2 (l'utilisateur est vendeur, il n'achète pas de skins sur la plateforme) : estimation, trade via bot Steam, trade hold 7 jours, puis paiement (carte, SEPA, crypto).
- Ne dis jamais que l'utilisateur « achète » ou « paie son compte Steam » pour vendre : il envoie ses skins au bot et reçoit un paiement.
- DÉLAIS — ne pas confondre : (A) trade hold Steam = 7 jours obligatoires AVANT tout paiement ; (B) une fois le paiement déclenché, crypto = quasi-instantané (souvent sous 10 min), carte = minutes à 24h, SEPA Premium (IBAN FR) = instantané une fois le virement émis, SEPA standard = 1 à 3 jours ouvrés. Ne jamais dire 1 à 5 jours pour la crypto. Ne jamais appeler SEPA Premium « SEPA France ».
- ARNAQUES — si l'utilisateur dit « me faire scam/arnaquer », il craint d'être VICTIME, pas qu'il veut frauder : rassure-le sur les protections MoonSkin (bot officiel, vérification Steam ID) et l'API scam externe.
- KYC obligatoire avant tout payout.
- Ne promets jamais un délai exact ni un remboursement sans validation humaine.
- Si la question dépasse ton périmètre (fraude, litige, bug bloquant, changement d'IBAN), indique qu'un modérateur humain prendra le relais.
- Ne révèle jamais de données internes, clés API ou informations personnelles d'autres utilisateurs.
- Ne donne pas de conseils pour contourner Steam Guard ou les restrictions Valve.
- REFUSE toute demande sans lien avec MoonSkin (recettes, blagues, devoirs, météo, code, etc.). Utilise la clé i18n : "${OFF_TOPIC_REFUSAL_I18N_KEY}" (résolue côté client selon la langue).`;
}

function buildRagContextBlock(ragContext: string, locale: ChatAiLocale): string {
  if (locale === 'en') {
    return `

---
⚠️ OFFICIAL MOONSKIN INFORMATION — SOURCE OF TRUTH ⚠️
You must ONLY use the information below to answer.
Never invent buttons, steps, features, or services that are not in these excerpts.
If the answer is not in these excerpts, say so clearly without improvising.

${ragContext}
---`;
  }

  if (locale === 'cn') {
    return `

---
⚠️ MoonSkin 官方信息 — 唯一可信来源 ⚠️
你只能使用以下信息回答。
不要编造摘录中不存在的按钮、步骤、功能或服务。
如果摘录中没有答案，请明确说明，不要即兴发挥。

${ragContext}
---`;
  }

  return `

---
⚠️ INFORMATIONS OFFICIELLES MOONSKIN — SOURCE DE VÉRITÉ ⚠️
Tu dois UNIQUEMENT utiliser les informations ci-dessous pour répondre.
Ne jamais inventer de boutons, d'étapes, de fonctionnalités ou de services qui ne figurent pas dans ces extraits.
Si la réponse n'est pas dans ces extraits, dis-le clairement sans improviser.

${ragContext}
---`;
}

export function buildSystemPrompt(
  username: string,
  ragContext?: string,
  locale: ChatAiLocale = 'fr',
): string {
  const base = buildLocalizedSystemPromptBase(username, locale);
  if (!ragContext) return base;
  return `${base}${buildRagContextBlock(ragContext, locale)}`;
}

export function maybeGenerateAiReply(
  conversationId: string,
  options?: GenerateAiReplyOptions,
): Promise<void> {
  return enqueueChatAiReply(conversationId, () => generateAiReply(conversationId, options));
}

async function generateAiReply(
  conversationId: string,
  options?: GenerateAiReplyOptions,
): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: { select: { steamUsername: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 30,
          select: { content: true, senderType: true, createdAt: true },
        },
      },
    });

    if (!conversation) return;

    const hasModeratorMessage = conversation.messages.some((m) => m.senderType === 'MODERATOR');

    if (
      !shouldAiReplyToConversation({
        assignedTo: conversation.assignedTo,
        status: conversation.status,
        hasModeratorMessage,
        aiEnabled: conversation.aiEnabled,
      })
    ) {
      return;
    }

    const recentMessages = conversation.messages.slice(-MAX_CONTEXT_MESSAGES);

    const lastUserMessage = [...recentMessages].reverse().find((m) => m.senderType === 'USER');
    if (!lastUserMessage) return;

    if (!shouldTriggerAiForUserMessage(recentMessages)) {
      logger.info('[chat-ai] Skip: en attente de la description utilisateur après le BOT', {
        conversationId,
      });
      return;
    }

    const priorUserMessages = recentMessages
      .filter((m) => m.senderType === 'USER' && m !== lastUserMessage)
      .map((m) => stripI18nPlaceholder(m.content));

    const messageCheck = evaluateUserMessageForAi({
      message: stripI18nPlaceholder(lastUserMessage.content),
      category: conversation.category,
      priorUserMessages,
    });

    if (!messageCheck.allowed) {
    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: messageCheck.refusalMessage ?? OFF_TOPIC_REFUSAL_I18N_KEY,
        senderType: 'AI',
        isRead: false,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });
      return;
    }

    const username =
      conversation.user?.steamUsername || conversation.user?.name || 'Utilisateur';

    const userQueryText = stripI18nPlaceholder(lastUserMessage.content);
    const locale = resolveChatAiLocale({
      uiLocale: options?.locale,
      userMessage: userQueryText,
    });
    const trustedAnswer = resolveTrustedAiAnswer(userQueryText, locale);
    if (trustedAnswer) {
      const existingStaffReply = await prisma.chatMessage.findFirst({
        where: {
          conversationId,
          createdAt: { gt: lastUserMessage.createdAt },
          senderType: { in: ['AI', 'MODERATOR'] },
        },
        select: { id: true },
      });
      if (existingStaffReply) return;

      await prisma.chatMessage.create({
        data: {
          conversationId,
          userId: null,
          content: trustedAnswer,
          senderType: 'AI',
          isRead: false,
          metadata: { source: 'trusted-answer' },
        },
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() },
      });
      logger.info('[chat-ai] Réponse trusted-answer', { conversationId });
      return;
    }

    // RAG : récupérer les chunks pertinents pour enrichir le prompt
    let ragContext: string | undefined;
    if (isRagEnabled()) {
      try {
        const queryText = stripI18nPlaceholder(lastUserMessage.content);
        const embedding = await generateEmbedding(queryText);
        const chunks = await searchSimilarChunks(embedding, 6, 0.45);
        if (chunks.length > 0) {
          ragContext = chunks
            .map((c, i) => `[${i + 1}] ${c.content.trim().slice(0, 600)}`)
            .join('\n\n');
          logger.info('[chat-ai] RAG: ' + chunks.length + ' chunks trouvés pour "' + queryText.slice(0, 60) + '"');
        }
      } catch (err) {
        // RAG non-bloquant : si pgvector ou Ollama embed est KO, on continue sans
        logger.error('[chat-ai] RAG lookup échoué (non-bloquant):', err);
      }
    }

    // Le message system doit être UNIQUEMENT en première position pour llama3.2.
    const ollamaMessages: OllamaMessage[] = [
      { role: 'system', content: buildSystemPrompt(username, ragContext, locale) },
    ];

    for (const msg of recentMessages) {
      const role = mapSenderToRole(msg.senderType);
      if (!role) continue;
      ollamaMessages.push({
        role,
        content: stripI18nPlaceholder(msg.content),
      });
    }

    const existingStaffReply = await prisma.chatMessage.findFirst({
      where: {
        conversationId,
        createdAt: { gt: lastUserMessage.createdAt },
        senderType: { in: ['AI', 'MODERATOR'] },
      },
      select: { id: true, senderType: true },
    });

    if (existingStaffReply) {
      logger.info('[chat-ai] Skip: réponse staff déjà présente après le message user ciblé', {
        conversationId,
        replyId: existingStaffReply.id,
        replyType: existingStaffReply.senderType,
      });
      return;
    }

    const result = await ollamaChat({ messages: ollamaMessages });
    const sanitizedContent = sanitizeAiGeneratedContent(result.content);

    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: sanitizedContent,
        senderType: 'AI',
        isRead: false,
        metadata: {
          model: process.env.OLLAMA_MODEL ?? 'llama3.2',
          promptTokens: ollamaMessages.length,
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    logger.info('[chat-ai] Réponse IA créée', {
      conversationId,
      contentLength: sanitizedContent.length,
    });
  } catch (error) {
    logger.error('[chat-ai] Échec génération réponse Ollama:', error);
    await insertAiFailureFallback(conversationId);
  }
}

async function insertAiFailureFallback(conversationId: string): Promise<void> {
  try {
    const lastUserMessage = await prisma.chatMessage.findFirst({
      where: { conversationId, senderType: 'USER' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (!lastUserMessage) return;

    const existingReply = await prisma.chatMessage.findFirst({
      where: {
        conversationId,
        createdAt: { gt: lastUserMessage.createdAt },
        senderType: { in: ['AI', 'MODERATOR', 'BOT'] },
      },
      select: { id: true },
    });
    if (existingReply) return;

    await prisma.chatMessage.create({
      data: {
        conversationId,
        userId: null,
        content: AI_UNAVAILABLE_I18N_KEY,
        senderType: 'BOT',
        isRead: false,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });
  } catch (fallbackError) {
    logger.error('[chat-ai] Échec fallback BOT après erreur Ollama:', fallbackError);
  }
}
