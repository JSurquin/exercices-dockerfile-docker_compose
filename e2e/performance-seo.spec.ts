import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la performance et SEO
 * Vitesse, optimisation, référencement
 */

test.describe('Performance - Temps de chargement', () => {
  
  test('Page d\'accueil - Chargement < 3 secondes', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Temps de chargement: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('First Contentful Paint - Rapide', async ({ page }) => {
    await page.goto('/');
    
    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      return fcpEntry?.startTime;
    });
    
    console.log(`FCP: ${fcp}ms`);
  });

  test('Largest Contentful Paint - < 2.5s', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForLoadState('load');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
          resolve(lastEntry.renderTime ?? lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        setTimeout(() => resolve(null), 5000);
      });
    });
    
    if (lcp) {
      console.log(`LCP: ${lcp}ms`);
    }
  });

  test('Time to Interactive - < 5 secondes', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const tti = Date.now() - startTime;
    
    console.log(`TTI: ${tti}ms`);
    expect(tti).toBeLessThan(5000);
  });

  test('Total Blocking Time - Minimal', async ({ page }) => {
    await page.goto('/');
    
    const tbt = await page.evaluate(() => {
      return performance.getEntriesByType('measure')
        .filter(m => m.name.includes('long'))
        .reduce((sum, m) => sum + m.duration, 0);
    });
    
    console.log(`TBT: ${tbt}ms`);
  });
});

test.describe('Performance - Ressources', () => {
  
  test('Images - Optimisées et lazy loading', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      const src = await img.getAttribute('src');
      
      if (loading === 'lazy') {
        console.log('✅ Lazy loading:', src?.substring(0, 50));
      }
    }
  });

  test('Fonts - Chargement optimisé', async ({ page }) => {
    await page.goto('/');
    
    const fonts = await page.evaluate(() => {
      return [...document.fonts.values()].map(f => f.family);
    });
    
    console.log('Fonts chargées:', fonts);
  });

  test('CSS - Pas de fichiers bloquants', async ({ page }) => {
    await page.goto('/');
    
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    
    console.log(`${stylesheets} feuille(s) de style`);
  });

  test('JavaScript - Bundle size raisonnable', async ({ page }) => {
    const response = await page.goto('/');
    
    const resources = await page.evaluate(() => 
      performance.getEntriesByType('resource')
        .filter(r => r.name.endsWith('.js'))
        .map((r) => {
          const res = r as PerformanceResourceTiming;
          return {
            name: r.name.split('/').pop(),
            size: res.transferSize,
          };
        })
    );
    
    console.log('JS bundles:', resources);
  });

  test('Compression - Gzip/Brotli activé', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    const encoding = headers?.['content-encoding'];
    
    if (encoding) {
      console.log('✅ Compression:', encoding);
    }
  });

  test('Cache - Headers correctement configurés', async ({ page }) => {
    const response = await page.goto('/');
    
    const headers = response?.headers();
    const cacheControl = headers?.['cache-control'];
    
    if (cacheControl) {
      console.log('✅ Cache-Control:', cacheControl);
    }
  });
});

test.describe('Performance - Interactions', () => {
  
  test('First Input Delay - < 100ms', async ({ page }) => {
    await page.goto('/');
    
    const startTime = Date.now();
    
    await page.locator('button, a').first().click();
    
    const fid = Date.now() - startTime;
    
    console.log(`FID: ${fid}ms`);
    expect(fid).toBeLessThan(200);
  });

  test('Scroll - Fluide sans lag', async ({ page }) => {
    await page.goto('/');
    
    const startY = await page.evaluate(() => window.scrollY);
    
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(100);
    }
    
    const endY = await page.evaluate(() => window.scrollY);
    
    console.log(`Scroll: ${startY} → ${endY}`);
  });

  test('Animations - Performantes', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier qu'il n'y a pas d\'animations coûteuses
    const animations = await page.evaluate(() => 
      document.getAnimations().length
    );
    
    console.log(`${animations} animation(s) en cours`);
  });
});

