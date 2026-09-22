/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LazyChatWidget } from '@/components/ui/lazy-chat-widget';

const chatWidgetMock = jest.fn(({ initialOpen }: { initialOpen?: boolean }) => (
  <div data-testid="chat-widget-loaded" data-open={initialOpen ? 'true' : 'false'} />
));

jest.mock('next/dynamic', () => () =>
  function DynamicChatWidget(props: { initialOpen?: boolean }) {
    return chatWidgetMock(props);
  }
);

jest.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    messages: {
      chatWidget: {
        tooltip: 'Support',
      },
    },
  }),
}));

describe('LazyChatWidget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    chatWidgetMock.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a lightweight FAB before the chat bundle loads', () => {
    render(<LazyChatWidget />);
    expect(screen.getByTestId('chat-fab')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-widget-loaded')).not.toBeInTheDocument();
  });

  it('loads the chat widget on first click and opens it', () => {
    render(<LazyChatWidget />);
    fireEvent.click(screen.getByTestId('chat-fab'));
    expect(screen.getByTestId('chat-widget-loaded')).toHaveAttribute('data-open', 'true');
  });

  it('loads the chat widget after a few seconds of inactivity', () => {
    render(<LazyChatWidget />);
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(screen.getByTestId('chat-widget-loaded')).toHaveAttribute('data-open', 'false');
  });
});
