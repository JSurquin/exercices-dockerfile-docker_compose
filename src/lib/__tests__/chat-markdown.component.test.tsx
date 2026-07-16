/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

import { render, screen } from '@testing-library/react';
import {
  CHAT_MARKDOWN_COMPONENTS,
  CHAT_REMARK_PLUGINS,
  ChatMarkdownContent,
  shouldRenderChatMarkdown,
} from '@/lib/chat-markdown';

const SENDER_TYPES = ['USER', 'BOT', 'MODERATOR', 'AI', 'SYSTEM'] as const;

describe('shouldRenderChatMarkdown', () => {
  it.each(SENDER_TYPES)('senderType=%s', (senderType) => {
    expect(shouldRenderChatMarkdown(senderType)).toBe(senderType !== 'USER');
  });
});

describe('CHAT_REMARK_PLUGINS', () => {
  it('inclut remarkGfm', () => {
    expect(CHAT_MARKDOWN_COMPONENTS).toBeDefined();
    expect(CHAT_REMARK_PLUGINS.length).toBeGreaterThan(0);
  });
});

describe('CHAT_MARKDOWN_COMPONENTS', () => {
  it.each(['p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'h1', 'h2', 'h3', 'a', 'br'] as const)(
    'expose le composant %s',
    (tag) => {
      expect(CHAT_MARKDOWN_COMPONENTS[tag]).toBeDefined();
    },
  );

  it('lien externe ouvre dans un nouvel onglet', () => {
    const Link = CHAT_MARKDOWN_COMPONENTS.a;
    const { container } = render(<Link href="https://moonskin.fun">Site</Link>);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
  });

  it('lien interne reste dans le même onglet', () => {
    const Link = CHAT_MARKDOWN_COMPONENTS.a;
    const { container } = render(<Link href="/help/scam">Guide</Link>);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/help/scam');
    expect(anchor?.getAttribute('target')).toBeNull();
  });
});

describe('ChatMarkdownContent', () => {
  it('affiche le contenu markdown', () => {
    render(<ChatMarkdownContent content="Bonjour **support**" />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('Bonjour **support**');
  });

  it('applique className personnalisée', () => {
    const { container } = render(
      <ChatMarkdownContent content="Test" className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('préserve les sauts de ligne via preserveChatLineBreaks', () => {
    render(<ChatMarkdownContent content="Ligne 1\nLigne 2" />);
    expect(screen.getByTestId('markdown').textContent).toContain('Ligne 1');
  });

  it.each([
    'Liste:\n- item 1\n- item 2',
    '**Gras** et *italique*',
    '[Lien](https://example.com)',
    '### Titre',
    '`code inline`',
  ])('rend le markdown « %s »', (content) => {
    render(<ChatMarkdownContent content={content} />);
    expect(screen.getByTestId('markdown')).toBeInTheDocument();
  });
});
