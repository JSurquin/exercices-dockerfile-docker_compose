/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  chatWidgetFabButtonClass,
  chatWidgetHeaderClass,
  chatWidgetMessageBubbleClass,
  chatWidgetPopupContainerClass,
  chatWidgetSenderLabelClass,
} from '@/lib/chat-widget-styles';

function DesignPreview() {
  return (
    <div>
      <div data-testid="popup" className={chatWidgetPopupContainerClass(true)} />
      <div data-testid="header" className={chatWidgetHeaderClass()} />
      <div data-testid="bubble-user" className={chatWidgetMessageBubbleClass('USER')}>
        Message user
      </div>
      <div data-testid="bubble-ai" className={chatWidgetMessageBubbleClass('AI')}>
        <span data-testid="ai-label" className={chatWidgetSenderLabelClass(false)}>
          Moony · l&apos;agent IA
        </span>
        Réponse IA
      </div>
      <div data-testid="bubble-mod" className={chatWidgetMessageBubbleClass('MODERATOR')} />
      <div data-testid="bubble-system" className={chatWidgetMessageBubbleClass('SYSTEM')} />
      <button type="button" data-testid="fab" className={chatWidgetFabButtonClass()}>
        Chat
      </button>
    </div>
  );
}

describe('Chat widget design (rendu DOM)', () => {
  it('popup ouvert utilise chat-glass et largeur sm', () => {
    render(<DesignPreview />);
    const popup = screen.getByTestId('popup');
    expect(popup).toHaveClass('chat-glass');
    expect(popup.className).toContain('sm:w-[390px]');
  });

  it('header gradient CTA blanc', () => {
    render(<DesignPreview />);
    expect(screen.getByTestId('header')).toHaveClass('bg-cta-gradient');
    expect(screen.getByTestId('header')).toHaveClass('text-white');
  });

  it('bulle USER : bleu chromé', () => {
    render(<DesignPreview />);
    const bubble = screen.getByTestId('bubble-user');
    expect(bubble).toHaveClass('chat-widget-bubble-user');
    expect(bubble).toHaveClass('chat-widget-bubble-chrome');
    expect(bubble.className).toContain('rounded-[22px]');
    expect(screen.getByText('Message user')).toBeInTheDocument();
  });

  it('bulle AI : bleu chromé avec label expéditeur', () => {
    render(<DesignPreview />);
    const bubble = screen.getByTestId('bubble-ai');
    expect(bubble).toHaveClass('chat-widget-bubble-ai');
    expect(screen.getByTestId('ai-label').className).toContain('text-theme-highlight');
  });

  it('bulle MODERATOR : bleu chromé staff', () => {
    render(<DesignPreview />);
    expect(screen.getByTestId('bubble-mod')).toHaveClass('chat-widget-bubble-staff');
  });

  it('bulle SYSTEM : chromé atténué', () => {
    render(<DesignPreview />);
    expect(screen.getByTestId('bubble-system').className).toContain('chat-widget-bubble-staff');
  });

  it('FAB rond CTA avec hover scale', () => {
    render(<DesignPreview />);
    const fab = screen.getByTestId('fab');
    expect(fab).toHaveClass('rounded-full');
    expect(fab).toHaveClass('bg-cta-gradient');
    expect(fab.className).toContain('hover:scale-110');
  });
});
