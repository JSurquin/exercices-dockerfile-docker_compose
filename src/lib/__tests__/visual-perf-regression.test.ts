import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');

function blockAfter(selector: string): string {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const from = start + marker.length;
  const end = css.indexOf('}', from);
  return css.slice(from, end);
}

describe('visual perf regression guards', () => {
  it('keeps chrome-shimmer opacity on the glow overlay, not the hero card', () => {
    expect(css).toMatch(
      /\.hero-product\s+\.chrome-shimmer::before\s*\{[\s\S]*?animation:\s*chrome-shimmer/
    );
    expect(css).not.toMatch(
      /\.hero-product\s+\.chrome-shimmer\s*\{[\s\S]*?animation:\s*chrome-shimmer/
    );
    expect(blockAfter('.btn-select-all')).not.toMatch(/animation:\s*chrome-shimmer/);
  });

  it('defaults enter/reveal elements to the final visible state', () => {
    const beforeMotion = css.split('@supports (animation-timeline: view())')[0];
    expect(beforeMotion).toMatch(
      /\.home-enter-left,[\s\S]*?\.home-reveal-fade \{\s*opacity:\s*1;\s*transform:\s*none;/
    );
    expect(beforeMotion).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*html:not\(\.perf-lite\) \.home-enter-right/
    );
  });

  it('only applies scroll-reveal opacity 0 when motion can actually play', () => {
    const revealBlock = css.split('@supports (animation-timeline: view())')[1] ?? '';
    expect(revealBlock).toMatch(/prefers-reduced-motion: no-preference/);
    expect(revealBlock).toMatch(/html:not\(\.perf-lite\) \.home-reveal-up/);
    expect(css).toMatch(/html\.perf-lite \.home-reveal-up[\s\S]*?opacity:\s*1 !important/);
    expect(css).toMatch(/html\.perf-lite \.chrome-shimmer \{\s*opacity:\s*1 !important/);
  });

  it('restores a stacking context and an opaque glass fallback on lunar cards', () => {
    const lunar = blockAfter('.lunar-card');
    expect(lunar).toMatch(/isolation:\s*isolate/);
    expect(lunar).toMatch(/z-index:\s*1/);
    expect(lunar).toMatch(/rgba\(18,\s*18,\s*24,\s*0\.88\)/);
    expect(lunar).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.08\)/);
  });

  it('keeps hover halo opt-in via surface-interactive only', () => {
    expect(css).toMatch(/\.lunar-card\.surface-interactive:hover::after/);
    expect(css).not.toMatch(/\.lunar-card:hover::after/);
    expect(blockAfter('.surface-interactive')).toMatch(/cursor:\s*pointer/);
    expect(blockAfter('.surface-interactive:focus-visible')).toMatch(/outline:\s*2px\s+solid/);
    expect(css).not.toMatch(/\.hero-box:hover\s*,/);
    expect(css).not.toMatch(/\.payment-box:hover\s*,/);
    expect(css).not.toMatch(/\.hero-payment-chip:hover\s*\{/);
    expect(css).not.toMatch(/\.hiw-cs2-step:hover\s/);
    expect(css).toMatch(/\.surface-interactive\.home-hover-scale:hover\s*\{/);
    expect(css).not.toMatch(/(?<!surface-interactive)\.home-hover-scale:hover\s*\{/);
  });

  it('keeps the homepage starfield paint-cheap', () => {
    expect(css).toMatch(/\.cb-stars\s*\{/);
    expect(css).not.toMatch(/\.cb-stars\s*\{[^}]*animation:/);
    expect(blockAfter('.cb-comet-fixed')).not.toMatch(/filter:/);
    expect(blockAfter('.cb-debris')).not.toMatch(/filter:/);
    expect(blockAfter('.hero-product')).not.toMatch(/filter:/);
    expect(css).not.toMatch(/filter:\s*blur\(40px\)/);
    expect(css).not.toMatch(/animation:\s*cb-star-twinkle/);
    expect(css).not.toMatch(/animation:\s*cb-nebula-drift/);
    expect(css).not.toMatch(/animation:\s*neon-angle-spin/);
    expect(css).not.toMatch(/animation:\s*hero-brand-shine/);
    expect(blockAfter('.home-neon-pill__glow')).not.toMatch(/animation:/);
  });

  it('does not force cursor: default on .surface so content text stays selectable', () => {
    expect(css).not.toMatch(/\.surface\s*\{[^}]*cursor:\s*default/);
    expect(css).toMatch(/:where\(h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*p/);
    expect(css).toMatch(/cursor:\s*text/);
    expect(css).toMatch(/::selection\s*\{/);
    expect(blockAfter('.surface-interactive')).toMatch(/cursor:\s*pointer/);
  });
});
