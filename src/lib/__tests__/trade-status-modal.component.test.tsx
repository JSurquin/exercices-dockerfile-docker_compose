/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { TradeStatusModal } from '@/components/sell/trade-status-modal';

function renderPending(locale: 'en' | 'fr' | 'cn' = 'en') {
  return render(
    <LocaleProvider initialLocale={locale}>
      <TradeStatusModal
        status="pending"
        onClose={() => {}}
        onSellAgain={() => {}}
        bot={null}
      />
    </LocaleProvider>
  );
}

describe('TradeStatusModal pending', () => {
  it('darkens the backdrop and asks to wait until detection is done', () => {
    renderPending('en');

    expect(screen.getByText('Wait until the detection is done.')).toBeInTheDocument();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toHaveClass('bg-black/80');
    expect(overlay).not.toHaveClass('bg-black/50');
  });

  it('shows the French wait message', () => {
    renderPending('fr');
    expect(
      screen.getByText("Patientez jusqu'à ce que la détection soit terminée.")
    ).toBeInTheDocument();
  });
});
