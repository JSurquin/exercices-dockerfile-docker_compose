/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({
    children,
    components = {},
  }: {
    children: string;
    components?: Record<string, React.ComponentType<{ children?: React.ReactNode; href?: string }>>;
  }) => {
    const text = String(children);
    const C = components;
    return (
      <div data-testid="markdown">
        {C.h1 ? <C.h1>Title</C.h1> : null}
        {C.h2 ? <C.h2>Sub</C.h2> : null}
        {C.h3 ? <C.h3>Sub3</C.h3> : null}
        {C.p ? <C.p>{text}</C.p> : null}
        {C.strong ? <C.strong>Gras</C.strong> : null}
        {C.em ? <C.em>ital</C.em> : null}
        {C.code ? <C.code>code</C.code> : null}
        {C.ul ? <C.ul>{C.li ? <C.li>item</C.li> : null}</C.ul> : null}
        {C.ol ? <C.ol>{C.li ? <C.li>one</C.li> : null}</C.ol> : null}
        {C.a ? <C.a href="https://moonskin.fun">lien</C.a> : null}
      </div>
    );
  },
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatWidget } from '@/components/ui/chat-widget';

const mockInvalidateQueries = jest.fn();
const mockSendMessage = jest.fn();
const mockSetConversationId = jest.fn();
const mockStartNewConversation = jest.fn();
const mockLoadOlderMessages = jest.fn();
const mockGetUnreadCount = jest.fn();

let chatMock: ReturnType<typeof buildChatMock>;

function buildChatMock(overrides: Record<string, unknown> = {}) {
  return {
    currentConversation: null as {
      id: string;
      status: string;
      messages: Array<{
        id: string;
        content: string;
        senderType: string;
        createdAt: string;
        isRead: boolean;
        userId?: string | null;
      }>;
    } | null,
    conversationId: null as string | null,
    conversationListItems: [] as Array<{
      id: string;
      title: string;
      lastMessageAt: string;
      status: string;
      unread: number;
    }>,
    setConversationId: mockSetConversationId,
    startNewConversation: mockStartNewConversation,
    sendMessage: mockSendMessage,
    loadOlderMessages: mockLoadOlderMessages,
    hasOlderMessages: false,
    isLoadingOlderMessages: false,
    getUnreadCount: mockGetUnreadCount,
    isLoading: false,
    ...overrides,
  };
}

const mockMessages = {
  chatWidget: {
    support: 'MoonSkin Support',
    online: 'En ligne',
    responseTime: 'Répond en 5min',
    greeting: 'Bonjour',
    greetingSuffix: ' ! Comment puis-je vous aider ?',
    problemQuestion: 'Quel est votre problème ?',
    moderatorLabel: 'Modérateur',
    botLabel: 'Bot',
    aiLabel: 'Réponse IA',
    sendHint: 'Entrée pour envoyer',
    historyTitle: 'Historique',
    newConversation: 'Nouvelle conversation',
    tabs: { home: 'Accueil', help: 'Aide', messages: 'Messages' },
    home: {
      subtitle: 'Comment pouvons-nous vous aider ?',
      searchHelp: 'Rechercher de l\'aide',
      askQuestion: 'Poser une question',
      askQuestionDesc: 'Notre assistant IA et l\'équipe vous répondent',
      recentMessage: 'Message récent',
      noConversations: 'Aucune conversation',
      startChat: 'Démarrer une conversation',
    },
    placeholder: 'Tapez votre message...',
    tooltip: 'Besoin d aide ?',
    responses: {
      welcomeMessage: 'Bienvenue sur le support MoonSkin',
      thankYouMessage: 'Merci pour votre message ! Un membre de notre équipe vous répondra rapidement.',
    },
    categories: {
      trade: {
        label: 'Problème de trade',
        description: 'Trade bloqué, item manquant',
        subcategories: {
          pending: 'Trade en attente',
          blocked: 'Trade bloqué',
          itemMissing: 'Item manquant',
          lock: 'Compte verrouillé',
          botIssue: 'Problème bot',
        },
      },
      payment: {
        label: 'Paiement',
        description: 'Délai, virement',
        subcategories: {
          card: 'Carte',
          sepaFr: 'SEPA FR',
          sepaEu: 'SEPA EU',
          crypto: 'Crypto',
          delayCard: 'Délai carte',
          delaySepaFr: 'Délai SEPA FR',
          delaySepaEu: 'Délai SEPA EU',
          delayCrypto: 'Délai crypto',
        },
      },
      support: {
        label: 'Support général',
        description: 'Bug, KYC',
        subcategories: {
          bug: 'Bug',
          partnership: 'Partenariat',
          kyc: 'KYC',
          other: 'Autre',
        },
      },
    },
  },
};