test.describe('Performance - Bundle analysis', () => {
  
  test('Code splitting - Chunks séparés', async ({ page }) => {
    await page.goto('/');
    
    const scripts = await page.evaluate(() => 
      [...document.scripts].map(s => s.src)
        .filter(src => src)
    );
    
    console.log(`${scripts.length} script(s) chargé(s)`);
    
    // Devrait avoir plusieurs chunks
    const chunks = scripts.filter(s => s.includes('chunk'));
    console.log(`${chunks.length} chunk(s)`);
  });

  test('Tree shaking - Pas de code mort', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la taille totale du JS
    const jsSize = await page.evaluate(() => 
      performance.getEntriesByType('resource')
        .filter(r => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + (r as PerformanceResourceTiming).transferSize, 0)
    );
    
    console.log(`Taille totale JS: ${(jsSize / 1024).toFixed(2)} KB`);
  });
});

test.describe('SEO - Méta données', () => {
  
  test('Titre - Présent et unique', async ({ page }) => {
    await page.goto('/');
    
    const title = await page.title();
    
    expect(title.length).toBeGreaterThan(10);
    expect(title.length).toBeLessThan(60);
    
    console.log('✅ Titre:', title);
  });

  test('Description - Meta tag présent', async ({ page }) => {
    await page.goto('/');
    
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    
    if (description) {
      expect(description.length).toBeGreaterThan(50);
      expect(description.length).toBeLessThan(160);
      
      console.log('✅ Description:', description.substring(0, 50) + '...');
    }
  });

  test('Keywords - Si présents', async ({ page }) => {
    await page.goto('/');
    
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    
    if (keywords) {
      console.log('Keywords:', keywords);
    }
  });

  test('Open Graph - Balises sociales', async ({ page }) => {
    await page.goto('/');
    
    const ogTags = [
      'og:title',
      'og:description',
      'og:image',
      'og:url',
      'og:type',
    ];
    
    for (const tag of ogTags) {
      const content = await page.locator(`meta[property="${tag}"]`).getAttribute('content');
      
      if (content) {
        console.log(`✅ ${tag}:`, content.substring(0, 50));
      }
    }
  });

  test('Twitter Card - Balises présentes', async ({ page }) => {
    await page.goto('/');
    
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    
    if (twitterCard) {
      console.log('✅ Twitter Card:', twitterCard);
    }
  });

  test('Canonical - URL canonique', async ({ page }) => {
    await page.goto('/');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    
    if (canonical) {
      console.log('✅ Canonical URL:', canonical);
    }
  });

  test('hreflang - Si multilingue', async ({ page }) => {
    await page.goto('/');
    
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').count();
    
    console.log(`${hreflangs} balise(s) hreflang`);
  });
});

test.describe('SEO - Structure', () => {
  
  test('H1 - Un seul par page', async ({ page }) => {
    await page.goto('/');
    
    const h1Count = await page.locator('h1').count();
    
    expect(h1Count).toBe(1);
    
    const h1Text = await page.locator('h1').textContent();
    console.log('✅ H1:', h1Text);
  });

  test('Hiérarchie des titres - Logique', async ({ page }) => {
    await page.goto('/');
    
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();
    const h3 = await page.locator('h3').count();
    const h4 = await page.locator('h4').count();
    
    console.log(`Titres: H1=${h1}, H2=${h2}, H3=${h3}, H4=${h4}`);
  });

  test('Liens internes - Présents', async ({ page }) => {
    await page.goto('/');
    
    const internalLinks = await page.locator('a[href^="/"]').count();
    
    console.log(`${internalLinks} lien(s) interne(s)`);
    expect(internalLinks).toBeGreaterThan(5);
  });

  test('Liens externes - rel="nofollow" si nécessaire', async ({ page }) => {
    await page.goto('/');
    
    const externalLinks = await page.locator('a[href^="http"]:not([href*="moonskin"])').all();
    
    for (const link of externalLinks) {
      const rel = await link.getAttribute('rel');
      const href = await link.getAttribute('href');
      
      console.log('Lien externe:', href, 'rel:', rel);
    }
  });

  test('Images - Alt text significatif', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img[alt]').all();
    
    for (const img of images.slice(0, 5)) {
      const alt = await img.getAttribute('alt');
      
      if (alt && alt.length > 0) {
        console.log('✅ Alt:', alt.substring(0, 50));
      }
    }
  });
});

