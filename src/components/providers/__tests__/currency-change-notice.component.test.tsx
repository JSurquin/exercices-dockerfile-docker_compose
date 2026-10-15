/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from '@/components/providers/currency-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import type { SupportedCurrency } from '@/lib/currency-converter';

function Switcher({ next }: { next: SupportedCurrency }) {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  return (
    <button type="button" onClick={() => setSelectedCurrency(next)}>
      current:{selectedCurrency}
    </button>
  );
}

function renderSwitcher(next: SupportedCurrency) {
  return render(
    <LocaleProvider initialLocale="fr">
      <CurrencyProvider>
        <Switcher next={next} />
      </CurrencyProvider>
    </LocaleProvider>
  );
}

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => undefined;
  Element.prototype.releasePointerCapture = () => undefined;
  HTMLElement.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
  localStorage.clear();
});

describe('currency change notice', () => {
  it('explains the exchange rate when the currency changes', () => {
    renderSwitcher('USD');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'current:EUR' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Les devises sur MoonSkin' })).toBeInTheDocument();
    expect(
      screen.getByText("Cela ne change pas nos prix. C'est lié au taux de change.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualiser' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compris !' })).toBeInTheDocument();
    expect(localStorage.getItem('preferred-currency')).toBe('USD');
  });

  it('closes with Got it and keeps the new currency', () => {
    renderSwitcher('USD');

    fireEvent.click(screen.getByRole('button', { name: 'current:EUR' }));
    fireEvent.click(screen.getByRole('button', { name: 'Compris !' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'current:USD' })).toBeInTheDocument();
    expect(localStorage.getItem('preferred-currency')).toBe('USD');
  });

  it('stays closed when the same currency is selected again', () => {
    renderSwitcher('EUR');

    fireEvent.click(screen.getByRole('button', { name: 'current:EUR' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not open while restoring the saved currency', async () => {
    localStorage.setItem('preferred-currency', 'USD');
    renderSwitcher('EUR');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'current:USD' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
