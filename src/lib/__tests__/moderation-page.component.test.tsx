/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
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

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    locale: 'fr',
    messages: {
      moderation: {
        title: 'Modération',
        subtitle: 'Gérez les conversations',
        loading: 'Chargement…',
        accessDenied: {
          title: 'Accès refusé',
          description: 'Réservé aux modérateurs.',
        },
        stats: {
          activeConversations: 'Actives',
          unassigned: 'Non assignées',
          responseTime: 'Temps de réponse',
          closed: 'Fermées',
          minutesShort: 'min',
        },
        filtersTitle: 'Filtres',
        noConversations: 'Aucune conversation',
        conversationsCount: 'Conversations',
        attentionNeeded: 'Réponse requise',
        noSubject: '(Sans sujet)',
        anonymousUser: 'Anonyme',
        createdOn: 'Créée le',
        messages: 'messages',
        assignedTo: 'Assignée à',
        filters: {
          statusPlaceholder: 'Statut',
          priorityPlaceholder: 'Priorité',
          assignmentPlaceholder: 'Assignation',
          searchPlaceholder: 'Rechercher…',
          allStatuses: 'Tous',
          active: 'Actives',
          closed: 'Fermées',
          archived: 'Archivées',
          allPriorities: 'Toutes',
          low: 'Faible',
          normal: 'Normale',
          high: 'Élevée',
          urgent: 'Urgente',
          all: 'Toutes',
          myConversations: 'Mes conversations',
          unassigned: 'Non assignées',
        },
        actions: {
          assignToMe: "S'assigner",
          close: 'Fermer',
          open: 'Ouvrir',
        },
        conversation: {
          info: {
            steam: 'Steam:',
          },
        },
      },
      chatWidget: {
        aiLabel: 'Réponse IA',
      },
    },
  }),
}));

import ModerationPage from '@/app/moderation/page';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <ModerationPage />
    </QueryClientProvider>,
  );

  return { client };
}

describe('ModerationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url.includes('/api/chat/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            activeConversations: 1,
            unassignedConversations: 0,
            averageResponseTime: 5,
            closedConversations: 0,
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          conversations: [
            {
              id: 'conv-ai',
              subject: 'Question paiement',
              status: 'ACTIVE',
              priority: 'NORMAL',
              createdAt: '2026-06-12T10:00:00Z',
              updatedAt: '2026-06-12T11:00:00Z',
              user: { name: 'Joueur', email: 'j@test.com' },
              assignedModerator: null,
              assignedTo: null,
              _count: { messages: 2 },
              messages: [
                {
                  id: 'm-ai',
                  content: 'Voici la réponse automatique.',
                  senderType: 'AI',
                  createdAt: '2026-06-12T11:00:00Z',
                },
              ],
            },
            {
              id: 'conv-user',
              subject: 'Autre sujet',
              status: 'ACTIVE',
              priority: 'NORMAL',
              aiEnabled: false,
              createdAt: '2026-06-11T10:00:00Z',
              updatedAt: '2026-06-11T10:30:00Z',
              user: { name: 'Alice', email: 'a@test.com' },
              assignedModerator: null,
              assignedTo: null,
              _count: { messages: 1 },
              messages: [
                {
                  id: 'm-user',
                  content: 'Dernier message utilisateur.',
                  senderType: 'USER',
                  createdAt: '2026-06-11T10:30:00Z',
                },
              ],
            },
          ],
        }),
      });
    });
  });

  it('affiche le badge Réponse IA quand le dernier message vient de l’IA', async () => {
    renderPage();

    expect(await screen.findByText('Question paiement')).toBeInTheDocument();
    expect(screen.getAllByText('Réponse IA')).toHaveLength(1);
    expect(screen.getByText('Voici la réponse automatique.')).toBeInTheDocument();
    expect(screen.getByText('Dernier message utilisateur.')).toBeInTheDocument();
  });

  it('affiche le compteur rouge quand une réponse modérateur est requise', async () => {
    renderPage();

    expect(await screen.findByText('Autre sujet')).toBeInTheDocument();
    const attentionBadges = screen.getAllByTitle('Réponse requise');
    expect(attentionBadges).toHaveLength(2);
    attentionBadges.forEach((badge) => {
      expect(badge).toHaveTextContent('1');
    });
  });
});
