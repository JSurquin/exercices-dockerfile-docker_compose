/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'conv-1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/providers/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'mod-1', role: 'MODERATOR', email: 'mod@test.com' } }),
}));

jest.mock('~/lib/auth-client', () => ({
  useSession: () => ({
    data: { user: { id: 'mod-1', role: 'MODERATOR' } },
    isPending: false,
  }),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/play-notification-sound', () => ({
  playNotificationSound: jest.fn(),
}));

jest.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    locale: 'fr',
    messages: {
      moderation: {
        loading: 'Chargement…',
        accessDenied: {
          title: 'Accès refusé',
          description: 'Vous devez être modérateur ou administrateur pour accéder à cette page.',
        },
        filters: {
          active: 'Actives',
          closed: 'Fermées',
          archived: 'Archivées',
          low: 'Faible',
          normal: 'Normale',
          high: 'Élevée',
          urgent: 'Urgente',
        },
        conversation: {
          notFound: { title: 'Introuvable', backButton: 'Retour' },
          header: {
            noSubject: 'Sans sujet',
            withUser: 'Avec',
            anonymousUser: 'Anonyme',
          },
          messages: {
            title: 'Messages',
            empty: 'Aucun message dans cette conversation.',
            messageSent: 'Message envoyé',
            sendError: 'Erreur envoi',
            statusUpdated: 'Statut mis à jour',
            updateError: 'Erreur mise à jour',
            assigned: 'Conversation assignée',
            assignError: 'Erreur assignation',
          },
          senderTypes: {
            USER: 'Utilisateur',
            BOT: 'Bot',
            AI: 'IA',
            MODERATOR: 'Modérateur',
            SYSTEM: 'Système',
          },
          sendHint: 'Entrée pour envoyer · Shift+Entrée pour nouvelle ligne',
          typeYourReply: 'Votre réponse…',
          info: {
            title: 'Informations',
            userTitle: 'Utilisateur',
            anonymous: 'Anonyme',
            assignmentTitle: 'Assignation',
            unassigned: 'Non assignée',
            assignToMe: "M'assigner",
            datesTitle: 'Dates',
            created: 'Créée le',
            updated: 'Mise à jour le',
            closed: 'Fermée le',
            actionsTitle: 'Actions',
            closeConversation: 'Fermer la conversation',
            reopenConversation: 'Rouvrir la conversation',
          },
        },
      },
      chatWidget: {
        aiLabel: 'Réponse IA',
        imageMessage: '📷 Photo',
        attachImage: 'Joindre une photo',
        removeImage: 'Retirer la photo',
        imageUploading: 'Envoi de la photo…',
        imageUploadError: "Impossible d'envoyer la photo",
      },
    },
  }),
}));

jest.mock('@/lib/chat-markdown', () => {
  const ChatMarkdownContent = ({ content }: { content: string }) => {
    const boldMatch = content.match(/\*\*(.+?)\*\*([\s\S]*)/);
    if (boldMatch) {
      return (
        <div data-testid="markdown">
          <p>
            <strong>{boldMatch[1]}</strong>
            {boldMatch[2]}
          </p>
        </div>
      );
    }
    return (
      <div data-testid="markdown">
        <p>{content}</p>
      </div>
    );
  };
  return {
    ChatMarkdownContent,
    shouldRenderChatMarkdown: (senderType: string) => senderType !== 'USER',
    ChatMessageContent: ({
      content,
      senderType,
    }: {
      content: string;
      senderType: string;
    }) =>
      senderType === 'USER' ? <p>{content}</p> : <ChatMarkdownContent content={content} />,
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt?: string; src?: string }) => (
    <img alt={props.alt ?? ''} src={typeof props.src === 'string' ? props.src : ''} />
  ),
}));

import ConversationPage from '@/app/moderation/conversations/[id]/page';
import * as sound from '@/lib/play-notification-sound';
import { toast } from 'sonner';

function buildConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conv-1',
    status: 'ACTIVE',
    priority: 'NORMAL',
    subject: 'Trade bloqué',
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-12T12:00:00Z',
    user: { name: 'Redfox-One', email: 'user@test.com', steamUsername: 'Redfox' },
    assignedModerator: null,
    messages: [
      {
        id: 'm1',
        content: 'Mon trade est bloqué',
        senderType: 'USER',
        createdAt: '2026-06-12T11:00:00Z',
        isRead: false,
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchInterval: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <ConversationPage />
      </QueryClientProvider>,
    ),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  global.URL.createObjectURL = jest.fn(() => 'blob:preview');
  global.URL.revokeObjectURL = jest.fn();
});