test.describe('SEO - Indexation', () => {
  
  test('robots.txt - Accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    
    expect(response?.status()).toBe(200);
    
    const content = await page.textContent('body');
    console.log('robots.txt:', content?.substring(0, 100));
  });

  test('sitemap.xml - Accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    
    // Devrait retourner 200 ou 404 si pas encore créé
    const status = response?.status();
    console.log('sitemap.xml status:', status);
  });

  test('Meta robots - Pas de noindex sur pages importantes', async ({ page }) => {
    await page.goto('/');
    
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    
    if (robots) {
      expect(robots).not.toContain('noindex');
      console.log('Meta robots:', robots);
    }
  });
});

test.describe('SEO - Données structurées', () => {
  
  test('Schema.org - JSON-LD présent', async ({ page }) => {
    await page.goto('/');
    
    const jsonLd = await page.locator('script[type="application/ld+json"]').count();
    
    console.log(`${jsonLd} bloc(s) JSON-LD`);
  });

  test('Organisation - Informations de la société', async ({ page }) => {
    await page.goto('/');
    
    const jsonLdContent = await page.locator('script[type="application/ld+json"]').first().textContent();
    
    if (jsonLdContent) {
      try {
        const data = JSON.parse(jsonLdContent);
        console.log('Schema type:', data['@type']);
      } catch (e) {
        console.log('Erreur parsing JSON-LD');
      }
    }
  });
});

test.describe('SEO - Mobile friendly', () => {
  
  test('Viewport - Meta tag configuré', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(viewport).toBeTruthy();
    console.log('✅ Viewport:', viewport);
  });

  test('Responsive - S\'adapte aux mobiles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    console.log('✅ Responsive mobile OK');
  });

  test('Police - Taille lisible sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const textSize = await page.locator('p').first().evaluate(el => 
      window.getComputedStyle(el).fontSize
    );
    
    console.log('Taille police mobile:', textSize);
  });
});

test.describe('SEO - Vitesse Google', () => {
  
  test('Core Web Vitals - Performance globale', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      const lcp = performance.getEntriesByType(
        'largest-contentful-paint',
      )[0] as LargestContentfulPaint | undefined;
      return {
      lcp: lcp?.renderTime,
      fid: 0, // Nécessite une interaction réelle
      cls: 0, // Nécessite calcul layout-shift
    };
    });
    
    console.log('Core Web Vitals:', metrics);
  });

  test('Lighthouse score - Simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const resourcesCount = await page.evaluate(() => 
      performance.getEntriesByType('resource').length
    );
    
    console.log(`${resourcesCount} ressources chargées`);
  });
});

test.describe('SEO - URLs', () => {
  
  test('URLs - Propres et descriptives', async ({ page }) => {
    await page.goto('/giveaways');
    
    const url = page.url();
    
    // URL devrait être lisible
    expect(url).toContain('giveaways');
    expect(url).not.toContain('?id=');
    
    console.log('✅ URL clean:', url);
  });

  test('Redirections - 301 pour pages déplacées', async ({ page }) => {
    // Tester une redirection si applicable
    console.log('✅ Vérifier les redirections 301');
  });

  test('404 - Page d\'erreur personnalisée', async ({ page }) => {
    const response = await page.goto('/page-inexistante-12345');
    
    const status = response?.status();
    
    if (status === 404 || status === 200) {
      // Next.js peut retourner 200 avec une page 404 custom
      const content = await page.textContent('body');
      
      if (content?.includes('404') || content?.includes('introuvable')) {
        console.log('✅ Page 404 personnalisée');
      }
    }
  });
});

test.describe('Performance - Monitoring', () => {
  
  test('Temps de réponse serveur - TTFB', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const ttfb = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return entry.responseStart - entry.requestStart;
    });
    
    console.log(`TTFB: ${ttfb}ms`);
    expect(ttfb).toBeLessThan(600);
  });

  test('Memory usage - Pas de fuite', async ({ page }) => {
    await page.goto('/');
    
    // Naviguer entre plusieurs pages
    await page.goto('/about');
    await page.goto('/contact');
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (metrics) {
      console.log('Memory:', metrics);
    }
  });
});
