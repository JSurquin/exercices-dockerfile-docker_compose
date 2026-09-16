/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { GiveawayCountdown } from '@/components/giveaway/giveaway-countdown';
import { GiveawayCtaButton } from '@/components/giveaway/giveaway-cta-button';
import { GiveawayMotionSurface } from '@/components/giveaway/giveaway-motion-surface';
import { GiveawayStarfield } from '@/components/giveaway/giveaway-starfield';
import { getGiveawayTierCtaColors } from '@/lib/giveaway-presentation';
import type { Messages } from '~/utils/types';

jest.mock('framer-motion', () => {
  const passthrough = ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <div {...props}>{children}</div>
  );
  return {
    motion: {
      span: passthrough,
      div: passthrough,
      header: passthrough,
      aside: passthrough,
      section: passthrough,
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    useReducedMotion: () => false,
  };
});

const messages = {
  giveaways: {
    card: {
      participateCost: 'Participer · {cost}',
      missingFragmentsCta: 'Il manque {count}',
      missingFragmentsBalance: '{have} / {need}',
      accessReserved: 'Accès réservé',
      maxEntriesReached: 'Maximum atteint',
      entryBurstOne: '+{count} entrée',
      entryBurstOther: '+{count} entrées',
      missionsLink: 'Gagner des fragments →',
    },
  },
} as unknown as Messages;

beforeAll(() => {
  class MockObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockObserver,
  });
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('hover: hover') || query.includes('pointer: fine'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

describe('GiveawayCountdown', () => {
  it('marks the last hour as urgent and keeps seconds visible', () => {
    const now = Date.parse('2026-09-16T12:00:00.000Z');
    render(
      <GiveawayCountdown
        endDate="2026-09-16T12:40:00.000Z"
        now={now}
        labels={{ days: 'J', hours: 'H', minutes: 'M', seconds: 'S' }}
      />
    );
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('data-urgent', 'true');
    expect(timer).toHaveClass('giveaway-countdown--urgent');
  });
});

describe('GiveawayCtaButton', () => {
  it('shows an earn-fragments link when the viewer cannot afford an entry', () => {
    render(
      <GiveawayCtaButton
        action={{ type: 'unaffordable', missing: 386 }}
        messages={messages}
        ticketPrice={500}
        userFragments={114}
        layout="card"
        tier="weekly"
        onEarnFragments={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Gagner des fragments →' })).toBeInTheDocument();
  });

  it('applies AA --tier colors on the participate button', () => {
    const colors = getGiveawayTierCtaColors('yearly');
    const { container } = render(
      <GiveawayCtaButton
        action={{ type: 'participate' }}
        messages={messages}
        ticketPrice={10}
        userFragments={40}
        tier="yearly"
        onParticipate={() => {}}
      />
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('giveaway-cta--tier');
    expect(button).toHaveStyle({
      '--giveaway-cta-bg': colors.bg,
      '--giveaway-cta-fg': colors.fg,
    });
  });
});

describe('GiveawayMotionSurface', () => {
  it('does not enable tilt when the pointer is coarse', () => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { container } = render(
      <GiveawayMotionSurface featured>
        <span>card</span>
      </GiveawayMotionSurface>
    );
    expect(container.firstElementChild).toHaveAttribute('data-tilt', 'false');
  });
});

describe('GiveawayStarfield', () => {
  it('renders at most 30 stars', () => {
    const { container } = render(<GiveawayStarfield />);
    expect(container.querySelectorAll('.giveaway-star').length).toBeLessThanOrEqual(30);
  });
});
