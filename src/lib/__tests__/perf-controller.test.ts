/**
 * @jest-environment jsdom
 */
import { applyPerfLiteClass } from '@/components/ui/perf-controller';

describe('applyPerfLiteClass', () => {
  const originalConcurrency = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');

  afterEach(() => {
    if (originalConcurrency) {
      Object.defineProperty(navigator, 'hardwareConcurrency', originalConcurrency);
    }
    document.documentElement.classList.remove('perf-lite');
  });

  it('adds perf-lite on modest CPUs', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 4,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    const tokens = document.documentElement.classList;
    expect(applyPerfLiteClass(tokens)).toBe(true);
    expect(tokens.contains('perf-lite')).toBe(true);
  });

  it('adds perf-lite when macOS-style reduced motion is enabled', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 8,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    const tokens = document.documentElement.classList;
    expect(applyPerfLiteClass(tokens)).toBe(true);
    expect(tokens.contains('perf-lite')).toBe(true);
  });

  it('keeps full effects on capable machines without reduced motion', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 8,
    });
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    const tokens = document.documentElement.classList;
    expect(applyPerfLiteClass(tokens)).toBe(false);
    expect(tokens.contains('perf-lite')).toBe(false);
  });
});
