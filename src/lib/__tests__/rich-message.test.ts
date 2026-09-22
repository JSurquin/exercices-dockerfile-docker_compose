import { splitHighlightedMessage } from '@/lib/rich-message';
import { messages } from '@/lib/i18n';

describe('splitHighlightedMessage', () => {
  it('keeps the highlighted span in place so locale grammar stays intact', () => {
    expect(
      splitHighlightedMessage('Avant <highlight>0 % de frais de vente</highlight> après'),
    ).toEqual([
      { text: 'Avant ', highlight: false },
      { text: '0 % de frais de vente', highlight: true },
      { text: ' après', highlight: false },
    ]);
  });

  it('returns the raw string when no marker is present', () => {
    expect(splitHighlightedMessage('Aucun marqueur')).toEqual([
      { text: 'Aucun marqueur', highlight: false },
    ]);
  });

  it('highlights the fee phrase in FR, EN and ZH without concatenating fragments', () => {
    const expected = {
      fr: '0 % de frais de vente',
      en: '0% selling fees',
      cn: '0%销售手续费',
    } as const;

    for (const locale of ['fr', 'en', 'cn'] as const) {
      const subtitle = messages[locale].hero.subtitle;
      const parts = splitHighlightedMessage(subtitle);
      const highlighted = parts.filter((part) => part.highlight);

      expect(subtitle).toContain(`<highlight>${expected[locale]}</highlight>`);
      expect(highlighted).toHaveLength(1);
      expect(highlighted[0]?.text).toBe(expected[locale]);
      expect(parts.map((part) => part.text).join('')).toBe(
        subtitle.replace(/<\/?highlight>/g, ''),
      );
    }
  });
});

describe('hero copy', () => {
  it('drops the double with and the regulated MoonSkin wording in every locale', () => {
    for (const locale of ['fr', 'en', 'cn'] as const) {
      const hero = messages[locale].hero;
      const title = hero.title.toLowerCase();
      const subtitle = hero.subtitle.toLowerCase();

      expect(title).not.toMatch(/with moonskin with/);
      expect(title).not.toMatch(/avec moonskin/);
      expect(subtitle).not.toMatch(/regulated moonskin platform/);
      expect(subtitle).not.toMatch(/plateforme moonskin régul/);
      expect(subtitle).not.toMatch(/受监管的皮肤变现平台/);
    }
  });
});
