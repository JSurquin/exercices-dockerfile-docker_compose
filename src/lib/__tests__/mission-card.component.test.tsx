/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { MissionCard, MissionClaimedRow } from '@/components/missions/mission-card';
import type { MissionRow } from '@/lib/mission-presentation';
import { SOCIAL_VISIT_STORAGE_KEY } from '@/lib/mission-presentation';
import type { Messages } from '~/utils/types';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const t = {
  claimed: 'Réclamée',
  claim: 'Réclamer',
  claimReward: 'Réclamer +{n}',
  actionSell: 'Vendre →',
  actionParticipate: 'Participer →',
  actionVisit: 'Visiter →',
  moreInfo: 'Détail de la mission',
  inProgress: 'En cours',
  socialVisit: 'Visiter',
  socialConfirm: 'Confirmer',
  socialWaiting: 'Vérifie...',
  socialThanks: 'Merci ! Réclame ta récompense',
  items: {
    WEEKLY_SELL_500: { label: 'Vendre {amount}', description: 'Atteins 500 €.' },
    WEEKLY_GIVEAWAY_3: { label: '3 giveaways', description: 'Rejoins 3 giveaways différents.' },
    SOCIAL_DISCORD: { label: 'Rejoindre Discord', description: 'Rejoins Discord.' },
    DAILY_SELL_SKIN: { label: 'Vendre un skin', description: 'Réalise 1 vente.' },
  },
} as unknown as Messages['missions'];

function row(partial: Partial<MissionRow> & Pick<MissionRow, 'key'>): MissionRow {
  return {
    category: 'WEEKLY',
    rewardFragments: 50,
    periodKey: 'week:2026-W39',
    completed: false,
    eligible: false,
    ...partial,
  };
}

describe('MissionCard', () => {
  it('shows a claim CTA for a claimable mission', () => {
    render(
      <MissionCard
        mission={row({ key: 'WEEKLY_SELL_500', eligible: true, thresholdCents: 50_000 })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    expect(screen.getByRole('button', { name: /Réclamer \+50/ })).toBeEnabled();
    expect(screen.queryByText(/Non disponible/i)).not.toBeInTheDocument();
  });

  it('sends an in-progress sell mission to /sell instead of locking it', () => {
    render(
      <MissionCard
        mission={row({
          key: 'WEEKLY_SELL_500',
          eligible: false,
          progressCurrent: 12_000,
          progressTarget: 50_000,
          thresholdCents: 50_000,
        })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    expect(screen.getByRole('link', { name: 'Vendre →' })).toHaveAttribute('href', '/sell');
    expect(screen.getByText(/120\s*€\s*\/\s*500\s*€/)).toBeInTheDocument();
    expect(screen.queryByText(/Non disponible/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cadenas|lock/i })).not.toBeInTheDocument();
  });

  it('sends an in-progress giveaway mission to /giveaways', () => {
    render(
      <MissionCard
        mission={row({
          key: 'WEEKLY_GIVEAWAY_3',
          eligible: false,
          progressCurrent: 1,
          progressTarget: 3,
        })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    expect(screen.getByRole('link', { name: 'Participer →' })).toHaveAttribute('href', '/giveaways');
    expect(screen.getByRole('button', { name: 'Détail de la mission' })).toBeInTheDocument();
    expect(screen.queryByText('Rejoins 3 giveaways différents.')).not.toBeInTheDocument();
  });

  it('shows claimed state with a local reset line', () => {
    render(
      <MissionCard
        mission={row({ key: 'WEEKLY_SELL_500', completed: true, eligible: false, thresholdCents: 50_000 })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel="Revient dans 5h 12min"
        t={t}
      />
    );
    expect(screen.getByRole('button', { name: /Réclamée/ })).toBeDisabled();
    expect(screen.getByText('Revient dans 5h 12min')).toBeInTheDocument();
    expect(screen.getByText('Revient dans 5h 12min').textContent).not.toMatch(/UTC/i);
  });

  it('locks the claim button with a spinner while submitting', () => {
    render(
      <MissionCard
        mission={row({ key: 'WEEKLY_SELL_500', eligible: true })}
        onClaim={() => {}}
        claimingKey="WEEKLY_SELL_500"
        returnsLabel={null}
        t={t}
      />
    );
    expect(screen.getByRole('button', { name: /Réclamer \+50/ })).toBeDisabled();
  });

  it('keeps the mission icon after claim and hides repeating social descriptions', () => {
    const { container } = render(
      <MissionCard
        mission={row({ key: 'WEEKLY_SELL_500', completed: true, eligible: false, thresholdCents: 50_000 })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    expect(container.querySelector('.mission-quest__icon-badge')).toBeTruthy();
    expect(screen.getByText(/Vendre\s*500\s*€/)).toBeInTheDocument();
    expect(screen.queryByText('Atteins 500 €.')).not.toBeInTheDocument();

    render(
      <MissionCard
        mission={row({
          key: 'SOCIAL_DISCORD',
          category: 'SOCIAL',
          eligible: true,
          rewardFragments: 25,
        })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    expect(screen.getByText('Rejoindre Discord')).toBeInTheDocument();
    expect(screen.queryByText('Rejoins Discord.')).not.toBeInTheDocument();
  });

  it('opens a social link then shows a filled claim CTA with thanks copy', () => {
    window.localStorage.removeItem(SOCIAL_VISIT_STORAGE_KEY);
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <MissionCard
        mission={row({
          key: 'SOCIAL_DISCORD',
          category: 'SOCIAL',
          eligible: true,
          rewardFragments: 25,
        })}
        onClaim={() => {}}
        claimingKey={null}
        returnsLabel={null}
        t={t}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Visiter →' }));
    expect(open).toHaveBeenCalled();
    expect(screen.getByText('Merci ! Réclame ta récompense')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Réclamer \+25/ })).toBeEnabled();
    open.mockRestore();
  });

  it('renders claimed missions as a compact row with the original logo', () => {
    const { container } = render(
      <MissionClaimedRow
        mission={row({ key: 'WEEKLY_SELL_500', completed: true, eligible: false, thresholdCents: 50_000 })}
        t={t}
      />
    );
    expect(container.querySelector('.mission-quest-compact')).toBeTruthy();
    expect(container.querySelector('.mission-quest__icon-badge')).toBeTruthy();
    expect(screen.getByText(/Vendre\s*500\s*€/)).toBeInTheDocument();
    expect(screen.getByText('Réclamée')).toBeInTheDocument();
  });
});