describe('ModerationConversationPage', () => {
  it('affiche les messages utilisateur et le champ de réponse', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => buildConversation(),
    });

    renderPage();

    expect(await screen.findByText('Mon trade est bloqué')).toBeInTheDocument();
    expect(screen.getByTestId('moderation-reply-input')).toBeInTheDocument();
    expect(screen.getByTestId('moderation-reply-send')).toBeInTheDocument();
  });

  it("assigne la conversation au modérateur connecté", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildConversation(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildConversation(),
      });

    renderPage();
    await screen.findByText("M'assigner");

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "M'assigner" }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/conversations/conv-1/assign',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ moderatorId: 'mod-1' }),
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Conversation assignée');
  });

  it('envoie une réponse modérateur via l’API messages', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildConversation(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'm2', senderType: 'MODERATOR' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          buildConversation({
            messages: [
              {
                id: 'm1',
                content: 'Mon trade est bloqué',
                senderType: 'USER',
                createdAt: '2026-06-12T11:00:00Z',
                isRead: false,
              },
              {
                id: 'm2',
                content: 'Nous regardons votre trade',
                senderType: 'MODERATOR',
                createdAt: '2026-06-12T12:00:00Z',
                isRead: false,
              },
            ],
          }),
      });

    renderPage();
    await screen.findByTestId('moderation-reply-input');

    fireEvent.change(screen.getByTestId('moderation-reply-input'), {
      target: { value: 'Nous regardons votre trade' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('moderation-reply-send'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            conversationId: 'conv-1',
            content: 'Nous regardons votre trade',
            replyContext: 'moderation',
            locale: 'fr',
          }),
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Message envoyé');
  });

  it('envoie une image jointe par un modérateur', async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', {
      type: 'image/jpeg',
    });
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildConversation(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: '/api/chat-media/abc-123.jpg' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'm-img', senderType: 'MODERATOR' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => buildConversation(),
      });

    renderPage();
    const input = (await screen.findByTestId('moderation-image-input')) as HTMLInputElement;
    expect(screen.getByTestId('moderation-attach-image')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { files: [jpeg] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('moderation-reply-send'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/images',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            conversationId: 'conv-1',
            content: '',
            replyContext: 'moderation',
            locale: 'fr',
            attachmentUrl: '/api/chat-media/abc-123.jpg',
          }),
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith('Message envoyé');
  });

  it('joue un son quand un nouveau message utilisateur arrive', async () => {
    let call = 0;
    (global.fetch as jest.Mock).mockImplementation(async () => ({
      ok: true,
      json: async () => {
        call += 1;
        if (call === 1) {
          return buildConversation();
        }
        return buildConversation({
          messages: [
            {
              id: 'm1',
              content: 'Premier message',
              senderType: 'USER',
              createdAt: '2026-06-12T11:00:00Z',
              isRead: false,
            },
            {
              id: 'm2',
              content: 'Deuxième message',
              senderType: 'USER',
              createdAt: '2026-06-12T12:00:00Z',
              isRead: false,
            },
          ],
        });
      },
    }));

    const { client } = renderPage();
    await screen.findByText('Mon trade est bloqué');
    expect(sound.playNotificationSound).not.toHaveBeenCalled();

    await act(async () => {
      await client.refetchQueries({ queryKey: ['moderation', 'conversation', 'conv-1'] });
    });

    await waitFor(() => {
      expect(screen.getByText('Deuxième message')).toBeInTheDocument();
      expect(sound.playNotificationSound).toHaveBeenCalledWith(520, 350, 0.3);
    });
  });

  it('affiche le badge Réponse IA pour les messages automatiques', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () =>
        buildConversation({
          messages: [
            {
              id: 'm1',
              content: 'Question utilisateur',
              senderType: 'USER',
              createdAt: '2026-06-12T11:00:00Z',
              isRead: false,
            },
            {
              id: 'm2',
              content: 'Voici une réponse générée automatiquement.',
              senderType: 'AI',
              createdAt: '2026-06-12T11:01:00Z',
              isRead: false,
            },
          ],
        }),
    });

    renderPage();

    expect(await screen.findByText('Réponse IA')).toBeInTheDocument();
    expect(screen.getByText('Voici une réponse générée automatiquement.')).toBeInTheDocument();
    expect(screen.queryByText('Modérateur')).not.toBeInTheDocument();
  });

  it('affiche le markdown des réponses IA et modérateur', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () =>
        buildConversation({
          messages: [
            {
              id: 'm1',
              content: '**Important** : vérifiez votre trade link.',
              senderType: 'AI',
              createdAt: '2026-06-12T11:01:00Z',
              isRead: false,
            },
          ],
        }),
    });

    renderPage();

    const bold = await screen.findByText('Important');
    expect(bold.tagName).toBe('STRONG');
    expect(screen.getByText(/vérifiez votre trade link/)).toBeInTheDocument();
  });

  it('ne joue pas de son quand le modérateur répond lui-même', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () =>
        buildConversation({
          messages: [
            {
              id: 'm1',
              content: 'Question user',
              senderType: 'USER',
              createdAt: '2026-06-12T11:00:00Z',
              isRead: false,
            },
            {
              id: 'm2',
              content: 'Réponse mod',
              senderType: 'MODERATOR',
              createdAt: '2026-06-12T12:00:00Z',
              isRead: false,
            },
          ],
        }),
    });

    const { client } = renderPage();
    await screen.findByText('Réponse mod');

    await act(async () => {
      await client.refetchQueries({ queryKey: ['moderation', 'conversation', 'conv-1'] });
    });

    expect(sound.playNotificationSound).not.toHaveBeenCalled();
  });
});
