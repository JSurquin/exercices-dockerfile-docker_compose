/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { LocaleProvider, useLocale } from '@/components/providers/locale-provider';
import { LOCALE_STORAGE_KEY } from '@/lib/locale-detection';

function LocaleReader() {
  const { locale } = useLocale();
  return <span data-testid="locale">{locale}</span>;
}

describe('LocaleProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  it('keeps the server locale on first paint even if localStorage differs', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');

    render(
      <LocaleProvider initialLocale="en">
        <LocaleReader />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
  });

  it('renders Chinese from the server locale without swapping after mount', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');

    render(
      <LocaleProvider initialLocale="cn">
        <LocaleReader />
      </LocaleProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('cn');
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('cn');
    });
  });
});