let authUser: { id: string; username: string } | null = null;

jest.mock('@/hooks/use-chat', () => ({
  useChat: () => chatMock,
}));

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({ user: authUser }),
}));

jest.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({ messages: mockMessages }),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

function renderWidget() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <ChatWidget />
    </QueryClientProvider>,
  );
  const rerenderWidget = () =>
    view.rerender(
      <QueryClientProvider client={client}>
        <ChatWidget />
      </QueryClientProvider>,
    );
  return { ...view, rerenderWidget, client };
}

async function openHelpTab() {
  fireEvent.click(screen.getByTestId('chat-tab-help'));
}

async function openChat() {
  fireEvent.click(screen.getByTestId('chat-fab'));
}

function openConversationView() {
  fireEvent.click(screen.getByText('Poser une question'));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ advanceTimers: true });
  authUser = null;
  chatMock = buildChatMock();
  mockGetUnreadCount.mockReturnValue(0);
  mockSendMessage.mockResolvedValue({ conversationId: 'conv-1' });
  mockLoadOlderMessages.mockResolvedValue(undefined);
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ChatWidget', () => {
  it('ouvre et ferme via le FAB', async () => {
    renderWidget();
    expect(screen.queryByTestId('chat-popup')).not.toBeInTheDocument();
    await openChat();
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-100');
    fireEvent.click(screen.getByTestId('chat-fab'));
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-0');
    act(() => jest.advanceTimersByTime(150));
    expect(screen.queryByTestId('chat-popup')).not.toBeInTheDocument();
  });

  it('affiche le badge unread quand fermé', async () => {
    mockGetUnreadCount.mockReturnValue(3);
    renderWidget();
    expect(screen.getByText('3')).toBeInTheDocument();
    await openChat();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('affiche les catégories pour une nouvelle conversation', async () => {
    renderWidget();
    await openChat();
    await openHelpTab();
    expect(screen.getByText('Problème de trade')).toBeInTheDocument();
    expect(screen.getByText('Paiement')).toBeInTheDocument();
    expect(screen.getByText('Support général')).toBeInTheDocument();
  });

  it('salutation avec username connecté', async () => {
    authUser = { id: 'u1', username: 'Player1' };
    renderWidget();
    await openChat();
    expect(screen.getByText(/Player1/)).toBeInTheDocument();
  });

  it('navigue catégorie → sous-catégorie → conversation', async () => {
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Problème de trade'));
    expect(screen.getByText('Trade en attente')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Trade en attente'));
    await waitFor(() =>
      expect(mockSendMessage).toHaveBeenCalledWith('Trade en attente', {
        category: 'trade',
        forceNew: true,
      }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chat/conversations/conv-1/bot-message',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockInvalidateQueries).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('chat-message-input')).toBeInTheDocument());
  });

  it('retour depuis sous-catégories vers catégories', async () => {
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Paiement'));
    const backButtons = screen.getAllByRole('button');
    const back = backButtons.find((b) => b.querySelector('svg') && b.className.includes('rounded-full'));
    fireEvent.click(back!);
    expect(screen.getByText('Problème de trade')).toBeInTheDocument();
  });

  it('gère l erreur sous-catégorie sans bloquer', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSendMessage.mockRejectedValueOnce(new Error('network'));
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('Bug'));
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    errSpy.mockRestore();
  });

  it('sous-catégorie sans convId ne appelle pas bot-message', async () => {
    mockSendMessage.mockResolvedValueOnce({ conversationId: null });
    chatMock = buildChatMock({ conversationId: null });
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('Autre'));
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('affiche spinner pendant envoi bot sous-catégorie', async () => {
    let resolveSend!: (v: unknown) => void;
    mockSendMessage.mockReturnValueOnce(new Promise((r) => { resolveSend = r; }));
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Problème de trade'));
    fireEvent.click(screen.getByText('Trade bloqué'));
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    resolveSend({ conversationId: 'c1' });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled());
  });

  it('rouvre sur accueil après fermeture même si messages existants', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [
          {
            id: 'm1',
            content: 'Hello',
            senderType: 'USER',
            createdAt: '2026-06-12T10:00:00Z',
            isRead: true,
            userId: 'u1',
          },
        ],
      },
      conversationId: 'c1',
    });
    authUser = { id: 'u1', username: 'Me' };
    renderWidget();
    await openChat();
    openConversationView();
    expect(screen.getByTestId('chat-message-input')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('chat-fab'));
    act(() => jest.advanceTimersByTime(150));
    await openChat();
    expect(screen.queryByTestId('chat-message-input')).not.toBeInTheDocument();
    expect(screen.getByText(/Comment pouvons-nous vous aider/i)).toBeInTheDocument();
  });

  it('affiche tous les types de messages et le markdown staff', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [
          { id: 'u1', content: 'Mon message', senderType: 'USER', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: 'u1' },
          { id: 'b1', content: 'Réponse bot', senderType: 'BOT', createdAt: '2026-06-12T10:01:00Z', isRead: false, userId: null },
          { id: 'a1', content: '**Gras** et [lien](https://moonskin.fun)', senderType: 'AI', createdAt: '2026-06-12T10:02:00Z', isRead: false, userId: null },
          { id: 'm1', content: 'Modérateur ici', senderType: 'MODERATOR', createdAt: '2026-06-12T10:03:00Z', isRead: false, userId: 'mod' },
          { id: 's1', content: 'Ticket transmis', senderType: 'SYSTEM', createdAt: '2026-06-12T10:04:00Z', isRead: true, userId: null },
        ],
      },
      conversationId: 'c1',
    });
    authUser = { id: 'u1', username: 'Me' };
    renderWidget();
    await openChat();
    openConversationView();
    expect(screen.getByText('Mon message')).toBeInTheDocument();
    expect(screen.getByText('Réponse bot')).toBeInTheDocument();
    expect(screen.getAllByTestId('markdown').length).toBeGreaterThan(0);
    expect(screen.getByText('Modérateur ici')).toBeInTheDocument();
    expect(screen.getByText('Ticket transmis')).toBeInTheDocument();
    expect(screen.getByText('Modérateur')).toBeInTheDocument();
    expect(screen.getByText('Bot')).toBeInTheDocument();
  });

  it('message i18n placeholder résolu', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [
          {
            id: 'm1',
            content: '__i18n:chatWidget.responses.thankYouMessage__',
            senderType: 'BOT',
            createdAt: '2026-06-12T10:00:00Z',
            isRead: true,
            userId: null,
          },
        ],
      },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    openConversationView();
    expect(screen.getByText(/Merci pour votre message/)).toBeInTheDocument();
  });

  it('welcome message sans conversation', async () => {
    chatMock = buildChatMock({ currentConversation: null });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('Autre'));
    await waitFor(() => expect(screen.getByTestId('chat-message-input')).toBeInTheDocument());
    expect(screen.getByText('Bienvenue sur le support MoonSkin')).toBeInTheDocument();
  });

  it('envoie un message via bouton et Entrée', async () => {
    chatMock = buildChatMock({
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('Autre'));
    await waitFor(() => screen.getByTestId('chat-message-input'));

    const input = screen.getByTestId('chat-message-input');
    fireEvent.change(input, { target: { value: 'Mon problème' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mockSendMessage).toHaveBeenCalledWith('Mon problème'));
    act(() => jest.advanceTimersByTime(100));
  });

  it('Maj+Entrée insère un saut de ligne sans envoyer', async () => {
    chatMock = buildChatMock({
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('KYC'));
    await waitFor(() => screen.getByTestId('chat-message-input'));

    const input = screen.getByTestId('chat-message-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'ligne1', style: { height: 'auto', scrollHeight: 50 } } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(mockSendMessage).not.toHaveBeenCalledWith('ligne1');
  });

  it('bouton envoi désactivé si message vide', async () => {
    chatMock = buildChatMock({
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('KYC'));
    await waitFor(() => screen.getByTestId('chat-message-input'));
    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
  });

  it('affiche loading et spinner envoi', async () => {
    chatMock = buildChatMock({
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
      isLoading: true,
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('KYC'));
    await waitFor(() => screen.getByTestId('chat-message-input'));
    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
    expect(document.querySelectorAll('.typing-dot').length).toBeGreaterThan(0);
  });

  it('historique conversations pour user connecté', async () => {
    authUser = { id: 'u1', username: 'Me' };
    chatMock = buildChatMock({
      conversationListItems: [
        {
          id: 'c1',
          title: 'Trade bloqué',
          lastMessageAt: '2026-06-12T10:00:00Z',
          status: 'ACTIVE',
          unread: 2,
        },
        { id: 'c2', title: 'Paiement SEPA', lastMessageAt: '2026-06-11T10:00:00Z', status: 'CLOSED', unread: 0 },
      ],
      conversationId: 'c1',
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [{ id: 'm1', content: 'Hi', senderType: 'USER', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: 'u1' }],
      },
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByTestId('chat-tab-messages'));
    expect(screen.getByTestId('chat-history-list')).toBeInTheDocument();
    expect(screen.getByText('Trade bloqué')).toBeInTheDocument();
    expect(screen.getByTestId('chat-history-list').querySelector('[data-slot="badge"]')).toHaveTextContent('2');
    fireEvent.click(screen.getByText('Paiement SEPA'));
    expect(mockSetConversationId).toHaveBeenCalledWith('c2');
  });

  it('nouvelle conversation depuis historique', async () => {
    authUser = { id: 'u1', username: 'Me' };
    chatMock = buildChatMock({
      conversationListItems: [{ id: 'c1', title: 'Old', lastMessageAt: '2026-06-12T10:00:00Z', status: 'ACTIVE', unread: 0 }],
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByTestId('chat-tab-messages'));
    fireEvent.click(screen.getByTestId('chat-new-conversation'));
    expect(mockStartNewConversation).toHaveBeenCalled();
    expect(screen.getByText('Problème de trade')).toBeInTheDocument();
  });

  it('retour historique → conversation', async () => {
    authUser = { id: 'u1', username: 'Me' };
    chatMock = buildChatMock({
      conversationListItems: [{ id: 'c1', title: 'Old', lastMessageAt: '2026-06-12T10:00:00Z', status: 'ACTIVE', unread: 0 }],
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    fireEvent.click(screen.getByTestId('chat-tab-messages'));
    fireEvent.click(screen.getByText('Old'));
    expect(screen.getByTestId('chat-message-input')).toBeInTheDocument();
  });

  it('retour conversation sans messages vers catégories', async () => {
    chatMock = buildChatMock({ currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] }, conversationId: 'c1' });
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('KYC'));
    await waitFor(() => screen.getByTestId('chat-message-input'));
    const backs = screen.getAllByRole('button');
    const back = backs.find((b) => b.querySelector('svg') && b.className.includes('hover:bg-white'));
    fireEvent.click(back!);
    await openHelpTab();
    expect(screen.getByText('Problème de trade')).toBeInTheDocument();
  });

  it('charge messages anciens au scroll haut', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [{ id: 'm1', content: 'Recent', senderType: 'BOT', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: null }],
      },
      conversationId: 'c1',
      hasOlderMessages: true,
    });
    renderWidget();
    await openChat();
    openConversationView();
    const container = screen.getByTestId('chat-messages');
    Object.defineProperty(container, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(container, 'scrollHeight', { value: 800, writable: true, configurable: true });
    fireEvent.scroll(container, { target: container });
    await waitFor(() => expect(mockLoadOlderMessages).toHaveBeenCalled());
  });

  it('affiche spinner chargement messages anciens', async () => {
    chatMock = buildChatMock({
      currentConversation: { id: 'c1', status: 'ACTIVE', messages: [] },
      conversationId: 'c1',
      isLoadingOlderMessages: true,
    });
    renderWidget();
    await openChat();
    await openHelpTab();
    fireEvent.click(screen.getByText('Support général'));
    fireEvent.click(screen.getByText('KYC'));
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeInTheDocument());
  });

  it('événement open-support-chat avec prefill', async () => {
    renderWidget();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('open-support-chat', { detail: { prefillMessage: 'Aide trade' } }),
      );
    });
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-100');
    expect(screen.getByTestId('chat-message-input')).toHaveValue('Aide trade');
  });

  it('événement open-support-chat sans prefill', async () => {
    renderWidget();
    act(() => {
      window.dispatchEvent(new CustomEvent('open-support-chat', { detail: {} }));
    });
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-100');
  });

  it('masque le widget quand menu mobile ouvert puis restaure', async () => {
    renderWidget();
    await openChat();
    act(() => {
      window.dispatchEvent(new CustomEvent('mobile-menu-open-change', { detail: { open: true } }));
    });
    expect(screen.queryByTestId('chat-fab')).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new CustomEvent('mobile-menu-open-change', { detail: { open: false } }));
    });
    expect(screen.getByTestId('chat-fab')).toBeInTheDocument();
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-100');
  });

  it('menu mobile sans chat ouvert avant', async () => {
    renderWidget();
    act(() => {
      window.dispatchEvent(new CustomEvent('mobile-menu-open-change', { detail: { open: true } }));
    });
    act(() => {
      window.dispatchEvent(new CustomEvent('mobile-menu-open-change', { detail: { open: false } }));
    });
    expect(screen.getByTestId('chat-fab')).toBeInTheDocument();
  });

  it('ferme via le bouton X du header', async () => {
    renderWidget();
    await openChat();
    const closeButtons = screen.getAllByRole('button');
    const headerClose = closeButtons.find((b) => b.className.includes('p-1.5'));
    fireEvent.click(headerClose!);
    expect(screen.getByTestId('chat-popup')).toHaveClass('opacity-0');
    act(() => jest.advanceTimersByTime(150));
    expect(screen.queryByTestId('chat-popup')).not.toBeInTheDocument();
  });

  it('ne charge pas les anciens messages si scroll bas', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [{ id: 'm1', content: 'Recent', senderType: 'BOT', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: null }],
      },
      conversationId: 'c1',
      hasOlderMessages: true,
    });
    renderWidget();
    await openChat();
    openConversationView();
    const container = screen.getByTestId('chat-messages');
    Object.defineProperty(container, 'scrollTop', { value: 200, writable: true, configurable: true });
    fireEvent.scroll(container, { target: container });
    expect(mockLoadOlderMessages).not.toHaveBeenCalled();
  });

  it('bloque envoi si isLoading', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [{ id: 'm1', content: 'Hi', senderType: 'BOT', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: null }],
      },
      conversationId: 'c1',
      isLoading: true,
    });
    renderWidget();
    await openChat();
    openConversationView();
    const input = screen.getByTestId('chat-message-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('message USER invité aligné à gauche', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [
          { id: 'm1', content: 'Guest msg', senderType: 'USER', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: null },
        ],
      },
      conversationId: 'c1',
    });
    renderWidget();
    await openChat();
    openConversationView();
    expect(screen.getByText('Guest msg')).toBeInTheDocument();
  });

  it('indicateur IA typing après envoi', async () => {
    chatMock = buildChatMock({
      currentConversation: {
        id: 'c1',
        status: 'ACTIVE',
        messages: [
          { id: 'm1', content: 'Q', senderType: 'USER', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: 'u1' },
        ],
      },
      conversationId: 'c1',
    });
    authUser = { id: 'u1', username: 'Me' };
    const { rerenderWidget } = renderWidget();
    mockSendMessage.mockImplementation(async () => {
      chatMock = buildChatMock({
        currentConversation: {
          id: 'c1',
          status: 'ACTIVE',
          messages: [
            { id: 'm1', content: 'Q', senderType: 'USER', createdAt: '2026-06-12T10:00:00Z', isRead: true, userId: 'u1' },
            { id: 'm2', content: 'Question IA', senderType: 'USER', createdAt: '2026-06-12T10:01:00Z', isRead: true, userId: 'u1' },
          ],
        },
        conversationId: 'c1',
        isLoading: false,
      });
      rerenderWidget();
      return { conversationId: 'c1' };
    });
    await openChat();
    openConversationView();
    const input = screen.getByTestId('chat-message-input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Question IA' } });
      fireEvent.click(screen.getByTestId('chat-send-button'));
    });
    await waitFor(() =>
      expect(document.querySelector('.ai-typing-bubble')).toBeInTheDocument(),
    );
    act(() => jest.advanceTimersByTime(90_000));
  });
});
